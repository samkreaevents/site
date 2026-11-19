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
