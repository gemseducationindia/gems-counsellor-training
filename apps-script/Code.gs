/**
 * GEMS Counsellor Academy: Google Sheet backend.
 *
 * Paste this into Extensions → Apps Script of an empty Google Sheet,
 * run setup() once, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Copy the /exec URL into assets/js/config.js.
 *
 * Tabs it keeps:
 *   Users     one row per counsellor (login details, overall progress, certification)
 *   Progress  one row per counsellor per module (steps done, attempts, best score)
 *   Attempts  every quiz attempt ever taken (module, final and refresher)
 *   Activity  every login and every step completed
 *   State     the full saved progress per person, so they can continue on any device (hidden)
 */

const TABS = {
  Users: ["Email", "Name", "Team", "Campus", "First seen", "Last seen", "Logins", "Training round", "Overall %", "Modules passed", "Final best %", "Certified on", "Certificate ID"],
  Progress: ["Email", "Name", "Campus", "Module ID", "Module", "Steps done", "Steps total", "Attempts", "Best %", "Last %", "Passed", "Passed on", "Updated"],
  Attempts: ["Timestamp", "Email", "Name", "Team", "Campus", "Quiz type", "Module ID", "Module", "Attempt #", "Round", "Score", "Out of", "Percent", "Passed", "Outcome", "Time taken (s)", "Questions missed"],
  Activity: ["Timestamp", "Email", "Name", "Event", "Detail"],
  State: ["Email", "Updated", "State JSON"]
};

function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(TABS).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight("bold").setBackground("#1b2a5c").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  });
  ss.getSheetByName("State").hideSheet();
  const blank = ss.getSheetByName("Sheet1");
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "state" && p.email) {
    const row = findRow_(sheet_("State"), String(p.email).toLowerCase());
    if (!row) return json_({ ok: true, state: null });
    const v = sheet_("State").getRange(row, 3).getValue();
    let state = null;
    try { state = JSON.parse(v); } catch (err) { state = null; }
    return json_({ ok: true, state: state });
  }
  return json_({ ok: true, service: "GEMS Counsellor Academy" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== "sync") return json_({ ok: false, error: "unknown action" });
    const u = body.user || {};
    u.email = String(u.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) return json_({ ok: false, error: "bad email" });
    const items = body.items || [];
    const s = body.summary || {};
    const ts = new Date();

    // Activity and attempts are appended in one write each.
    const logins = items.filter(function (x) { return x.kind === "event" && (x.event === "login" || x.event === "signup"); }).length;
    const acts = items.filter(function (x) { return x.kind === "event"; }).map(function (x) {
      return [new Date(x.ts || ts), u.email, u.name, x.event, x.detail || ""];
    });
    if (acts.length) append_("Activity", acts);
    const atts = items.filter(function (x) { return x.kind === "attempt"; }).map(function (x) {
      return [new Date(x.ts || ts), u.email, u.name, u.role, u.campus, x.quizKind, x.moduleId, x.module, x.attempt, x.round, x.score, x.total, x.percent, x.passed ? "Yes" : "No", x.outcome, x.seconds, (x.wrong || []).join(" | ")];
    });
    if (atts.length) append_("Attempts", atts);

    // Users: one row per person.
    const us = sheet_("Users");
    let r = findRow_(us, u.email);
    const fin = s.final || {};
    if (!r) {
      us.appendRow([u.email, u.name, u.role, u.campus, ts, ts, logins || 1, s.round || 1, s.overall || 0, (s.modulesPassed || 0) + " of " + (s.modulesTotal || 0), fin.best == null ? "" : fin.best, fin.passed ? new Date(fin.passedAt) : "", fin.certId || ""]);
    } else {
      const prev = us.getRange(r, 1, 1, 13).getValues()[0];
      us.getRange(r, 2, 1, 12).setValues([[u.name, u.role, u.campus, prev[4] || ts, ts, (Number(prev[6]) || 0) + logins, s.round || 1, s.overall || 0, (s.modulesPassed || 0) + " of " + (s.modulesTotal || 0), fin.best == null ? "" : fin.best, fin.passed ? new Date(fin.passedAt) : "", fin.certId || ""]]);
    }

    // Progress: one row per person per module.
    const ps = sheet_("Progress");
    const data = ps.getLastRow() > 1 ? ps.getRange(2, 1, ps.getLastRow() - 1, 4).getValues() : [];
    (s.modules || []).forEach(function (m) {
      const vals = [u.email, u.name, u.campus, m.id, m.title, m.lessonsDone, m.lessonsTotal, m.attempts || 0, m.best == null ? "" : m.best, m.last == null ? "" : m.last, m.passed ? "Yes" : "No", m.passedAt ? new Date(m.passedAt) : "", ts];
      let found = 0;
      for (let i = 0; i < data.length; i++) { if (data[i][0] === u.email && data[i][3] === m.id) { found = i + 2; break; } }
      if (found) ps.getRange(found, 1, 1, vals.length).setValues([vals]);
      else { ps.appendRow(vals); data.push([u.email, "", "", m.id]); }
    });

    // State: full saved progress for resuming on another device.
    if (body.state) {
      const st = sheet_("State");
      const json = JSON.stringify(body.state);
      const sr = findRow_(st, u.email);
      if (sr) st.getRange(sr, 2, 1, 2).setValues([[ts, json]]);
      else st.appendRow([u.email, ts, json]);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { setup(); sh = ss.getSheetByName(name); }
  return sh;
}

function findRow_(sh, email) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const f = sh.getRange(2, 1, last - 1, 1).createTextFinder(email).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}

function append_(name, rows) {
  const sh = sheet_(name);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
