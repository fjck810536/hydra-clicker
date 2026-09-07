# Hydra Clicker — Economy / Upgrade Curve Proposal

> Status: **provisional player-facing proposal**. This file is intentionally not a core implementation spec.
>
> Scope: Hydra II resource allocation, NP requirement growth, Command Spell II upgrade structure, and Humanity Evil acquisition. Values below are design candidates for playtest, not confirmed implementation values.

## 1. Existing economy facts used as baseline

Current known values outside this folder are treated as read-only references:

- Humanity Evil currently awards **11 per true Hydra kill**.
- Command Spell I current total cost is **484 Humanity Evil** if all listed levels are purchased.
- Hydra I has **99 kills** in the generation, so at 11 Humanity Evil per kill it produces **1089 Humanity Evil** total.
- A player who buys every current Command Spell I level as soon as possible would therefore enter Hydra II with roughly **605 Humanity Evil** remaining.
- NP currently starts at **66 required points**, with one accepted head cut contributing one NP point.
- Command Spell I can reach **64 APS** before Hydra II.

The important consequence is that a flat 66-NP requirement becomes extremely easy to refill once high APS is active. Hydra II therefore needs an NP economy that scales with burst power rather than leaving every Noble Phantasm release at the same 66-point requirement forever.

---

## 2. Recommended shape: sawtooth NP economy

Do **not** increase NP requirement after every upgrade.

Instead use an alternating pressure / relief structure:

> power upgrade → NP requirement rises  
> efficiency upgrade → NP requirement is reduced  
> next power upgrade → requirement rises again

This avoids making every upgrade feel like a tax while still preventing long / multistrike Noble Phantasms from becoming nearly permanent at 64 APS.

Recommended principle:

- **Multistrike or longer time stop** increases the NP requirement.
- **NP efficiency** nodes reduce the current requirement, preferably by about half.
- The player should periodically feel that they have made the new stronger Noble Phantasm practical again.

---

## 3. Command Spell II — proposed 3 × 3 structure

The cleanest current player-facing shape is three repeating beats:

1. **STRIKE** — increase manual cuts per click during NP only.
2. **EFFICIENCY** — reduce NP required for release.
3. **TIME** — increase the time-stop window.

Repeat this cycle three times.

| CS II beat | Reward | NP requirement after reward | Notes |
|---|---:|---:|---|
| Base | 1 cut / click · 3 s | 66 | pre-Command Spell II |
| I-1 STRIKE | 3 cuts / click | 132 | first CS II unlock; NP-only multistrike |
| I-2 EFFICIENCY | NP requirement ÷2 | 66 | first relief node |
| I-3 TIME | 9 s time stop | 198 | first real duration extension |
| II-1 STRIKE | 6 cuts / click | 396 | high burst, still NP-only |
| II-2 EFFICIENCY | NP requirement ÷2 | 198 | second relief node |
| II-3 TIME | 27 s time stop | 594 | duration ×3 |
| III-1 STRIKE | 9 cuts / click | 792 | Nine Lives-style manual burst peak |
| III-2 EFFICIENCY | NP requirement ÷2 | 396 | third relief node |
| III-3 TIME · MAX | 81 s time stop | 1188 | Command Spell II MAX |

The exact NP values are a candidate curve, but the **shape** is the important part:

> 66 → 132 → 66 → 198 → 396 → 198 → 594 → 792 → 396 → 1188

### Why this shape works

- The first 3-hit unlock is immediately exciting, but it makes the next NP slightly harder to charge.
- The following efficiency upgrade restores the familiar 66-point rhythm while keeping 3-hit.
- A 9-second time stop then triples the charge requirement instead of being a free 3× duration upgrade.
- The same pressure / relief rhythm repeats for 6-hit / 27 s and 9-hit / 81 s.
- At MAX, the player is extremely powerful but still has a meaningful recharge phase.

At 64 APS and ignoring manual taps, candidate recharge times are approximately:

- 66 NP → 1.0 s
- 198 NP → 3.1 s
- 396 NP → 6.2 s
- 594 NP → 9.3 s
- 792 NP → 12.4 s
- 1188 NP → 18.6 s

This prevents the 81-second time stop from becoming literally free while still making MAX feel overwhelmingly strong.

---

## 4. Important rule: multistrike is NP-only

Command Spell II multistrike should **not** apply during ordinary time.

Normal state:

> 1 player click = 1 cut

NP / Noble Phantasm state:

> 1 player click = 3 / 6 / 9 rapid visible cuts

This protects the identity of **Nine Lives / 射殺す百頭**. The multistrike is part of the Noble Phantasm fantasy, not a permanent click multiplier.

The 3 / 6 / 9 cuts should be presented as rapid successive swings rather than an invisible instant subtraction.

---

## 5. Humanity Evil — recommended acquisition law

### Do not award Humanity Evil per head or per cut

Hydra II allows the player to create or maintain enormous head populations. Any Humanity Evil reward tied to heads cut, heads spawned, or time spent at cap would become an obvious infinite farm.

Recommended rule:

> **Humanity Evil is awarded only for a true Hydra kill / encounter completion.**

### Recommended generation scaling

Current Hydra I baseline:

> Generation I: 11 Humanity Evil / kill

Recommended future rule:

> **Humanity Evil per true kill = 11 × 3^(generation - 1)**

Therefore:

| Generation | Humanity Evil / kill | 99-kill generation total |
|---|---:|---:|
| Hydra I | 11 | 1089 |
| Hydra II | 33 | 3267 |
| Hydra III | 99 | 9801 |
| Hydra IV | 297 | 29403 |

Why ×3 rather than ×9:

- Hydra head capacity already grows roughly as powers of nine.
- Currency growing by ×9 as well would make old costs disappear too quickly.
- ×3 gives each generation visibly richer rewards while preserving room for upgrade prices to matter.

This is a recommendation, not yet a confirmed rule.

---

## 6. Hydra II purchasing power

If the current Hydra I economy is left unchanged and the player buys all Command Spell I levels, expected Hydra II entry balance is roughly:

> **605 Humanity Evil**

If Hydra II then awards the proposed **33 per kill**, its 99 kills generate:

> **3267 Humanity Evil**

Total spending power across Hydra II would therefore be roughly:

> **3872 Humanity Evil**

This is a useful budget target for Command Spell II plus optional side upgrades.

The player should not be able to buy an entire Hydra II economy immediately from the 605 carryover, but that carryover should be enough to feel like useful seed capital.

---

## 7. Recommended Command Spell II Humanity Evil costs

To create actual resource allocation, Command Spell II is better treated as three related branches rather than one mandatory linear purchase chain:

### STRIKE branch

- 3 cuts / click: **297**
- 6 cuts / click: **396**
- 9 cuts / click: **594**

Branch total: **1287**

### NP EFFICIENCY branch

- Efficiency I: **198**
- Efficiency II: **330**
- Efficiency III: **495**

Branch total: **1023**

### TIME branch

- 9 s: **396**
- 27 s: **495**
- 81 s: **693**

Branch total: **1584**

All three branch totals combined:

> **3894 Humanity Evil**

This is intentionally almost equal to the estimated **3872** available by the end of Hydra II for a player who entered with ~605 and earned 33 × 99 during the chapter.

Result:

- a focused player can strongly specialize during Hydra II;
- a completionist can almost finish everything by the generation boundary;
- any optional side spending creates a real tradeoff;
- the final missing amount can naturally spill into early Hydra III rather than requiring artificial grinding.

The exact costs are provisional and should be tuned after Hydra II playtest timing is measured.

---

## 8. Recommended unlock cadence across Hydra II

A possible 9-beat unlock schedule across the 99 Hydra II kills:

> **3 / 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99 kills**

Suggested reveal order:

1. 3-hit
2. Efficiency I
3. 9 s
4. 6-hit
5. Efficiency II
6. 27 s
7. 9-hit
8. Efficiency III
9. 81 s / MAX

Important: availability can be tied to kill milestones while purchases remain player-selected. The next card does not necessarily need the previous card from another branch to be purchased.

Within a branch, however, normal prerequisites still make sense:

> 3-hit → 6-hit → 9-hit  
> Efficiency I → II → III  
> 9 s → 27 s → 81 s

This makes Humanity Evil allocation meaningful instead of reducing the economy to a fixed sequence of mandatory purchases.

---

## 9. Design goals to test

1. Does 64 APS make 66 NP obviously too cheap once Hydra II reaches its cap state?
2. Does the sawtooth requirement curve create a pleasant rhythm of "new power is expensive → I make it efficient"?
3. Do players choose between STRIKE, TIME, and EFFICIENCY, or is one branch obviously dominant?
4. Is 33 Humanity Evil per Hydra II kill enough to make every kill feel economically relevant without trivializing prices?
5. Does carrying ~605 from Hydra I feel like useful seed capital rather than an accidental economy break?
6. Is Command Spell II MAX arriving around the Hydra II → III boundary satisfying, especially if 81 seconds becomes a power fantasy for entering Hydra III?
