# Hydra II Economy v0.1 — Player-Facing Simulation

> Status: **provisional player-facing balance proposal**.
>
> Purpose: test whether Hydra II has a readable resource-allocation game between Command Spell I and Command Spell II without softlocks, dead zones, or one obviously mandatory purchase path.
>
> This file does not define implementation. It records a candidate balance shape for playtest.

## 1. Starting assumptions

Use the currently discussed player-facing baseline:

- Hydra I ends with Command Spell I at approximately **27 APS**.
- Hydra I Humanity Evil income remains **11 per true Hydra kill**.
- Candidate Hydra I Command Spell I costs are **99 / 33 / 66 / 99**, for 1 / 3 / 9 / 27 APS.
- Hydra I therefore produces 1089 Humanity Evil and spends 297 if the full intended Hydra I Command Spell I line is purchased.
- Expected Hydra II entry reserve is therefore approximately **792 Humanity Evil**.
- Hydra II awards a candidate **33 Humanity Evil per true Hydra kill**.
- Humanity Evil is not awarded for individual heads, cuts, spawned heads, or cap-stalemate farming.
- Base NP remains **66 points / 3 seconds** before Command Spell II modifies it.
- Auto Slash remains paused during NP until the later Command Spell III concept.

Hydra II entry should therefore feel economically different from Hydra I:

> the player enters with meaningful seed capital, immediately discovers a second Command Spell, and must decide which of two persistent systems to feed.

---

## 2. Hard safety invariant for Command Spell II

Command Spell II must be purchasable **before the first Hydra II is killed**.

Preferred sequence:

> Hydra II encounter 1 starts at 9 heads  
> → first manual cut reveals `9 → 10` / `CUT 1 → GROW +2`  
> → Command Spell II becomes eligible while that same Hydra is still alive  
> → if Humanity Evil is sufficient, slot II lights immediately

Candidate first purchase cost:

> **297 Humanity Evil**

With an expected entry reserve around 792, the player can safely buy it immediately after the first-cut reveal.

This first purchase gives:

> **during NP only: 1 manual click → 3 rapid visible cuts**

and must never require `Hydra II kills >= 1`.

---

## 3. Command Spell I Hydra II targets

Keep the current candidate major purchases:

| Upgrade | Candidate cost | Hydra-II-kill-equivalent at 33 / kill |
|---|---:|---:|
| 27 → **81 APS** | **1782** | 54 kills of fresh income |
| 81 → **243 APS** | **2178** | 66 kills of fresh income |

Because the player enters with 792 seed capital, a player who spends nothing on Command Spell II can reach:

> approximately Hydra II kill **30** → 81 APS  
> approximately Hydra II kill **96** → 243 APS

This is the extreme automation route.

---

## 4. Command Spell II candidate internal sequence

Command Spell II remains **one visible slot**. The player does not see three branches on the main UI.

Candidate internal reward order:

1. **3 cuts / click during NP**
2. **NP requirement efficiency I**
3. **9-second time stop**
4. **6 cuts / click during NP**
5. **NP requirement efficiency II**
6. **27-second time stop**
7. **9 cuts / click during NP**
8. **NP requirement efficiency III**
9. **81-second time stop / MAX**

Candidate Humanity Evil prices for first balance pass:

| CS II level | Reward | Candidate HE cost | Hydra-II-kill-equivalent |
|---:|---|---:|---:|
| 1 | 3 cuts / click | **297** | 9 kills |
| 2 | Efficiency I | **594** | 18 kills |
| 3 | 9 s | **594** | 18 kills |
| 4 | 6 cuts / click | **693** | 21 kills |
| 5 | Efficiency II | **693** | 21 kills |
| 6 | 27 s | **792** | 24 kills |
| 7 | 9 cuts / click | **891** | 27 kills |
| 8 | Efficiency III | **990** | 30 kills |
| MAX | 81 s | **1188** | 36 kills |

These prices are intentionally simple multiples of the 33-per-kill Hydra II income.

The exact values are not yet confirmed. The useful structure is:

- level 1 is guaranteed purchasable on the first living Hydra II;
- level 2 arrives very soon for a player who commits to Noble Phantasm development;
- later levels each represent a noticeable but readable chunk of Hydra II progress;
- the full Command Spell II ladder is not expected to finish inside Hydra II.

---

## 5. Pure Noble-Phantasm route simulation

Assume the player spends on Command Spell II as soon as possible and ignores 81 / 243 APS.

Starting balance:

> **792 HE**

Approximate purchase timing:

| Point in Hydra II | Purchase |
|---:|---|
| first Hydra still alive | CS II Lv.1 — 3-hit |
| kill ~3 | Lv.2 — Efficiency I |
| kill ~21 | Lv.3 — 9 s |
| kill ~42 | Lv.4 — 6-hit |
| kill ~63 | Lv.5 — Efficiency II |
| kill ~87 | Lv.6 — 27 s |

By Hydra II kill 99, this route has approximately:

> **27 APS**  
> **6-hit NP**  
> **second NP-efficiency node**  
> **27-second time stop**

with roughly **396 HE** available afterward if no other spending occurs.

The 9-hit / third-efficiency / 81-second tail naturally spills into Hydra III.

This is desirable: Command Spell II MAX should feel like a long-term transformation, not a chapter checkbox.

---

## 6. Pure automation route simulation

If the player ignores Command Spell II after it becomes available and saves everything for Command Spell I:

> Hydra II kill ~30 → **81 APS**  
> Hydra II kill ~96 → **243 APS**

The player reaches the end of Hydra II with almost no spare Humanity Evil.

Player-facing identity:

> ordinary time becomes violently fast; Hydra proliferation and NP charging both accelerate, but the actual Noble Phantasm remains primitive and manual.

This route should be powerful but intentionally awkward.

---

## 7. Balanced route simulation

One candidate balanced path:

> first-cut reveal → buy CS II Lv.1  
> kill ~3 → buy Efficiency I  
> kill ~21 → buy 9-second NP  
> then save for 81 APS  
> around kill ~75 → buy **81 APS**  
> around kill ~96 → buy CS II Lv.4 / **6-hit**

Approximate Hydra II end state:

> **81 APS**  
> **6-hit NP**  
> **Efficiency I**  
> **9-second time stop**

This is a useful center-of-gravity target because it demonstrates both Command Spell identities without finishing either system.

A second balanced style can instead rush 81 APS earlier, then return to Command Spell II. The shared resource pool should allow both stories.

---

## 8. Why this economy shape is useful

Hydra I intentionally gives cheap frequent upgrades.

Hydra II intentionally changes the question from:

> "When does my next upgrade light up?"

into:

> **"Which of the two lit / dim Command Spell slots do I want to feed next?"**

The economy is doing narrative work:

- Command Spell I = more cutting in ordinary time;
- Command Spell II = more power inside stopped time;
- neither is meant to be completed automatically;
- buying one materially delays the other;
- Command Spell III remains absent, preserving the conspicuous fact that Auto Slash still stops during NP.

---

## 9. NP requirement curve still needs one dedicated pass

The earlier sawtooth idea remains promising:

> power upgrade → NP requirement rises  
> efficiency upgrade → NP requirement falls  
> next power upgrade → rises again

But exact NP requirements should be tuned **after** the Humanity Evil purchase cadence above is accepted.

Reason:

The same NP requirement feels radically different at:

> 27 APS  
> 81 APS  
> 243 APS

Therefore NP cost cannot be balanced independently from the Command Spell I route.

The next numerical pass should explicitly calculate recharge feel for at least:

- 27 APS + base / early CS II;
- 81 APS + mid CS II;
- 243 APS + late CS II;
- mixed manual tapping on top of those states.

---

## 10. Playtest / falsification questions

1. Is the **297 HE** first Command Spell II purchase comfortably guaranteed at Hydra II entry under all intended Hydra I spending paths?
2. Does buying 3-hit on the first living Hydra II actually remove softlock risk in practice?
3. Is the immediate post-purchase NP requirement increase, if retained, too punishing before Efficiency I arrives around Hydra II kill ~3?
4. Does 27 APS + 3-hit make the first Hydra II kill possible without excessive waiting?
5. Does the pure automation route feel intentionally dangerous / funny rather than simply stronger than every other route?
6. Does the pure NP route feel active enough while staying at 27 APS until Hydra III?
7. Does the balanced route reaching roughly 81 APS + 9 s + 6-hit near the end of Hydra II feel like meaningful progress rather than underpowered compromise?
8. Are any Command Spell II levels obvious mandatory purchases that destroy the resource-allocation choice?
9. Is 33 Humanity Evil per Hydra II kill still the right income scale once actual encounter duration is measured?
