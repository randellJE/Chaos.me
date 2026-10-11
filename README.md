# CHAOS — Chaos Zero Nightmare planner

A responsive, unofficial progression planner inspired by seelie.me. Includes one 4★ and one 5★ combatant, plus one partner each at 3★, 4★, and 5★. Artwork, roles, and material costs are placeholders; costs are illustrative and are not verified game data.

## Development

Requires Node.js 20.19+ or 22.12+ (validated with Node 24).

```sh
npm ci
npm run dev
```

Vite listens on port 5173 by default. Use the Combatants and Partners pages to add goals. Click a portrait to open the tabbed editor: Level includes current/target level and ascension, Skills includes three demo skill tracks, and Partner assigns one of the partner placeholders. Notes, rank, favorites, and goal inclusion are saved per unit. Save commits edits; Cancel or Escape discards them. Update owned amounts in Materials and view combined requirements in Overview. Settings provides JSON backups and manual energy tracking. Progress is stored in this browser's localStorage, with no backend or game account integration.

```sh
npm test
npm run build
npm run preview
```

Browser checks: `npm run test:e2e` (starts or reuses the development server on port 5173). The provided Playwright configuration uses `/usr/bin/chromium`; change its executable path for another machine or use Playwright's managed browser.

The generated `dist/` directory can be hosted on any static web host. No secrets or environment variables are required.
