# Command Spell II Scaling Rethink — Playtest-Derived Proposal

> Status: **provisional player-facing redesign based on direct play observations**.
>
> This supersedes the earlier assumption that **Command Spell II MAX = 81 seconds**. 81 seconds is now treated as a later progression milestone, not the endpoint of Command Spell II.
>
> This file does not define implementation outside `02_player_facing/`.

## 1. New empirical anchors

Current design should preserve all four observed behaviors:

1. **Base 3-second NP cannot reliably let the player manually kill one full 81-head Hydra II.**
2. **After first acquiring Command Spell II's 3-cut manual multistrike, the player can finish a full Hydra II during NP and may use the remaining window to kill several newly spawned 9-head Hydra II encounters.** This is allowed and desirable.
3. **By around Command Spell II Lv.3, Hydra II can already be pushed through comfortably into Hydra III.** Therefore Command Spell II is not a Hydra-II completion checklist; later levels should naturally spill into Hydra III and beyond.
4. **The old fully-upgraded Command Spell II can refill NP and chain-kill many Hydra III encounters.** This means the old 81-second endpoint is appearing too early / too cheaply relative to its actual throughput. It does not mean 81 seconds itself must be nerfed out of existence.

Important preserved encounter rule:

> Every new Hydra II still begins at **9 heads**.

A strong NP window is allowed to cross encounter boundaries and kill multiple fresh Hydra II in succession.

---

## 2. Stop balancing by seconds alone

The relevant quantity is not only time-stop duration.

For the manual side of Command Spell II, define a player-facing relative capacity index:

> **K = time-stop seconds × manual cuts produced per player click during NP**

This is not a literal DPS formula because actual tapping speed differs by player. It is a **relative throughput index** used to compare upgrade tiers while keeping the same player's tapping ability roughly constant.

### Empirical calibration

Base NP:

> `3 s × 1 cut/click = K3`

Observed result:

> not enough to reliably clear a full 81-head Hydra II.

First Command Spell II purchase:

> `3 s × 3 cuts/click = K9`

Observed result:

> enough to finish a full Hydra II and often kill several fresh 9-head Hydra II afterward.

Therefore the first useful empirical anchor is:

> **K9 ≈ Hydra-II-clear band for a fast manual player.**

The exact number of kills is player-skill-sensitive and does not need to be fixed.

---

## 3. Use Hydra's ×9 scale to place later Command Spell II power

Hydra maximum head scale grows by ×9 per generation:

> Hydra II: 81  
> Hydra III: 729  
> Hydra IV: 6561  
> ...

If K9 is approximately the observed full-Hydra-II manual-NP band, a useful first-order target is:

> **Hydra III mature manual-NP band ≈ K81**

and later:

> **Hydra IV mature manual-NP band ≈ K729**

This does not guarantee one-window kills; it is a scaling benchmark.

### Example milestone combinations

| Relative role | Example NP state | K |
|---|---:|---:|
| Base / insufficient for full Hydra II | 3 s × 1 | 3 |
| First CS II / Hydra-II-clear band | 3 s × 3 | **9** |
| Bridge | 3 s × 6 | 18 |
| Bridge | 9 s × 3 | 27 |
| Hydra-III mature band | 9 s × 9 | **81** |
| Bridge toward next scale | 27 s × 9 | 243 |
| Hydra-IV mature band | 81 s × 9 | **729** |
| Bridge | 243 s × 9 | 2187 |
| Hydra-V mature band | 729 s × 9 | **6561** |

This immediately changes the interpretation of the old duration curve:

> **81 seconds is not Command Spell II MAX.**
>
> At 9 cuts/click, 81 seconds is roughly a **K729** state — a later-generation-scale milestone.

Likewise, 729 seconds can become a still-later milestone if the game continues to larger Hydra generations.

---

## 4. Revised chapter placement

### Hydra II

Expected Command Spell II experience:

- Base `3 s × 1` is deliberately insufficient against a full Hydra II.
- First purchase grants `3 cuts/click` while keeping the 3-second joke intact.
- This first purchase is the important Hydra-II solution and should feel dramatically effective.
- It is allowed to kill the current full Hydra II and then several fresh 9-head Hydra II within the same NP window.
- Around Lv.3, Hydra II may already become easy enough that the player naturally reaches Hydra III.

Therefore:

> **Do not require Command Spell II to be highly leveled or completed before Hydra III.**

### Hydra III

Hydra III begins while Command Spell II is still unfinished.

This is desirable because Hydra III supplies the next reason to keep upgrading:

> a technique that demolished 81-head encounters is no longer proportionate to a 729-head problem.

Command Spell III can enter here as the automation / time-stop bridge, while Command Spell II continues growing in parallel.

### Later generations

Long-duration milestones such as:

> 27 s → 81 s → 243 s → 729 s

should be distributed across later generations rather than compressed into Hydra II / early Hydra III.

---

## 5. Manual multistrike should saturate earlier than time-stop duration

Current preferred manual multistrike identity remains:

> 1 → 3 → 6 → 9 cuts/click during NP only

The important recommendation is:

> **do not keep multiplying manual strike count forever.**

Once 9 cuts/click is reached, later Command Spell II growth should come mainly from:

- longer stopped time;
- NP requirement / efficiency tuning;
- possibly other NP-specific quality-of-life rules;

rather than turning every click into 27 / 81 / 243 invisible cuts.

This keeps Nine Lives tactile and readable.

It also makes long-duration milestones meaningful instead of letting strike count alone solve every future scale.

---

## 6. 81 seconds becomes a milestone, not a cap

Previous assumption:

> Command Spell II MAX = 81-second time stop

is rejected.

New preferred interpretation:

> 3 s = base joke / Hydra-II problem  
> 9 s = early real duration upgrade / Hydra-II-to-III bridge  
> 27 s = Hydra-III bridge  
> **81 s = later major milestone, approximately K729 at 9 cuts/click**  
> 243 s = later bridge  
> 729 s = still-later major milestone

Exact generation placement after Hydra III remains open, but the duration ladder should be allowed to continue.

There may eventually be no useful player-facing reason to call 81 seconds "MAX" at all.

---

## 7. Reinterpret the old MAX observation

Observed old MAX behavior:

> the player can fill NP and chain-kill many Hydra III encounters.

This should not be read as "81 seconds is too weak."

It indicates two separate facts:

1. the old MAX throughput is already far beyond what Hydra III requires;
2. the old economy / unlock placement made this state reachable too early relative to its true scale.

Therefore the redesign should primarily change **where** 81 seconds belongs in progression, not simply increase its immediate power.

A later player reaching an 81-second, 9-cut state and annihilating many Hydra III can be completely acceptable — Hydra III should simply be old content by then.

---

## 8. NP recharge must be tuned separately from window power

A long NP window creates two distinct balance axes:

- **window capacity:** how many heads / encounters can be killed while time is stopped;
- **recharge economy:** how quickly the next NP becomes available.

Do not use a fixed 66-point NP requirement forever once K grows from 9 toward 81 / 729 / beyond.

The old observation that a maxed Command Spell II can refill NP while slaughtering Hydra III shows why the requirement curve still matters.

Preferred direction remains a sawtooth economy:

> stronger NP state → larger NP requirement  
> later efficiency upgrade → requirement becomes meaningfully cheaper again  
> next scale increase → requirement rises again

But exact NP-point values should be tuned only after Command Spell III and Hydra III throughput are placed.

### Important provisional recommendation

NP may continue charging from legitimate cuts during an active NP window, because cross-encounter slaughter is part of the desired power fantasy.

However, a filled gauge should **not automatically imply that an already-active time-stop window can be recursively refreshed forever**. Whether re-release is allowed before the current window ends is a separate player-facing rule that must be explicitly decided before final NP-economy tuning.

The desirable behavior to preserve is:

> one strong window can kill many fresh Hydras.

The potentially dangerous behavior is:

> one strong window refills itself and extends itself without ever allowing normal time to return.

These are not the same thing.

---

## 9. Consequence for Command Spell III

Command Spell III's identity can remain:

> **allow Auto Slash to participate inside NP / stopped time.**

But the earlier `APS × time = 729` symmetry should no longer be treated as the whole Hydra-III balance model.

Why:

- Command Spell II manual capacity now has its own K scaling;
- different players can enter Hydra III with very different partial Command Spell II states;
- Command Spell III adds autonomous throughput on top of that manual capacity;
- 81 seconds and later milestones belong farther out in progression.

The better role split is:

> Command Spell II = manual NP technique keeps scaling across generations  
> Command Spell III = automation can cross into that NP state

Both remain useful without requiring one to be maxed before the other exists.

---

## 10. Current recommended progression shape

### Command Spell II early

Keep the observed first transition intact:

> Base: `3 s × 1`  
> → first purchase: `3 s × 3`

This is high-confidence because it comes directly from play.

### By the end of Hydra II / entry to Hydra III

It is acceptable for a typical player to have only roughly the first few Command Spell II levels.

A useful target is:

> Command Spell II Lv.1–3 is enough to make Hydra II comfortable and reach Hydra III.

Later levels are not "missed Hydra-II upgrades." They are future progression.

### Hydra III and beyond

Continue toward relative capacity bands rather than an early hard MAX:

> K9 → K27 → K81 → K243 → K729 → ...

with 9 cuts/click as a likely manual-strike ceiling and duration carrying more of the later scale.

---

## 11. High-value next tests

1. Preserve Base `3 s × 1`: confirm it still cannot reliably clear a full Hydra II.
2. Preserve first CS II `3 s × 3`: confirm it reliably clears a full Hydra II for a fast player and can chain several fresh Hydra II.
3. Record the exact Command Spell II Lv.3 state that currently reaches Hydra III comfortably; use it as the **Hydra-II exit anchor** rather than trying to force more upgrades before generation transition.
4. Test Hydra III with only that Lv.3 state. Measure whether the 729-head scale creates the intended new pressure before Command Spell III.
5. Only after that, place the K81 milestone and determine whether it belongs in early, middle, or late Hydra III.
6. Treat 81-second time stop as a later milestone and test it against the generation it is actually meant to dominate, rather than against Hydra II.
7. Decide explicitly whether NP can be released again while an NP window is already active; this decision materially changes all high-level recharge tuning.
