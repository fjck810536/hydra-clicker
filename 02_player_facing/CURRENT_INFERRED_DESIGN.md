# Hydra Clicker — Current Inferred Player-Facing Design

> Status: working player-facing specification inferred from current rules, playtests, and design discussion.
>
> This document records **what the game should feel like / communicate to the player**. It does not define implementation. Any conflict with core rules or implementation outside `02_player_facing/` must be resolved by updating this document or by a separate change outside this chat.

## Status vocabulary

- **Confirmed** — currently treated as a player-facing design decision.
- **Provisional** — preferred direction, still open to playtest revision.
- **Open** — unresolved design question.

---

## 1. Core player-facing identity

### Confirmed

Hydra Clicker is not primarily about a conventional fail state. The intended long-form experience is **endless cutting / management of a system that can become absurdly large**.

A central causal rule is:

> Hydra does not automatically grow toward its maximum merely because time passes. The player's cutting is what creates regrowth pressure.

This supports the player-facing idea:

> **The act of solving the problem also creates the problem.**

The game may therefore feel like a clicker / idle game rather than a conventional combat game with player death.

---

## 2. Hydra II — first causal reversal

### Confirmed

Normal Hydra II cutting follows the current conceptual rule:

> CUT 1 → GROW +2

Net head count change from a completed cut/regrowth cycle is therefore +1 until the current Hydra cap is reached.

The player should not learn this primarily from explanatory UI text. The preferred teaching method is **visible cause and effect**.

### Provisional presentation below cap

A cut may visually read approximately as:

1. a head is successfully severed;
2. the severed head falls / the count temporarily decreases;
3. a short delay, transition, body-color shift, wound cue, or similar anticipation occurs;
4. two heads grow from the cut location;
5. only then does the player perceive that the total has increased.

The intended first reactions include all of:

- 「靠，這東西會越砍越多。」
- 「那我要想辦法存 NP？」
- absurdity / dark comedy.

The game should not immediately invalidate obsessive or precision play. A player who manually counts NP, waits for the exact activation point, bursts during NP, and then slowly rebuilds NP may be allowed to feel that they have found an unusual solution. Later growth scale may make this increasingly impractical without explicitly forbidding it.

### Confirmed constraint

When heads are not being cut, the current head count does **not** automatically climb toward the Hydra's maximum cap.

---

## 3. Hydra II cap state — deliberate stalemate

### Confirmed player-facing direction

Hydra II is currently treated as beginning around **9 heads** with a maximum scale of **9^2 = 81 heads**.

At the 81-head cap, the preferred presentation changes.

The player should **not** continue seeing a full theatrical "one falls, two visibly emerge" cycle on every click. Instead, the encounter enters a perceptual stalemate:

> CUT → immediate replacement / recovery → still 81

The important feeling is that the player is cutting successfully, but the overall problem is not getting smaller.

### Confirmed feedback principle

At cap, cutting should still feel tactile and satisfying while the count remains brutally unchanged.

> satisfying hit feedback + no numerical progress

This contrast is intentional. The player is not meant to feel that the input failed; they are meant to feel that **ordinary cutting has ceased to make progress**.

### NP at cap

The current player-facing direction is that continued cutting at cap can still contribute to NP. This prevents the cap from becoming a deadlock and allows 81 heads to function as a temporary **NP charging wall / stalemate state**.

This does not mean the intended optimal strategy is always "rush to cap." The preferred pacing is that an ordinary player tends to reach full NP somewhere in the **70–81 head region**, so the first NP may occur just before or around the cap rather than at one exact scripted count.

This keeps room for:

- ordinary reactive play;
- obsessive NP counting;
- unusually efficient burst timing;
- players who deliberately ride the cap to finish charging.

---

## 4. NP / Noble Phantasm — temporary cancellation of Hydra law

### Confirmed

NP capacity is currently treated as:

> **66 NP**

Manual cutting currently contributes to NP accumulation.

When NP is released, Hydra regrowth is disabled for the duration. Heads severed during NP are **not queued for later regrowth** and are not restored when the effect ends.

The important player-facing interpretation is therefore not merely:

> increased DPS

but:

> **For a short window, Hydra stops obeying the rule that makes it Hydra.**

This is intended to prioritize catharsis and tactile pleasure over conservation of the normal regrowth rule.

### Confirmed base duration

The initial Noble Phantasm window is only:

> **3 seconds**

This short duration is intentional and is part of the joke / frustration / urgency of the early player experience. The first Noble Phantasm should feel powerful because Hydra law is turned off, but also comically brief.

The player may therefore experience:

> 寶具解放！ → 狂砍 → 「蛤？三秒就沒了？」

The short base window is not extended by Command Spell I. Noble Phantasm duration progression begins only once Command Spell II enters the design.

### Noble Phantasm presentation

The activation control is presented as a card / textual action:

> **寶具解放**

followed by:

> **ナインライブズ**  
> **射殺す百頭**

The Fate / Nine Lives reference is intended to remain a reusable content language rather than a single one-off joke. Later upgrades, weapons, or presentation may continue escalating the reference vocabulary (for example bow variants, Archer / projection / Unlimited Blade Works-adjacent jokes), subject to later design discussion.

---

## 5. NP as time stop

### Provisional, strongly preferred

NP may be presented as a literal or near-literal **time-stop state** rather than only a regeneration-disable buff.

During the early form of NP:

- Hydra regrowth is disabled;
- heads cut during NP permanently remain cut;
- autonomous cutting / APS may be governed separately by progression state rather than assumed active by default;
- the player remains able to cut manually;
- visual color, motion, sound, or UI state may clearly indicate that normal time has stopped.

### Confirmed timer visibility

The NP window should have a visible countdown timer rather than being readable only through atmosphere.

Preferred UI direction:

> a **small stopwatch / compact countdown** placed at the top or bottom edge of the play area

The countdown should be precise enough to make the three-second absurdity legible, but visually secondary to the Hydra itself.

### Confirmed end-of-window behavior

When the NP window ends, normal Hydra rules should not silently resume in the background. There should be a brief, legible **time resumes** transition.

Preferred sequence:

> stopped world → resume cue → normal color / motion returns → normal Hydra rule becomes active again on subsequent cutting

This may deliberately evoke a DIO-like time-stop joke without requiring explicit explanatory text.

The first post-NP return to ordinary regrowth should therefore feel like a boundary crossing, not like a buff icon merely expiring.

---

## 6. First Hydra II NP loop

### Confirmed target experience

The first Hydra II NP is **not required to guarantee a kill**.

The preferred outcome is skill-sensitive:

- a player using near-full-speed two-thumb clicking may be able to kill Hydra II in a single three-second NP window;
- a more typical player may require two or more NP cycles;
- neither outcome should feel like failure.

This preserves manual expression without turning exotic multi-finger clicking into a mandatory execution check.

### Working encounter arc

A likely Hydra II experience is:

> ~9 heads
> → player cuts normally
> → delayed regrowth reveals that cutting increases the problem
> → count climbs
> → NP approaches full somewhere around 70–81
> → if the cap is reached, ordinary cutting becomes a satisfying but numerically static stalemate
> → NP reaches 66
> → **寶具解放**
> → ~3-second time-stop / rule-cancellation window
> → for the first time the count falls continuously: 81 → 80 → 79 → ...
> → very fast two-thumb player may finish the Hydra; typical player may leave survivors
> → time resumes visibly
> → subsequent ordinary cutting again creates regrowth pressure
> → another cycle if needed

The core cathartic contrast is:

> **81 → 81 → 81 ...**
>
> then
>
> **81 → 80 → 79 → 78 ...**

The pleasure comes from finally watching the number genuinely decrease, while the three-second limit creates urgency and a deliberate "that's all I get?" joke.

---

## 7. Command Spell progression

### Confirmed SAO quote order and deliberate mismatch

The Command Spell texts deliberately follow the order of the Sword Art Online episode 9 boss-fight quotes:

1. first the request to hold for ten seconds;
2. later the internal demand to go faster.

The **quote order is part of the joke and should not be swapped to match the mechanical effects more literally**.

#### Command Spell I — APS / throughput

> **「幫我撐十秒。」**

Command Spell I is the APS / attack-speed progression, despite the text sounding like it should extend time.

That mismatch is intentional. The game humorously misreads a request to teammates to hold the boss as a command that produces more autonomous cutting throughput.

Player-facing purpose:

- introduce or escalate autonomous cutting throughput;
- preserve the ability for the player to **interleave manual clicks with APS**, rather than replacing active play with idle play;
- create the contrast that the player's overall cutting capability can become dramatically faster while the Noble Phantasm itself is still stuck at a ridiculous **3 seconds**;
- create a deliberate double-edged early experience in Hydra II: APS helps build throughput / NP, but outside NP it also causes more Hydra cuts and therefore more regrowth pressure.

### Confirmed learning arc for Command Spell I

The intended Hydra II reading is closest to:

> **At first APS can feel like a disaster; after the player understands the NP rhythm, the same automation becomes something they can exploit.**

So Command Spell I is not meant to be perceived as a purely positive stat increase from the first second. It is a power that initially accelerates both the player and the problem.

Command Spell I does **not** extend Noble Phantasm duration.

#### Command Spell II — NP time + multistrike progression

Preferred SAO-derived text:

> **「快點……再快點……！」**

(Equivalent presentation may use the Japanese **「速く……もっと速く……！」** if that reads better in the final UI.)

Command Spell II begins Noble Phantasm duration progression and also opens a second family of "faster" upgrades that change the meaning of one manual click.

Current design direction:

- the progression is organized into several stages around powers of three, **3^n**;
- the progression may extend up to a ceiling associated with **81**;
- only some stages need to increase Noble Phantasm duration;
- other stages can provide different related bonuses;
- a strong candidate for non-duration stages is **multistrike per click**, where one player click produces multiple cuts / swings, for example **3 cuts, 6 cuts, 9 cuts**;
- the exact mapping between the 3^n milestones, duration increases, and multistrike rewards remains open.

The joke now has a deliberate double mismatch:

- **「幫我撐十秒。」** gives APS rather than ten more seconds;
- **「快點……再快點……！」** can make the player effectively faster through multistrike, while paradoxically also being the progression where the three-second NP window finally begins to last longer.

This preserves the source quote order while letting the game reinterpret the lines mechanically.

#### Later Command Spell / automation beat

> **「這裡怎麼沒有 SKIP???」**

The later SKIP joke remains a candidate for enabling stronger automation during Noble Phantasm / time-stop play, turning an early manual burst window into a later automated massacre window.

Its exact placement remains provisional until the full Command Spell II / 3^n progression is mapped.

### Synchronization note

The exact relationship between these player-facing Command Spell beats and any already-established core APS unlock/progression rules outside `02_player_facing/` must be checked before implementation. This file records the preferred **player-facing order and meaning**, not an implementation rewrite.

---

## 8. Hydra scale progression — powers of nine

### Confirmed direction

Hydra maximum scale may follow powers of nine:

> 9^1, 9^2, 9^3, ...

Early values can remain ordinary decimal numbers. Once ordinary decimal display becomes comically / cognitively unwieldy, the UI can stop pretending that expanded decimal notation is the natural way to understand the Hydra and switch to exponential notation such as:

> **9^n**

A useful natural breakpoint exists between Hydra IX and Hydra X:

- 9^9 = 387,420,489 (nine decimal digits)
- 9^10 = 3,486,784,401 (ten decimal digits)

The desired player-facing effect is a **change of scale**, not merely a formatting optimization.

### Provisional conceptual arc

Player understanding may evolve roughly as:

> snake head
> → many snake heads
> → crowd / mass
> → number
> → huge number
> → 9^n
> → tree
> → generation
> → mathematical structure

Hydra III does not necessarily require a new special rule. Keeping the same regrowth logic while jumping to a much larger capacity (for example 9^3) may itself be enough to create the next experiential step.

---

## 9. Main visual head limit and abstraction

### Confirmed direction

The main Hydra view has a practical / aesthetic visual ceiling of approximately:

> **99 visible heads**

This is treated as a deliberate player-facing abstraction rather than a requirement to literally render every mathematical head.

Above that scale:

- the main Hydra can act as a visual proxy for overwhelming multiplicity;
- the true numeric count may continue beyond the visible head count;
- increasingly large values may transition toward compact mathematical notation.

The goal is that increasing scale changes how the player **perceives** Hydra, instead of merely cluttering the screen with hundreds or millions of literal head sprites.

---

## 10. Tree view

### Confirmed direction

A tree representation becomes available around Hydra III / the next major scale step.

The tree should simplify its rendering as scale grows rather than attempting literal node-for-node fidelity at enormous sizes.

### Current progression hypothesis

#### Early tree view — observation

Tree view is primarily an X-ray / data visualization. The player can inspect structure but still plays mainly through the normal Hydra view.

#### Later tree view — understanding

Tree view begins exposing generations / branches as meaningful structural information.

#### Much later / endgame — operation

Selecting a generation, branch, or particular structural location to cut may become a later-generation or endgame mechanic.

This is intentionally deferred. Tree interaction should not become mandatory merely because tree view first appears.

---

## 11. Hydra death / corpse overlap

### Confirmed visual direction

When a Hydra is killed:

1. the body loses tension;
2. it becomes limp / ragdoll-like / plush-like;
3. it begins fading out;
4. the next Hydra may enter **before the previous corpse has disappeared**.

If the player kills early Hydras fast enough, multiple Hydra bodies may therefore visibly pile up.

The game does not currently need to explain whether successive Hydras are reincarnations, separate organisms, clones, stages, or something else. The unexplained overlap itself may create useful dark comedy and narrative ambiguity.

---

## 12. Current player-facing progression hypothesis

One useful working model is:

> **Manual suppression → self-created pressure → cap stalemate → 3-second NP rule-breaking window → APS that initially accelerates both player and problem → learned NP rhythm → multistrike / longer NP control → scale abstraction → structural understanding**

A parallel transformation occurs in the meaning of a head:

> enemy → pressure → NP input / resource → population → abstract quantity → leaf of a structure

And in the meaning of the player character / Heracles-side power:

> hand → extra autonomous hands → one click becoming many cuts → more controlled time → later automation inside the impossible window

These are working hypotheses to test against actual play rather than fixed lore.

---

## 13. Open design questions

The next player-facing questions that remain genuinely unresolved include:

1. **Hydra II regrowth timing below cap:** exactly how long should the severed-head → regrowth delay be so that cause is legible without slowing rapid play?
2. **Hydra II cap feedback:** what exact animation communicates "you are still cutting successfully, but the population is no longer shrinking" without replaying a visually exhausting two-head regrowth sequence every click?
3. **Three-second NP lethality:** with real two-thumb play, how many heads can a strong player actually remove in 3 seconds, and does that produce the desired one-cycle / multi-cycle split?
4. **Command Spell I APS/manual interaction:** how should APS and manual clicks coexist perceptually so that the early "this upgrade is making the Hydra worse" phase is funny and legible rather than merely confusing?
5. **Command Spell II 3^n ladder:** which milestones increase NP duration, which unlock multistrike (for example 3 / 6 / 9 cuts per click), which provide other bonuses, and what does the ceiling at 81 represent player-facing?
6. **NP timer placement:** should the small stopwatch live above or below the play field, and how visible should tenths / hundredths of seconds be?
7. **Hydra III tree reveal:** what information should the first tree view actually expose, and what should remain hidden?
8. **Text / micro-story:** how much Souls-like encounter naming / death text should coexist with the unexplained corpse conveyor-belt comedy?
9. **Visual abstraction >99:** what exact visual grammar tells the player that the Hydra is still growing even though the main view stops drawing literal new heads?
10. **Sound:** what should cutting, regrowth, cap stalemate, NP time stop, and time resume sound like, especially under high-frequency clicking?
