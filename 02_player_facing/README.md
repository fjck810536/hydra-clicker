# 02_player_facing

This directory contains the player-facing design layer for Hydra Clicker.

## Scope

Topics that belong here include:

- player experience and pacing
- gameplay-facing mechanics
- balance and player-facing data
- text and content
- visual language and visual feedback
- UI / UX and information design
- inferred player-facing structure derived from playtests and known data

## Working files

- [`CURRENT_INFERRED_DESIGN.md`](./CURRENT_INFERRED_DESIGN.md) — current inferred player-facing architecture, confirmed decisions, provisional directions, and open questions.
- [`ECONOMY_PROPOSAL.md`](./ECONOMY_PROPOSAL.md) — economy / upgrade proposal source; Command Spell I / II values that are repeated in the confirmed sync file below are no longer merely provisional.
- [`CONFIRMED_COMMAND_SPELLS_AND_NUMERIC_QUEUE.md`](./CONFIRMED_COMMAND_SPELLS_AND_NUMERIC_QUEUE.md) — confirmed Command Spell I / II curves plus the remaining numeric decisions still needed outside those curves.
- [`PLAYTEST_4_2_NOTE.md`](./PLAYTEST_4_2_NOTE.md) — Playtest 4.1 empirical feedback and the next hypothesis: visible 3-second NP countdown + Command Spell II Lv.1 NP-only ×3 manual multistrike.

## Write boundary for this chat

This chat may read other parts of the repository for context, but may only create, modify, or delete files inside `02_player_facing/`.

The following are read-only from this chat:

- core game implementation
- root project files
- `js/`
- `css/`
- `assets/`
- `docs/`
- tests and tooling
- any other path outside `02_player_facing/`

If a player-facing decision implies an implementation change elsewhere, record the requirement inside `02_player_facing/` rather than editing implementation files directly.

## Working distinction

This layer specifies **what the game is like to play** rather than **how the code implements it**.
