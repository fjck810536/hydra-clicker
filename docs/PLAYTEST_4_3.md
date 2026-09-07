# Playtest 4.3 — Cross-generation Command Spell Economy

## Scope

This milestone synchronizes the confirmed player-facing Command Spell I / II curves into the runnable game.

It intentionally does **not** change the separately unresolved numeric items N2–N6.

## Humanity Evil

Humanity Evil remains a true-kill currency and now scales by Hydra generation:

```text
reward = 11 × 3^(generation - 1)

Hydra I   11 / kill
Hydra II  33 / kill
Hydra III 99 / kill
Hydra IV 297 / kill
```

No head-cut / spawned-head / cap-stall Humanity Evil farming is introduced.

## Command Spell I

Confirmed APS curve:

```text
1 → 3 → 9 → 27 → 81 → 243 → 729 APS
```

Confirmed costs:

```text
99 / 198 / 396 / 891 / 2673 / 8019 / 24057 人類惡
```

N2 was not selected in this implementation pass, so the previous reveal gates remain temporarily unchanged:

```text
9 / 12 / 16 / 22 / 30 / 40 / 66 lifetime Hydra kills
```

These are reveal gates only; the new prices make later upgrades naturally cross-generation.

Legacy tuned saves are migrated conservatively. A save carrying old Command Spell I upgrade milestones keeps the highest new APS that does not exceed its stored old APS; old level numbers do not grant free new-curve power.

## Command Spell II

Base NP state:

```text
manual ×1
3 s
66 NP
```

Formal canonical nine-beat progression:

| Lv | Beat | Cost | NP requirement | Manual NP strike | NP duration |
|---:|---|---:|---:|---:|---:|
| 1 | STRIKE | 297 | 132 | ×3 | 3 s |
| 2 | EFFICIENCY I | 198 | 66 | ×3 | 3 s |
| 3 | TIME | 396 | 198 | ×3 | 9 s |
| 4 | STRIKE | 396 | 396 | ×6 | 9 s |
| 5 | EFFICIENCY II | 330 | 198 | ×6 | 9 s |
| 6 | TIME | 495 | 594 | ×6 | 27 s |
| 7 | STRIKE | 594 | 792 | ×9 | 27 s |
| 8 | EFFICIENCY III | 495 | 396 | ×9 | 27 s |
| 9 | TIME · MAX | 693 | 1188 | ×9 | 81 s |

Hydra II reveal cadence:

```text
3 / 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99 Hydra II kills
```

The current implementation follows this canonical nine-beat order linearly. The player-facing proposal also discusses independent STRIKE / EFFICIENCY / TIME branch purchasing, but no purchase-order-independent NP-requirement composition rule is specified yet. The runtime therefore does not invent one.

## NP integration

Command Spell II owns the current NP configuration projection:

```text
CS II status
→ npMaxPoints
→ npDurationMs
→ npManualStrikeCount
```

NP System remains the owner of charge / release / active window lifecycle.

Important boundary:

```text
Command Spell II never mutates Hydra directly.
Hydra still only sees the timed hydra.headGrowth modifier during NP.
```

A TIME upgrade changes future NP releases only. An already-active NP modifier keeps the `endsAt` fixed at release time.

When NP max changes after a purchase, the game preserves **absolute charged NP points**, not the previous normalized percentage. Example:

```text
33 / 66 charged
buy STRIKE I
→ 33 / 132
not 66 / 132
```

The save field remains normalized 0..1 for schema compatibility; the purchase system performs the point-preserving conversion.

## Player controls

The current prototype footer now exposes two formal purchase controls:

```text
COMMAND SPELL I
COMMAND SPELL II
寶具解放
```

This is not the final three-slot Command Spell UI. It is a functional player-facing control surface for economy playtesting.

## Automated contracts

Tests lock:

```text
Humanity Evil: 11 → 33 → 99 → 297
Hydra II true kill → +33 Humanity Evil
CS I APS: 1 → 3 → 9 → 27 → 81 → 243 → 729
CS I prices: 99 → ... → 24057
CS II reveal: 3 / 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99 Hydra II kills
CS II NP max: 132 / 66 / 198 / 396 / 198 / 594 / 792 / 396 / 1188
CS II NP duration: 3 / 3 / 9 / 9 / 9 / 27 / 27 / 27 / 81 s
CS II NP manual strike: 3 / 3 / 3 / 6 / 6 / 6 / 9 / 9 / 9
NP points are preserved absolutely across max changes
81-second MAX release creates an 81-second GameClock window
```

## Not changed in this milestone

- Command Spell I new reveal thresholds (N2)
- Hydra II below-cap growth presentation delay (N3)
- Hydra II cap replacement timing (N4)
- NP countdown display precision (N5)
- Tree View reveal trigger (N6)
- Hydra III combat rule
- visible Hydra head cap 99
- NP time-stop Auto Slash pause policy
- save schema version

Core principle:

> **The economy can become strange; the ownership boundaries should not.**
