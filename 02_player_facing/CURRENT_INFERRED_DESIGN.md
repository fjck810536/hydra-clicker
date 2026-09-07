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
- autonomous cutting / APS may stop;
- the player remains able to cut manually;
- visual color, motion, sound, or UI state may clearly indicate that normal time has stopped.

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

- a fast manual player may be able to kill Hydra II in a single NP window;
- a more typical player may require two NP cycles;
- neither outcome should feel like failure.

This preserves manual expression without turning high-speed clicking into a mandatory execution check.

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
> → time-stop / rule-cancellation window
> → for the first time the count falls continuously: 81 → 80 → 79 → ...
> → strong player may finish the Hydra; typical player may leave survivors
> → time resumes visibly
> → subsequent ordinary cutting again creates regrowth pressure
> → second cycle if needed

The core cathartic contrast is:

> **81 → 81 → 81 ...**
>
> then
>
> **81 → 80 → 79 → 78 ...**

The pleasure comes from finally watching the number genuinely decrease.

---

## 7. Command Spell progression

### Current preferred player-facing order

The first two Command Spell beats have been reordered from the earlier discussion.

#### Command Spell I

> **「幫我撐十秒。」**

Player-facing purpose: establish / extend the safe Noble Phantasm window and teach the player that **time itself is a resource**.

#### Command Spell II

> **「快一點，再快一點。」**

Player-facing purpose: escalate cutting speed / APS and turn the player's growing throughput into the next form of power.

#### Command Spell III

> **「這裡怎麼沒有 SKIP???」**

Player-facing purpose: allow autonomous cutting to participate during the Noble Phantasm / time-stop window, transforming early manual burst play into a later automated massacre window.

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

> **Manual suppression → self-created pressure → cap stalemate → NP rule-breaking window → stronger automation → scale abstraction → structural understanding**

A parallel transformation occurs in the meaning of a head:

> enemy → pressure → NP input / resource → population → abstract quantity → leaf of a structure

And in the meaning of the player character / Heracles-side power:

> hand → more time → faster hand → automated hand

These are working hypotheses to test against actual play rather than fixed lore.

---

## 13. Open design questions

The next player-facing questions that remain genuinely unresolved include:

1. **Hydra II regrowth timing below cap:** exactly how long should the severed-head → regrowth delay be so that cause is legible without slowing rapid play?
2. **Hydra II cap feedback:** what exact animation communicates "you are still cutting successfully, but the population is no longer shrinking" without replaying a visually exhausting two-head regrowth sequence every click?
3. **Base NP duration:** what duration makes one-cycle kills possible for strong manual players while making two cycles normal for typical players?
4. **First NP timing:** what data tuning causes ordinary players to reach 66 NP naturally around the 70–81-head region rather than always at the same exact count?
5. **APS paradox:** during Hydra II, how strongly should automation behave as both help (NP generation / throughput) and danger (creating more regrowth)?
6. **Hydra III tree reveal:** what information should the first tree view actually expose, and what should remain hidden?
7. **Text / micro-story:** how much Souls-like encounter naming / death text should coexist with the unexplained corpse conveyor-belt comedy?
8. **Visual abstraction >99:** what exact visual grammar tells the player that the Hydra is still growing even though the main view stops drawing literal new heads?
9. **Sound:** what should cutting, regrowth, cap stalemate, NP time stop, and time resume sound like, especially under high-frequency clicking?
