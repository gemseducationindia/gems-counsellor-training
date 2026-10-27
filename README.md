# GEMS Counsellor Academy

Step-by-step training for GEMS admission counsellors on Exotel calling and the Admissions CRM.
Plain static site for GitHub Pages: no build step.

## How it works
- The counsellor types their email ID (plus name, team and campus the first time). Progress is saved on the device and in the Google Sheet, so they can continue on any computer.
- 8 modules, in order: Exotel → CRM home → Walk-in leads → Calling and logging → Visits and handover → Junk and Lost → Application to enrolment → Fees and discounts.
- Every step has a short video or screenshot, numbered instructions, and a quick check that must be answered correctly before moving on. "Read this to me" reads the step aloud.
- Each module ends with a quiz drawn at random from its question bank (options shuffled, so every retake is different). Pass mark 70%. Below 70% the module starts again from step 1.
- After all modules: a 25-question final exam across everything. Below 70% the whole training starts again. Pass gives a printable certificate.
- Refresher quizzes can be taken any time and do not change pass status.

## Files
- `assets/js/config.js`: Google Sheet URL, pass mark, quiz sizes, campus walk-in links.
- `assets/js/content.js`: all lessons and questions. Add questions to a module's `bank`, or add a refresher to `REFRESHERS`.
- `assets/js/app.js`: the engine. `assets/css/style.css`: the look.
- `assets/video/`: short clips cut from the tutorial films. `assets/img/`: screenshots (staff details masked).
- `apps-script/Code.gs`: the Google Sheet backend.

## Connect the Google Sheet
1. Create a new Google Sheet (for example "Counsellor Academy results").
2. Extensions → Apps Script. Delete what is there, paste `apps-script/Code.gs`, save.
3. Choose `setup` in the function menu and click Run. Allow the permissions.
4. Deploy → New deployment → type Web app. Execute as: Me. Who has access: Anyone. Deploy.
5. Copy the Web app URL (ends in `/exec`) into `SHEET_URL` in `assets/js/config.js`.

The sheet gets tabs Users, Progress, Attempts and Activity (plus a hidden State tab used for resuming).

## Adding a refresher quiz
Add an entry to `REFRESHERS` in `content.js`, for example:
```js
{ id: "nov-week-1", title: "November refresher", summary: "Visits and handover.", pool: ["visits"], size: 8,
  questions: [ { type: "single", q: "...", options: ["...", "..."], answer: 0, explain: "..." } ] }
```
