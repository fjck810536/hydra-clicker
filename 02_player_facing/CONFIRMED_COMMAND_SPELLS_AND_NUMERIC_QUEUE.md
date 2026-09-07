# Hydra Clicker — Confirmed Command Spell Curves + Remaining Numeric Queue

> Date: 2026-09-08  
> Status: player-facing decision sync.  
> This file supersedes the **provisional** status of the Command Spell I / II values in `ECONOMY_PROPOSAL.md` where the same values appear. It does not change the write boundary of this chat.

---

## 1. Confirmed now — Command Spell I

Command Spell I remains the ordinary-time APS / autonomous cutting progression.

Player-facing APS scale:

> **1 → 3 → 9 → 27 → 81 → 243 → 729 APS**

Confirmed Humanity Evil purchase costs:

| APS after purchase | Humanity Evil cost |
|---:|---:|
| 1 | 99 |
| 3 | 198 |
| 9 | 396 |
| 27 | 891 |
| 81 | 2673 |
| 243 | 8019 |
| 729 | 24057 |

Confirmed identity:

- Command Spell I affects ordinary-time automation / APS.
- It persists across Hydra generations.
- It does **not** extend NP duration.
- In Hydra II, ordinary-time Auto Slash still cuts Hydra and therefore also creates Hydra growth pressure.
- Power-of-nine APS landmarks intentionally parallel Hydra scale.
- A future upgrade may be visible before it is affordable; price pressure may be used instead of a hard generation lock.

The exact **reveal / availability kill thresholds** for these seven APS steps are not yet numerically fixed in `02_player_facing`.

---

## 2. Confirmed now — Command Spell II identity

Command Spell II owns Noble Phantasm / time-stop technique progression.

Base before Command Spell II:

> **1 cut / click · 3 s NP · 66 NP requirement**

Multistrike remains NP-only:

- ordinary time: **1 click = 1 cut**;
- NP / time stop: **1 click = 3 / 6 / 9 rapid visible cuts** according to STRIKE progression;
- cuts are discrete cut resolutions, not a bulk subtraction;
- Auto Slash remains paused during the base NP time-stop policy unless a later separate ability changes that rule.

---

## 3. Confirmed Command Spell II rewards and costs

### STRIKE branch

| Reward | Humanity Evil cost |
|---:|---:|
| 3 cuts / click | 297 |
| 6 cuts / click | 396 |
| 9 cuts / click | 594 |

Branch total: **1287**.

### NP EFFICIENCY branch

| Reward | Humanity Evil cost |
|---|---:|
| Efficiency I | 198 |
| Efficiency II | 330 |
| Efficiency III | 495 |

Branch total: **1023**.

### TIME branch

| Reward | Humanity Evil cost |
|---:|---:|
| 9 s | 396 |
| 27 s | 495 |
| 81 s | 693 |

Branch total: **1584**.

Combined Command Spell II branch cost: **3894 Humanity Evil**.

---

## 4. Confirmed Command Spell II canonical 9-beat curve

Current canonical progression values:

| Beat | Reward | NP requirement after reward |
|---|---:|---:|
| Base | 1 cut / click · 3 s | 66 |
| I-1 STRIKE | 3 cuts / click | 132 |
| I-2 EFFICIENCY | NP requirement relief | 66 |
| I-3 TIME | 9 s | 198 |
| II-1 STRIKE | 6 cuts / click | 396 |
| II-2 EFFICIENCY | NP requirement relief | 198 |
| II-3 TIME | 27 s | 594 |
| III-1 STRIKE | 9 cuts / click | 792 |
| III-2 EFFICIENCY | NP requirement relief | 396 |
| III-3 TIME · MAX | 81 s | 1188 |

Canonical NP requirement rhythm:

> **66 → 132 → 66 → 198 → 396 → 198 → 594 → 792 → 396 → 1188**

Confirmed Hydra II reveal cadence from the existing design:

> **3 / 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99 Hydra II kills**

Reveal order:

1. 3-hit
2. Efficiency I
3. 9 s
4. 6-hit
5. Efficiency II
6. 27 s
7. 9-hit
8. Efficiency III
9. 81 s / MAX

Within each named branch, prerequisites remain ordered:

- 3-hit → 6-hit → 9-hit
- Efficiency I → II → III
- 9 s → 27 s → 81 s

### Implementation handoff ambiguity still present

`ECONOMY_PROPOSAL.md` simultaneously describes the above as a canonical 9-beat curve **and** says the three branches should be player-selectable rather than one mandatory linear chain.

That creates one implementation question that is not purely numeric:

> If a player buys unlocked cards across branches in a different order from the canonical 9-beat sequence, how is the current NP requirement composed?

The fixed sequence above is confirmed. A purchase-order-independent composition rule is not currently written in `02_player_facing`.

Until that rule is decided, implementation should not invent a hidden formula that changes the confirmed NP requirements.

---

## 5. Remaining numeric queue outside the confirmed Command Spell curves

Only items that still need a number are listed here.

### N1 — Humanity Evil acquisition by Hydra generation

Current existing baseline:

> Hydra I = **11 Humanity Evil / true kill**

Current proposal, not yet confirmed:

> **11 × 3^(generation - 1)**

which gives:

| Hydra generation | Humanity Evil / true kill |
|---:|---:|
| I | 11 |
| II | 33 |
| III | 99 |
| IV | 297 |

Need: confirm this sequence or provide replacement values / multiplier.

### N2 — Command Spell I reveal / availability thresholds

APS and prices are confirmed, but exact reveal points are not.

Need kill / progression thresholds for:

> **1 / 3 / 9 / 27 / 81 / 243 / 729 APS**

The existing proposal only says roughly Hydra I early / mid / late, 27 visible late in Hydra I, 81 around Hydra II, and 243 / 729 later.

### N3 — Hydra II below-cap regrowth presentation delay

Rule is confirmed:

> CUT 1 → GROW +2

but the player-facing delay between severing and the +2 becoming visible is not numerically fixed.

Need: delay in **ms** (or a range).

### N4 — Hydra II 81-cap replacement timing

At cap the intended read is:

> CUT → immediate replacement / recovery → still 81

but “immediate” has no fixed timing.

Need: replacement / recovery delay in **ms** if this is to be tuned separately from below-cap growth.

### N5 — NP countdown precision

Timer existence is confirmed; display precision remains open.

Need one of:

> **0.1 s steps**  
> **0.01 s steps**

or another display increment.

### N6 — Tree View first reveal point

Tree View is intended around Hydra III / the next scale step, but no exact unlock point exists.

Need, only if we want to schedule it now:

> generation + encounter / kill threshold, or an exact head-count / milestone trigger.

---

## 6. Not currently requesting numbers

The following remain design questions but do not need numeric input yet:

- exact Hydra II cap animation grammar;
- Command Spell I audio / visual coexistence with manual taps;
- visual abstraction grammar above 99 heads;
- Tree View contents / interaction depth;
- Souls-like encounter text amount;
- sound design language;
- later SKIP / NP automation beat.

They should not block Command Spell I / II curve synchronization.
