# MEOWBOMB — Original Edition web game

Status: proposed design, awaiting user review before implementation
Date: 2026-10-22 (Asia/Singapore)
Workspace: D:\MEOWBOMB

## Goal and agreed scope

Build a Thai-language browser game for friends, with working rules and card actions rather than a visual demo. The user selected the base Original Edition. Support 2–5 people using separate phones or computers. No expansion cards in this release.

The workspace was empty when inspected. No existing application or repository conventions were found. This document is the first project artifact; implementation and deployment have not started.

## Rules authority

Use the publisher's Original Edition instructions linked on its official rules page, checked on 2026-10-22:

- Rules page: https://www.explodingkittens.com/pages/rules-kittens
- English PDF: https://cdn.shopify.com/s/files/1/0345/9180/1483/files/ekoe-instructions-english.pdf?v=1743802429
- Source identifier printed in the PDF: ©2025, LONS-202504-79, two pages, 56 cards, 2–5 players.

Both pages were extracted and inspected. This is the selected rules edition, not an assertion that every historical printing has identical rules. Implement the full standard game and its pair/triple combos. The optional faster-game deck reduction is outside this initial release. Do not introduce the older five-different-cards combo.

### Deck and turn contract

Catalog: Exploding Kitten ×4; Defuse ×6; Attack, Skip, Favor and Shuffle ×4 each; Nope and See the Future ×5 each; five distinct cat types ×4 each. Total: 56.

Setup reserves bombs and Defuses, gives each player one Defuse, returns up to two spare Defuses, and deals seven more cards per player. Add one fewer bomb than players. Randomize the remaining deck and starting player.

Draw ends one owed turn. Skip consumes one owed turn. A normal Attack assigns two turns; an Attack during attack debt transfers the current remaining debt plus two. Favor lets its target choose one card. Shuffle randomizes the deck. Future privately shows up to three top cards without reordering.

A bomb requires Defuse or elimination. Defuse allows secret reinsertion at any deck position, then consumes one owed turn. Elimination removes that player's hand from play. The final survivor wins.

Pairs of any matching title steal randomly; triples request a named type, succeeding only if present. Cat cards cannot act singly. Nope cancels actions and combos; chained Nopes toggle cancellation. Bombs, Defuses and the ordinary draw cannot be Noped. Played cards remain discarded.

### Digital timing policy

The physical rules do not prescribe network timers. These are explicit website adaptations:

- Each cancellable action opens an 8-second response window for every living player, including the actor. Everyone sees the same window regardless of who holds Nope.
- The action and any target/type choice are visible before resolution; no private card result is revealed yet.
- Each Nope restarts the window and clears prior passes. Odd Nope count cancels; even count resolves the original action once.
- Any living player can pass. Resolve early only when all living players pass. Passing does not prevent a later Nope while the window remains open.
- The server deadline is authoritative. An expired window is resolved before processing a newly received command, and cannot accept late Nopes.
- No automatic action-selection timeout. A player can take time choosing a card, giving Favor, viewing Future or reinserting a bomb. The UI explains who is being awaited.
- A Future result remains private until its viewer closes the result. That closes only the viewing phase; it does not end the turn.
- Disconnected players retain their seat. They can reconnect using their saved secret. Other players can wait or explicitly abandon the round; no hidden automatic moves.

## Product flow

### Home and room lobby

Enter a nickname, choose a cat avatar, then create a room or enter its six-character code. Provide a shareable room URL and copy buttons. A room code locates a room; it never substitutes for a player's private session secret.

Show seats, readiness and connection indicators. The host starts when 2–5 players are ready. Lock new player admission during an active round. Names are length-limited and rendered as plain text. Resolve code collisions on the server.

Leaving a lobby removes that seat. If its host leaves, transfer ownership to the next participant. During a round, disconnecting preserves the seat. Connected participants can vote to abandon a stuck round; require unanimous agreement of currently connected participants and at least two votes. Abandonment returns everyone to the lobby without awarding a winner.

### Table

Place opponents around a central draw/discard area and the player's hand along the bottom. Show the active player, turns owed, remaining deck size, opponents' hand counts, and a concise event history. Keep the primary action clear: play selected cards or draw.

Selecting a card opens its Thai explanation and legal choices. For Favor and combos, choose a living target before submitting. Triple combos also choose the requested type from the full base catalog. All dialogs can close and reopen without silently committing an action.

Nope has a prominent response banner, countdown and pass button. Show cancelled actions distinctly. Future and bomb reinsertion use private panels; reinsertion choices range from top to bottom without showing any other deck cards. Favor prompts only its target to select the card being given.

Eliminated participants can watch public events, never other hands or Future results. Show a winner panel with replay and return-to-lobby actions. Starting another round creates a fresh shuffled deck and readiness cycle.

### Presentation

Use original MEOWBOMB branding and original cat illustrations/icons. Direction: warm cream, charcoal outlines, coral danger accents and mint safe-action accents, with playful typography and readable Thai body text. Avoid reusing the publisher's card artwork or logo. Keep English card names next to Thai explanations so players can compare their physical deck.

Design for 360px-wide phones and desktop screens. Use horizontal hand scrolling on small screens, large touch targets, keyboard-operable controls, visible focus, sufficient contrast and reduced-motion support. Critical states need text and icons as well as color.

## Architecture and delivery

### Approaches considered

1. **Recommended: hosted server and persisted room state through Sites.** React/TypeScript UI using the supplied Vinext starter, server request handlers and D1 storage. Friends share one authoritative game state; the creator's computer does not need to remain online. Browser updates use short polling, appropriate for a turn-based game.
2. **Dedicated Node/WebSocket server.** Lower update latency but requires a separate persistent host and deployment setup. It can reuse the pure game engine later if necessary.
3. **Browser-hosted peer game.** Adds host migration and hidden-state trust problems. It does not fit the intended reliable friend-group experience.

Use approach 1. Keep sources in this workspace, with the Sites application in a dedicated `meowbomb` subdirectory and this design at the workspace root. Sites publication begins private for review. The shared release must have an audience that admits friends; an owner-only deployment is not completion of online multiplayer. Confirm actual access capabilities before claiming the share link works for friends. Do not purchase hosting or credits automatically.

### Boundaries

- **Card catalog:** immutable identifiers, counts, labels and concise original Thai descriptions.
- **Game engine:** pure state transitions; injected randomness/time; explicit setup, turn, response, Favor, Future, reinsertion and finished phases. No browser, database or transport dependencies.
- **Room service:** nickname/seat lifecycle, host/readiness rules, connection presence, replay and abandonment.
- **Persistence:** full private room state, revision and inactivity timestamps in D1. Schema changes use migrations. Browser state holds only its session secret and preferences.
- **API:** authenticate each command, validate its payload and phase, call the engine, persist atomically, then return a player-specific view.
- **UI:** display server-approved state and available actions; never calculate a secret outcome locally.

### Consistency, reconnect and privacy

Generate cryptographically random player/session secrets. Persist only secret hashes on the server. Do not place secrets in invitation links, public history, error messages or analytics. Use per-tab session storage so separate tabs can be used for local multiplayer QA; refresh restores the same seat. Cross-device seat transfer is outside this release.

Each command carries a unique request ID and expected state revision. Store the request ID and resulting state in the same conditional database update. Conflicting revisions return the newest filtered snapshot and ask the user to retry, rather than replaying a stale choice automatically. Retried identical commands do not draw, spend or transfer twice. Limit request size and reject malformed identifiers, duplicate card IDs, invalid ownership and illegal phase transitions.

Poll approximately every 750ms while the table is visible; back off in the lobby or a hidden tab and refresh immediately on focus. Deadline resolution also runs safely on reads through the same revision check. Persist pending deadlines so a process restart does not reset them. Store small bounded public logs and deduplication records.

Return only the caller's hand, authorized private prompt, and public table information. Never serialize the hidden deck, opponent card identities, removed hands or reconnection secrets. Generate shuffled decks and random theft server-side with unbiased randomness. Stale private Future results must not survive into a later viewing phase.

Mark presence separately from turn ownership. Rooms expire after 24 hours with no authenticated activity; enforce expiration server-side and perform bounded cleanup. Do not introduce accounts, chat, rankings, bots or expansions into this first release.

## Verification and completion criteria

### Engine tests

- Setup counts and legal starting hands for every player count; exactly N−1 bombs remain in play.
- Every base card and pair/triple combo, including empty target hands and an absent requested type.
- Attack followed by Attack produces four owed turns; consuming one first produces three; Skip consumes only one.
- Bomb reinsertion at top, middle, bottom and into an empty deck; Defuse during attack debt; elimination and final victory.
- Odd/even Nope chains, self-Nope, cancelled combos, deadline boundaries and rejection of Nope on draw/Defuse.
- Card conservation across deck, hands, discard, removed hands and bombs; no accidental duplicated IDs.
- Scenario/randomized complete games terminate normally and maintain invariants.

### Service tests

- Two simultaneous commands cannot both spend one card or both draw the same top card.
- Duplicate request IDs, stale revisions and reconnects cannot repeat an effect.
- Fake identities, out-of-turn commands, invalid card selections and spectator actions are rejected.
- Public responses and logs contain no private opponent/deck data.
- Room start, readiness, host handover, full-room rejection, abandoned rounds, expiry and replay.

### Browser and delivery checks

- Exercise two independent browser sessions through create/join/start/play and reconnect; exercise a five-player room through service tests.
- Verify touch layout at 360px and a desktop viewport, dialog reopening, keyboard focus, clipboard fallback and reduced motion.
- Run type checking, targeted tests and production build. Inspect the served UI and browser errors where browser automation is available.
- Verify deployed access from a non-owner context before reporting friend access as tested. Report any remaining deployment or browser verification limit explicitly.
- Update README with local startup, deployment, selected rules edition, digital timer differences, changed modules and actual verification results.

## Review checkpoint

The user approved the base set. This document makes the technical approach, digital timing choices and completion criteria concrete. The next step is user review of this design, followed by the implementation plan and implementation.
