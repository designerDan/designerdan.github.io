/**
 * Case study + About page motion — line-mask reveals, scroll-reveal, nav sync
 * Depends on shared.js for motion utilities.
 */

const FINISH_BRAND_THRESHOLD = 0.35;
const FINISH_LINE_START = 0.5;
const FINISH_LINE_HIDE = 0.46;
const FINISH_LINE_STAGGER = 0.07;

function sectionCoversNavBand(el, navH) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top < navH && r.bottom > 0;
}

function parseRgb(color) {
  if (!color) return null;
  const match = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function inferLinkToneFromBg(cssColor) {
  const rgb = parseRgb(cssColor);
  if (!rgb) return "light";
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return lum > 0.55 ? "dark" : "light";
}

function resolveLinkTone(el, bgColor) {
  if (!el) return inferLinkToneFromBg(bgColor);
  const fromAttr = el.dataset.navLinkTone?.trim();
  if (fromAttr === "light" || fromAttr === "dark") return fromAttr;
  const fromVar = getComputedStyle(el).getPropertyValue("--case-nav-link-tone").trim();
  if (fromVar === "light" || fromVar === "dark") return fromVar;
  return inferLinkToneFromBg(bgColor);
}

function applyNavSurface(siteHead, surfaceEl, linkTone) {
  const bg = getComputedStyle(surfaceEl).backgroundColor;
  if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "transparent") return false;
  siteHead.style.setProperty("--site-head-bg", bg);
  siteHead.dataset.navLinks = linkTone || resolveLinkTone(surfaceEl, bg);
  return true;
}

function clearNavSurface(siteHead) {
  siteHead.style.removeProperty("--site-head-bg");
  siteHead.removeAttribute("data-nav-links");
}

function syncSiteHeadMetrics() {
  const siteHead = document.querySelector(".site-head");
  if (!siteHead) return;
  document.documentElement.style.setProperty("--site-head-height", `${siteHead.offsetHeight}px`);
}

function syncSiteHeadTheme() {
  const siteHead = document.querySelector(".site-head");
  if (!siteHead) return;

  const navH = siteHead.getBoundingClientRect().height;
  const handoff = document.querySelector(".project-handoff[data-nav-theme]");
  const finish = document.querySelector(".finish");
  const hero = document.querySelector(".project-hero");

  siteHead.classList.remove("is-scrolled", "is-handoff", "is-hero-nav", "is-finish");
  siteHead.removeAttribute("data-handoff-theme");
  clearNavSurface(siteHead);

  if (handoff && sectionCoversNavBand(handoff, navH)) {
    siteHead.classList.add("is-handoff");
    siteHead.dataset.handoffTheme = handoff.dataset.navTheme || "yellow";
    return;
  }

  const finishSticky = finish?.querySelector(".finish__sticky");
  if (finishSticky && sectionCoversNavBand(finishSticky, navH)) {
    if (
      finish.classList.contains("finish--brand-active") &&
      applyNavSurface(
        siteHead,
        finish.querySelector(".finish__bg") || finishSticky,
        resolveLinkTone(finish)
      )
    ) {
      siteHead.classList.add("is-finish");
      return;
    }

    siteHead.classList.add("is-scrolled");
    return;
  }

  if (hero && sectionCoversNavBand(hero, navH) && applyNavSurface(siteHead, hero)) {
    siteHead.classList.add("is-hero-nav");
    return;
  }

  siteHead.classList.add("is-scrolled");
}

function syncPageNav() {
  if (document.body.classList.contains("about-page")) {
    syncAboutNav();
  } else {
    syncSiteHeadTheme();
  }
}

function syncAboutNav() {
  const siteHead = document.querySelector(".site-head");
  if (!siteHead) return;

  const navH = siteHead.getBoundingClientRect().height;
  const intro = document.querySelector(".about-intro");
  const themed = [...document.querySelectorAll(".about-page [data-nav-theme]")];

  siteHead.classList.remove("is-scrolled", "is-hero-nav", "is-handoff");
  siteHead.removeAttribute("data-handoff-theme");
  clearNavSurface(siteHead);

  for (let i = themed.length - 1; i >= 0; i -= 1) {
    const el = themed[i];
    if (!sectionCoversNavBand(el, navH)) continue;

    const theme = el.dataset.navTheme;

    if (theme === "yellow" || theme === "brown" || theme === "black") {
      siteHead.classList.add("is-handoff");
      siteHead.dataset.handoffTheme = theme;
      return;
    }

    if (applyNavSurface(siteHead, el, resolveLinkTone(el))) {
      if (el === intro || theme === "paper" || theme === "brand") {
        siteHead.classList.add("is-hero-nav");
      } else {
        siteHead.classList.add("is-scrolled");
      }
      return;
    }
  }

  siteHead.classList.add("is-scrolled");
}

function initCaseStudy() {
  if (!document.body.classList.contains("case-page")) return;

  syncSiteHeadMetrics();

  const reduced = prefersReducedMotion();

  if (!hasMotionLibs()) {
    revealStaticMotion();
    initProjectHandoff(reduced);
    initBannerShowroom(reduced);
    initFinishSequence(true);
    initSiteHeadTheme(true);
    return;
  }

  document.body.classList.add("motion-ready");
  gsap.registerPlugin(ScrollTrigger);

  initLineMaskReveals(".cs-line-mask .cs-line", { reduced, excludeSelector: ".finish" });
  initScrollReveals(".scroll-reveal", { reduced, excludeSelector: ".finish" });

  initProjectHandoff(reduced);
  initBannerShowroom(reduced);
  initProductShowcase(reduced);
  initFinishSequence(reduced);
  initSiteHeadTheme();

  window.addEventListener("load", () => refreshScrollLayout({ sync: syncSiteHeadTheme }), { once: true });
  onDebouncedResize(() => refreshScrollLayout({ sync: syncSiteHeadTheme }));
}

function initSiteHeadTheme(useFallback) {
  if (!document.querySelector(".site-head")) return;
  if (useFallback) {
    syncSiteHeadTheme();
    return;
  }
  initNavListeners(syncSiteHeadTheme);
}

function initSiteHeadHideOnScroll(reduced) {
  const siteHead = document.querySelector(".site-head");
  if (!siteHead || reduced) return;

  let lastY = window.scrollY;
  const THRESHOLD = 12;

  const onScroll = () => {
    const y = window.scrollY;
    const delta = y - lastY;

    if (y <= 4) {
      siteHead.classList.remove("is-hidden");
      lastY = y;
      syncPageNav();
      return;
    }

    if (delta > THRESHOLD) {
      siteHead.classList.add("is-hidden");
    } else if (delta < -THRESHOLD) {
      siteHead.classList.remove("is-hidden");
    }

    lastY = y;
    syncPageNav();
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function getBannerStartScale() {
  return window.matchMedia("(max-width: 600px)").matches ? 0.72 : 0.58;
}

function initBannerShowroom(reduced) {
  const banner = document.querySelector(".banner-showroom");
  const image = banner?.querySelector(".banner-showroom__image");
  const scrim = banner?.querySelector(".banner-showroom__scrim");
  const content = banner?.querySelector(".banner-showroom__content");
  if (!banner || !image) return;

  if (reduced || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    banner.classList.add("banner-showroom--static");
    gsap?.set(image, { scale: 1, clearProps: "transform" });
    return;
  }

  const build = () => {
    ScrollTrigger.getById("banner-showroom")?.kill();
    gsap.killTweensOf([image, scrim, content]);

    banner.classList.add("banner-showroom--js");
    banner.classList.remove("banner-showroom--static");

    const startScale = getBannerStartScale();

    gsap.set(image, {
      scale: startScale,
      transformOrigin: "50% 50%",
      force3D: true,
    });

    if (scrim) gsap.set(scrim, { opacity: 0.35 });
    if (content) gsap.set(content, { y: 28, opacity: 0.82 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: "banner-showroom",
        trigger: banner,
        start: "top 88%",
        end: "bottom 25%",
        scrub: 0.85,
        invalidateOnRefresh: true,
      },
    });

    tl.to(image, { scale: 1, ease: "none" }, 0);

    if (scrim) {
      tl.to(scrim, { opacity: 0.82, ease: "none" }, 0);
    }

    if (content) {
      tl.to(content, { y: 0, opacity: 1, ease: "none" }, 0.15);
    }
  };

  build();

  ScrollTrigger.addEventListener("refreshInit", () => {
    if (!banner.classList.contains("banner-showroom--static")) {
      gsap.set(image, { scale: getBannerStartScale(), transformOrigin: "50% 50%" });
    }
  });
}

function initProductShowcase(reduced) {
  if (reduced || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const configs = [
    null,
    { start: 1, end: -1 },
    { start: -0.7, end: 0.7 },
    { start: 0.5, end: -0.5 },
  ];

  gsap.utils.toArray(".product-showcase__item").forEach((item, index) => {
    const config = configs[index];
    if (!config) return;

    const travel = () => {
      const base = Math.max(24, Math.round(item.offsetHeight * 0.15));
      const scale = window.matchMedia("(max-width: 600px)").matches ? 0.5 : 1;
      return base * scale;
    };

    gsap.fromTo(
      item,
      { y: () => travel() * config.start },
      {
        y: () => travel() * config.end,
        ease: "none",
        scrollTrigger: {
          id: `product-showcase-${index}`,
          trigger: item,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      }
    );
  }  );
}

function initFinishSequence(reduced) {
  const finish = document.querySelector(".finish");
  const track = finish?.querySelector(".finish__track");
  const sticky = finish?.querySelector(".finish__sticky");
  const headline = finish?.querySelector(".closing-cta__headline");

  if (!finish || !track || !sticky || !headline) return;

  const getCtaLines = () => Array.from(finish.querySelectorAll(".finish__act--cta .cs-line"));

  const setComplete = () => {
    finish.classList.add("finish--complete", "finish--brand-active");
    finish.querySelectorAll(".finish__act--cta .cs-line-mask").forEach((mask) => {
      mask.classList.add("is-revealed");
    });
    getCtaLines().forEach((line) => {
      gsap.set(line, { yPercent: 0 });
    });
    syncSiteHeadTheme();
  };

  if (reduced) {
    setComplete();
    return;
  }

  /* Always use JS driver — view-timeline cover progress does not align with sticky
     scroll range on 400vh tracks (pre-entry/end states leak wrong opacities). */
  finish.classList.add("finish--js");

  let ctaLinesRevealed = false;

  const primeCtaLines = () => {
    ctaLinesRevealed = false;
    getCtaLines().forEach((line) => {
      gsap.killTweensOf(line);
      gsap.set(line, { yPercent: 110 });
      line.closest(".cs-line-mask")?.classList.remove("is-revealed");
    });
  };

  const revealCtaLines = () => {
    if (ctaLinesRevealed) return;
    ctaLinesRevealed = true;

    getCtaLines().forEach((line, index) => {
      line.closest(".cs-line-mask")?.classList.add("is-revealed");
      gsap.to(line, {
        yPercent: 0,
        duration: 0.95,
        delay: index * FINISH_LINE_STAGGER,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  };

  const hideCtaLines = () => {
    if (!ctaLinesRevealed) return;
    ctaLinesRevealed = false;

    const lines = getCtaLines();
    lines.forEach((line, index) => {
      line.closest(".cs-line-mask")?.classList.remove("is-revealed");
      gsap.killTweensOf(line);
      gsap.to(line, {
        yPercent: 110,
        duration: 0.55,
        delay: (lines.length - 1 - index) * 0.04,
        ease: "power3.in",
        overwrite: "auto",
      });
    });
  };

  const updateLineMasks = (progress) => {
    if (progress >= FINISH_LINE_START) {
      revealCtaLines();
    } else if (progress < FINISH_LINE_HIDE) {
      hideCtaLines();
    }
  };

  const updateFinish = () => {
    const progress = getStickyTrackProgress(track);

    sticky.style.setProperty("--finish-p", progress.toFixed(4));

    finish.classList.toggle("finish--brand-active", progress >= FINISH_BRAND_THRESHOLD);
    finish.classList.toggle("finish--cta-interactive", progress >= FINISH_LINE_START);
    finish.classList.toggle(
      "finish--proof-interactive",
      progress >= 0.05 && progress < 0.48
    );

    updateLineMasks(progress);
    syncSiteHeadTheme();
  };

  primeCtaLines();
  updateFinish();

  window.addEventListener("scroll", updateFinish, { passive: true });
  window.addEventListener("resize", updateFinish, { passive: true });
}

function initProjectHandoff(reduced) {
  const nextUrl = document.body.dataset.nextProject;
  if (!nextUrl) return;

  const handoff = document.querySelector(".project-handoff");
  const progressBar = handoff?.querySelector(".project-handoff__progress-bar");
  const isMobileLike = window.matchMedia("(max-width: 47.99rem), (pointer: coarse)").matches;
  const THRESHOLD = isMobileLike ? 250 : 420;
  const WHEEL_GAIN = isMobileLike ? 0.65 : 0.45;
  const TOUCH_GAIN = isMobileLike ? 0.6 : 0.28;
  const BACKTRACK_GAIN = isMobileLike ? 1 : 1.3;
  const DECAY_DELAY = isMobileLike ? 280 : 180;
  const DECAY_FACTOR = isMobileLike ? 0.08 : 0.18;
  let budget = 0;
  let touchStartY = 0;
  let decayTimer;

  function isAtBottom() {
    const atDocEnd =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;

    if (!handoff) return atDocEnd;

    const rect = handoff.getBoundingClientRect();
    const handoffVisible = rect.top < window.innerHeight * 0.55;
    return atDocEnd && handoffVisible;
  }

  function updateProgress(ratio) {
    if (!progressBar) return;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  }

  function resetBudget() {
    budget = 0;
    updateProgress(0);
  }

  function scheduleDecay() {
    clearTimeout(decayTimer);
    decayTimer = setTimeout(() => {
      if (budget > 0) {
        budget = Math.max(0, budget - THRESHOLD * DECAY_FACTOR);
        updateProgress(budget / THRESHOLD);
      }
    }, DECAY_DELAY);
  }

  function navigateNext() {
    window.location.assign(nextUrl);
  }

  if (reduced) return;

  window.addEventListener(
    "wheel",
    (e) => {
      if (!isAtBottom()) {
        resetBudget();
        return;
      }

      if (e.deltaY < 0) {
        budget = Math.max(0, budget + e.deltaY * BACKTRACK_GAIN);
        updateProgress(budget / THRESHOLD);
        scheduleDecay();
        return;
      }

      e.preventDefault();
      budget += e.deltaY * WHEEL_GAIN;
      updateProgress(budget / THRESHOLD);
      scheduleDecay();

      if (budget >= THRESHOLD) {
        navigateNext();
      }
    },
    { passive: false }
  );

  handoff?.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  handoff?.addEventListener(
    "touchmove",
    (e) => {
      if (!isAtBottom()) {
        resetBudget();
        return;
      }

      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;

      if (deltaY < 0) {
        budget = Math.max(0, budget + deltaY * BACKTRACK_GAIN);
        updateProgress(budget / THRESHOLD);
        scheduleDecay();
        return;
      }

      if (deltaY <= 0) return;

      budget += deltaY * TOUCH_GAIN;
      updateProgress(budget / THRESHOLD);
      scheduleDecay();

      if (budget >= THRESHOLD) {
        navigateNext();
      }
    },
    { passive: true }
  );
}

function initAboutBeneCarousel(reduced) {
  const section = document.querySelector(".about-bene");
  const track = section?.querySelector("[data-bene-track]");
  const slides = [...(section?.querySelectorAll("[data-bene-slide]") || [])];
  const figures = [...(section?.querySelectorAll("[data-bene-figure]") || [])];
  const prevBtn = section?.querySelector("[data-bene-prev]");
  const nextBtn = section?.querySelector("[data-bene-next]");
  const currentEl = section?.querySelector("[data-bene-current]");

  if (!section || !track || !slides.length) return;

  let activeIndex = 0;
  let isProgrammaticScroll = false;
  let scrollTimer;

  const progressToIndex = (progress) => {
    if (progress < 0.33) return 0;
    if (progress < 0.66) return 1;
    return 2;
  };

  const setSlide = (index) => {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
    if (nextIndex === activeIndex) return;

    activeIndex = nextIndex;

    slides.forEach((slide, idx) => {
      const isActive = idx === nextIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    figures.forEach((figure, idx) => {
      figure.classList.toggle("is-active", idx === nextIndex);
    });

    if (currentEl) {
      currentEl.textContent = String(nextIndex + 1).padStart(2, "0");
    }
  };

  const clearBeneOpacity = () => {
    const targets = [...slides, ...figures];
    if (typeof gsap !== "undefined") {
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "opacity" });
      return;
    }
    targets.forEach((el) => el.style.removeProperty("opacity"));
  };

  const scrollToIndex = (index) => {
    const range = track.offsetHeight - window.innerHeight;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const divisor = Math.max(1, slides.length - 1);
    const y = trackTop + (range * index) / divisor;

    isProgrammaticScroll = true;
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      isProgrammaticScroll = false;
    }, reduced ? 0 : 600);
  };

  const goTo = (index, scroll = true) => {
    setSlide(index);
    if (scroll && !reduced) scrollToIndex(index);
  };

  if (reduced) {
    section.classList.add("about-bene--static");
    clearBeneOpacity();
    setSlide(0);
  } else {
    clearBeneOpacity();
    setSlide(0);
    const onScroll = () => {
      if (isProgrammaticScroll) return;
      const idx = progressToIndex(getStickyTrackProgress(track));
      if (idx !== activeIndex) setSlide(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  prevBtn?.addEventListener("click", () => {
    goTo((activeIndex - 1 + slides.length) % slides.length);
  });

  nextBtn?.addEventListener("click", () => {
    goTo((activeIndex + 1) % slides.length);
  });

  section.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo((activeIndex - 1 + slides.length) % slides.length);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo((activeIndex + 1) % slides.length);
    }
  });
}

function initAboutIntroHero(reduced) {
  const intro = document.querySelector(".about-intro");
  const banner = intro?.querySelector(".about-intro__banner");
  const photo = intro?.querySelector(".about-intro__photo");
  const lines = intro?.querySelectorAll(".about-intro__lede .cs-line-mask .cs-line");
  if (!intro || !banner || !photo) return;

  if (reduced || typeof gsap === "undefined") {
    intro.classList.add("about-intro--static", "about-intro--revealed");
    lines?.forEach((line) => line.closest(".cs-line-mask")?.classList.add("is-revealed"));
    return;
  }

  intro.classList.add("about-intro--js", "about-intro--revealed");
  lines?.forEach((line) => gsap.set(line, { yPercent: 110 }));

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.fromTo(
    banner,
    { clipPath: "inset(0 0 100% 0)" },
    { clipPath: "inset(0)", duration: 1.1 },
    0
  )
    .fromTo(photo, { scale: 1.05 }, { scale: 1, duration: 1.1 }, 0);

  lines?.forEach((line, i) => {
    tl.to(
      line,
      {
        yPercent: 0,
        duration: 0.95,
        onStart: () => line.closest(".cs-line-mask")?.classList.add("is-revealed"),
      },
      0.45 + i * 0.1
    );
  });

  if (typeof ScrollTrigger !== "undefined") {
    gsap.to(photo, {
      yPercent: 4,
      ease: "none",
      scrollTrigger: {
        trigger: intro,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  }
}

function initAboutLineMasks(reduced) {
  initLineMaskReveals(".about-contact .cs-line-mask .cs-line", {
    reduced,
    excludeSelector: null,
    triggerSelector: "section, .text-section",
    stagger: 0,
  });
}

function initAboutQuoteBand(reduced) {
  const block = document.querySelector(".about-quote__quote");
  if (!block) return;
  initScrollReveals(block, { reduced, start: "top 78%", y: 20 });
}

function initAboutContactReveal(reduced) {
  const contact = document.querySelector(".about-contact");
  const inner = contact?.querySelector(".about-contact__inner");
  if (!inner) return;

  if (reduced || !hasMotionLibs()) {
    inner.style.opacity = "1";
    return;
  }

  document.body.classList.add("about-contact--js");
  initScrollReveals(inner, { reduced, start: "top 78%", y: 0 });
}

function initAboutReveals(reduced) {
  initScrollReveals(
    ".about-proof__stat, .about-work__card, .about-page .text-blocks__item, .about-looking__text",
    { reduced, y: 22, duration: 0.8 }
  );
}

function initAbout() {
  if (!document.body.classList.contains("about-page")) return;

  const reduced = prefersReducedMotion();

  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    document.body.classList.add("motion-ready");
  }

  initAboutIntroHero(reduced);
  initAboutBeneCarousel(reduced);
  initAboutLineMasks(reduced);
  initAboutQuoteBand(reduced);
  initAboutContactReveal(reduced);
  initAboutReveals(reduced);
  initNavListeners(syncAboutNav);

  window.addEventListener("load", () => refreshScrollLayout({ sync: syncAboutNav }), { once: true });
  onDebouncedResize(() => refreshScrollLayout({ sync: syncAboutNav }));

  if (!hasMotionLibs()) {
    revealStaticMotion();
  }
}

function initApp() {
  const reduced = prefersReducedMotion();

  if (document.body.classList.contains("case-page")) {
    initCaseStudy();
    initHeroGallery();
  }

  if (document.body.classList.contains("about-page")) {
    initAbout();
  }

  if (document.body.classList.contains("case-page") || document.body.classList.contains("about-page")) {
    initSiteHeadHideOnScroll(reduced);
  }
}

onReady(initApp);
