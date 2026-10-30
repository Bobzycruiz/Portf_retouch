/* Bobola Alabi — Portfolio interactions
   One scroll loop drives every choreographed moment; everything else is event-driven. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktopMQ = matchMedia("(min-width: 1081px)");
  const fxEnabled = () => !reduceMotion && desktopMQ.matches;

  /* ---------- ambient light: each media glows with its own poster ---------- */
  const setGlow = (media) => {
    const img = $("img", media);
    if (img) media.style.setProperty("--poster", `url("${img.src}")`);
  };
  $$(".media").forEach(setGlow);

  /* ---------- split headings into words ---------- */
  let wordIndex = 0;
  const splitInto = (node, inEm, makeWord) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(" "));
          else frag.appendChild(makeWord(tok, inEm));
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("pill")) {
        splitInto(child, inEm || child.tagName === "EM", makeWord);
      }
    });
  };

  $$("[data-split]").forEach((el) => {
    wordIndex = 0;
    splitInto(el, false, (word, inEm) => {
      const w = document.createElement("span");
      const i = document.createElement("span");
      w.className = "w";
      i.className = inEm ? "w-i w-em" : "w-i";
      i.style.setProperty("--wi", wordIndex++);
      i.textContent = word;
      w.appendChild(i);
      return w;
    });
  });

  /* statement: words (and inline media pills) light up in reading order */
  const statement = $("[data-words]");
  splitInto(statement, false, (word) => {
    const s = document.createElement("span");
    s.className = "wd";
    s.textContent = word;
    return s;
  });
  $$(".pill", statement).forEach((p) => p.classList.add("wd"));
  const statementWords = $$(".wd", statement);

  /* ---------- reveal on enter ---------- */
  $$("[data-reveal]").forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal"));
    el.style.setProperty("--rd", `${siblings.indexOf(el) * 90}ms`);
  });
  const revealer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealer.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );
  $$("[data-reveal], [data-split], [data-fan], [data-stills]").forEach((el) => revealer.observe(el));

  /* ---------- header: sliding nav pill, active section, mobile menu ---------- */
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

  const sectionObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        activeLink = navLinks.find((a) => a.getAttribute("href") === "#" + e.target.id) || null;
        navLinks.forEach((a) => a.classList.toggle("is-active", a === activeLink));
        if (!nav.matches(":hover")) movePill(activeLink);
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  ["#top", "#work", "#services", "#process", "#about", "#contact"].forEach((id) => sectionObserver.observe($(id)));

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

  /* ---------- running timecode (25fps) ---------- */
  const tcEl = $("#timecode");
  const t0 = performance.now();
  const pad = (n) => String(n).padStart(2, "0");
  if (!reduceMotion) {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      tcEl.textContent = `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(Math.floor(t) % 60)}:${pad(Math.floor((t % 1) * 25))}`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- hero video: only plays while visible ---------- */
  const hero = $(".hero");
  const heroVideo = $(".lens__video");
  if (reduceMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  } else {
    new IntersectionObserver(([e]) => (e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause())).observe(hero);
  }

  /* ==========================================================
     SCROLL CHOREOGRAPHY
     ========================================================== */
  const heroContent = $(".hero__content");
  const process = $("[data-process]");
  const monitor = $(".monitor");
  const monitorLabel = $(".monitor__label b");
  const steps = $$(".step");
  const clips = $$(".clip");
  const stepNames = ["Brief", "Rough cut", "Motion & grade", "Deliver"];
  const blades = $(".sculpture__blades");
  const portrait = $(".lensring__photo img");
  const parallaxEls = $$("[data-speed]");

  const setStep = (i) => {
    if (monitor.dataset.step === String(i)) return;
    monitor.dataset.step = i;
    monitorLabel.textContent = stepNames[i];
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    clips.forEach((c, k) => {
      c.classList.toggle("is-on", k === i);
      c.classList.toggle("is-done", k < i);
    });
  };

  const sectionProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };

  function heroFrame(vw, vh) {
    const p = sectionProgress(hero);
    const e = easeInOut(clamp(p / 0.78));
    // the lens starts as a floating capsule on the right and opens to fill the frame
    const s = { t: vh * 0.19, r: Math.max(24, vw * 0.05), b: vh * 0.12, l: vw * 0.6 };
    const f = { t: 88, r: 24, b: 24, l: 24 };
    const t = lerp(s.t, f.t, e), r = lerp(s.r, f.r, e), b = lerp(s.b, f.b, e), l = lerp(s.l, f.l, e);
    const startRad = Math.min(vw - s.l - s.r, vh - s.t - s.b) / 2;
    const style = hero.style;
    style.setProperty("--lt", `${t}px`);
    style.setProperty("--lr", `${r}px`);
    style.setProperty("--lb", `${b}px`);
    style.setProperty("--ll", `${l}px`);
    style.setProperty("--lrad", `${lerp(startRad, 28, e)}px`);
    style.setProperty("--hud", clamp((p - 0.68) / 0.2).toFixed(3));
    style.setProperty("--cue", (1 - clamp(p / 0.06)).toFixed(3));
    heroContent.style.setProperty("--c-op", (1 - clamp(p / 0.32)).toFixed(3));
    heroContent.style.setProperty("--c-y", (-p * 160).toFixed(1));
    heroContent.style.visibility = p > 0.34 ? "hidden" : "";
  }

  function processFrame() {
    const p = sectionProgress(process);
    $(".playhead").style.setProperty("--p", p.toFixed(4));
    setStep(Math.min(3, Math.floor(p * 4)));
  }

  function statementFrame(vh) {
    const r = statement.getBoundingClientRect();
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3));
    const lit = Math.round(p * statementWords.length);
    statementWords.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
  }

  function ambientFrame(vh) {
    if (blades) blades.style.setProperty("--spin", (scrollY * 0.06).toFixed(2));
    if (portrait) {
      const r = portrait.parentElement.getBoundingClientRect();
      portrait.style.setProperty("--py", (((r.top + r.height / 2 - vh / 2) / vh) * -36).toFixed(1));
    }
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    });
  }

  let ticking = false;
  function frame() {
    ticking = false;
    const vw = innerWidth, vh = innerHeight;
    if (root.classList.contains("fx-hero")) heroFrame(vw, vh);
    if (root.classList.contains("fx-process")) processFrame();
    if (!reduceMotion) statementFrame(vh);
    if (fxEnabled()) ambientFrame(vh);
  }
  const requestFrame = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  };

  /* mobile / tablet: the process story plays itself when it comes into view */
  let autoTimer = null;
  const autoStory = new IntersectionObserver(([e]) => {
    clearInterval(autoTimer);
    if (!e.isIntersecting || root.classList.contains("fx-process")) return;
    let i = 0;
    setStep(0);
    $(".playhead").style.setProperty("--p", 0.06);
    autoTimer = setInterval(() => {
      i = (i + 1) % 4;
      setStep(i);
      $(".playhead").style.setProperty("--p", (i + 0.5) / 4);
    }, 2200);
  }, { threshold: 0.35 });

  function applyMode() {
    const fx = fxEnabled();
    root.classList.toggle("fx-hero", fx);
    root.classList.toggle("fx-process", fx);
    if (!fx) {
      heroContent.style.visibility = "";
      parallaxEls.forEach((el) => (el.style.translate = ""));
      if (reduceMotion) {
        setStep(2);
        $(".playhead").style.setProperty("--p", 0.62);
        statementWords.forEach((w) => w.classList.add("is-lit"));
      }
    }
    if (!reduceMotion) autoStory.observe(monitor);
    requestFrame();
  }
  applyMode();
  desktopMQ.addEventListener("change", applyMode);
  addEventListener("scroll", requestFrame, { passive: true });
  addEventListener("resize", requestFrame);

  /* ==========================================================
     MEDIA: hover preview, tilt, light, player
     ========================================================== */
  const player = $("#player");
  const stage = $("#player-stage");
  const playerTitle = $("#player-title");
  let lastFocus = null;

  function openPlayer({ video, poster, image, title, vertical }) {
    lastFocus = document.activeElement;
    stage.innerHTML = "";
    player.classList.toggle("is-vertical", Boolean(vertical));
    playerTitle.textContent = title || "";
    if (video) {
      const v = document.createElement("video");
      Object.assign(v, { src: video, controls: true, playsInline: true, autoplay: true });
      if (poster) v.poster = poster;
      stage.appendChild(v);
    } else {
      const img = document.createElement("img");
      Object.assign(img, { src: image, alt: title || "" });
      stage.appendChild(img);
    }
    player.showModal();
    document.body.style.overflow = "hidden";
  }
  player.addEventListener("close", () => {
    const v = $("video", stage);
    if (v) v.pause();
    stage.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  });
  $("#player-close").addEventListener("click", () => player.close());
  player.addEventListener("click", (e) => {
    if ([player, stage, $(".player__inner")].includes(e.target)) player.close();
  });

  $$("[data-video]").forEach((item) => {
    const media = $(".media", item);
    const btn = $(".media__btn", item);
    const img = $("img", btn);
    let preview = null;

    if (finePointer && !reduceMotion) {
      btn.addEventListener("pointerenter", () => {
        if (!preview) {
          preview = document.createElement("video");
          Object.assign(preview, { muted: true, loop: true, playsInline: true, preload: "auto" });
          btn.appendChild(preview);
        }
        if (preview.dataset.src !== item.dataset.video) {
          preview.src = preview.dataset.src = item.dataset.video;
        }
        preview.play().then(() => btn.classList.add("is-playing")).catch(() => {});
      });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        btn.style.setProperty("--mx", `${x * 100}%`);
        btn.style.setProperty("--my", `${y * 100}%`);
        if (!item.classList.contains("phone")) {
          btn.style.setProperty("--rx", `${(0.5 - y) * 5}deg`);
          btn.style.setProperty("--ry", `${(x - 0.5) * 7}deg`);
        }
      });
      btn.addEventListener("pointerleave", () => {
        btn.classList.remove("is-playing");
        btn.style.setProperty("--rx", "0deg");
        btn.style.setProperty("--ry", "0deg");
        if (preview) preview.pause();
      });
    }

    const play = () => {
      if (preview) preview.pause();
      btn.classList.remove("is-playing");
      openPlayer({ video: item.dataset.video, poster: img.src, title: item.dataset.title, vertical: media.classList.contains("media--9x16") });
    };
    btn.addEventListener("click", play);
    const cta = $(".feature__cta", item);
    if (cta) cta.addEventListener("click", play);

    /* language versions (XRP EN / ES) */
    const toggle = $(".lang-toggle", item);
    if (toggle) {
      const langs = JSON.parse(item.dataset.langs);
      const baseTitle = item.dataset.title;
      toggle.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-lang]");
        if (!b) return;
        const [video, poster] = langs[b.dataset.lang];
        item.dataset.video = video;
        item.dataset.title = `${baseTitle} (${b.dataset.lang})`;
        img.src = poster;
        setGlow(media);
        $$("button", toggle).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      });
    }
  });

  $$(".still").forEach((s) => s.addEventListener("click", () => openPlayer({ image: s.dataset.image, title: $("img", s).alt })));

  /* ---------- light that follows the cursor (services) ---------- */
  if (finePointer) {
    $$(".service").forEach((el) =>
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      })
    );
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.setProperty("--tx", `${dx * 0.22}px`);
        b.style.setProperty("--ty", `${dy * 0.32}px`);
        b.style.setProperty("--bx", `${e.clientX - r.left}px`);
        b.style.setProperty("--by", `${e.clientY - r.top}px`);
      });
      b.addEventListener("pointerleave", () => {
        b.style.setProperty("--tx", "0px");
        b.style.setProperty("--ty", "0px");
      });
    });
  }

  /* ---------- clock (Nigeria, WAT) + year ---------- */
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
  const setClock = () => (clock.textContent = `${fmt.format(new Date())} WAT`);
  setClock();
  setInterval(setClock, 30000);
  $("#year").textContent = new Date().getFullYear();

  /* ---------- contact form (FormSubmit AJAX) ---------- */
  const form = $("#contact-form");
  const status = $(".form__status", form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", form);
    const label = $("span", btn);
    btn.disabled = true;
    label.textContent = "Sending…";
    status.className = "form__status mono";
    status.textContent = "";
    try {
      const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.classList.add("ok");
      status.textContent = "Message sent — I’ll get back to you within 24 hours.";
    } catch {
      status.classList.add("err");
      status.textContent = "Couldn’t send. Email me directly at bobzycruiz2004@gmail.com.";
    } finally {
      btn.disabled = false;
      label.textContent = "Send message";
    }
  });
})();
