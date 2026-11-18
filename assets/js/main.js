/* Bobola Alabi — Portfolio ("Live Wall")
   The work is always playing, and the page takes its colours from what you're looking at. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const make = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const EMAIL = "bobzycruiz2004@gmail.com";

  const toastEl = $(".toast");
  let toastTimer = null;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  };

  /* ==========================================================
     THEME — two accent colours that follow the visitor's attention
     ========================================================== */
  const themeOf = (node) => node.dataset.theme.split(",");
  const tileTheme = (node) => [node.style.getPropertyValue("--c1"), node.style.getPropertyValue("--c2")];
  const hero = $(".hero");
  let heroTheme = themeOf(hero);
  let sectionTheme = heroTheme;
  let hoverTheme = null;
  const applyTheme = () => {
    const [a, b] = hoverTheme || sectionTheme;
    root.style.setProperty("--a", a);
    root.style.setProperty("--b", b);
  };

  /* ---------- header: sliding pill, active section, mobile menu ---------- */
  const header = $(".header");
  const nav = $(".nav");
  const navPill = $(".nav__pill");
  const navLinks = $$(".nav a");
  let activeLink = null;
  const movePill = (link) => {
    if (!link) return (navPill.style.opacity = 0);
    navPill.style.opacity = 1;
    navPill.style.width = `${link.offsetWidth}px`;
    navPill.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  navLinks.forEach((a) => a.addEventListener("mouseenter", () => movePill(a)));
  nav.addEventListener("mouseleave", () => movePill(activeLink));

  let activeSection = hero;
  const sectionObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        activeSection = e.target;
        sectionTheme = e.target === hero ? heroTheme : themeOf(e.target);
        applyTheme();
        activeLink = navLinks.find((a) => a.getAttribute("href") === "#" + e.target.id) || null;
        navLinks.forEach((a) => a.classList.toggle("is-active", a === activeLink));
        if (!nav.matches(":hover")) movePill(activeLink);
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("[data-theme]").forEach((s) => sectionObserver.observe(s));

  const menuBtn = $(".menu-btn");
  const setMenu = (open) => {
    header.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    $("span", menuBtn).textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
  };
  menuBtn.addEventListener("click", () => setMenu(!header.classList.contains("menu-open")));
  $$(".mobile-nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && header.classList.contains("menu-open") && setMenu(false));

  /* ---------- reveal on enter ---------- */
  $$("[data-reveal]").forEach((node) => {
    const siblings = [...node.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
    node.style.setProperty("--rd", `${siblings.indexOf(node) * 80}ms`);
  });
  const revealer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealer.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  $$("[data-reveal], .wall").forEach((node) => revealer.observe(node));

  /* ==========================================================
     LIVE VIDEO — loops load when they scroll into view and pause when they leave
     ========================================================== */
  const player = $("#player");
  const liveHosts = new Set();
  const startLive = (host) => {
    const v = $("video", host);
    if (!v || reduceMotion || player.open) return;
    const src = host.dataset.preview || v.dataset.src;
    if (src && v.getAttribute("src") !== src) v.setAttribute("src", src);
    v.play().then(() => host.classList.add("is-live")).catch(() => {});
  };
  const stopLive = (host) => $("video", host)?.pause();
  const liveObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          liveHosts.add(e.target);
          startLive(e.target);
        } else {
          liveHosts.delete(e.target);
          stopLive(e.target);
        }
      }),
    { rootMargin: "80px", threshold: 0.15 }
  );
  $$(".tile[data-preview], .stack__card, .reelpill").forEach((host) => liveObserver.observe(host));
  // browsers pause muted loops in background tabs; pick them back up on return
  document.addEventListener("visibilitychange", () => !document.hidden && liveHosts.forEach(startLive));

  /* ==========================================================
     PLAYER — full cut, with sound
     ========================================================== */
  const stage = $("#player-stage");
  const playerTitle = $("#player-title");
  let lastFocus = null;

  function openPlayer({ video, poster, image, title, vertical }) {
    lastFocus = document.activeElement;
    stage.innerHTML = "";
    player.classList.toggle("is-vertical", Boolean(vertical));
    playerTitle.textContent = title || "";
    if (video) {
      const v = make("video", { src: video, controls: true, playsInline: true, autoplay: true });
      if (poster) v.poster = poster;
      stage.appendChild(v);
    } else {
      stage.appendChild(make("img", { src: image, alt: title || "" }));
    }
    player.showModal();
    document.body.style.overflow = "hidden";
    liveHosts.forEach(stopLive);
  }
  player.addEventListener("close", () => {
    $("video", stage)?.pause();
    stage.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
    liveHosts.forEach(startLive);
  });
  $("#player-close").addEventListener("click", () => player.close());
  player.addEventListener("click", (e) => {
    if ([player, stage, $(".player__inner")].includes(e.target)) player.close();
  });

  /* ==========================================================
     WALL — tiles, tilt, colour, filters
     ========================================================== */
  const wall = $("#wall");
  const tiles = $$(".tile", wall);
  const projects = tiles.filter((t) => t.dataset.title);

  tiles.forEach((tile, i) => {
    tile.style.setProperty("--i", i);
    tile.style.viewTransitionName = `tile-${i}`;
  });

  projects.forEach((tile) => {
    const btn = $(".tile__btn", tile);
    const img = $("img", btn);
    btn.dataset.cursor = tile.dataset.video ? "Play" : "View";

    btn.addEventListener("click", () =>
      openPlayer(
        tile.dataset.video
          ? { video: tile.dataset.video, poster: img.src, title: tile.dataset.title, vertical: tile.classList.contains("tile--v") }
          : { image: tile.dataset.image, title: tile.dataset.title }
      )
    );

    tile.addEventListener("pointerenter", () => {
      hoverTheme = tileTheme(tile);
      applyTheme();
    });
    tile.addEventListener("pointerleave", () => {
      hoverTheme = null;
      applyTheme();
      tile.style.setProperty("--rx", "0deg");
      tile.style.setProperty("--ry", "0deg");
    });
    if (finePointer && !reduceMotion) {
      tile.addEventListener("pointermove", (e) => {
        const r = tile.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        tile.style.setProperty("--mx", `${x * 100}%`);
        tile.style.setProperty("--my", `${y * 100}%`);
        tile.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
        tile.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
      });
    }

    /* language versions (XRP EN / ES) */
    const toggle = $(".lang-toggle", tile);
    if (toggle) {
      const langs = JSON.parse(tile.dataset.langs);
      const baseTitle = tile.dataset.title;
      toggle.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-lang]");
        if (!b) return;
        const [video, poster, preview] = langs[b.dataset.lang];
        Object.assign(tile.dataset, { video, preview, title: `${baseTitle} (${b.dataset.lang})` });
        img.src = poster;
        startLive(tile);
        $$("button", toggle).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      });
    }
  });

  const filterBtns = $$("[data-filter]");
  filterBtns.forEach((b) => {
    const n = b.dataset.filter === "all" ? projects.length : projects.filter((t) => t.dataset.cat === b.dataset.filter).length;
    $("sup", b).textContent = String(n).padStart(2, "0");
  });
  const setFilter = (key) => {
    const update = () => {
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
      projects.forEach((t) => (t.hidden = key !== "all" && t.dataset.cat !== key));
    };
    if (document.startViewTransition && !reduceMotion && !document.hidden) {
      // an interrupted morph is fine — the filter itself has already applied
      const vt = document.startViewTransition(update);
      vt.ready.catch(() => {});
      vt.finished.catch(() => {});
    } else update();
  };
  filterBtns.forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.filter)));

  const openProject = (id) => $(`#${id} .tile__btn`).click();
  $$("[data-reel]").forEach((b) => b.addEventListener("click", () => openProject("showreel")));

  /* ==========================================================
     HERO STACK — tap a side card to bring it forward; the front card plays
     ========================================================== */
  const stack = $("[data-stack]");
  const cards = $$(".stack__card", stack);
  let stackTimer = null;
  let stackTouched = false;

  const frontCard = () => cards.find((c) => c.dataset.pos === "0");
  const syncStack = () => {
    cards.forEach((c) => (c.dataset.cursor = c.dataset.pos === "0" ? "Play" : "Next"));
    if (!stackTouched) return;
    heroTheme = tileTheme(frontCard());
    if (activeSection === hero) {
      sectionTheme = heroTheme;
      applyTheme();
    }
  };
  const bringForward = (card) => {
    const from = card.dataset.pos;
    frontCard().dataset.pos = from;
    card.dataset.pos = "0";
    stackTouched = true;
    syncStack();
  };
  const advance = () => bringForward(cards.find((c) => c.dataset.pos === "1"));
  const autoplayStack = () => {
    clearInterval(stackTimer);
    if (!reduceMotion) stackTimer = setInterval(() => !stack.matches(":hover") && !player.open && !document.hidden && advance(), 4200);
  };
  cards.forEach((card) =>
    card.addEventListener("click", () => {
      if (card.dataset.pos === "0") return openProject(card.dataset.open);
      bringForward(card);
      autoplayStack();
    })
  );
  syncStack();
  new IntersectionObserver(([e]) => (e.isIntersecting ? autoplayStack() : clearInterval(stackTimer))).observe(stack);

  if (finePointer && !reduceMotion) {
    hero.addEventListener("pointermove", (e) => {
      stack.style.setProperty("--px", ((e.clientX / innerWidth - 0.5) * 2).toFixed(3));
      stack.style.setProperty("--py", ((e.clientY / innerHeight - 0.5) * 2).toFixed(3));
    });
  }

  /* ==========================================================
     SMALL LIVELY THINGS
     ========================================================== */
  /* light that follows the pointer inside service cards */
  if (finePointer) {
    $$(".svc").forEach((card) =>
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      })
    );
  }

  /* numbers count up when they come into view */
  const counter = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        counter.unobserve(e.target);
        const end = Number(e.target.dataset.count);
        if (reduceMotion) return;
        const t0 = performance.now();
        const tick = (now) => {
          const p = clamp((now - t0) / 1300);
          e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((n) => counter.observe(n));

  /* magnetic buttons */
  if (finePointer && !reduceMotion) {
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--tx", `${(e.clientX - (r.left + r.width / 2)) * 0.22}px`);
        b.style.setProperty("--ty", `${(e.clientY - (r.top + r.height / 2)) * 0.32}px`);
      });
      b.addEventListener("pointerleave", () => {
        b.style.setProperty("--tx", "0px");
        b.style.setProperty("--ty", "0px");
      });
    });
  }

  /* copy email */
  const copyEmail = () => navigator.clipboard.writeText(EMAIL).then(() => toast("Email address copied"), () => toast(EMAIL));
  $$("[data-copy]").forEach((b) => b.addEventListener("click", copyEmail));

  /* reactive cursor: says what a click will do */
  if (finePointer && !reduceMotion) {
    root.classList.add("has-cursor");
    const cursor = $(".cursor");
    const label = $("span", cursor);
    let cx = 0, cy = 0, tx = 0, ty = 0, moving = false;
    const follow = () => {
      cx = lerp(cx, tx, 0.24);
      cy = lerp(cy, ty, 0.24);
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      moving = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3;
      if (moving) requestAnimationFrame(follow);
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!moving) {
        moving = true;
        requestAnimationFrame(follow);
      }
      const onControl = e.target.closest?.(".lang-toggle");
      const text = onControl ? "" : e.target.closest?.("[data-cursor]")?.dataset.cursor;
      cursor.classList.toggle("is-active", Boolean(text));
      if (text) label.textContent = text;
    }, { passive: true });
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    root.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    addEventListener("scroll", () => cursor.classList.remove("is-active"), { passive: true });
  }

  /* ==========================================================
     PALETTE — search work, sections and actions
     ========================================================== */
  const KEYS = {
    crypto: "crypto bitcoin btc xrp finance market short vertical tiktok reels shorts explainer",
    promo: "promo product launch saas fintech app ui motion graphics showreel reel landscape",
    thumb: "thumbnail youtube still design image",
  };
  const jump = (hash) => () => $(hash).scrollIntoView();
  const entries = [
    ...projects.map((tile) => ({
      group: "Work",
      title: () => tile.dataset.title,
      poster: () => $("img", tile).getAttribute("src"),
      meta: tile.dataset.meta,
      keys: KEYS[tile.dataset.cat],
      run: () => $(".tile__btn", tile).click(),
    })),
    ...[
      ["Work", "#work", "portfolio projects videos wall"],
      ["Services", "#services", "services offer what i do process how"],
      ["About", "#about", "about bio bobola who"],
      ["Contact", "#contact", "contact hire message form"],
    ].map(([t, hash, keys]) => ({ group: "Go to", glyph: "→", title: () => t, meta: "Section", run: jump(hash), keys })),
    { group: "Actions", glyph: "✦", title: () => "WhatsApp me", meta: "+234 808 081 1089", keys: "whatsapp chat phone hire", run: () => open("https://wa.me/2348080811089", "_blank", "noopener") },
    { group: "Actions", glyph: "✦", title: () => "Email me", meta: EMAIL, keys: "email mail hire contact", run: () => (location.href = `mailto:${EMAIL}`) },
    { group: "Actions", glyph: "✦", title: () => "Copy email address", meta: EMAIL, keys: "copy email clipboard", run: copyEmail },
    { group: "Actions", glyph: "✦", title: () => "Download CV", meta: "PDF", keys: "cv resume download pdf", run: () => make("a", { href: "assets/Bobola_Alabi_Video_Editor_CV.pdf", download: "" }).click() },
  ];
  const palette = $("#palette");
  const pInput = $("#palette-input");
  const pList = $("#palette-list");
  let pShown = [];
  let pIndex = 0;

  const markSelected = (i, scroll) => {
    pIndex = clamp(i, 0, Math.max(0, pShown.length - 1));
    $$(".palette__item", pList).forEach((row, k) => {
      row.setAttribute("aria-selected", String(k === pIndex));
      if (k === pIndex) {
        pInput.setAttribute("aria-activedescendant", row.id);
        if (scroll) row.scrollIntoView({ block: "nearest" });
      }
    });
  };
  const runEntry = (i) => {
    const entry = pShown[i];
    if (!entry) return;
    palette.close();
    entry.run();
  };
  const renderPalette = () => {
    const tokens = pInput.value.toLowerCase().split(/\s+/).filter(Boolean);
    pShown = entries.filter((e) => {
      const hay = `${e.title()} ${e.meta} ${e.keys} ${e.group}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
    const rows = [];
    let group = "";
    pShown.forEach((e, i) => {
      if (e.group !== group) rows.push(make("div", { className: "palette__group", textContent: (group = e.group) }));
      const thumb = e.poster ? make("img", { className: "palette__thumb", src: e.poster(), alt: "" }) : make("span", { className: "palette__thumb", textContent: e.glyph });
      const row = make("button", { type: "button", className: "palette__item", id: `palette-item-${i}` }, thumb,
        make("span", { className: "palette__text" }, make("b", { textContent: e.title() }), make("small", { textContent: e.meta })),
        make("span", { className: "palette__go", textContent: "↵" }));
      row.setAttribute("role", "option");
      row.addEventListener("pointermove", () => i !== pIndex && markSelected(i));
      row.addEventListener("click", () => runEntry(i));
      rows.push(row);
    });
    if (!pShown.length) rows.push(make("p", { className: "palette__empty", textContent: "Nothing matches — try “crypto”, “promo”, “thumbnail” or “contact”." }));
    pList.replaceChildren(...rows);
    markSelected(0);
  };
  const openPalette = () => {
    if (palette.open || player.open) return;
    if (header.classList.contains("menu-open")) setMenu(false);
    pInput.value = "";
    renderPalette();
    palette.showModal();
    pInput.focus();
  };
  pInput.addEventListener("input", renderPalette);
  pInput.addEventListener("keydown", (e) => {
    const move = { ArrowDown: pIndex + 1, ArrowUp: pIndex - 1, Home: 0, End: pShown.length - 1 }[e.key];
    if (move !== undefined) {
      e.preventDefault();
      markSelected(move, true);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runEntry(pIndex);
    }
  });
  palette.addEventListener("click", (e) => e.target === palette && palette.close());
  $$("[data-palette-open]").forEach((b) => b.addEventListener("click", openPalette));
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $$("[data-palette-open] kbd").forEach((k) => (k.textContent = isMac ? "⌘K" : "Ctrl K"));
  addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.open ? palette.close() : openPalette();
    } else if (e.key === "/" && !typing && !palette.open) {
      e.preventDefault();
      openPalette();
    }
  });

  /* ---------- clock + year ---------- */
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
  const setClock = () => (clock.textContent = `${fmt.format(new Date())} (GMT+1)`);
  setClock();
  setInterval(setClock, 30000);
  $("#year").textContent = new Date().getFullYear();

  /* ---------- contact form (Netlify Forms, with an email fallback so no message is lost) ---------- */
  const form = $("#contact-form");
  const status = $(".form__status", form);
  const emailFallback = (data) => {
    const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})\nProject: ${data.get("project_type")}`;
    return make("a", {
      className: "link",
      href: `mailto:${EMAIL}?subject=${encodeURIComponent("Project enquiry — " + data.get("project_type"))}&body=${encodeURIComponent(body)}`,
      textContent: "Tap here to send it by email instead",
    });
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", form);
    const label = $("span", btn);
    const data = new FormData(form);
    btn.disabled = true;
    label.textContent = "Sending…";
    status.className = "form__status mono";
    status.textContent = "";
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.classList.add("ok");
      status.textContent = "Message sent — I’ll get back to you within 24 hours.";
    } catch {
      status.classList.add("err");
      status.append("Couldn’t send right now — your message is still here. ", emailFallback(data), ".");
    } finally {
      btn.disabled = false;
      label.textContent = "Send message";
    }
  });
})();
