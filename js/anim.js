gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray(".panel").forEach((panel, index) => {
  gsap.to(panel, {
    scrollTrigger: {
      trigger: panel,
      start: "top top",
      end: "bottom top",
      scrub: true,
      pin: true,
      snap: 1 / (document.querySelectorAll(".panel").length - 1)
    }
  });
});