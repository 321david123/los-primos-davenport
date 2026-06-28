/* =========================================================
   LOS PRIMOS MEXICAN GRILL — interactions
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP / ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); }

    if (!reduceMotion) {
      /* Hero reveals — fire on load (never scroll-gated, never stuck) */
      var heroReveals = gsap.utils.toArray(".hero [data-reveal]");
      heroReveals.forEach(function (el) { el.classList.add("is-visible"); });
      gsap.fromTo(heroReveals, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.15
      });

      /* In-view reveals (everything except the hero) */
      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        if (el.closest(".hero")) return;
        gsap.fromTo(el, { opacity: 0, y: 28 }, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onComplete: function () { el.classList.add("is-visible"); }
        });
      });

      /* Hero parallax */
      var heroImg = document.getElementById("heroImg");
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 12, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      }

      /* Image parallax inside wraps */
      gsap.utils.toArray("[data-parallax]").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      /* Signature title letters */
      gsap.utils.toArray("[data-letters]").forEach(function (title) {
        var text = title.textContent;
        title.innerHTML = "";
        text.split("").forEach(function (ch) {
          var s = document.createElement("span");
          s.className = "ltr";
          s.textContent = ch === " " ? " " : ch;
          title.appendChild(s);
        });
        gsap.from(title.querySelectorAll(".ltr"), {
          opacity: 0, yPercent: 60, duration: 0.6, ease: "power3.out", stagger: 0.02,
          scrollTrigger: { trigger: title, start: "top 85%", once: true }
        });
      });

      /* Stat counters */
      gsap.utils.toArray(".stat__num[data-count]").forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-count"));
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: function () { el.textContent = obj.v.toFixed(decimals) + suffix; },
          onComplete: function () { el.textContent = target.toFixed(decimals) + suffix; }
        });
      });
    }
  }

  /* ---------- Nav solid on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile overlay ---------- */
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("overlay");
  var overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  if (overlay) {
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeOverlay);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOverlay();
  });

  /* ---------- Smooth anchor scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu__tab");
  var panels = document.querySelectorAll(".menu__panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Highlight current hours row ---------- */
  (function () {
    var rows = document.querySelectorAll("#hours tr");
    if (!rows.length) return;
    var day = new Date().getDay(); // 0 = Sun ... 6 = Sat
    var map = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
    var idx = map[day];
    var hour = new Date().getHours();
    var closeHour = (day === 0) ? 16 : 20; // Sun closes 4pm, else 8pm
    var openNow = hour >= 11 && hour < closeHour;
    if (rows[idx] && openNow) rows[idx].classList.add("is-now");
  })();

  /* ---------- Swiper: gallery ---------- */
  if (window.Swiper) {
    new Swiper(".gallery__swiper", {
      slidesPerView: "auto",
      spaceBetween: 18,
      grabCursor: true,
      navigation: { prevEl: ".gallery__btn--prev", nextEl: ".gallery__btn--next" }
    });

    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      spaceBetween: 40,
      loop: true,
      autoplay: { delay: 5200, disableOnInteraction: false },
      pagination: { el: ".reviews__dots", clickable: true }
    });
  }
})();
