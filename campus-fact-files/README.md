# GEMS Campus Fact Files

One page per campus for admissions teams: fees, transport, facilities and curriculum, laid out like the CEO's sample sheet. Each page has a Download PDF button (2 pages, A4 landscape).

- `campuses.js`: all campus data. To add a campus, copy the Vikhroli block, fill it in and set `live: true`.
- `build-pdfs.mjs`: run `node build-pdfs.mjs` (needs Playwright) after any data change to rebuild `pdf/<slug>.pdf`.
- Pages are marked noindex so search engines skip them; anyone with the link can still open them.
