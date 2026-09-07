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

Net head count change from a completed cut/regrowth cycle is therefore +1.

The player should not learn this primarily from explanatory UI text. The preferred teaching method is **visible cause and effect**.

### Provisional presentation

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

## 3. NP / Noble Phantasm — temporary cancellation of Hydra law

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

## 4. NP as time stop

### Provisional, strongly preferred

NP may be presented as a literal or near-literal **time-stop state** rather than only a regeneration-disable buff.

During the early form of NP:

- Hydra regrowth is disabled;
- heads cut during NP permanently remain cut;
- autonomous cutting / APS may stop;
- the player remains able to cut manually;
- visual color, motion, sound, or UI state may clearly indicate that normal time has stopped.

At the end of NP, there should be a brief, legible "time resumes" transition before normal Hydra rules and automation resume.

This transition may deliberately evoke a DIO-like time-stop joke without requiring explicit explanatory text.

---

## 5. Command Spell progression

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

## 6. Hydra scale progression — powers of nine

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

## 7. Main visual head limit and abstraction

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

## 8. Tree view

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

## 9. Hydra death / corpse overlap

### Confirmed visual direction

When a Hydra is killed:

1. the body loses tension;
2. it becomes limp / ragdoll-like / plush-like;
3. it begins fading out;
4. the next Hydra may enter **before the previous corpse has disappeared**.

If the player kills early Hydras fast enough, multiple Hydra bodies may therefore visibly pile up.

The game does not currently need to explain whether successive Hydras are reincarnations, separate organisms, clones, stages, or something else. The unexplained overlap itself may create useful dark comedy and narrative ambiguity.

---

## 10. Current player-facing progression hypothesis

One useful working model is:

> **Manual suppression → self-created pressure → NP rule-breaking window → stronger automation → scale abstraction → structural understanding**

A parallel transformation occurs in the meaning of a head:

> enemy → pressure → NP input / resource → population → abstract quantity → leaf of a structure

And in the meaning of the player character / Heracles-side power:

> hand → more time → faster hand → automated hand

These are working hypotheses to test against actual play rather than fixed lore.

---

## 11. Open design questions

The next player-facing questions that remain genuinely unresolved include:

1. **Hydra II pacing:** exactly how long should the severed-head → regrowth delay be so that cause is legible without slowing rapid play?
2. **NP duration:** what base duration produces urgency and catharsis without feeling like a mandatory rhythm-game window?
3. **APS paradox:** during Hydra II, how strongly should automation initially behave as both help (NP generation / throughput) and danger (creating more regrowth)?
4. **Hydra I → II → III encounter pacing:** what head counts, starting states, and transition timing produce the intended cognitive steps before scale explodes?
5. **Hydra III tree reveal:** what information should the first tree view actually expose, and what should remain hidden?
6. **Text / micro-story:** how much Souls-like encounter naming / death text should coexist with the unexplained corpse conveyor-belt comedy?
7. **Visual abstraction >99:** what exact visual grammar tells the player that the Hydra is still growing even though the main view stops drawing literal new heads?
8. **Sound:** what should cutting, regrowth, NP time stop, and time resume sound like, especially under high-frequency clicking?

