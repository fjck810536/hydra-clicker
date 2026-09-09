# Indie Incremental Economy Healthcheck — Command Spells I / II / III

> Status: provisional player-facing economy framework.
>
> Scope: healthcheck of learning cadence, upgrade cost bands, and the long-form relationship between the three Command Spells. This is not a monetization model and not an implementation spec.

## 1. Consultant lens

This review uses an **independent incremental / idle game** design lens rather than a live-service or monetization lens.

Useful external principles:

- avoid perfectly smooth curves; meaningful bumps / multipliers create surprise and delight;
- let different upgrade families become important at different times rather than letting one generator dominate forever;
- phase changes should reframe the meaning of existing systems instead of simply stacking more numbers;
- old content becoming dramatically overkillable is a feature, not automatically a balance failure.

The Hydra project already has a strong world-scale law:

> Hydra generation `n` has a logical cap around `9^n`.

The economy should support that scale without requiring every Command Spell to grow identically every generation.

---

## 2. Main diagnosis

### Healthy foundations

1. **World scale is clear:** every Hydra generation is approximately ×9.
2. **The three Command Spells have distinct identities:**
   - I = ordinary-time automation / APS;
   - II = Noble Phantasm manual technique / time / efficiency;
   - III = automation crossing into stopped time.
3. **The game already has strong experiential phase changes:**
   - Hydra I teaches throughput vs regeneration;
   - Hydra II teaches that cutting can worsen the problem;
   - Hydra III teaches that the number exceeds literal visualization.
4. **Old-Hydra multi-kill during a strong NP is desirable.** It communicates mastery and scale growth.

### Current risks

1. **If all three Command Spells scale smoothly together, their effects multiply into runaway power too early.**
2. **If every level is priced by one exponential formula, upgrades become predictable and emotionally flat.**
3. **If a new system's first useful level is expensive, the game can trap the player before they have learned why the system exists.**
4. **If one upgrade family is always the best ROI, the three-slot resource choice becomes fake.**
5. **If every Command Spell must remain infinitely relevant, the design becomes cluttered. It is acceptable for a spell to reach a meaningful MAX and let later structural systems take over.**

---

## 3. Recommended global pacing law

Hydra scale advances by:

> **one generation = ×9 world scale**

Use a smaller player-power unit:

> **one major power beat ≈ ×3**

Therefore, after the onboarding period, a good default target is:

> **about two major ×3-equivalent power beats per Hydra generation across the whole build, not two per Command Spell.**

This is the core anti-runaway rule.

A player may spend both beats on one Command Spell and become highly specialized, or spread them between systems.

Do not guarantee that every player gets every major upgrade in the generation where it first appears.

---

## 4. Price upgrades in "kills worth", not only raw Humanity Evil

Define the generation currency unit:

> `U_n = Humanity Evil earned from one true Hydra kill in generation n`

Current provisional law:

> `U_n = 11 × 3^(n-1)`

Since each generation currently contains about 99 true kills, one generation provides approximately:

> **99 U_n**

Balance upgrade prices first in `U_n` units, then convert to raw Humanity Evil.

Recommended price bands:

| Upgrade role | Cost band | Player meaning |
|---|---:|---|
| Teaching unlock | **1–9 U** | learn the new verb immediately |
| Utility / efficiency | **6–12 U** | make an existing tool less awkward |
| Major scale step | **27–36 U** | clear ×3-ish jump in capability |
| Build-defining purchase | **45–54 U** | forces a real choice against another spell |
| Generation-spanning aspiration | **66–81 U** | visible long-term target; often spills forward |

The exact numbers should be bumpy, not mechanically regular.

---

## 5. Recommended learning → mastery rhythm inside a generation

A useful default chapter rhythm is:

### Beat A — Problem appears

The Hydra demonstrates a new failure mode before the game explains it.

### Beat B — Cheap teaching unlock

The first relevant Command Spell level is deliberately underpriced.

Its purpose is not resource tension; its purpose is to let the player try the new verb.

### Beat C — First satisfying jump

Within roughly another 6–18 kills, the player can buy a level that makes the new system feel genuinely strong.

### Beat D — Build choice

The next large upgrade costs around 27–54 kills worth of income and competes with another Command Spell.

### Beat E — Mastery / overkill

Late in the generation, a focused build may become absurdly good at killing current or earlier Hydras.

This is allowed and desirable.

### Beat F — New generation invalidates comfort

The next Hydra scale or representation change exposes a new limitation without deleting the player's previous power.

This loop should repeat more strongly than any smooth exponential formula.

---

## 6. Command Spell I — ordinary-time throughput

### Identity

> **How much automatic cutting exists in ordinary time?**

Recommended long ladder:

> `1 → 3 → 9 → 27 → 81 → 243 → 729 → ... APS`

### Healthy behavior

- early levels should arrive rapidly;
- later levels should be expensive enough to compete with Command Spell II / III;
- Command Spell I should sometimes become dangerous in Hydra II because more ordinary-time cutting also creates more regrowth pressure;
- its value is therefore not a simple permanent DPS number.

### Hydra I onboarding exception

Hydra I should remain front-loaded and cheap:

| APS | Candidate price |
|---:|---:|
| 1 | 9 U1 = 99 |
| 3 | 3 U1 = 33 |
| 9 | 6 U1 = 66 |
| 27 | 9 U1 = 99 |

This is intentionally irregular.

The player is learning automation, so the curve should feel like repeated rewards rather than careful allocation.

### Hydra II and later

81 APS and higher are no longer tutorial upgrades.

A strong default is:

- 81 APS = **build-defining** (roughly 45–54 U2);
- 243 APS = **generation-spanning aspiration** (roughly 66 U2);
- 729 APS = major Hydra III-era investment rather than an automatic milestone.

Do not force every later APS level to follow one raw exponential cost ratio.

---

## 7. Command Spell II — NP technique, not one monolithic multiplier

### Identity

> **How strong, long, and practical is my manual Noble Phantasm state?**

Do not let all three internal axes scale aggressively at the same time.

Recommended separation:

### A. Manual multistrike — technique mastery

Keep this relatively short and tactile:

> `1 → 3 → 6 → 9 visible cuts / click during NP`

This does not need to continue forever.

It is a finite "I learned Nine Lives" axis.

### B. Time-stop duration — long macro scale

This is the axis that can continue across many generations:

> `3 → 9 → 27 → 81 → 243 → 729 ... seconds`

Do **not** treat 81 seconds as Command Spell II MAX.

Each duration jump is a major ×3-scale upgrade and should usually cost at least a major/build-defining price band.

### C. NP efficiency — utility / recovery

Efficiency should be cheaper than a raw ×3 power step.

Its job is:

> new powerful NP feels expensive / awkward
> → efficiency makes it practical again

But efficiency should not repeatedly make a stronger NP **cheaper to recharge than the older weaker NP was**, or the long-NP chain becomes self-sustaining too early.

Recommended rule:

> efficiency restores comfort; it does not create a free extra scale step.

### Hydra II learning target

Hydra II should not require Command Spell II completion.

A healthy target is that the player can reach Hydra III around Command Spell II Lv.1–3.

The first level must remain available during the first living Hydra II encounter after the `CUT 1 → GROW +2` reversal is revealed.

---

## 8. Command Spell III — bridge, then allow it to finish

### Identity

> **How much of Command Spell I automation can cross into stopped time?**

Recommended early ladder:

> `0 → 1/9 APS → 1/3 APS → full APS during NP`

This is a very good candidate for a **finite** progression line.

It does not need an infinite multiplier ladder merely because Command Spell I and II continue scaling.

Possible Hydra III pricing shape:

- first teaching unlock: **1–3 U3**;
- 1/3 participation: **6–12 U3**;
- full participation: **27 U3** or another major-step price.

This creates a rapid understanding phase followed by one meaningful commitment.

After full participation, Command Spell III may legitimately become MAX until a later structural / SKIP-style capstone is actually needed.

This is preferable to inventing arbitrary ×3 automation multipliers inside NP, which would duplicate Command Spell I.

---

## 9. Suggested role rotation by Hydra generation

This is a pacing map, not a lock table.

| Generation | Main learning / upgrade spotlight | Secondary pressure |
|---|---|---|
| Hydra I | **Command Spell I** onboarding | learn NP loop |
| Hydra II | **Command Spell II** first technique | choose 81 / 243 APS versus NP investment |
| Hydra III | **Command Spell III** bridge into NP | continue unfinished I / II |
| Hydra IV | **Command Spell II duration / technique** becomes major again | I continues as expensive scale investment |
| Hydra V | **Command Spell I** or structural economy | II duration becomes aspiration |
| Hydra VI+ | rotate emphasis; Tree / structural systems increasingly take progression weight | do not require all three spells to stay equally active forever |

The key is **rotation**.

At any given point, one spell should feel like the exciting new answer, one should be a costly long-term investment, and one may temporarily feel "good enough".

---

## 10. Concrete Hydra II sample cost shape

Using `U2 = 33 Humanity Evil`:

### Command Spell II

- first 3-hit unlock: **9 U2 = 297**
- first efficiency level: around **9 U2 = 297**
- first 9-second time upgrade: around **18 U2 = 594**

These three together cost about 36 Hydra II kills worth of income.

That is enough to teach and mature the system without requiring a full Hydra II generation.

### Command Spell I competition

- 81 APS: around **45–54 U2 = 1485–1782**
- 243 APS: around **66 U2 = 2178**

This makes 81 / 243 genuine specialization choices rather than automatic purchases.

The exact values should be playtested against real kill timing and carryover.

---

## 11. Concrete Hydra III sample cost shape

Using `U3 = 99 Humanity Evil`:

### Command Spell III

- first Auto-in-NP unlock: **1–3 U3 = 99–297**
- second participation step: **9 U3 = 891**
- full participation: around **27 U3 = 2673**

### Competing major upgrades

A Hydra III-era major Command Spell I or II scale step should usually cost roughly:

> **27–54 U3 = 2673–5346 Humanity Evil**

An aspirational upgrade may sit around:

> **66–81 U3 = 6534–8019 Humanity Evil**

This guarantees that a player cannot casually buy every available ×3 jump in the same generation.

---

## 12. Overkill is part of the reward curve

Do not balance every late-generation build so that current Hydras are always barely difficult.

The desired incremental loop includes:

> struggle
> → learn
> → buy the right tool
> → become comfortable
> → become ridiculous
> → next generation restores uncertainty

Therefore these are acceptable:

- one NP kills a full Hydra II and several newborn Hydra II afterward;
- a mature late-Hydra-III build chains through many earlier Hydras;
- long NP windows end with NP already READY.

The system only becomes unhealthy if the player reaches that overkill state **before they have learned the generation's problem**, or if one build remains permanently dominant across many later generations.

---

## 13. Recharge rule should be balanced as a phase, not a punishment tax

Do not simply multiply NP requirement after every Command Spell II upgrade.

Instead track the actual experience:

> **ordinary-time recharge phase → NP burst phase → resume beat**

Early in a new generation, the player should usually spend meaningful time outside NP.

Late in a mastered generation, it is acceptable for a long NP to end with the next NP already READY, creating near-back-to-back bursts.

The next generation should be what makes that old comfort insufficient again.

Until a deliberate late-game capstone says otherwise, avoid allowing an active NP to refresh its own remaining duration indefinitely before time resumes at least once.

---

## 14. Healthcheck verdict

### Keep

- Hydra `9^n` generation scale;
- Command Spell I = APS;
- Command Spell II = manual NP technique / time / efficiency;
- Command Spell III = Auto crossing into NP;
- shared Humanity Evil economy;
- old-Hydra multi-kill / overkill;
- fixed three-slot UI.

### Change / avoid

- do not use one smooth exponential price curve across all spells;
- do not expect all three spells to receive equal upgrade counts each generation;
- do not make 81 seconds the final Command Spell II duration;
- do not make Command Spell III scale forever just to preserve symmetry;
- do not price first-time learning tools like endgame investments;
- do not let efficiency become a hidden extra ×3 power multiplier.

### Recommended invariant

After onboarding:

> **one Hydra generation gives the player enough economy for roughly two major ×3-equivalent power beats total, plus some utility / comfort purchases.**

That invariant should be tested before exact raw prices are finalized.

It is the strongest current candidate for keeping both:

> **learning curve**
>
> and
>
> **incremental-game power fantasy.**
