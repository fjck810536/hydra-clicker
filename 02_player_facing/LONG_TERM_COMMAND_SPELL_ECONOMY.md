# Long-Term Command Spell Economy — Player-Facing Proposal

> Status: **provisional long-term economy proposal**.
>
> Scope: Hydra I–X pacing, normalized Humanity Evil budgeting, three-Command-Spell upgrade cadence, and anti-trap catch-up behavior.
>
> This file is player-facing design only. It does not modify implementation or any files outside `02_player_facing/`.

---

## 1. Normalize the economy by current-generation income

Let:

> **U_n = Humanity Evil gained from killing one Hydra in generation n**

Current candidate acquisition law:

> **U_n = 11 × 3^(n-1)**

Each generation contains 99 true Hydra kills, so gross generation income is:

> **99 U_n**

This normalized unit is more useful for long-term balancing than raw Humanity Evil values.

### Important inflation consequence

Because `U_(n+1) = 3 U_n`, an upgrade that cost:

> **36 U_n**

when first introduced costs only:

> **12 U_(n+1)**

in next-generation purchasing-power terms.

Likewise:

- `54 U_n` becomes `18 U_(n+1)`;
- `27 U_n` becomes `9 U_(n+1)`;
- `9 U_n` becomes `3 U_(n+1)`.

This creates a desirable incremental-game property:

> **A current-generation choice is expensive now, but skipped old upgrades become natural catch-up purchases later.**

The player can specialize without permanently bricking the build.

---

## 2. Core long-term budget rule

After Hydra I onboarding, a normal generation should not fund every major upgrade that is visible.

Recommended budget grammar:

| Upgrade role | Typical debut price |
|---|---:|
| first introduction / teaching unlock | **6–9 U** |
| comfort / NP efficiency / readability | **6–12 U** |
| medium technique refinement | **18–27 U** |
| first major ×3 scale beat on an axis | **36 U** |
| second same-axis ×3 beat in the same generation | **54 U** |
| deliberately deferred cross-generation aspiration | **66–81 U** |

The central rule is:

> **99 U of current-generation income should support roughly two true major scale beats, not every branch.**

---

## 3. Why 36 U + 54 U is a useful major-upgrade pair

From the mature midgame onward, the two long-running multiplicative axes are:

### Command Spell I

> ordinary-time Auto Slash throughput / APS

Typical major step:

> **APS ×3**

### Command Spell II

> Noble Phantasm time-stop duration

Typical major step:

> **duration ×3**

Once Command Spell III has connected Auto Slash into NP, effective automated NP capacity is approximately proportional to:

> **APS × NP duration**

Hydra generation scale grows:

> **×9 per generation**

Therefore a generation needs roughly two ×3 major beats somewhere across those axes:

> `3 × 3 = 9`

Use the cost pair:

> first same-axis step = **36 U**  
> second same-axis step = **54 U**

Then three useful build patterns emerge naturally.

### Automation specialization

> APS ×3 for 36 U  
> APS ×3 again for 54 U  
> total = **90 U**

Result:

> **APS ×9**

### Time specialization

> duration ×3 for 36 U  
> duration ×3 again for 54 U  
> total = **90 U**

Result:

> **time ×9**

### Balanced

> APS ×3 for 36 U  
> time ×3 for 36 U  
> total = **72 U**

Result:

> **APS × time = ×9 effective NP capacity**

Thus all three build identities can approximately keep pace with a Hydra generation's ×9 scale increase.

Crucially:

> three current-generation major upgrades cost at least `36 + 36 + 54 = 126 U`

which is more than one generation's `99 U` income.

So the player cannot casually buy everything.

---

## 4. Hydra I — onboarding exception

Hydra I intentionally violates the mature 36 / 54 U rule.

Its job is to teach automation quickly and remove early waiting.

Current candidate Command Spell I sequence:

| APS | Cost | Cost in U1 | Approx. kill if bought immediately |
|---:|---:|---:|---:|
| 1 | 99 HE | **9 U1** | 9 |
| 3 | 33 HE | **3 U1** | 12 |
| 9 | 66 HE | **6 U1** | 18 |
| 27 | 99 HE | **9 U1** | 27 |

Total:

> **27 U1**

Hydra I gross income:

> **99 U1**

Expected leftover:

> **72 U1**

When entering Hydra II, because `U2 = 3 U1`, this reserve is worth:

> **24 U2**

This exactly reproduces the current candidate carryover:

> 792 HE / 33 HE per Hydra II kill = 24 U2

Hydra I therefore teaches rapid power acquisition rather than resource scarcity.

---

## 5. Hydra II — Command Spell II becomes the new learning system

Expected entry reserve:

> **~24 U2**

### Command Spell II teaching sequence

The first Hydra II cut reveals:

> `CUT 1 → GROW +2`

Command Spell II becomes eligible while the first Hydra II is still alive.

Recommended early costs:

| Upgrade | Effect | Candidate debut cost |
|---|---|---:|
| CS II Lv.1 | NP-only **3 cuts / click** | **9 U2** |
| CS II Lv.2 | first NP-efficiency relief | **6 U2** |
| CS II Lv.3 | time stop **3 s → 9 s** | **27 U2** |

These are intentionally affordable enough that the player can learn the new system inside Hydra II.

Observed target:

> CS II Lv.1 already makes a full-head Hydra II practically killable during NP and can spill into several newborn Hydra II kills.

Observed target:

> around CS II Lv.3, Hydra II should already be comfortably solvable and the player may naturally reach Hydra III without completing Command Spell II.

### Command Spell I choices introduced in Hydra II

Recommended mature-cost candidates:

| Upgrade | Effect | Candidate cost |
|---|---|---:|
| CS I | 27 → **81 APS** | **36 U2** |
| CS I | 81 → **243 APS** | **54 U2** |

This produces clean Hydra II build stories.

#### Automation-heavy

> CS II first unlock 9 U2  
> + 81 APS 36 U2  
> + 243 APS 54 U2  
> = **99 U2**

The player ends the generation extremely automation-heavy, but NP technique remains primitive.

#### Balanced

> CS II Lv.1–3 = 42 U2  
> + 81 APS = 36 U2  
> total = **78 U2**

The player gets a mature Hydra-II Noble Phantasm and one major APS step, with reserve remaining.

#### NP-focused

The player may continue saving for later Command Spell II technique upgrades and delay 81 / 243 APS.

Skipped Hydra-II APS upgrades become cheaper in Hydra-III purchasing-power terms.

---

## 6. Hydra III — Command Spell III becomes the new learning system

Hydra III cap:

> **729 logical heads**

This generation introduces the >99-head abstraction and begins Tree-view language.

Command Spell III should become eligible on the first Hydra III NP release, not on a Hydra III kill requirement.

### Command Spell III compact ladder

Recommended long-term identity:

| CS III state | Auto Slash allowed during NP |
|---|---:|
| not owned | 0 |
| Lv.1 | **1/9 current APS** |
| Lv.2 | **1/3 current APS** |
| MAX | **100% current APS** |

Recommended debut costs:

| Upgrade | Candidate cost |
|---|---:|
| CS III Lv.1 | **9 U3** |
| CS III Lv.2 | **9–18 U3** |
| CS III MAX | **18–36 U3** |

Command Spell III is intentionally shorter than I or II. It performs one conceptual job:

> **automation crosses into stopped time**

and then it may legitimately finish.

### Hydra III current-generation major options

Candidate major upgrades:

| Upgrade | Effect | Candidate cost |
|---|---|---:|
| CS I | 243 → **729 APS** | **36–54 U3** |
| CS II | 9 s → **27 s** | **36–54 U3** |

Medium Command Spell II technique upgrades such as:

> 3-hit → 6-hit

may cost roughly:

> **18–27 U3**

rather than being treated as another full ×3-scale axis.

The player should not trivially afford:

> full CS III + 729 APS + 27 s + every technique refinement

inside Hydra III.

---

## 7. Hydra IV — mature three-system economy begins

By Hydra IV, the player has learned the three major Command Spell identities:

- I = ordinary-time automation;
- II = manual NP technique + stopped-time duration;
- III = automation crossing into NP.

This is the natural point to begin a repeating mature-economy frame.

Assume a representative baseline around:

> APS = 729  
> NP duration = 27 s  
> CS III partially or fully connecting Auto into NP

Current-generation major offers can be:

### Command Spell I

> 729 → **2,187 APS** = 36 U4  
> 2,187 → **6,561 APS** = 54 U4

### Command Spell II time

> 27 s → **81 s** = 36 U4  
> 81 s → **243 s** = 54 U4

### Command Spell II technique completion

Manual multistrike can finish around this era:

> 6-hit → **9-hit**

This is a medium technique upgrade, not another infinite multiplicative axis.

Candidate cost:

> **18–27 U4**

NP efficiency remains a comfort / cadence modifier around:

> **6–12 U4**

and should not secretly equal another ×3 power beat.

### Important observed validation

An 81-second NP can already chain-kill many Hydra III under the current observed system.

That is desirable if 81 s is positioned as a Hydra-IV-era major upgrade:

> current-generation power humiliates previous-generation content.

It should not be treated as Command Spell II MAX.

---

## 8. Hydra V–X — repeating major-beat frame

From Hydra V onward, use the same economic grammar unless Tree / structural mechanics later require a new axis.

Each generation offers two sequential ×3 steps on Command Spell I and two sequential ×3 steps on Command Spell II time.

The player can usually afford approximately two of those four current-generation major beats.

### Hydra V

Hydra cap:

> **59,049**

Candidate current-generation offers:

#### CS I

> 6,561 → **19,683 APS** = 36 U5  
> 19,683 → **59,049 APS** = 54 U5

#### CS II time

> 243 s → **729 s** = 36 U5  
> 729 s → **2,187 s** = 54 U5

### Hydra VI

Hydra cap:

> **531,441**

#### CS I

> 59,049 → **177,147 APS** = 36 U6  
> 177,147 → **531,441 APS** = 54 U6

#### CS II time

> 2,187 s → **6,561 s** = 36 U6  
> 6,561 s → **19,683 s** = 54 U6

### Hydra VII

Hydra cap:

> **4,782,969**

#### CS I

> 531,441 → **1,594,323 APS** = 36 U7  
> 1,594,323 → **4,782,969 APS** = 54 U7

#### CS II time

> 19,683 s → **59,049 s** = 36 U7  
> 59,049 s → **177,147 s** = 54 U7

### Hydra VIII

Hydra cap:

> **43,046,721**

#### CS I

> 4,782,969 → **14,348,907 APS** = 36 U8  
> 14,348,907 → **43,046,721 APS** = 54 U8

#### CS II time

> 177,147 s → **531,441 s** = 36 U8  
> 531,441 s → **1,594,323 s** = 54 U8

### Hydra IX

Hydra cap:

> **387,420,489**

#### CS I

> 43,046,721 → **129,140,163 APS** = 36 U9  
> 129,140,163 → **387,420,489 APS** = 54 U9

#### CS II time

> 1,594,323 s → **4,782,969 s** = 36 U9  
> 4,782,969 s → **14,348,907 s** = 54 U9

### Hydra X

Hydra cap:

> **3,486,784,401 = 9^10**

#### CS I

> 387,420,489 → **1,162,261,467 APS** = 36 U10  
> 1,162,261,467 → **3,486,784,401 APS** = 54 U10

#### CS II time

> 14,348,907 s → **43,046,721 s** = 36 U10  
> 43,046,721 s → **129,140,163 s** = 54 U10

These extreme literal time values are intentionally a warning sign, not a commitment that the late game should display multi-year real-time countdowns.

The economic grammar may remain valid while the **representation of stopped-time budget** later changes.

By the exponent era, the UI may need to represent time and APS as powers / structural quantities rather than ordinary human-scale seconds.

---

## 9. The repeating-frame invariant

From the mature midgame onward, if the player buys exactly two major current-generation beats, effective NP scale grows approximately ×9 regardless of specialization.

### Two APS upgrades

> APS ×9  
> time unchanged

Effective automatic NP capacity:

> ×9

### Two time upgrades

> APS unchanged  
> time ×9

Effective automatic NP capacity:

> ×9

### One APS + one time

> APS ×3  
> time ×3

Effective automatic NP capacity:

> ×9

This matches:

> Hydra cap ×9 per generation

and gives the economy a stable mathematical backbone without forcing one build.

---

## 10. Catch-up is intentional, not an exploit

Because Humanity Evil income per Hydra triples each generation, skipped old upgrades become cheaper in relative terms.

Example:

A player skips a 54 U4 upgrade.

In Hydra V terms it costs:

> **18 U5**

In Hydra VI terms:

> **6 U6**

This means:

- specialization is meaningful now;
- bad early allocation does not permanently destroy the save;
- old systems can be cleaned up later;
- current-generation upgrades remain the interesting expensive decisions.

This is a desirable independent-incremental behavior.

Do not counteract it by continuously rescaling old prices upward.

---

## 11. Manual multistrike should not scale forever

Command Spell II's manual strike chain should remain a technique progression, not become another infinite exponential axis.

Recommended ceiling:

> **1 → 3 → 6 → 9 cuts / click**

After 9-hit:

- the technique is considered mastered;
- future long-term Command Spell II growth comes primarily from stopped-time scale and cadence / efficiency;
- manual clicking remains readable as a physical action rather than becoming `243 cuts / tap`.

This prevents too many simultaneous multiplicative axes.

---

## 12. Command Spell III should be finite

Recommended:

> `0 → 1/9 → 1/3 → 1` Auto-in-NP

then:

> **MAX**

Command Spell III's value continues growing automatically because it imports the player's ever-growing Command Spell I APS into ever-growing Command Spell II time.

It does not need its own endless multiplier ladder.

This also makes the three Command Spells structurally distinct:

- **I** — infinite throughput axis;
- **II** — finite manual-technique mastery + long-term stopped-time axis;
- **III** — finite bridge / rule-unlock axis.

---

## 13. Learning + delight rhythm by era

### Hydra I

> rapid onboarding  
> cheap upgrades  
> repeated slot lighting  
> automation becomes real

### Hydra II

> old solution fails  
> CS II appears cheaply  
> NP suddenly becomes effective  
> player can already overpower old Hydra II states before CS II is complete

### Hydra III

> scale exceeds visible monster  
> CS III appears  
> automation enters stopped time  
> three systems begin interacting

### Hydra IV+

> current-generation major upgrades become expensive choices  
> only about two scale beats per generation  
> skipped alternatives become cheap catch-up one generation later  
> late-generation power temporarily humiliates current / previous content

The intended emotional loop is:

> problem  
> → cheap new understanding  
> → first strong payoff  
> → expensive specialization  
> → temporary domination  
> → next generation restores pressure

---

## 14. Do not balance around full-cap Hydra only

Every generation has at least three relevant combat states:

1. newborn Hydra at 9 heads;
2. growing intermediate state;
3. near-cap / full-cap state at `9^n`.

A strong NP may:

> kill a full or partially grown Hydra  
> → continue through several newborn Hydras while time remains

This chain-kill behavior is an intended reward and should not be removed merely because a single NP kills more than one encounter.

Balance should instead ask:

> **Does a current-generation major investment allow the player to dominate too early, before they have understood that generation's new problem?**

If not, overkilling old / newborn Hydras is desirable delight.

---

## 15. High-priority playtest checks before sealing raw HE values

1. Does Hydra II still feel good if CS II Lv.1 / 2 / 3 cost roughly 9 / 6 / 27 U2?
2. Does 81 APS at 36 U2 arrive early enough to be exciting but late enough to preserve the Hydra-II reversal lesson?
3. Does 243 APS at 54 U2 create a genuine automation-specialization choice rather than an obvious mandatory purchase?
4. In Hydra III, is `CS III 0 → 1/9 → 1/3 → 1` fast enough to teach the bridge without consuming the whole generation budget?
5. Is 27 s around Hydra III and 81 / 243 s around Hydra IV consistent with observed chain-kill behavior?
6. Does the 36 U / 54 U repeating frame truly limit the player to ~two major current-generation beats?
7. Is one-generation-later catch-up at 12 U / 18 U satisfying rather than making current choices feel meaningless?
8. At very long NP durations, when should literal seconds stop being the right player-facing representation?
9. Does Tree / structural progression eventually need to absorb one of the two major-beat slots rather than letting I + II carry the entire late game forever?
