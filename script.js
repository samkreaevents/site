const header = document.querySelector(".site-header");
const headerInner = document.querySelector(".header-inner");
const menu = document.querySelector("#primary-menu");
const menuButton = document.querySelector(".menu-button");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

if (header && headerInner && menu && menuButton) {
  let resizeFrame = 0;
  let locationFrame = 0;
  const sectionLinks = [...menu.querySelectorAll('a[href^="#"]')];

  const updateNavigationLayout = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      header.classList.add("is-wide");
      const fits = headerInner.scrollWidth <= headerInner.clientWidth;

      if (fits && menu.matches(":popover-open")) {
        menu.hidePopover();
      }

      header.classList.toggle("is-wide", fits);
    });
  };

  menu.addEventListener("toggle", (event) => {
    menuButton.setAttribute("aria-expanded", String(event.newState === "open"));
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a") && menu.matches(":popover-open")) {
      menu.hidePopover();
    }
  });

  const updateCurrentLocation = () => {
    cancelAnimationFrame(locationFrame);
    locationFrame = requestAnimationFrame(() => {
      const marker = Math.max(header.offsetHeight + 16, window.innerHeight * 0.3);
      const atPageEnd = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
      const currentSection = atPageEnd
        ? document.getElementById(sectionLinks[sectionLinks.length - 1].hash.slice(1))
        : sectionLinks
          .map((link) => document.getElementById(link.hash.slice(1)))
          .filter((section) => section && section.getBoundingClientRect().top <= marker)
          .at(-1);

      if (!currentSection) {
        return;
      }

      sectionLinks.forEach((link) => {
        if (link.hash === `#${currentSection.id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  };

  const resizeObserver = new ResizeObserver(updateNavigationLayout);
  resizeObserver.observe(headerInner);
  window.addEventListener("resize", updateNavigationLayout, { passive: true });
  window.addEventListener("scroll", updateCurrentLocation, { passive: true });
  window.addEventListener("resize", updateCurrentLocation, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateNavigationLayout);
  }

  updateNavigationLayout();
  updateCurrentLocation();
}

const testimonialCarousel = document.querySelector(".testimonials");
const testimonialAutoplayIntervalMs = 10_000;

if (testimonialCarousel) {
  const track = testimonialCarousel.querySelector(".testimonial-track");
  const slides = [...testimonialCarousel.querySelectorAll(".testimonial-slide")];
  const markers = [...testimonialCarousel.querySelectorAll("[data-testimonial-index]")];
  const status = testimonialCarousel.querySelector(".testimonial-status");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (track && slides.length > 1 && markers.length === slides.length && status) {
    let settledIndex = 0;
    let pendingIndex = null;
    let manualChange = false;
    let hovered = false;
    let focused = false;
    let autoplayTimer = 0;
    let scrollFrame = 0;
    let settleTimer = 0;

    const nearestSlideIndex = () => {
      const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
      return slides.reduce((nearest, slide, index) => {
        const slideCenter = slide.getBoundingClientRect().left + slide.clientWidth / 2;
        const nearestCenter = slides[nearest].getBoundingClientRect().left + slides[nearest].clientWidth / 2;
        return Math.abs(slideCenter - trackCenter) < Math.abs(nearestCenter - trackCenter) ? index : nearest;
      }, 0);
    };

    const setActiveSlide = (index) => {
      markers.forEach((marker, markerIndex) => {
        if (markerIndex === index) {
          marker.setAttribute("aria-current", "true");
        } else {
          marker.removeAttribute("aria-current");
        }
      });
    };

    const settleScroll = () => {
      const index = nearestSlideIndex();
      setActiveSlide(index);
      if (manualChange && index !== settledIndex) {
        status.textContent = `Slide ${index + 1} of ${slides.length}`;
      }
      settledIndex = index;
      pendingIndex = null;
      manualChange = false;
      updateAutoplay();
    };

    const updateAutoplay = () => {
      window.clearInterval(autoplayTimer);
      autoplayTimer = 0;

      if (reducedMotion.matches || hovered || focused || document.hidden) {
        return;
      }

      autoplayTimer = window.setInterval(() => {
        navigate(1, false);
      }, testimonialAutoplayIntervalMs);
    };

    const navigate = (direction, isManual = true) => {
      const baseIndex = pendingIndex ?? nearestSlideIndex();
      const nextIndex = (baseIndex + direction + slides.length) % slides.length;
      pendingIndex = nextIndex;
      manualChange ||= isManual;
      setActiveSlide(nextIndex);
      const slide = slides[nextIndex];
      const left = track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({
        left,
        behavior: reducedMotion.matches ? "instant" : "smooth"
      });
      if (isManual) {
        updateAutoplay();
      }
    };

    markers.forEach((marker) => {
      marker.addEventListener("click", () => {
        const index = Number(marker.dataset.testimonialIndex);
        pendingIndex = index;
        manualChange = true;
        setActiveSlide(index);
        const slide = slides[index];
        const left = track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
        track.scrollTo({
          left,
          behavior: reducedMotion.matches ? "instant" : "smooth"
        });
        updateAutoplay();
      });
    });

    track.addEventListener("scroll", () => {
      if (pendingIndex === null) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => setActiveSlide(nearestSlideIndex()));
      }
      if (!("onscrollend" in track)) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settleScroll, 160);
      }
    }, { passive: true });

    if ("onscrollend" in track) {
      track.addEventListener("scrollend", settleScroll);
    }

    track.addEventListener("pointerdown", () => {
      pendingIndex = null;
      manualChange = true;
    });
    track.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(event.key)) {
        pendingIndex = null;
        manualChange = true;
      }
    });

    testimonialCarousel.addEventListener("pointerenter", () => {
      hovered = true;
      updateAutoplay();
    });
    testimonialCarousel.addEventListener("pointerleave", () => {
      hovered = false;
      updateAutoplay();
    });
    testimonialCarousel.addEventListener("focusin", () => {
      focused = true;
      updateAutoplay();
    });
    testimonialCarousel.addEventListener("focusout", (event) => {
      if (!testimonialCarousel.contains(event.relatedTarget)) {
        focused = false;
        updateAutoplay();
      }
    });
    document.addEventListener("visibilitychange", updateAutoplay);
    reducedMotion.addEventListener("change", updateAutoplay);

    updateAutoplay();
  }
}
