/* =====================================================
   SHARED SCRIPT
   Handles: theme toggle, active nav link, star field,
   flame cursor trail, card tilt, My Works dashboard,
   search and layout switching.
   ===================================================== */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -----------------------------------------------------
   0. HOMEPAGE STARTUP INTRO
   Terminal text glitches into a pixel reveal.
   ----------------------------------------------------- */
(function () {
  if (!document.getElementById("boot-intro")) return;

  function playIntro() {
    const currentIntro = document.getElementById("boot-intro");
    if (!currentIntro) return;
    if (reduceMotion) {
      currentIntro.classList.add("is-finished");
      return;
    }

    const intro = currentIntro.cloneNode(true);
    const pixelLayer = intro.querySelector(".boot-pixels");
    pixelLayer.replaceChildren();
    intro.classList.remove("is-glitching", "is-dispersing", "is-finished");
    currentIntro.replaceWith(intro);

    const pixelSize = 48;
    const columns = Math.ceil(window.innerWidth / pixelSize);
    const rows = Math.ceil(window.innerHeight / pixelSize);
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const maxDistance = Math.hypot(centerX, centerY) || 1;

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = column * pixelSize;
        const y = row * pixelSize;
        const width = Math.min(pixelSize, window.innerWidth - x);
        const height = Math.min(pixelSize, window.innerHeight - y);
        const deltaX = x + width / 2 - centerX;
        const deltaY = y + height / 2 - centerY;
        const distance = Math.hypot(deltaX, deltaY);
        const travel = 90 + Math.random() * 170;
        const direction = distance || 1;
        const pixel = document.createElement("span");
        const colorRoll = Math.random();

        pixel.className = "boot-pixel";
        pixel.style.left = `${x}px`;
        pixel.style.top = `${y}px`;
        pixel.style.width = `${width}px`;
        pixel.style.height = `${height}px`;
        pixel.style.setProperty("--pixel-x", `${Math.round(deltaX / direction * travel)}px`);
        pixel.style.setProperty("--pixel-y", `${Math.round(deltaY / direction * travel)}px`);
        pixel.style.setProperty("--pixel-delay", `${(distance / maxDistance * 0.22 + Math.random() * 0.1).toFixed(2)}s`);
        pixel.style.setProperty("--pixel-color", colorRoll < 0.06 ? "var(--lime)" : colorRoll < 0.14 ? "var(--purple)" : "var(--boot-bg)");
        pixelLayer.append(pixel);
      }
    }

    window.setTimeout(() => intro.classList.add("is-glitching"), 2350);
    window.setTimeout(() => {
      intro.classList.remove("is-glitching");
      intro.classList.add("is-dispersing");
    }, 2700);
    window.setTimeout(() => intro.classList.add("is-finished"), 3950);
  }

  window.addEventListener("pageshow", playIntro);
})();

/* -----------------------------------------------------
   1. DARK / LIGHT MODE
   Dark is the default. The choice is remembered.
   ----------------------------------------------------- */
(function () {
  const root = document.documentElement;
  const saved = (() => { try { return localStorage.getItem("theme"); } catch (e) { return null; } })();
  root.dataset.theme = saved === "light" ? "light" : "dark";

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.textContent = root.dataset.theme === "dark" ? "☀" : "☾";
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      btn.textContent = next === "dark" ? "☀" : "☾";
      document.querySelectorAll(".theme-toggle").forEach((b) => (b.textContent = next === "dark" ? "☀" : "☾"));
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });
})();

/* -----------------------------------------------------
   1b. FIXED NAV HEIGHT
   The nav is fixed to the top, so the page gets padding
   equal to its real height (it can wrap on phones).
   ----------------------------------------------------- */
(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  function setNavHeight() {
    document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
  }
  setNavHeight();
  window.addEventListener("resize", setNavHeight);
  window.addEventListener("load", setNavHeight);
})();

/* -----------------------------------------------------
   2. ACTIVE NAV LINK
   Uses <body data-page="..."> and matches nav links
   that have data-page-link="...".
   ----------------------------------------------------- */
(function () {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-page-link]").forEach((a) => {
    if (a.dataset.pageLink === page) a.classList.add("active");
  });
})();

/* -----------------------------------------------------
   3. SCROLL TRACKING
   Scrolling speeds up the stars and the button gradient.
   ----------------------------------------------------- */
let scrollBoost = 0;
(function () {
  let lastY = window.scrollY;
  let timer;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const delta = Math.abs(y - lastY);
    lastY = y;
    scrollBoost = Math.min(scrollBoost + delta * 0.04, 8);
    document.body.classList.add("is-scrolling");
    clearTimeout(timer);
    timer = setTimeout(() => document.body.classList.remove("is-scrolling"), 250);
  }, { passive: true });
})();

/* -----------------------------------------------------
   4. STAR FIELD (ambient background)
   Half the stars drift down, half drift up.
   To change the star colours, edit STAR_COLORS.
   ----------------------------------------------------- */
(function () {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const STAR_COLORS = ["#ABD613", "#C86FFF", "#9A08CE", "#7E9C0E", "#FFFFFF"];
  const ctx = canvas.getContext("2d");
  let w, h, stars = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(220, Math.floor((w * h) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      speed: (Math.random() * 0.35 + 0.12) * (Math.random() < 0.5 ? 1 : -1), // + down, - up
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    scrollBoost *= 0.94;
    const multiplier = 1 + scrollBoost;

    for (const s of stars) {
      s.y += s.speed * multiplier;
      if (s.y > h + 2) s.y = -2;
      if (s.y < -2) s.y = h + 2;
      s.twinkle += 0.02;

      ctx.globalAlpha = 0.45 + 0.4 * Math.sin(s.twinkle);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) frame.id = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  frame();
  // With reduced motion on, stop after the first static frame
  if (reduceMotion) {
    cancelAnimationFrame(frame.id);
  }
})();

/* -----------------------------------------------------
   5. PIXELATED FLAME CURSOR TRAIL
   Only shown on devices with a mouse (not touch screens).
   To change the flame colours, edit FLAME_COLORS.
   ----------------------------------------------------- */
(function () {
  const canvas = document.getElementById("flame");
  if (!canvas || reduceMotion) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const FLAME_COLORS = ["#ABD613", "#7E9C0E", "#C86FFF", "#9A08CE", "#FFFFFF"];
  const PIXEL = 4; // size of each flame pixel
  const ctx = canvas.getContext("2d");
  let particles = [];
  let lastSpawn = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (now - lastSpawn < 16) return;
    lastSpawn = now;

    // Snap to the pixel grid so the trail looks pixelated
    const x = Math.floor(e.clientX / PIXEL) * PIXEL;
    const y = Math.floor(e.clientY / PIXEL) * PIXEL;

    for (let i = 0; i < 2; i++) {
      if (particles.length > 180) break;
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.2 + 0.4), // rise like flame
        life: 1,
        color: FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)],
      });
    }
  });

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.life > 0);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.97;
      p.life -= 0.035;

      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x / PIXEL) * PIXEL, Math.floor(p.y / PIXEL) * PIXEL, PIXEL, PIXEL);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  loop();
})();

/* -----------------------------------------------------
   6. CARD TILT ON HOVER
   Sets the tilt angles from the mouse position.
   ----------------------------------------------------- */
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--ry", `${px * 12}deg`);
    card.style.setProperty("--rx", `${-py * 10}deg`);
  });
  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});

/* -----------------------------------------------------
   7. MY WORKS PAGE
   Dashboard count, search and layout switcher.
   ----------------------------------------------------- */
(function () {
  const grid = document.getElementById("project-grid");
  if (!grid) return;

  const cards = [...grid.querySelectorAll(".card")];
  const search = document.getElementById("search");
  const noResults = document.getElementById("no-results");
  const countEl = document.getElementById("project-count");
  const layoutButtons = document.querySelectorAll("[data-layout-btn]");

  // Dashboard: animate the count up to the number of projects
  const total = cards.length;
  let shown = 0;
  function countUp() {
    shown = Math.min(shown + Math.max(1, Math.ceil(total / 20)), total);
    countEl.textContent = shown;
    if (shown < total) requestAnimationFrame(countUp);
  }
  if (reduceMotion) countEl.textContent = total;
  else countUp();

  // Search: matches the name, description and tags of each card
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const match = card.textContent.toLowerCase().includes(q);
      card.hidden = !match;
      if (match) visible++;
    });
    noResults.hidden = visible !== 0;
  });

  // Layout switcher: list, two columns, three columns
  function setLayout(layout) {
    grid.dataset.layout = layout;
    layoutButtons.forEach((b) => b.classList.toggle("active", b.dataset.layoutBtn === layout));
    try { localStorage.setItem("worksLayout", layout); } catch (e) {}
  }
  layoutButtons.forEach((btn) => {
    btn.addEventListener("click", () => setLayout(btn.dataset.layoutBtn));
  });

  let saved = null;
  try { saved = localStorage.getItem("worksLayout"); } catch (e) {}
  setLayout(["list", "two", "three"].includes(saved) ? saved : "three");
})();
