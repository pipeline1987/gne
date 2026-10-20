# Gotham Night Edition

Dummy Gotham news desk with a 20-year archive (2006–2026). Search copy by topic, author, and date. Ask the night desk in sentences — a local clerk that searches the morgue and answers only from printed copy. The search ledger tracks queries, dead ends, and result clicks in this browser (plus a seeded sample).

**Tech:** React 19, TypeScript, Vite, React Router, custom CSS (Cinzel, Libre Baskerville, Barlow Condensed). No backend and no model API — the archive is local article data; the desk agent is extractive over that corpus; search analytics stay in `localStorage`.

```bash
npm install
npm run dev
```
