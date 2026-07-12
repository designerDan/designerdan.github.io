/**
 * Shared motion + scroll utilities
 */

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, factor) {
  return start * (1 - factor) + end * factor;
}

function getStickyTrackProgress(track) {
  if (!track) return 0;
  const range = track.offsetHeight - window.innerHeight;
  if (range <= 0) return 0;
  return clamp(-track.getBoundingClientRect().top / range);
}

function hasMotionLibs() {
  return typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
}

function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

function onDebouncedResize(fn, delay = 150) {
  let timer;
  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
  window.addEventListener("resize", handler, { passive: true });
  return handler;
}

function initNavListeners(syncFn) {
  syncFn();

  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.addEventListener("scroll", syncFn);
    ScrollTrigger.addEventListener("refresh", syncFn);
  }

  window.addEventListener("scroll", syncFn, { passive: true });
  window.addEventListener("resize", syncFn, { passive: true });
}

function refreshScrollLayout({ sync, refresh = true } = {}) {
  const siteHead = document.querySelector(".site-head");
  if (siteHead) {
    document.documentElement.style.setProperty("--site-head-height", `${siteHead.offsetHeight}px`);
  }
  if (refresh && typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
  sync?.();
}

function revealStaticMotion() {
  document.querySelectorAll(".cs-line-mask").forEach((mask) => {
    mask.classList.add("is-revealed");
  });
  document.querySelectorAll(".scroll-reveal").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
}

function initLineMaskReveals(selector, options = {}) {
  const {
    reduced = prefersReducedMotion(),
    excludeSelector = ".finish",
    triggerSelector = ".banner-showroom, .text-blocks, section",
    start = "top 82%",
    stagger = 0.07,
  } = options;

  const lines = hasMotionLibs()
    ? gsap.utils.toArray(selector)
    : [...document.querySelectorAll(selector)];

  if (!lines.length) return;

  if (reduced || !hasMotionLibs()) {
    lines.forEach((line) => {
      if (excludeSelector && line.closest(excludeSelector)) return;
      line.closest(".cs-line-mask")?.classList.add("is-revealed");
      if (hasMotionLibs()) gsap.set(line, { yPercent: 0 });
    });
    return;
  }

  lines.forEach((line, index) => {
    if (excludeSelector && line.closest(excludeSelector)) return;

    gsap.set(line, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: line.closest(triggerSelector) || line,
      start,
      once: true,
      onEnter: () => {
        line.closest(".cs-line-mask")?.classList.add("is-revealed");
        gsap.to(line, {
          yPercent: 0,
          duration: 0.95,
          delay: index * stagger,
          ease: "power3.out",
        });
      },
    });
  });
}

function toElementArray(target) {
  if (!target) return [];
  if (typeof target === "string") {
    return hasMotionLibs()
      ? gsap.utils.toArray(target)
      : [...document.querySelectorAll(target)];
  }
  if (target instanceof Element) return [target];
  return [...target];
}

function initScrollReveals(selector, options = {}) {
  const {
    reduced = prefersReducedMotion(),
    excludeSelector = null,
    start = "top 88%",
    y = 24,
    duration = 0.9,
  } = options;

  const elements = toElementArray(selector);

  if (!elements.length) return;

  if (reduced || !hasMotionLibs()) {
    elements.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  elements.forEach((el) => {
    if (excludeSelector && el.closest(excludeSelector)) return;

    gsap.set(el, { opacity: 0, y });
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration, ease: "power3.out" });
      },
    });
  });
}
