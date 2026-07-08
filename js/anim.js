/**
 * Landing page animations + swipeable project carousel
 * Breakpoint note: 768px here matches CSS --bp-md (48rem) at default root font size.
 */
const LANDING_DESKTOP_BP = 768;

function initLandingAnim() {
  if (!document.body.classList.contains("landing-page")) return;

  gsap.registerPlugin(ScrollTrigger);

  const carousel = document.getElementById("projects-carousel");
  const track = document.querySelector(".projects-track");
  const realCols = gsap.utils.toArray(".project-col:not(.project-col--clone)");
  const dots = gsap.utils.toArray(".carousel-dot");
  const headline = document.querySelector(".landing-headline");
  const lockup = document.querySelector(".site-head__lockup");
  const nav = document.querySelector(".site-head__nav");
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeColIndex = -1;

  function formatStat(el, value) {
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = Number(el.dataset.decimals || 0);
    const v = decimals > 0 ? Number(Number(value).toFixed(decimals)) : value;

    if (suffix === "k" && v >= 1000) {
      return prefix + Math.round(v / 1000) + "k";
    }
    if (v >= 1000 && suffix === "+") {
      return Math.round(v / 1000) + "k+";
    }
    const num = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
    return prefix + num + suffix;
  }

  function resetColStats(col) {
    col.querySelectorAll(".stat-num").forEach((el) => {
      el.textContent = formatStat(el, 0);
    });
  }

  function animateCounters(col) {
    if (!col) return;

    col.querySelectorAll(".stat-num").forEach((el) => {
      gsap.killTweensOf(el);
      const end = Number(el.dataset.value);
      const decimals = Number(el.dataset.decimals || 0);
      const state = { val: 0 };

      gsap.to(state, {
        val: end,
        duration: 1.15,
        ease: "power2.out",
        snap: decimals > 0 ? { val: 0.1 } : { val: 1 },
        onUpdate: () => {
          el.textContent = formatStat(el, state.val);
        },
      });
    });
  }

  realCols.forEach(resetColStats);

  function splitHeadline() {
    if (!headline) return [];
    const text = headline.textContent.trim();
    headline.textContent = "";
    headline.setAttribute("aria-label", text);
    const inners = [];
    text.split(/\s+/).forEach((word, i, arr) => {
      const wrap = document.createElement("span");
      wrap.className = "word";
      wrap.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.className = "word-inner";
      inner.textContent = word + (i < arr.length - 1 ? "\u00a0" : "");
      wrap.appendChild(inner);
      headline.appendChild(wrap);
      inners.push(inner);
    });
    return inners;
  }

  const wordInners = splitHeadline();

  function setActiveDot(index) {
    const n = realCols.length;
    const wrapped = ((index % n) + n) % n;
    dots.forEach((dot, i) => {
      const active = i === wrapped;
      dot.setAttribute("aria-selected", active ? "true" : "false");
      dot.setAttribute("aria-current", active ? "true" : "false");
      dot.setAttribute("tabindex", active ? "0" : "-1");
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = dots[(i + step + dots.length) % dots.length];
      next.focus();
      next.click();
    });
  });

  function runCountersForIndex(index) {
    if (reducedMotion) return;
    const col = realCols[index];
    if (!col) return;
    resetColStats(col);
    animateCounters(col);
  }

  let isVisibleSlideClone = null;

  function onCarouselIndexChange(index) {
    if (index === activeColIndex) return;
    activeColIndex = index;
    setActiveDot(index);
    if (window.innerWidth < LANDING_DESKTOP_BP && !isVisibleSlideClone?.()) {
      runCountersForIndex(index);
    }
  }

  let drag = false;

  function initColumnTapGuard() {
    const links = gsap.utils.toArray(".project-col-link").filter(
      (link) => !link.closest(".project-col--clone")
    );
    let startX = 0;
    let startY = 0;
    const threshold = 10;

    function onPointerDown(e) {
      drag = false;
      startX = e.clientX;
      startY = e.clientY;
    }

    function onPointerMove(e) {
      if (
        Math.abs(e.clientX - startX) > threshold ||
        Math.abs(e.clientY - startY) > threshold
      ) {
        drag = true;
      }
    }

    function onPointerUp() {
      window.setTimeout(() => {
        drag = false;
      }, 50);
    }

    carousel.addEventListener("pointerdown", onPointerDown, { passive: true });
    carousel.addEventListener("pointermove", onPointerMove, { passive: true });
    carousel.addEventListener("pointerup", onPointerUp, { passive: true });
    carousel.addEventListener("pointercancel", onPointerUp, { passive: true });
    carousel.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length) onPointerDown(e.touches[0]);
      },
      { passive: true }
    );
    carousel.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length) onPointerMove(e.touches[0]);
      },
      { passive: true }
    );
    carousel.addEventListener("touchend", onPointerUp, { passive: true });

    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (drag) e.preventDefault();
      });
    });
  }

  function initMobileInfiniteCarousel() {
    if (!carousel || !track || realCols.length < 2) return () => {};

    const n = realCols.length;

    function seedCloneStats(clone) {
      clone.querySelectorAll(".stat-num").forEach((el) => {
        el.textContent = formatStat(el, Number(el.dataset.value));
      });
    }

    function cloneSet() {
      const frag = document.createDocumentFragment();
      realCols.forEach((col) => {
        const clone = col.cloneNode(true);
        clone.classList.add("project-col--clone");
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("inert", "");
        clone.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1"));
        seedCloneStats(clone);
        frag.appendChild(clone);
      });
      return frag;
    }

    track.insertBefore(cloneSet(), track.firstChild);
    track.appendChild(cloneSet());

    let slides = gsap.utils.toArray(".project-col", track);
    let scrollEndTimer = 0;
    let repositioning = false;

    function refreshSlides() {
      slides = gsap.utils.toArray(".project-col", track);
    }

    function getActiveIndex() {
      const scroll = carousel.scrollLeft;
      let best = n;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs(slide.offsetLeft - scroll);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    }

    function getRealIndex() {
      return getActiveIndex() % n;
    }

    isVisibleSlideClone = () => {
      const slide = slides[getActiveIndex()];
      return Boolean(slide?.classList.contains("project-col--clone"));
    };

    function setSmoothScroll(enabled) {
      carousel.classList.toggle("projects-carousel--smooth", enabled);
    }

    function normalizePosition() {
      if (repositioning) return;
      refreshSlides();
      const index = getActiveIndex();
      let target = null;
      if (index < n) target = slides[index + n];
      else if (index >= n * 2) target = slides[index - n];
      if (!target) return;

      repositioning = true;
      carousel.style.scrollSnapType = "none";
      carousel.scrollLeft = target.offsetLeft;
      requestAnimationFrame(() => {
        carousel.style.scrollSnapType = "";
        repositioning = false;
      });
    }

    function scrollToRealIndex(realIndex, smooth = true) {
      refreshSlides();
      const wrapped = ((realIndex % n) + n) % n;
      const target = slides[n + wrapped];
      if (!target) return;
      setSmoothScroll(smooth && !reducedMotion);
      carousel.scrollTo({
        left: target.offsetLeft,
        behavior: smooth && !reducedMotion ? "smooth" : "auto",
      });
      setActiveDot(wrapped);
      if (smooth && !reducedMotion) {
        window.setTimeout(() => setSmoothScroll(false), 400);
      }
    }

    function onScroll() {
      if (repositioning) return;
      drag = true;
      onCarouselIndexChange(getRealIndex());
      if (!("onscrollend" in window)) {
        window.clearTimeout(scrollEndTimer);
        scrollEndTimer = window.setTimeout(finishScroll, 150);
      }
    }

    function finishScroll() {
      normalizePosition();
      onCarouselIndexChange(getRealIndex());
      setSmoothScroll(false);
      window.setTimeout(() => {
        drag = false;
      }, 50);
    }

    function setStartPosition() {
      refreshSlides();
      const start = slides[n];
      if (!start || !start.offsetLeft) {
        requestAnimationFrame(setStartPosition);
        return;
      }
      setSmoothScroll(false);
      carousel.scrollLeft = start.offsetLeft;
      setActiveDot(0);
    }

    setStartPosition();

    carousel.addEventListener("scroll", onScroll, { passive: true });
    if ("onscrollend" in window) {
      carousel.addEventListener("scrollend", finishScroll, { passive: true });
    }

    const onResize = () => {
      refreshSlides();
      const wrapped = getRealIndex();
      const target = slides[n + wrapped];
      if (target) carousel.scrollLeft = target.offsetLeft;
    };
    window.addEventListener("resize", onResize);

    const dotHandlers = dots.map((dot) => {
      const handler = (e) => {
        e.stopPropagation();
        scrollToRealIndex(Number(dot.dataset.index));
      };
      dot.addEventListener("click", handler);
      return { dot, handler };
    });

    const onKeydown = (e) => {
      const i = getRealIndex();
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToRealIndex(i + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToRealIndex(i - 1);
      }
    };
    carousel.addEventListener("keydown", onKeydown);

    return () => {
      window.clearTimeout(scrollEndTimer);
      window.removeEventListener("resize", onResize);
      carousel.removeEventListener("scroll", onScroll);
      if ("onscrollend" in window) {
        carousel.removeEventListener("scrollend", finishScroll);
      }
      carousel.removeEventListener("keydown", onKeydown);
      dotHandlers.forEach(({ dot, handler }) => dot.removeEventListener("click", handler));
      track.querySelectorAll(".project-col--clone").forEach((el) => el.remove());
      carousel.classList.remove("projects-carousel--smooth");
      isVisibleSlideClone = null;
    };
  }

  if (carousel && track) {
    initColumnTapGuard();
    const mmCarousel = gsap.matchMedia();
    mmCarousel.add("(max-width: 47.99rem)", () => initMobileInfiniteCarousel());
  }

  if (reducedMotion) {
    wordInners.forEach((w) => gsap.set(w, { y: 0 }));
    gsap.set([lockup, nav, ...realCols, ".project-visual img"], { opacity: 1, y: 0, scale: 1 });
    realCols.forEach((col) => {
      col.querySelectorAll(".stat-num").forEach((el) => {
        el.textContent = formatStat(el, Number(el.dataset.value));
      });
    });
    return;
  }

  const loadTl = gsap.timeline({ defaults: { ease: "power3.out" } });

  loadTl
    .from(lockup, { opacity: 0, y: -10, duration: 0.4 })
    .from(
      [nav, document.querySelector(".site-head__linkedin")].filter(Boolean),
      { opacity: 0, duration: 0.3 },
      0.06
    )
    .from(wordInners, { yPercent: 110, duration: 0.8, stagger: 0.05 }, 0.08)
    .from(
      realCols,
      {
        y: 40,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
      },
      0.22
    )
    .from(
      ".project-visual img",
      {
        scale: 0.94,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        transformOrigin: "center 85%",
      },
      0.3
    )
    .add(() => {
      if (window.innerWidth >= LANDING_DESKTOP_BP) {
        realCols.forEach((col) => {
          resetColStats(col);
          animateCounters(col);
        });
      } else {
        runCountersForIndex(0);
      }
    }, 0.26);

  const mm = gsap.matchMedia();
  const projectsWrap = document.querySelector(".projects-wrap");

  mm.add("(min-width: 48rem)", () => {
    const tween = { duration: 0.32, ease: "power2.out" };
    let activeCol = null;

    realCols.forEach((col) => {
      gsap.set(col, { transformOrigin: "center center", scale: 1, opacity: 1 });
    });

    function setColumnActive(col) {
      activeCol = col || null;
      const hasActive = Boolean(col);

      realCols.forEach((c) => {
        const isActive = hasActive && c === col;
        const hit = c.querySelector(".project-col-link");

        c.classList.toggle("project-col--active", isActive);

        gsap.to(c, {
          opacity: !hasActive || isActive ? 1 : 0.55,
          scale: !hasActive || isActive ? 1 : 0.98,
          ...tween,
        });

        if (hit) {
          hit.setAttribute("aria-expanded", isActive ? "true" : "false");
        }
      });
    }

    function clearColumnActive() {
      if (!activeCol) return;
      setColumnActive(null);
    }

    function anyColumnFocused() {
      return Boolean(projectsWrap?.querySelector(".project-col-link:focus-visible"));
    }

    realCols.forEach((col) => {
      const hit = col.querySelector(".project-col-link");
      if (!hit) return;

      hit.addEventListener("mouseenter", () => setColumnActive(col));
      hit.addEventListener("focus", () => setColumnActive(col));
      hit.addEventListener("blur", () => {
        requestAnimationFrame(() => {
          if (!anyColumnFocused()) clearColumnActive();
        });
      });
    });

    if (projectsWrap) {
      projectsWrap.addEventListener("mouseleave", clearColumnActive);
    }

    return () => {
      realCols.forEach((col) => {
        col.classList.remove("project-col--active");
        gsap.set(col, { clearProps: "opacity,scale,transform" });
      });
    };
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLandingAnim);
} else {
  initLandingAnim();
}
