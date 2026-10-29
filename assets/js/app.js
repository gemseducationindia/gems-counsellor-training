/* GEMS Counsellor Training: the engine. Content lives in content.js, settings in config.js. */
(function () {
  "use strict";

  const CFG = window.GCT_CONFIG;
  const { MODULES, REFRESHERS, STAGES, REASONS } = window.GCT_CONTENT;
  const app = document.getElementById("app");
  const LS_USER = "gct:user:";
  const LS_CURRENT = "gct:current";
  const LS_QUEUE = "gct:queue";
  // ?preview opens everything without gates and never writes to the Sheet or this device's saved progress.
  const PREVIEW = new URLSearchParams(location.search).has("preview") || /preview/.test(location.hash);

  /* ---------------- small helpers ---------------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fill = (s) => String(s).replace(/\{\{(\w+)\}\}/g, (_, k) => esc(CFG[k] || ""));
  const strip = (s) => String(s).replace(/<[^>]+>/g, "");
  const now = () => new Date().toISOString();
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (s, t) => (t ? Math.round((s / t) * 100) : 0);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  const modIndex = (id) => MODULES.findIndex((m) => m.id === id);
  const modById = (id) => MODULES.find((m) => m.id === id);
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; } };

  /* ---------------- user state ---------------- */
  let user = null;

  function blankState(profile) {
    const modules = {};
    MODULES.forEach((m) => (modules[m.id] = { done: [], attempts: 0, best: null, last: null, passed: false, passedAt: null }));
    return Object.assign({ v: 1, round: 1, created: now(), updated: now(), modules, final: { attempts: 0, best: null, last: null, passed: false, passedAt: null, certId: null }, refreshers: {} }, profile);
  }

  function normalise(s) {
    // New modules added to content.js after someone started still need a slot.
    MODULES.forEach((m) => { if (!s.modules[m.id]) s.modules[m.id] = { done: [], attempts: 0, best: null, last: null, passed: false, passedAt: null }; });
    s.refreshers = s.refreshers || {};
    s.final = s.final || { attempts: 0, best: null, last: null, passed: false, passedAt: null, certId: null };
    return s;
  }

  function previewUser() {
    const s = blankState({ email: "preview@gems", name: "Preview", role: "Preview mode", campus: "All campuses" });
    MODULES.forEach((m) => Object.assign(s.modules[m.id], { passed: true, best: 100, last: 100, passedAt: now() }));
    Object.assign(s.final, { passed: true, best: 100, last: 100, passedAt: now(), certId: "PREVIEW" });
    return s;
  }

  function save(eventName, detail) {
    if (PREVIEW) return;
    user.updated = now();
    store.set(LS_USER + user.email, user);
    if (eventName) queue({ kind: "event", ts: now(), event: eventName, detail: detail || "" });
    else queue(null);
  }

  /* ---------------- unlock rules ---------------- */
  function moduleOpen(i) { return i === 0 || user.modules[MODULES[i - 1].id].passed; }
  function lessonOpen(m, k) {
    const st = user.modules[m.id];
    return k === 0 || st.passed || st.done.includes(m.lessons[k - 1].id);
  }
  function lessonsComplete(m) { const st = user.modules[m.id]; return st.passed || m.lessons.every((l) => st.done.includes(l.id)); }
  function allPassed() { return MODULES.every((m) => user.modules[m.id].passed); }
  function overall() {
    let total = 0, done = 0;
    MODULES.forEach((m) => { total += m.lessons.length + 1; const st = user.modules[m.id]; done += st.passed ? m.lessons.length + 1 : st.done.length; });
    total += 1; if (user.final.passed) done += 1;
    return pct(done, total);
  }
  function nextStep() {
    for (let i = 0; i < MODULES.length; i++) {
      const m = MODULES[i], st = user.modules[m.id];
      if (st.passed) continue;
      const k = m.lessons.findIndex((l) => !st.done.includes(l.id));
      if (k >= 0) return { href: `#/m/${m.id}/${k}`, label: `${m.title}: ${m.lessons[k].title}` };
      return { href: `#/quiz/${m.id}`, label: `${m.title}: module quiz` };
    }
    if (!user.final.passed) return { href: "#/final", label: "Final certification exam" };
    return { href: "#/certificate", label: "View your certificate" };
  }

  /* ---------------- Google Sheet sync ---------------- */
  let syncing = false;
  function queue(item) {
    if (PREVIEW) return;
    const q = store.get(LS_QUEUE, []);
    if (item) { item.email = user.email; q.push(item); }
    store.set(LS_QUEUE, q.slice(-500));
    flush();
  }

  async function flush() {
    if (PREVIEW || !CFG.SHEET_URL || syncing || !user) return;
    syncing = true;
    const q = store.get(LS_QUEUE, []);
    const mine = q.filter((x) => x.email === user.email);
    const payload = {
      action: "sync",
      user: { email: user.email, name: user.name, role: user.role, campus: user.campus },
      summary: summarise(),
      state: user,
      items: mine
    };
    try {
      const r = await fetch(CFG.SHEET_URL, { method: "POST", body: JSON.stringify(payload) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "sync failed");
      const left = store.get(LS_QUEUE, []).filter((x) => !mine.some((y) => y.ts === x.ts && y.kind === x.kind && y.email === x.email));
      store.set(LS_QUEUE, left);
      setSync("ok");
    } catch (e) {
      setSync("offline");
    } finally {
      syncing = false;
    }
  }

  function summarise() {
    return {
      round: user.round,
      overall: overall(),
      modulesPassed: MODULES.filter((m) => user.modules[m.id].passed).length,
      modulesTotal: MODULES.length,
      modules: MODULES.map((m) => {
        const st = user.modules[m.id];
        return { id: m.id, title: m.title, lessonsDone: st.passed ? m.lessons.length : st.done.length, lessonsTotal: m.lessons.length, attempts: st.attempts, best: st.best, last: st.last, passed: st.passed, passedAt: st.passedAt };
      }),
      final: user.final
    };
  }

  async function loadRemote(email) {
    if (!CFG.SHEET_URL) return null;
    try {
      const r = await fetch(CFG.SHEET_URL + "?action=state&email=" + encodeURIComponent(email));
      const j = await r.json();
      return j.ok && j.state ? j.state : null;
    } catch (e) { return null; }
  }

  function setSync(s) {
    const el = document.getElementById("sync");
    if (!el) return;
    el.className = "sync " + s;
    el.textContent = s === "ok" ? "Progress saved" : s === "offline" ? "Saved on this device. Will upload when online." : "";
  }

  setInterval(() => { if (user) flush(); }, 30000);
  window.addEventListener("online", () => user && flush());

  /* ---------------- speech ---------------- */
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = window.speechSynthesis.getVoices().find((x) => /en-IN/i.test(x.lang)) || window.speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
  function stopSpeaking() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }

  /* ---------------- layout ---------------- */
  function shell(inner, opts) {
    opts = opts || {};
    const who = PREVIEW ? `<div class="who"><span class="chip ready">Preview mode: everything open, nothing saved</span></div>` : user ? `<div class="who"><span>${esc(user.name)}</span><button class="link" data-act="switch">Switch user</button></div>` : "";
    app.innerHTML = `
      <header class="top">
        <a class="brand" href="${user ? "#/home" : "#/"}"><span class="wordmark">GEMS</span><span class="sub">EDUCATION</span><span class="divider"></span><span class="title">Counsellor Academy</span></a>
        ${who}
      </header>
      ${opts.crumbs ? `<nav class="crumbs">${opts.crumbs}</nav>` : ""}
      <main class="wrap ${opts.wide ? "wide" : ""}">${inner}</main>
      <footer class="foot"><span id="sync" class="sync"></span><span>GEMS Education India · Admissions</span></footer>`;
    window.scrollTo(0, 0);
    const sw = app.querySelector('[data-act="switch"]');
    if (sw) sw.onclick = () => { store.del(LS_CURRENT); user = null; stopSpeaking(); location.hash = "#/"; };
  }

  /* ---------------- views ---------------- */
  function viewLogin() {
    const campusOpts = ["Central admissions team"].concat(CFG.CAMPUSES.map((c) => c.name)).concat(["Corporate office"])
      .map((c) => `<option>${esc(c)}</option>`).join("");
    shell(`
      <section class="hero">
        <p class="eyebrow">Admissions training</p>
        <h1>Learn the CRM and Exotel, step by step.</h1>
        <p class="lead">Short videos, simple steps, and quick questions. Go at your own pace. You can take it again as many times as you like.</p>
      </section>
      <form class="card form" id="login" autocomplete="on" novalidate>
        <label>Your GEMS email ID
          <input type="email" name="email" required placeholder="firstname.lastname@gemsedu.in" inputmode="email" autocomplete="email">
        </label>
        <div class="more" hidden>
          <label>Your full name
            <input type="text" name="name" required placeholder="For example, Priya Nair" autocomplete="name">
          </label>
          <label>Your team
            <select name="role" required>
              <option value="">Choose one</option>
              <option>Central team</option>
              <option>School team</option>
              <option>Admissions head / manager</option>
            </select>
          </label>
          <label>Your campus
            <select name="campus" required><option value="">Choose one</option>${campusOpts}</select>
          </label>
        </div>
        <p class="err" id="err" role="alert"></p>
        <button class="btn primary big" type="submit">Start training</button>
      </form>
      <ol class="how">
        <li><b>Watch</b> a short video for each step.</li>
        <li><b>Answer</b> a quick question after each step.</li>
        <li><b>Pass</b> each module quiz with ${CFG.PASS_MARK}% or more.</li>
      </ol>`);
    const f = document.getElementById("login"), more = f.querySelector(".more"), err = document.getElementById("err");
    let stage = 1;
    f.onsubmit = async (e) => {
      e.preventDefault();
      err.textContent = "";
      const email = f.email.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please type a valid email ID."; f.email.focus(); return; }
      if (stage === 1) {
        const btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Checking…";
        let s = store.get(LS_USER + email, null);
        const remote = await loadRemote(email);
        if (remote && (!s || (remote.updated || "") > (s.updated || ""))) s = remote;
        btn.disabled = false;
        if (s && s.name) { user = normalise(s); store.set(LS_CURRENT, email); save("login"); location.hash = "#/home"; return; }
        stage = 2; more.hidden = false; btn.textContent = "Start training"; f.name.focus();
        if (!/@gemsedu\.in$/.test(email)) err.textContent = "Tip: use your GEMS email ID if you have one.";
        return;
      }
      const name = f.name.value.trim(), role = f.role.value, campus = f.campus.value;
      if (!name || !role || !campus) { err.textContent = "Please fill in your name, team and campus."; return; }
      user = blankState({ email, name, role, campus });
      store.set(LS_CURRENT, email);
      save("signup", `${role} · ${campus}`);
      location.hash = "#/home";
    };
  }

  function viewHome() {
    const ns = nextStep(), ov = overall();
    const cards = MODULES.map((m, i) => {
      const st = user.modules[m.id], open = moduleOpen(i);
      const state = st.passed ? "passed" : !open ? "locked" : st.done.length || (st.last != null && st.last < CFG.PASS_MARK) ? "progress" : "ready";
      const chip = { passed: `Passed · ${st.best}%`, locked: "Locked", progress: st.last != null && st.last < CFG.PASS_MARK ? `Retake needed · last ${st.last}%` : `${st.done.length} of ${m.lessons.length} steps`, ready: "Start here" }[state];
      const k = Math.max(0, m.lessons.findIndex((l) => !st.done.includes(l.id)));
      const href = !open ? "" : st.passed ? `#/m/${m.id}/0` : lessonsComplete(m) ? `#/quiz/${m.id}` : `#/m/${m.id}/${k}`;
      return `<a class="mod ${state}" ${href ? `href="${href}"` : 'aria-disabled="true"'}>
        <span class="num">${st.passed ? "✓" : i + 1}</span>
        <span class="body"><span class="t">${esc(m.title)}</span><span class="s">${esc(m.summary)}</span>
        <span class="meta"><span class="chip ${state}">${chip}</span><span>${m.lessons.length} steps · about ${m.minutes} min</span></span></span>
      </a>`;
    }).join("");
    const fin = user.final, finOpen = allPassed();
    const refs = REFRESHERS.map((r) => {
      const st = user.refreshers[r.id];
      return `<a class="ref" href="#/refresher/${r.id}"><span class="t">${esc(r.title)}</span><span class="s">${esc(r.summary)}</span>${st ? `<span class="chip">Best ${st.best}% · ${st.attempts} tries</span>` : ""}</a>`;
    }).join("");
    shell(`
      <section class="hello">
        <div>
          <p class="eyebrow">${esc(user.role)} · ${esc(user.campus)}${user.round > 1 ? ` · Round ${user.round}` : ""}</p>
          <h1>Hello, ${esc(user.name.split(" ")[0])}.</h1>
          <p class="lead">${ov === 100 ? "You have finished the training. Keep sharp with the refreshers below." : "Pick up where you left off."}</p>
        </div>
        <div class="ring" style="--p:${ov}"><span>${ov}%</span><small>done</small></div>
      </section>
      <a class="continue" href="${ns.href}"><span class="k">Continue</span><span class="v">${esc(ns.label)}</span><span class="arrow">→</span></a>
      <div class="rule"><b>Pass mark ${CFG.PASS_MARK}%.</b> Score below ${CFG.PASS_MARK}% in a module quiz and you go through that module again. Score below ${CFG.PASS_MARK}% in the final exam and you take the whole training again.</div>
      <h2 class="sec">Your modules</h2>
      <div class="mods">${cards}
        <a class="mod final ${fin.passed ? "passed" : finOpen ? "ready" : "locked"}" ${finOpen ? `href="${fin.passed ? "#/certificate" : "#/final"}"` : 'aria-disabled="true"'}>
          <span class="num">★</span>
          <span class="body"><span class="t">Final certification exam</span><span class="s">${CFG.FINAL_SIZE} questions from everything you learned. Pass to get your certificate.</span>
          <span class="meta"><span class="chip ${fin.passed ? "passed" : finOpen ? "ready" : "locked"}">${fin.passed ? `Certified · ${fin.best}%` : finOpen ? "Ready" : "Unlocks after all modules"}</span></span></span>
        </a>
      </div>
      <h2 class="sec">Refresher quizzes</h2>
      <p class="muted">Take these any time, as often as you like. They do not change your pass status.</p>
      <div class="refs">${refs}</div>`, { wide: true });
  }

  function extraBlock(kind) {
    if (kind === "stages" || kind === "appstages") {
      const list = kind === "stages" ? STAGES.enquiry : STAGES.application;
      const label = kind === "stages" ? "Enquiry stages" : "Application stages";
      return `<div class="stages"><p class="k">${label}</p><ol>${list.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>`;
    }
    if (kind === "walkins") {
      return `<div class="walkins"><p class="k">Walk-in form links</p><div class="grid">${CFG.CAMPUSES.map((c) =>
        `<a class="campus ${c.brand}" target="_blank" rel="noopener" href="${CFG.WALKIN_BASE + c.slug}/new"><span>${esc(c.name)}</span><small>Open form ↗</small></a>`).join("")}</div>
        <p class="muted small">Practise opening your campus form. Don't submit test entries: every submit creates a real lead.</p></div>`;
    }
    if (kind === "reasons") {
      return `<div class="reasons"><div><p class="k junk">Junk reasons (examples)</p><ul>${REASONS.junk.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
        <div><p class="k lost">Lost reasons (examples)</p><ul>${REASONS.lost.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div></div>`;
    }
    return "";
  }

  function viewLesson(id, k) {
    const mi = modIndex(id), m = MODULES[mi];
    if (!m || !moduleOpen(mi)) return go("#/home");
    k = Math.max(0, Math.min(m.lessons.length - 1, parseInt(k, 10) || 0));
    if (!lessonOpen(m, k)) return go(`#/m/${id}/${user.modules[id].done.length}`);
    const l = m.lessons[k], st = user.modules[id];
    const already = st.passed || st.done.includes(l.id);
    let watched = already || !l.video;
    let answered = already;

    const dots = m.lessons.map((x, i) => `<a href="${lessonOpen(m, i) ? `#/m/${id}/${i}` : "#"}" class="dot ${st.done.includes(x.id) || st.passed ? "done" : ""} ${i === k ? "cur" : ""}" title="${esc(x.title)}" ${lessonOpen(m, i) ? "" : 'aria-disabled="true"'}>${i + 1}</a>`).join("");

    const media = l.video
      ? `<figure class="media"><div class="vid"><video id="vid" controls playsinline preload="metadata" poster="assets/video/${l.video}.jpg" src="assets/video/${l.video}.mp4"></video></div>
         <div class="vctl"><button class="btn ghost" data-speed="0.75">Slower</button><button class="btn ghost" data-speed="1">Normal speed</button><button class="btn ghost" data-act="replay">↺ Watch again</button>
         <span class="watch" id="watchnote">${already ? "" : "Watch the video, then answer the question below."}</span></div></figure>`
      : "";
    const image = l.image ? `<figure class="shot"><img src="${l.image.src}" alt="${esc(l.image.alt)}" loading="lazy"><figcaption>${esc(l.image.caption || "")}</figcaption></figure>` : "";

    shell(`
      <div class="lesson-head">
        <p class="eyebrow">Module ${mi + 1} · ${esc(m.title)}</p>
        <div class="dots">${dots}<a class="dot quiz ${lessonsComplete(m) ? "" : "off"}" href="${lessonsComplete(m) ? `#/quiz/${id}` : "#"}" title="Module quiz">Quiz</a></div>
      </div>
      <article class="lesson">
        <h1>${esc(l.title)}</h1>
        <p class="lead">${fill(l.intro)}</p>
        <button class="btn ghost listen" data-act="listen">🔊 Read this to me</button>
        ${media}
        <h2 class="sub">What to do</h2>
        <ol class="steps">${l.steps.map((s) => `<li>${fill(s)}</li>`).join("")}</ol>
        ${l.warn ? `<div class="box warn"><b>Very important</b><p>${fill(l.warn)}</p></div>` : ""}
        ${l.remember ? `<div class="box tip"><b>Remember</b><p>${fill(l.remember)}</p></div>` : ""}
        ${l.extra ? extraBlock(l.extra) : ""}
        ${image}
        <section class="check" id="check">
          <p class="k">Quick check</p>
          <div id="q"></div>
        </section>
      </article>
      <div class="navbar">
        ${k > 0 ? `<a class="btn ghost" href="#/m/${id}/${k - 1}">← Back</a>` : `<a class="btn ghost" href="#/home">← Home</a>`}
        <button class="btn primary big" id="next" ${answered ? "" : "disabled"}>${k < m.lessons.length - 1 ? "Next step →" : "Go to module quiz →"}</button>
      </div>`, { crumbs: `<a href="#/home">Home</a><span>›</span>${esc(m.title)}` });

    const qEl = document.getElementById("q"), check = document.getElementById("check"), next = document.getElementById("next");
    renderQuestion(qEl, l.check, { practice: true, onCorrect: () => {
      answered = true; next.disabled = false;
      if (!st.done.includes(l.id)) { st.done.push(l.id); save("lesson", `${m.id}/${l.id}`); }
    }});

    const v = document.getElementById("vid");
    if (v) {
      let max = 0;
      const unlock = () => { if (watched) return; watched = true; check.classList.remove("locked"); const n = document.getElementById("watchnote"); if (n) n.textContent = ""; };
      v.addEventListener("timeupdate", () => { max = Math.max(max, v.currentTime); if (v.duration && max >= v.duration * CFG.WATCH_SHARE) unlock(); });
      v.addEventListener("ended", unlock);
      v.addEventListener("error", unlock); // a broken video must never trap a learner
      app.querySelectorAll("[data-speed]").forEach((b) => (b.onclick = () => { v.playbackRate = parseFloat(b.dataset.speed); v.play(); }));
      app.querySelector('[data-act="replay"]').onclick = () => { v.currentTime = 0; v.play(); };
    }
    app.querySelector('[data-act="listen"]').onclick = () => speak([l.title, strip(fill(l.intro)), "What to do.", ...l.steps.map((s, i) => `Step ${i + 1}. ${strip(fill(s))}`), l.warn ? "Very important. " + strip(fill(l.warn)) : "", l.remember ? "Remember. " + strip(fill(l.remember)) : ""].join(" "));
    next.onclick = () => { stopSpeaking(); go(k < m.lessons.length - 1 ? `#/m/${id}/${k + 1}` : `#/quiz/${id}`); };
  }

  /* ---------------- questions ---------------- */
  // Renders one question into el. opts.practice: retry until right. Otherwise one answer counts.
  function renderQuestion(el, q, opts) {
    const done = (ok, given) => {
      fb.hidden = false;
      fb.className = "fb " + (ok ? "good" : "bad");
      fb.innerHTML = `<b>${ok ? "Correct!" : opts.practice ? "Not quite. Try again." : "Not correct."}</b><p>${esc(q.explain || "")}</p>`;
      if (opts.practice && !ok) return;
      lock();
      if (ok && opts.onCorrect) opts.onCorrect();
      if (opts.onAnswer) opts.onAnswer(ok, given);
    };
    const lock = () => el.querySelectorAll("button, input").forEach((b) => { if (!b.classList.contains("keep")) b.disabled = true; });
    el.innerHTML = `<p class="qtext">${esc(q.q)}</p><div class="qbody"></div><div class="fb" hidden></div>`;
    const body = el.querySelector(".qbody"), fb = el.querySelector(".fb");

    if (q.type === "single" || q.type === "multi") {
      const order = shuffle(q.options.map((t, i) => ({ t, i })));
      const multi = q.type === "multi";
      body.innerHTML = `${multi ? '<p class="hint">Select all that are true, then press Check.</p>' : ""}<div class="opts">${order.map((o) => `<button class="opt" data-i="${o.i}" role="${multi ? "checkbox" : "button"}" aria-pressed="false"><span class="tick"></span><span>${esc(o.t)}</span></button>`).join("")}</div>${multi ? '<button class="btn primary" data-act="check">Check</button>' : ""}`;
      body.querySelectorAll(".opt").forEach((b) => (b.onclick = () => {
        if (multi) { b.classList.toggle("sel"); b.setAttribute("aria-pressed", b.classList.contains("sel")); return; }
        body.querySelectorAll(".opt").forEach((x) => x.classList.remove("sel", "right", "wrong"));
        const i = +b.dataset.i, ok = i === q.answer;
        b.classList.add(ok ? "right" : "wrong");
        if (ok || !opts.practice) body.querySelector(`.opt[data-i="${q.answer}"]`).classList.add("right");
        done(ok, q.options[i]);
      }));
      if (multi) body.querySelector('[data-act="check"]').onclick = () => {
        const sel = [...body.querySelectorAll(".opt.sel")].map((b) => +b.dataset.i).sort();
        if (!sel.length) return;
        const want = q.answer.slice().sort(), ok = sel.length === want.length && sel.every((x, i) => x === want[i]);
        body.querySelectorAll(".opt").forEach((b) => {
          const i = +b.dataset.i; b.classList.remove("right", "wrong");
          if (ok || !opts.practice) { if (want.includes(i)) b.classList.add("right"); else if (b.classList.contains("sel")) b.classList.add("wrong"); }
          else if (b.classList.contains("sel") && !want.includes(i)) b.classList.add("wrong");
        });
        done(ok, sel.map((i) => q.options[i]).join(" | "));
      };
    }

    if (q.type === "order") {
      let picked = [];
      const items = shuffle(q.items.map((t, i) => ({ t, i })));
      body.innerHTML = `<p class="hint">Tap the steps in the right order: first step first.</p><ol class="picked"></ol><div class="opts pool">${items.map((o) => `<button class="opt" data-i="${o.i}"><span>${esc(o.t)}</span></button>`).join("")}</div><button class="btn ghost keep" data-act="undo">Clear and start again</button>`;
      const pickedEl = body.querySelector(".picked");
      const draw = () => {
        pickedEl.innerHTML = picked.map((i) => `<li>${esc(q.items[i])}</li>`).join("");
        body.querySelectorAll(".pool .opt").forEach((b) => (b.hidden = picked.includes(+b.dataset.i)));
      };
      body.querySelectorAll(".pool .opt").forEach((b) => (b.onclick = () => {
        picked.push(+b.dataset.i); draw();
        if (picked.length === q.items.length) {
          const ok = picked.every((x, i) => x === i);
          pickedEl.querySelectorAll("li").forEach((li, i) => li.classList.add(picked[i] === i ? "right" : "wrong"));
          if (!ok && !opts.practice) pickedEl.insertAdjacentHTML("afterend", `<p class="hint">Right order:</p><ol class="picked answer">${q.items.map((t) => `<li class="right">${esc(t)}</li>`).join("")}</ol>`);
          done(ok, picked.map((i) => q.items[i]).join(" > "));
          if (ok || !opts.practice) body.querySelector('[data-act="undo"]').hidden = true;
        }
      }));
      body.querySelector('[data-act="undo"]').onclick = () => { picked = []; fb.hidden = true; draw(); };
    }

    if (q.type === "hotspot") {
      body.innerHTML = `<p class="hint">Tap on the picture.</p><div class="hot"><img src="${q.img}" alt="Screenshot for the question"><span class="mark" hidden></span><span class="zone" hidden></span></div>`;
      const hot = body.querySelector(".hot"), mark = hot.querySelector(".mark"), zone = hot.querySelector(".zone");
      const [x1, y1, x2, y2] = q.box, padX = 1, padY = 3; // forgiving up and down; neighbouring icons sit side by side
      Object.assign(zone.style, { left: x1 + "%", top: y1 + "%", width: x2 - x1 + "%", height: y2 - y1 + "%" });
      let finished = false;
      hot.onclick = (e) => {
        if (finished) return;
        const r = hot.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
        const ok = x >= x1 - padX && x <= x2 + padX && y >= y1 - padY && y <= y2 + padY;
        mark.hidden = false; mark.className = "mark " + (ok ? "right" : "wrong");
        Object.assign(mark.style, { left: x + "%", top: y + "%" });
        if (ok || !opts.practice) { zone.hidden = false; finished = true; }
        done(ok, `${Math.round(x)},${Math.round(y)}`);
      };
    }

    if (q.type === "number") {
      body.innerHTML = `<div class="numq"><span>${esc(q.prefix || "")}</span><input type="text" inputmode="numeric" placeholder="Type the amount"><button class="btn primary">Check</button></div>`;
      const inp = body.querySelector("input"), b = body.querySelector("button");
      const go2 = () => {
        const val = parseFloat(inp.value.replace(/[^\d.]/g, ""));
        if (isNaN(val)) { inp.focus(); return; }
        const ok = Math.abs(val - q.answer) < 0.5;
        inp.classList.toggle("right", ok); inp.classList.toggle("wrong", !ok);
        if (!ok && !opts.practice) fb.dataset.answer = q.answer;
        done(ok, String(val));
      };
      b.onclick = go2; inp.onkeydown = (e) => { if (e.key === "Enter") go2(); };
    }
  }

  /* ---------------- quizzes ---------------- */
  function drawFinal() {
    // Spread the final exam across every module so nothing is skipped.
    const per = Math.max(2, Math.floor(CFG.FINAL_SIZE / MODULES.length));
    let qs = [];
    MODULES.forEach((m) => (qs = qs.concat(shuffle(m.bank).slice(0, per).map((q) => Object.assign({ module: m.id }, q)))));
    const rest = shuffle(MODULES.flatMap((m) => m.bank.map((q) => Object.assign({ module: m.id }, q))).filter((q) => !qs.some((x) => x.q === q.q)));
    qs = qs.concat(rest).slice(0, CFG.FINAL_SIZE);
    return shuffle(qs);
  }
  function drawRefresher(r) {
    const pool = r.pool === "all" ? MODULES : MODULES.filter((m) => r.pool.includes(m.id));
    const qs = pool.flatMap((m) => m.bank.map((q) => Object.assign({ module: m.id }, q))).concat(r.questions || []);
    return shuffle(qs).slice(0, r.size || CFG.REFRESHER_SIZE);
  }

  function viewQuiz(kind, id) {
    let title, questions, back;
    if (kind === "module") {
      const mi = modIndex(id), m = MODULES[mi];
      if (!m || !moduleOpen(mi)) return go("#/home");
      if (!lessonsComplete(m)) return go(`#/m/${id}/${user.modules[id].done.length}`);
      title = `${m.title}: module quiz`;
      questions = shuffle(m.bank).slice(0, Math.min(CFG.QUIZ_SIZE, m.bank.length));
      back = `#/m/${id}/0`;
    } else if (kind === "final") {
      if (!allPassed()) return go("#/home");
      title = "Final certification exam"; questions = drawFinal(); back = "#/home";
    } else {
      const r = REFRESHERS.find((x) => x.id === id);
      if (!r) return go("#/home");
      title = r.title; questions = drawRefresher(r); back = "#/home";
    }

    const started = Date.now(), answers = [];
    let i = 0, score = 0;

    shell(`
      <div class="quiz-head">
        <p class="eyebrow">${kind === "refresher" ? "Refresher quiz" : `Pass mark ${CFG.PASS_MARK}%`}</p>
        <h1>${esc(title)}</h1>
        <div class="bar"><span id="bar"></span></div>
        <p class="muted" id="count"></p>
      </div>
      <section class="card quiz" id="qbox"></section>
      <div class="navbar"><a class="btn ghost" href="${back}" id="leave">Leave quiz</a><button class="btn primary big" id="qnext" disabled>Next question →</button></div>`, { crumbs: `<a href="#/home">Home</a><span>›</span>${esc(title)}` });

    const box = document.getElementById("qbox"), next = document.getElementById("qnext");
    document.getElementById("leave").onclick = (e) => { if (i > 0 && !confirm("Leave the quiz? This attempt will not count.")) e.preventDefault(); };
    const show = () => {
      const q = questions[i];
      document.getElementById("count").textContent = `Question ${i + 1} of ${questions.length}`;
      document.getElementById("bar").style.width = pct(i, questions.length) + "%";
      next.disabled = !PREVIEW;
      next.textContent = i < questions.length - 1 ? "Next question →" : "See my result →";
      renderQuestion(box, q, { practice: false, onAnswer: (ok, given) => {
        if (ok) score++;
        answers.push({ q: q.q, module: q.module || id, ok, given });
        next.disabled = false; next.focus();
      }});
    };
    next.onclick = () => { i++; if (i < questions.length) show(); else finish(); };
    show();

    function finish() {
      const p = pct(score, questions.length), passed = p >= CFG.PASS_MARK, secs = Math.round((Date.now() - started) / 1000);
      let rec, attemptNo;
      if (kind === "module") rec = user.modules[id];
      else if (kind === "final") rec = user.final;
      else rec = user.refreshers[id] = user.refreshers[id] || { attempts: 0, best: null, last: null };
      rec.attempts = (rec.attempts || 0) + 1; attemptNo = rec.attempts;
      rec.last = p; rec.best = Math.max(rec.best || 0, p);
      let outcome = "";
      if (kind === "module") {
        if (passed) { rec.passed = true; rec.passedAt = rec.passedAt || now(); outcome = "passed"; }
        else { rec.done = []; outcome = "retake module"; }
      } else if (kind === "final") {
        if (passed) { rec.passed = true; rec.passedAt = now(); rec.certId = rec.certId || certId(); outcome = "certified"; }
        else {
          user.round = (user.round || 1) + 1;
          MODULES.forEach((m) => Object.assign(user.modules[m.id], { done: [], passed: false }));
          outcome = "retake whole training";
        }
      } else outcome = passed ? "passed" : "below pass mark";

      const modTitle = kind === "module" ? modById(id).title : title;
      queue({ kind: "attempt", ts: now(), quizKind: kind, moduleId: kind === "final" ? "final" : id, module: modTitle, attempt: attemptNo, round: user.round, score, total: questions.length, percent: p, passed, outcome, seconds: secs, wrong: answers.filter((a) => !a.ok).map((a) => a.q) });
      save();
      viewResult(kind, id, { p, passed, score, total: questions.length, answers, title: modTitle });
    }
  }

  function certId() { return "GCA-" + Date.now().toString(36).toUpperCase().slice(-6) + "-" + Math.floor(Math.random() * 900 + 100); }

  function viewResult(kind, id, r) {
    const mi = kind === "module" ? modIndex(id) : -1;
    const nextMod = mi >= 0 ? MODULES[mi + 1] : null;
    let headline, body, actions;
    if (r.passed) {
      headline = kind === "final" ? "You are certified!" : "Well done, you passed!";
      body = kind === "final" ? "You have passed the full GEMS CRM and Exotel training." : kind === "module" ? (nextMod ? `The next module, <b>${esc(nextMod.title)}</b>, is now open.` : "All modules done. The final exam is now open.") : "Keep it up. Come back tomorrow for another round.";
      actions = kind === "final" ? `<a class="btn primary big" href="#/certificate">See my certificate →</a>`
        : kind === "module" ? `<a class="btn primary big" href="${nextMod ? `#/m/${nextMod.id}/0` : "#/final"}">${nextMod ? "Start next module →" : "Go to the final exam →"}</a><a class="btn ghost" href="#/home">Home</a>`
        : `<a class="btn primary big" href="#/refresher/${id}">Try another round</a><a class="btn ghost" href="#/home">Home</a>`;
    } else {
      headline = "Not yet. Let's go through it again.";
      body = kind === "final" ? `You need ${CFG.PASS_MARK}% to pass. As per the training rule, you will now take the <b>whole training again</b>, from Module 1. Take your time with each video.`
        : kind === "module" ? `You need ${CFG.PASS_MARK}% to pass. You will go through this module again from the first step, then retake the quiz.`
        : "Refresher scores don't change your status, but look at the questions you missed below.";
      actions = kind === "final" ? `<a class="btn primary big" href="#/m/${MODULES[0].id}/0">Start the training again →</a>`
        : kind === "module" ? `<a class="btn primary big" href="#/m/${id}/0">Start the module again →</a><a class="btn ghost" href="#/home">Home</a>`
        : `<a class="btn primary big" href="#/refresher/${id}">Try again</a><a class="btn ghost" href="#/home">Home</a>`;
    }
    const wrong = r.answers.filter((a) => !a.ok);
    shell(`
      <section class="result ${r.passed ? "pass" : "fail"}">
        <div class="score"><span>${r.p}%</span><small>${r.score} of ${r.total} right</small></div>
        <h1>${headline}</h1>
        <p class="lead">${body}</p>
        <div class="actions">${actions}</div>
      </section>
      ${wrong.length ? `<section class="card review"><h2 class="sub">Questions to look at again</h2><ul>${wrong.map((a) => `<li>${esc(a.q)}</li>`).join("")}</ul></section>` : ""}`,
      { crumbs: `<a href="#/home">Home</a><span>›</span>Result` });
    if (r.passed) confetti();
  }

  function viewCertificate() {
    if (!user.final.passed) return go("#/home");
    shell(`
      <section class="cert" id="cert">
        <p class="eyebrow">GEMS Education India · Admissions</p>
        <h1>Certificate of completion</h1>
        <p>This certifies that</p>
        <p class="name">${esc(user.name)}</p>
        <p>${esc(user.role)} · ${esc(user.campus)}</p>
        <p>has completed the <b>Admissions CRM and Exotel</b> counsellor training<br>with a final score of <b>${user.final.best}%</b>.</p>
        <div class="cert-foot"><span>${fmtDate(user.final.passedAt)}</span><span>ID ${esc(user.final.certId || "")}</span></div>
      </section>
      <div class="navbar"><a class="btn ghost" href="#/home">← Home</a><button class="btn primary" onclick="window.print()">Print or save as PDF</button></div>`);
  }

  function confetti() {
    const c = document.createElement("div"); c.className = "confetti";
    const colors = ["#751e2e", "#1b2a5c", "#a07c2c", "#d9c08a"];
    for (let i = 0; i < 60; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%"; s.style.background = colors[i % 4];
      s.style.animationDelay = Math.random() * 0.6 + "s"; s.style.transform = `rotate(${Math.random() * 360}deg)`;
      c.appendChild(s);
    }
    document.body.appendChild(c); setTimeout(() => c.remove(), 3200);
  }

  /* ---------------- router ---------------- */
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    stopSpeaking();
    const h = location.hash.replace(/^#\/?/, "").split("/");
    if (PREVIEW) user = previewUser();
    if (!user) {
      const cur = store.get(LS_CURRENT, null);
      const s = cur && store.get(LS_USER + cur, null);
      if (s) user = normalise(s);
    }
    if (!user) return viewLogin();
    switch (h[0]) {
      case "m": return viewLesson(h[1], h[2]);
      case "quiz": return viewQuiz("module", h[1]);
      case "final": return viewQuiz("final");
      case "refresher": return viewQuiz("refresher", h[1]);
      case "certificate": return viewCertificate();
      default: return viewHome();
    }
  }
  window.addEventListener("hashchange", route);
  route();
  if (user) flush();
})();
