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
  const sessionKey = "portfolioIntroPlayed";
  let playedInDocument = false;

  function playIntro() {
    const currentIntro = document.getElementById("boot-intro");
    if (!currentIntro) return;

    if (playedInDocument) {
      currentIntro.classList.add("is-finished");
      return;
    }

    playedInDocument = true;
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(sessionKey) === "true";
    } catch (e) {}

    if (alreadyPlayed) {
      currentIntro.classList.add("is-finished");
      return;
    }

    try {
      sessionStorage.setItem(sessionKey, "true");
    } catch (e) {}

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

    window.setTimeout(() => intro.classList.add("is-glitching"), 3800);
    window.setTimeout(() => {
      intro.classList.remove("is-glitching");
      intro.classList.add("is-dispersing");
    }, 4000);
    window.setTimeout(() => intro.classList.add("is-finished"), 5000);
  }

  window.addEventListener("pageshow", playIntro);
})();

/* -----------------------------------------------------
   BUTTON PIXEL FEEDBACK
   Decorative particles never intercept or delay the click.
   ----------------------------------------------------- */
(function () {
  if (reduceMotion) return;

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest("button, .btn");
    if (!control || control.matches(":disabled")) return;

    const colors = ["var(--lime)", "var(--lilac)", "var(--olive)"];
    for (let i = 0; i < 10; i++) {
      const pixel = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = 14 + Math.random() * 30;
      pixel.className = "pixel-burst";
      pixel.style.left = `${event.clientX - 3}px`;
      pixel.style.top = `${event.clientY - 3}px`;
      pixel.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      pixel.style.setProperty("--pixel-x", `${Math.cos(angle) * distance}px`);
      pixel.style.setProperty("--pixel-y", `${Math.sin(angle) * distance}px`);
      pixel.addEventListener("animationend", () => pixel.remove(), { once: true });
      document.body.append(pixel);
    }
  });
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
let heroScrollBoost = 0;
(function () {
  let lastY = window.scrollY;
  let timer;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const delta = Math.abs(y - lastY);
    lastY = y;
    scrollBoost = Math.min(scrollBoost + delta * 0.02, 4);
    heroScrollBoost = Math.min(heroScrollBoost + delta * 0.04, 8);
    document.body.classList.add("is-scrolling");
    clearTimeout(timer);
    timer = setTimeout(() => document.body.classList.remove("is-scrolling"), 250);
  }, { passive: true });
})();

/* -----------------------------------------------------
   4. AMBIENT PIXEL STARS AND ROTATING GRID
   New effects are masked out of the homepage hero.
   ----------------------------------------------------- */
(function () {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const STAR_COLORS = ["#ABD613", "#7E9C0E", "#C86FFF", "#60770B", "#2E3905", "#4E0468"];
  const HERO_STAR_COLORS = ["#ABD613", "#C86FFF", "#9A08CE", "#7E9C0E", "#FFFFFF"];
  const ctx = canvas.getContext("2d");
  const homeHero = document.body.dataset.page === "home"
    ? document.querySelector(".hero")
    : null;
  let w = 0;
  let h = 0;
  let stars = [];
  let heroStars = [];
  let gridRotation = 0;

  function createPixelStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2.5 + 2,
      speed: (Math.random() * 0.38 + 0.12) * (Math.random() < 0.5 ? 1 : -1),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() * 0.018 + 0.006) * (Math.random() < 0.5 ? 1 : -1),
      opacity: Math.random() * 0.35 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }));
  }

  function createHeroStars(count) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      speed: (Math.random() * 0.35 + 0.12) * (Math.random() < 0.5 ? 1 : -1),
      color: HERO_STAR_COLORS[Math.floor(Math.random() * HERO_STAR_COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(140, Math.max(30, Math.floor((w * h) / 15000)));
    heroStars = homeHero
      ? createHeroStars(Math.min(220, Math.floor((w * h) / 9000)))
      : [];
    stars = createPixelStars(count);
  }

  function drawGrid() {
    const extent = Math.ceil(Math.hypot(w, h) * 1.6);
    const halfExtent = extent / 2;
    const spacing = 48;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(gridRotation);
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = -halfExtent; x <= halfExtent; x += spacing) {
      ctx.moveTo(x, -halfExtent);
      ctx.lineTo(x, halfExtent);
    }
    ctx.globalAlpha = 0.09;
    ctx.strokeStyle = "#60770B";
    ctx.stroke();

    ctx.beginPath();
    for (let y = -halfExtent; y <= halfExtent; y += spacing) {
      ctx.moveTo(-halfExtent, y);
      ctx.lineTo(halfExtent, y);
    }
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "#4E0468";
    ctx.stroke();
    ctx.restore();
  }

  function drawHeroStars(speedMultiplier) {
    if (!homeHero) return;
    const rect = homeHero.getBoundingClientRect();

    ctx.clearRect(rect.left, rect.top, rect.width, rect.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.left, rect.top, rect.width, rect.height);
    ctx.clip();

    for (const star of heroStars) {
      star.y += star.speed * speedMultiplier;
      if (star.y > h + 2) star.y = -2;
      if (star.y < -2) star.y = h + 2;
      star.twinkle += 0.02;
      ctx.globalAlpha = (0.45 + 0.4 * Math.sin(star.twinkle)) * 0.2;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    drawGrid();
    scrollBoost *= 0.965;
    heroScrollBoost *= 0.94;
    const multiplier = 1 + scrollBoost;

    for (const star of stars) {
      star.x += star.speed * multiplier;
      if (star.x > w + star.size) star.x = -star.size;
      if (star.x < -star.size) star.x = w + star.size;
      star.rotation += star.rotationSpeed;
      star.twinkle += 0.025;

      ctx.save();
      ctx.translate(star.x, star.y);
      ctx.rotate(star.rotation);
      ctx.globalAlpha = star.opacity * (0.8 + 0.2 * Math.sin(star.twinkle));
      ctx.fillStyle = star.color;
      ctx.fillRect(-star.size / 2, -star.size / 2, star.size, star.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    drawHeroStars(1 + heroScrollBoost);

    if (!reduceMotion) {
      gridRotation = (gridRotation + 0.0001) % (Math.PI * 2);
      frame.id = requestAnimationFrame(frame);
    }
  }

  resize();
  window.addEventListener("resize", resize);
  frame();
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
