/**
 * Horizontal hero gallery — smooth scroll + image parallax
 * Depends on shared.js for motion utilities.
 */

class HeroGallery {
  constructor(root) {
    this.root = root;
    this.viewport = root.querySelector(".project-hero__gallery-viewport");
    this.track = root.querySelector(".project-hero__gallery-track");
    this.images = root.querySelectorAll(".project-hero__gallery-image");
    this.scroll = { current: 0, target: 0, ease: 0.08, limit: 0 };
    this.drag = { active: false, startX: 0, startTarget: 0 };
    this.raf = 0;
    this.reduced = prefersReducedMotion();

    this.onWheel = this.onWheel.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.render = this.render.bind(this);

    this.setLimit();
    this.addListeners();
    if (!this.reduced) {
      this.raf = requestAnimationFrame(this.render);
    }
  }

  hero() {
    return this.root.closest(".project-hero");
  }

  setLimit() {
    if (!this.track || !this.viewport) return;
    this.scroll.limit = Math.max(0, this.track.scrollWidth - this.viewport.clientWidth);
    this.scroll.target = clamp(this.scroll.target, 0, this.scroll.limit);
    this.scroll.current = clamp(this.scroll.current, 0, this.scroll.limit);
  }

  isHeroVisible() {
    const hero = this.hero();
    if (!hero) return false;
    const rect = hero.getBoundingClientRect();
    return rect.bottom > window.innerHeight * 0.2 && rect.top < window.innerHeight;
  }

  onWheel(e) {
    if (this.reduced || !this.isHeroVisible()) return;

    const { deltaX, deltaY } = e;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    const atStart = this.scroll.target <= 0.5;
    const atEnd = this.scroll.target >= this.scroll.limit - 0.5;

    if (deltaX < 0 && atStart) return;
    if (deltaX > 0 && atEnd) return;

    e.preventDefault();
    this.scroll.target += deltaX * 1.15;
  }

  onPointerDown(e) {
    if (this.reduced) return;
    this.drag.active = true;
    this.drag.startX = e.clientX;
    this.drag.startTarget = this.scroll.target;
    this.viewport?.setPointerCapture(e.pointerId);
  }

  onPointerMove(e) {
    if (!this.drag.active) return;
    this.scroll.target = this.drag.startTarget - (e.clientX - this.drag.startX);
  }

  onPointerUp(e) {
    if (!this.drag.active) return;
    this.drag.active = false;
    this.viewport?.releasePointerCapture(e.pointerId);
  }

  applyParallax() {
    if (this.reduced || !this.images.length) return;

    const viewportCenter = window.innerWidth * 0.5;
    const maxShift = 10;

    this.images.forEach((image) => {
      const parent = image.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const elementCenter = rect.left + rect.width * 0.5;
      const t = clamp((elementCenter - viewportCenter) / viewportCenter, -1, 1);
      const shift = -t * maxShift;

      image.style.transform = `translate3d(${shift}%, 0, 0)`;
    });
  }

  addListeners() {
    window.addEventListener("resize", this.onResize, { passive: true });
    this.viewport?.addEventListener("wheel", this.onWheel, { passive: false });
    this.viewport?.addEventListener("pointerdown", this.onPointerDown);
    this.viewport?.addEventListener("pointermove", this.onPointerMove);
    this.viewport?.addEventListener("pointerup", this.onPointerUp);
    this.viewport?.addEventListener("pointercancel", this.onPointerUp);
  }

  onResize() {
    this.setLimit();
  }

  render() {
    this.scroll.target = clamp(this.scroll.target, 0, this.scroll.limit);
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);

    if (this.track) {
      const x = this.scroll.current < 0.01 ? 0 : -this.scroll.current;
      this.track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    this.applyParallax();
    this.raf = requestAnimationFrame(this.render);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.viewport?.removeEventListener("wheel", this.onWheel);
  }
}

function initHeroGallery() {
  const root = document.querySelector("[data-hero-gallery]");
  if (!root) return null;
  return new HeroGallery(root);
}
