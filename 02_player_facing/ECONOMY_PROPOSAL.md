# Hydra Clicker — Economy / Upgrade Curve Proposal

> Status: **provisional player-facing proposal**. This file is intentionally not a core implementation spec.
>
> Scope: Command Spell I pacing, Hydra II resource allocation, NP requirement growth, Command Spell II internal progression, and Humanity Evil acquisition. Values below are design candidates for playtest, not confirmed implementation values.

## 1. Existing economy facts used as baseline

Current known values outside this folder are treated as read-only references:

- Humanity Evil currently awards **11 per true Hydra kill**.
- Hydra I has **99 kills**, so at 11 Humanity Evil per kill it produces **1089 Humanity Evil** total.
- NP currently starts at **66 required points**.
- One accepted head cut currently contributes one NP point.
- Command Spell I currently persists across Hydra generations.
- NP currently pauses Auto Slash during its active 3-second time-stop window; restoring automation inside NP is reserved for a later Command Spell III concept.

The implemented Command Spell I curve currently uses 1 / 2 / 4 / 8 / 16 / 32 / 64 APS. The player-facing proposal below intentionally replaces that *design target* with a powers-of-three ladder while leaving implementation changes outside the scope of this file.

---

## 2. Critical pacing correction from Hydra I experience

The earlier proposal that treated **9 APS as the practical Hydra I endpoint** is rejected.

Reason:

- 1 APS and 3 APS are too weak to sustain an exciting early automation ramp if their next upgrades are expensive;
- around the Hydra I middle / later curve, 9 APS can become stuck against regeneration;
- manual tapping does not sufficiently rescue that state once regeneration has accelerated;
- the player can then fall into an undesirable loop of waiting for Auto Slash to slowly generate 66 NP, releasing a 3-second Noble Phantasm, and repeating;
- because Auto Slash is intentionally paused during NP until a later Command Spell III concept, the solution cannot be "let automation finish the NP burst".

Therefore Command Spell I must accelerate much faster **inside Hydra I itself**.

The important distinction is:

> 27 APS does not need to completely overpower late Hydra I regeneration by itself.
>
> It only needs to make the recharge / recovery cycle fast enough that late Hydra I remains active instead of becoming a waiting game.

At an idealized 27 accepted cuts per second, 66 NP corresponds to roughly 2.4 seconds of charge rather than roughly 7.3 seconds at 9 APS. Actual combat timing will differ because accepted cuts and regeneration interact, but this illustrates the intended scale shift.

Late Hydra I may therefore legitimately become:

> 27 APS begins to struggle  
> → NP refills quickly  
> → player manually uses the 3-second NP window to finish the Hydra  
> → repeat without long passive waiting

This keeps NP relevant without making the player stare at 9 APS slowly charging the gauge.

---

## 3. Command Spell I — revised generation placement

### Recommended long-term ladder

> **1 → 3 → 9 → 27 → 81 → 243 → 729 → ... APS**

### Revised chapter placement

| Generation | APS levels primarily belonging to that generation | Intended role |
|---|---|---|
| Hydra I | **1 → 3 → 9 → 27** | rapid automation onboarding; 27 becomes the late-Hydra-I working baseline |
| Hydra II | **81 → 243** | major Humanity Evil allocation choices against Command Spell II |
| Hydra III | **729** | next full order-of-magnitude automation jump |

This is intentionally *not* a rule that each Hydra generation must end at the same power-of-nine APS as its head cap.

The more important pacing law is:

> **each generation should receive enough automation growth to avoid passive waiting before the next generation begins.**

The 1 / 3 / 9 / 27 / 81 / 243 / 729 pattern keeps the mathematical identity while allowing pacing to take priority over perfect symmetry.

---

## 4. Hydra I — recommended fast early Humanity Evil curve

Current Humanity Evil income remains the baseline:

> **11 Humanity Evil per true Hydra I kill**

The first Command Spell should still appear when the player first reaches **99 Humanity Evil**, matching the established first purchase moment.

### Candidate costs

| APS after purchase | Candidate cost | Approx. natural purchase point if bought immediately |
|---:|---:|---:|
| 1 APS | **99** | Hydra I kill 9 |
| 3 APS | **33** | Hydra I kill 12 |
| 9 APS | **66** | Hydra I kill 18 |
| 27 APS | **99** | Hydra I kill 27 |

This creates a deliberately front-loaded power curve.

If the player buys each level as soon as it becomes affordable and spends no Humanity Evil elsewhere:

```text
kill 9
→ 99 Humanity Evil
→ buy 1 APS for 99
→ balance 0

kills 10–12
→ +33
→ buy 3 APS
→ balance 0

kills 13–18
→ +66
→ buy 9 APS
→ balance 0

kills 19–27
→ +99
→ buy 27 APS
→ balance 0
```

The gaps themselves grow 3 → 6 → 9 kills while the APS triples each time.

### Why the early prices are intentionally cheap

The early Command Spell I upgrades are not meant to create Hydra I resource-management pressure.

Their job is to establish the automation fantasy quickly enough that:

- the first purchase feels exciting rather than merely symbolic;
- the player repeatedly sees the Command Spell slot light up again soon after buying it;
- 1 and 3 APS do not become long dead zones;
- 9 APS is a short-lived intermediate step rather than the place where the player gets stuck;
- 27 APS arrives before the steep Hydra I regeneration tail turns the chapter into NP waiting.

Hydra II, not Hydra I, is where serious Humanity Evil allocation should begin.

### Hydra I carryover

Total candidate Command Spell I spending through 27 APS:

> 99 + 33 + 66 + 99 = **297 Humanity Evil**

Hydra I total production:

> 99 × 11 = **1089 Humanity Evil**

Expected carryover if the player buys the full Hydra I Command Spell I line:

> **1089 − 297 = 792 Humanity Evil**

This large carryover is intentional seed capital for Hydra II.

---

## 5. Hydra II — 81 / 243 APS as real allocation decisions

Hydra II is where Command Spell I should stop being almost automatically affordable.

Recommended Humanity Evil generation law remains:

> Hydra II true kill = **33 Humanity Evil**

A player entering Hydra II after buying 27 APS is therefore expected to carry about:

> **792 Humanity Evil**

### Candidate Hydra II Command Spell I costs

| APS after purchase | Candidate cost | Intended timing for a player who spends only on Command Spell I |
|---:|---:|---|
| 81 APS | **1782** | around Hydra II kill 30 |
| 243 APS | **2178** | around Hydra II kill 96 |

The timing works cleanly:

```text
Hydra II entry balance ≈ 792

30 kills × 33 = 990
792 + 990 = 1782
→ buy 81 APS
→ balance ≈ 0

66 more kills × 33 = 2178
→ around Hydra II kill 96
→ buy 243 APS
```

Thus an extreme automation-focused player can nearly complete the Hydra II Command Spell I line by the end of Hydra II.

But any meaningful spending on Command Spell II pushes 243 APS later, often into Hydra III.

This is desirable.

### Elegant budget consequence

Hydra II total income:

> 99 × 33 = **3267**

Carryover + Hydra II income:

> 792 + 3267 = **4059 Humanity Evil**

Candidate cost of both Hydra II Command Spell I upgrades:

> 1782 + 2178 = **3960 Humanity Evil**

Therefore a player who commits almost the entire generation to automation can buy both 81 and 243 APS and finish with only about:

> **99 Humanity Evil remaining**

This produces an extremely clear build choice:

> **rush Command Spell I → reach 243 APS near the end of Hydra II**
>
> versus
>
> **spend on Command Spell II → stronger Noble Phantasm, but delay 243 APS into Hydra III**

No artificial branch lock is required; the shared Humanity Evil pool creates the tradeoff.

---

## 6. Command Spell III interaction boundary

Command Spell I automation and Command Spell II Noble Phantasm power should remain distinct from the later Command Spell III concept.

Current intended boundary:

- outside NP: Command Spell I APS operates normally;
- during early / mid NP: Auto Slash pauses;
- player uses manual input, enhanced by Command Spell II multistrike;
- a later Command Spell III capability may allow automation to participate during NP.

This boundary is important when balancing 27 / 81 / 243 APS.

Increasing APS must not be balanced as though those automatic attacks are also dealing damage during the current NP time-stop state.

---

## 7. Recommended relationship between Command Spell I and II

Hydra II should be the first chapter where Humanity Evil produces a real choice between the two owned Command Spell slots.

### Command Spell I

> **How much cutting happens in ordinary time?**

- persistent APS;
- generates rapid cut pressure;
- in Hydra II this also accelerates Hydra growth outside NP;
- helps reach NP-ready states faster;
- 81 / 243 APS are expensive long-term targets.

### Command Spell II

> **How powerful is the Noble Phantasm state?**

- NP-only multistrike;
- NP requirement / efficiency changes;
- longer time stop;
- later Noble Phantasm-specific capabilities.

The main allocation question should be legible from the simple three-slot Command Spell UI:

> **Do I feed Command Spell I, or Command Spell II next?**

The UI should not expose a conventional multi-branch skill tree.

---

## 8. Recommended shape: sawtooth NP economy

Do **not** increase NP requirement after every upgrade.

Instead use an alternating pressure / relief structure:

> power upgrade → NP requirement rises  
> efficiency upgrade → NP requirement falls  
> next power upgrade → requirement rises again

This avoids making every upgrade feel like a tax while preventing long / multistrike Noble Phantasms from becoming free as APS rises.

Recommended principle:

- multistrike or longer time stop increases NP requirement;
- NP-efficiency levels periodically reduce the current requirement;
- the player should repeatedly experience "new power is expensive → now I made it practical again."

---

## 9. Command Spell II — single-slot internal ladder

Command Spell II should remain **one visible Command Spell slot**.

Its internal progression may interleave three kinds of reward without visually splitting into branches:

1. **STRIKE** — more manual cuts per click during NP only;
2. **EFFICIENCY** — reduce NP required for release;
3. **TIME** — extend the time-stop window.

Candidate sequence:

| CS II level beat | Reward | Candidate NP requirement after reward |
|---|---:|---:|
| Base | 1 cut / click · 3 s | 66 |
| 1 | **3 cuts / click** | 132 |
| 2 | NP requirement ÷2 | 66 |
| 3 | **9 s** time stop | 198 |
| 4 | **6 cuts / click** | 396 |
| 5 | NP requirement ÷2 | 198 |
| 6 | **27 s** time stop | 594 |
| 7 | **9 cuts / click** | 792 |
| 8 | NP requirement ÷2 | 396 |
| MAX | **81 s** time stop | 1188 |

The exact NP values remain provisional, but the sawtooth shape remains recommended.

### Important rule: multistrike is NP-only

Normal state:

> 1 player click = 1 cut

NP state after Command Spell II upgrades:

> 1 player click = 3 / 6 / 9 rapid visible cuts

The multiple cuts should be visibly sequential, not an invisible instant subtraction.

This preserves the identity of **Nine Lives / 射殺す百頭**.

---

## 10. Humanity Evil — recommended acquisition law

### Award only on true Hydra kill

Do not award Humanity Evil per head, cut, spawned head, or time spent at cap.

Hydra II's 81-head stalemate would otherwise become an infinite farm.

Recommended identity:

> **NP = within-combat / head-cut cycle resource**  
> **Humanity Evil = true-kill / long-term progression resource**

### Recommended generation scaling

> **Humanity Evil per true kill = 11 × 3^(generation - 1)**

| Generation | Humanity Evil / kill | 99-kill generation total |
|---|---:|---:|
| Hydra I | 11 | 1089 |
| Hydra II | 33 | 3267 |
| Hydra III | 99 | 9801 |
| Hydra IV | 297 | 29403 |

Why ×3 rather than ×9:

- Hydra head capacity already grows by powers of nine;
- Command Spell I APS also grows rapidly;
- currency growing ×9 per generation would trivialize earlier prices too quickly;
- ×3 makes later generations richer while preserving scarcity.

This remains a recommendation, not a confirmed implementation rule.

---

## 11. Command Spell II Humanity Evil costs — still provisional

Earlier candidate total for the full Command Spell II internal ladder was approximately **3894 Humanity Evil**.

That figure should now be re-evaluated against the revised Command Spell I economy, because Hydra II now contains two expensive Command Spell I purchases:

- 81 APS: 1782 candidate
- 243 APS: 2178 candidate

The important design target is not that the player can complete both systems in Hydra II.

Instead:

- an automation-focused player can nearly complete Command Spell I through 243 APS during Hydra II;
- a Noble-Phantasm-focused player can spend heavily on Command Spell II and postpone 243 APS;
- a balanced player should make several meaningful purchases in both slots but finish neither trivially;
- Command Spell II MAX = 81-second time stop may naturally spill into Hydra III depending on spending.

Exact Command Spell II Humanity Evil prices should be tuned after the 81 / 243 APS timing is playtested.

---

## 12. Command Spell I reveal / affordability behavior

The fixed three-slot Command Spell UI remains the presentation contract.

For Command Spell I:

- the slot begins empty;
- when Humanity Evil first reaches 99, the purchase sigil / button appears clearly and brightly;
- after purchase, the slot remains permanently occupied;
- when the next level is unaffordable, the owned sigil remains visible but dims toward the empty-slot value;
- when enough Humanity Evil is accumulated, it brightens again and `LV UP` becomes clearly actionable;
- the player does not need a separate card for every APS level.

The same single-slot logic applies to Command Spell II and III.

---

## 13. Hydra III Command Spell I target

Current placement target:

> **729 APS belongs to Hydra III.**

Its Humanity Evil cost is intentionally left open until Hydra III's real combat / NP / Tree-view economy is designed.

Do not derive the 729 price mechanically from the Hydra II prices before Hydra III pacing exists.

---

## 14. Next playtest questions

1. Does 1 → 3 → 9 → 27 APS arriving roughly by Hydra I kills 9 / 12 / 18 / 27 remove the early waiting / dead-zone feeling?
2. Is 27 APS early enough that the Hydra I ~50-kill wall no longer traps the player at 9 APS?
3. Around Hydra I 80–99, does 27 APS create a tolerable "fast NP recharge → manual 3-second finish" rhythm, or is an additional Hydra I-side adjustment still required?
4. Does Hydra II 81 APS around kill ~30 feel like a compelling expensive target rather than an automatic purchase?
5. Can an automation-only player reaching 243 APS around Hydra II ~96 feel meaningfully different from a Command Spell II-focused player who delays it?
6. Does the proposed 11 → 33 → 99 Humanity Evil acquisition law preserve scarcity once the cheaper Hydra I upgrades are adopted?
7. Does the simple one-slot-per-Command-Spell UI remain legible when Command Spell I and II are both asking for large Humanity Evil investments at the same time?
