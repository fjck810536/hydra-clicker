# Hydra Clicker — Economy / Upgrade Curve Proposal

> Status: **provisional player-facing proposal**. This file is intentionally not a core implementation spec.
>
> Scope: cross-generation Command Spell I growth, Hydra II resource allocation, NP requirement growth, Command Spell II upgrade structure, and Humanity Evil acquisition. Values below are design candidates for playtest, not confirmed implementation values.

## 1. Existing economy facts used as baseline

Current known values outside this folder are treated as read-only references:

- Humanity Evil currently awards **11 per true Hydra kill**.
- The currently implemented Command Spell I curve reaches **64 APS** and costs **484 Humanity Evil** in total.
- Hydra I has **99 kills** in the generation, so at 11 Humanity Evil per kill it produces **1089 Humanity Evil** total.
- NP currently starts at **66 required points**, with one accepted head cut contributing one NP point.
- Command Spell I currently persists across Hydra generations.

The player-facing proposal below intentionally does **not** assume Command Spell I should be completed during Hydra I. Instead, Command Spell I becomes a long-running cross-generation progression line that competes with later Noble Phantasm upgrades for Humanity Evil.

---

## 2. Command Spell I — recommended cross-generation 9-scale

### Core idea

Command Spell I should not feel like a disposable Hydra I tutorial tree that is fully solved before Hydra II begins.

Recommended macro law:

> **Each Hydra generation has a natural APS landmark at the same power-of-nine scale as that Hydra generation.**

Use ×3 bridge steps between the powers of nine:

> 1 → 3 → **9** → 27 → **81** → 243 → **729** → ...

Suggested interpretation:

| Era | Command Spell I APS | Player-facing role |
|---|---:|---|
| Hydra I early | 1 APS | automation appears |
| Hydra I mid | 3 APS | extra hand becomes noticeable |
| Hydra I late | **9 APS** | practical Hydra I landmark |
| Hydra II early/mid | 27 APS | automation becomes dangerous / productive |
| Hydra II mid/late | **81 APS** | Hydra II landmark |
| Hydra III | 243 APS | first post-99-visible abstraction-scale automation |
| Hydra III late | **729 APS** | Hydra III landmark |

This gives Command Spell I a macro progression parallel to Hydra scale:

> Hydra max heads: 9 → 81 → 729  
> Command Spell I landmark APS: 9 → 81 → 729

The player does not need to reach each APS landmark before leaving the matching generation. These are **natural scale landmarks, not mandatory chapter completion requirements**.

### Important pacing rule: visible but unaffordable is allowed

The next Command Spell I upgrade may be revealed before the player can realistically afford it.

This is desirable when intentional:

> player sees 27 APS during late Hydra I  
> → realizes there is another scale of automation  
> → cannot yet pay for it  
> → enters Hydra II with an explicit long-term target

Do not hard-lock every upgrade behind generation transitions if price pressure alone can create the desired anticipation.

---

## 3. Candidate Humanity Evil costs for Command Spell I

A first playtest-oriented candidate curve:

| APS after purchase | Candidate cost | Intended affordability |
|---:|---:|---|
| 1 | 99 | Hydra I early |
| 3 | 198 | Hydra I early/mid |
| 9 | 396 | Hydra I mid/late |
| 27 | 891 | intentionally impractical to finish inside Hydra I after normal prior spending; Hydra II target |
| 81 | 2673 | Hydra II major investment; late Hydra II or later if the player also invests in Command Spell II |
| 243 | 8019 | Hydra III candidate |
| 729 | 24057 | Hydra III / later long-term candidate |

The exact prices are provisional. The important shape is:

1. Hydra I can reasonably establish automation and reach roughly **9 APS**.
2. **27 APS is visible before it is comfortably affordable**, creating a carry-over goal.
3. **81 APS should compete directly with Command Spell II spending** rather than being an automatic Hydra II purchase.
4. A player who prioritizes automation above everything else may reach 81 APS during Hydra II; a player investing heavily in Noble Phantasm power may not reach it until Hydra III.
5. Later APS landmarks continue the same 9-scale rather than introducing a new arbitrary doubling ladder.

### Hydra I budget check

At the proposed 1 / 3 / 9 prices:

> 99 + 198 + 396 = **693 Humanity Evil**

Hydra I total production at the current 11-per-kill rate is:

> 99 × 11 = **1089 Humanity Evil**

So a player who buys through 9 APS enters Hydra II with approximately:

> **396 Humanity Evil**

The visible 27 APS upgrade costs 891, so even a player who reaches the end of Hydra I cannot buy it after following the normal earlier progression. This is intentional.

### Hydra II timing if the player tunnels into APS

If Hydra II follows the proposed 33 Humanity Evil per true kill:

- enter with ~396;
- 27 APS costs 891;
- the missing 495 requires about 15 Hydra II kills at 33 each;
- after buying 27 APS, 81 APS costs 2673;
- funding 2673 from Hydra II kill income alone corresponds to 81 Hydra II kills.

Therefore a player who almost completely ignores Command Spell II could approximately experience:

> Hydra II ~15 kills → 27 APS  
> Hydra II ~96 kills cumulative economy pressure → 81 APS around the end of the generation

Any meaningful spending on Command Spell II delays 81 APS naturally into Hydra III.

This is desirable because **resource allocation, not a hard content lock, determines which power fantasy arrives first**.

---

## 4. Recommended economy relationship between Command Spell I and II

Hydra II should be the first chapter where Humanity Evil produces a real choice.

The two main upgrade families answer different questions:

### Command Spell I

> **How much cutting happens in ordinary time?**

- persistent APS;
- always active outside time stop unless another rule pauses it;
- in Hydra II, initially accelerates both NP generation and Hydra growth pressure;
- becomes increasingly valuable once the player understands when to exploit NP.

### Command Spell II

> **How powerful is the Noble Phantasm state?**

- NP-only multistrike;
- NP efficiency;
- longer time stop;
- later Noble Phantasm-specific capabilities.

The player should not be able to buy both trees to completion during Hydra II without significant opportunity cost.

Desired player stories include:

> "I rushed 81 APS and now ordinary time is insane, but my Noble Phantasm is still primitive."

or

> "I stayed at 27 APS but built a much stronger Nine Lives window."

or

> "I bought efficiency first, so I can use a weaker Noble Phantasm much more often."

This creates actual build identity inside a clicker without requiring conventional class selection.

---

## 5. Recommended shape: sawtooth NP economy

Do **not** increase NP requirement after every upgrade.

Instead use an alternating pressure / relief structure:

> power upgrade → NP requirement rises  
> efficiency upgrade → NP requirement is reduced  
> next power upgrade → requirement rises again

This avoids making every upgrade feel like a tax while still preventing long / multistrike Noble Phantasms from becoming nearly permanent as APS rises toward 27 / 81 and beyond.

Recommended principle:

- **Multistrike or longer time stop** increases the NP requirement.
- **NP efficiency** nodes reduce the current requirement, preferably by about half.
- The player should periodically feel that they have made the new stronger Noble Phantasm practical again.

---

## 6. Command Spell II — proposed 3 × 3 structure

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

Note: recharge time depends strongly on which Command Spell I path the player has purchased. The same NP requirement feels very different at 9, 27, 81, or later APS. That dependency is intentional and is one reason the two trees create meaningful allocation decisions.

---

## 7. Important rule: multistrike is NP-only

Command Spell II multistrike should **not** apply during ordinary time.

Normal state:

> 1 player click = 1 cut

NP / Noble Phantasm state:

> 1 player click = 3 / 6 / 9 rapid visible cuts

This protects the identity of **Nine Lives / 射殺す百頭**. The multistrike is part of the Noble Phantasm fantasy, not a permanent click multiplier.

The 3 / 6 / 9 cuts should be presented as rapid successive swings rather than an invisible instant subtraction.

---

## 8. Humanity Evil — recommended acquisition law

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
- Command Spell I now also has major APS landmarks on powers of nine.
- Currency growing by ×9 as well would make old costs disappear too quickly.
- ×3 gives each generation visibly richer rewards while preserving room for old and current upgrades to remain meaningful.

This is a recommendation, not yet a confirmed rule.

### Important economy identity

Keep the currencies conceptually separate:

> **NP = within-combat / head-cut cycle resource**  
> **Humanity Evil = true-kill / long-term progression resource**

This prevents the 81-head stalemate from becoming an infinite Humanity Evil farm while allowing it to remain an NP charging state.

---

## 9. Hydra II purchasing power — revised with unfinished Command Spell I

If the player follows the proposed Command Spell I path through 9 APS during Hydra I:

> Hydra I income 1089  
> − CS I through 9 APS 693  
> = **396 Humanity Evil carried into Hydra II**

If Hydra II then awards the proposed 33 per kill, its 99 kills generate:

> **3267 Humanity Evil**

Total new + carried purchasing power across Hydra II is therefore roughly:

> **3663 Humanity Evil**

But unlike the earlier model, this is **not all available for Command Spell II**, because Command Spell I remains unfinished:

- 27 APS candidate cost: 891
- 81 APS candidate cost: 2673
- Command Spell II also competes for the same Humanity Evil pool

This is the intended resource-allocation tension.

A completionist should not expect both Command Spell I = 81 APS and Command Spell II = MAX by the Hydra II → III boundary.

---

## 10. Recommended Command Spell II Humanity Evil costs

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

Since Hydra II provides only about 3663 total purchasing power under the revised 9-APS Hydra I path — before paying for 27 / 81 APS — Command Spell II MAX is now naturally pushed later unless the player heavily deprioritizes Command Spell I.

This is intentional. Hydra II becomes the first generation where "what did you buy?" materially changes the feel of play.

---

## 11. Recommended unlock cadence across Hydra II

A possible 9-beat Command Spell II reveal schedule across the 99 Hydra II kills:

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

Within a branch, normal prerequisites still make sense:

> 3-hit → 6-hit → 9-hit  
> Efficiency I → II → III  
> 9 s → 27 s → 81 s

Command Spell I should have its own reveal cadence and should not be forced into the same nine milestones.

Candidate cross-generation reveal idea:

- 1 APS: Hydra I early
- 3 APS: Hydra I early
- 9 APS: Hydra I mid
- 27 APS: reveal during Hydra I late, but price-gated into Hydra II
- 81 APS: reveal once 27 APS is acquired or around Hydra II midgame
- 243 / 729 APS: remain later-generation aspirations

---

## 12. Design goals to test

1. Does Hydra I feel better when Command Spell I has a practical 9 APS landmark instead of racing to a completed 64 APS tree?
2. Does seeing an unaffordable 27 APS upgrade before Hydra II create anticipation rather than frustration?
3. In Hydra II, do players genuinely choose between **27/81 APS** and **Command Spell II Noble Phantasm upgrades**?
4. Does higher APS initially make Hydra II feel more dangerous before the player learns to exploit the NP rhythm?
5. Does the sawtooth NP requirement curve create a pleasant rhythm of "new power is expensive → I make it efficient"?
6. Do players choose between STRIKE, TIME, and EFFICIENCY, or is one branch obviously dominant?
7. Is 33 Humanity Evil per Hydra II kill enough to make every true kill economically relevant while supporting both unfinished Command Spell I and Command Spell II?
8. Does Command Spell I = 81 APS naturally arrive in late Hydra II for automation-focused players and Hydra III for Noble-Phantasm-focused players?
9. Do the 9 / 81 / 729 APS landmarks make the automation system feel like part of the same mathematical world as Hydra scale rather than a separate arbitrary idle-game stat?
