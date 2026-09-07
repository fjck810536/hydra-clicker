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

At the 81-head cap, the preferred presentation changes. The player should not continue seeing a full theatrical one-falls-two-grow cycle on every click. Instead, the encounter enters a perceptual stalemate:

> CUT → immediate replacement / recovery → still 81

The important feeling is that the player is cutting successfully, but the overall problem is not getting smaller.

At cap, cutting should still feel tactile and satisfying while the count remains brutally unchanged:

> satisfying hit feedback + no numerical progress

Continued cutting at cap can still contribute to NP. This prevents the cap from becoming a deadlock and lets 81 function as a temporary **NP charging wall / stalemate state**.

The preferred pacing is that an ordinary player tends to reach full NP somewhere in the **70–81 head region**, rather than being forced to hit 81 first.

---

## 4. NP / Noble Phantasm — temporary cancellation of Hydra law

### Confirmed

NP capacity is currently treated as:

> **66 NP**

Manual cutting currently contributes to NP accumulation.

When NP is released, Hydra regrowth is disabled for the duration. Heads severed during NP are **not queued for later regrowth** and are not restored when the effect ends.

The important player-facing interpretation is not merely increased DPS but:

> **For a short window, Hydra stops obeying the rule that makes it Hydra.**

### Confirmed base duration

The initial Noble Phantasm window is only:

> **3 seconds**

This comically short duration is intentional. The first Noble Phantasm should feel powerful because Hydra law is turned off, but also provoke a reaction close to:

> 寶具解放！ → 狂砍 → 「蛤？三秒就沒了？」

Command Spell I does not extend this duration. Noble Phantasm duration progression begins only under Command Spell II.

### Noble Phantasm presentation

The activation control is presented as a card / textual action:

> **寶具解放**

followed by:

> **ナインライブズ**  
> **射殺す百頭**

The Fate / Nine Lives reference is intended to remain a reusable content language rather than a one-off joke.

---

## 5. NP as time stop

### Provisional, strongly preferred

NP may be presented as a literal or near-literal **time-stop state** rather than only a regeneration-disable buff.

During NP:

- Hydra regrowth is disabled;
- heads cut during NP permanently remain cut;
- the player remains able to cut manually;
- autonomous cutting / APS participation may depend on later progression rather than being assumed active from the start;
- visual color, motion, sound, or UI state should make the stopped state legible.

### Confirmed timer visibility

The NP window should display a visible countdown timer. Preferred presentation is a **small stopwatch / compact precise countdown** near an edge of the play area, visually secondary to the Hydra. Top-center is currently the preferred candidate because it avoids the thumb / action zone, but exact placement remains open to visual testing.

The three-second window should read numerically enough to make its absurd brevity obvious.

### Confirmed end-of-window behavior

When NP ends, normal Hydra rules should visibly resume rather than silently returning in the background:

> stopped world → resume cue → normal color / motion returns → ordinary Hydra regrowth rule becomes active again

This can evoke a DIO-like time-resume joke without requiring explicit explanatory text.

---

## 6. First Hydra II NP loop

### Confirmed target experience

The first Hydra II NP is **not required to guarantee a kill**.

The preferred outcome is skill-sensitive:

- a player using near-full-speed two-thumb clicking may be able to kill Hydra II in one three-second NP window;
- a more typical player may require two or more NP cycles;
- neither outcome should feel like failure.

A likely encounter arc is:

> ~9 heads
> → normal cutting reveals delayed regrowth
> → the population rises
> → NP approaches full around 70–81
> → cap, if reached, becomes a satisfying 81 → 81 stalemate
> → NP reaches 66
> → **寶具解放**
> → 3-second time-stop / rule-cancellation window
> → for the first time the count falls continuously
> → strong manual player may finish; typical player may leave survivors
> → time visibly resumes
> → ordinary cutting again creates regrowth pressure
> → another cycle if needed

The core cathartic contrast is:

> **81 → 81 → 81 ...**
>
> then
>
> **81 → 80 → 79 → 78 ...**

---

## 7. Command Spell progression

### Confirmed SAO quote order and deliberate mismatch

The Command Spell texts deliberately preserve the Sword Art Online boss-fight quote order:

1. first the request to hold for ten seconds;
2. later the demand to go faster.

The quote order is part of the joke and should **not** be rearranged merely to match the mechanical effects more literally.

### Command Spell I — APS / throughput

> **「幫我撐十秒。」**

### Confirmed effect

Command Spell I is the **APS / autonomous cutting progression**, despite the text sounding like it should extend time.

Player-facing purpose:

- introduce / escalate autonomous cutting throughput;
- preserve manual clicking so the player can interleave their own taps with APS;
- keep the Noble Phantasm itself stuck at the ridiculous base **3 seconds**;
- create a deliberate double-edged experience in Hydra II: more APS means more throughput and NP generation, but outside NP it also means more cuts causing more regrowth.

### Confirmed learning arc

The intended reading is:

> **At first APS can feel like a disaster; once the player understands the NP rhythm, the same automation becomes something they can exploit.**

So Command Spell I initially accelerates both the player and the problem.

Command Spell I does **not** extend NP duration.

---

### Command Spell II — NP-only multistrike + time-stop progression

Preferred SAO-derived text:

> **「快點……再快點……！」**

Japanese presentation such as **「速く……もっと速く……！」** remains an alternate UI candidate.

### Confirmed first unlock

The first Command Spell II unlock gives the Noble Phantasm a recognizable multi-hit / technique feeling:

> **During NP only: 1 player click → 3 visible rapid cuts.**

This is not a global click multiplier.

Outside NP:

> **1 click remains 1 cut.**

The restriction is intentional. The multi-hit behavior belongs to the **Nine Lives / 射殺す百頭 fantasy** and should feel like the player has entered a special technique state after filling NP, rather than simply owning a permanent generic DPS multiplier.

### Confirmed multistrike presentation

Multiple cuts should be perceived as a **very fast visible sequence** — e.g. 鏘鏘鏘 — rather than as one click instantly subtracting an invisible batch number.

Later Command Spell II upgrades may raise the NP-only manual sequence further, with current candidate steps such as:

> 3 cuts / click → 6 cuts / click → 9 cuts / click

The exact unlock levels for 6 and 9 remain open.

### Confirmed NP-duration structure

Command Spell II is also the progression that upgrades time stop.

- NP begins at **3 seconds** before Command Spell II time upgrades.
- **Specific Command Spell II levels**, not every level, grant NP duration increases.
- Other levels can grant multistrike or other NP-specific bonuses.
- The maximum Command Spell II state reaches:

> **81 seconds of NP / time stop.**

The exact intermediate duration milestones and which levels grant them remain open; the design should not assume every `3^n`-themed level is purely a duration upgrade.

### Player-facing joke

The system keeps a deliberate mismatch:

- **「幫我撐十秒。」** gives APS and does not extend the three-second window;
- **「快點……再快點……！」** finally makes NP attacks genuinely faster through multistrike **and** is the progression where time stop itself starts becoming longer.

The source quote order therefore survives while the game reinterprets the lines in a deliberately crooked way.

---

### Later automation / SKIP beat

> **「這裡怎麼沒有 SKIP???」**

A later SKIP joke remains a candidate for allowing stronger automation during NP / time stop, turning an early manual technique window into a later automated massacre window. Exact placement remains provisional.

### Synchronization note

The exact relationship between these player-facing beats and core APS / progression rules outside `02_player_facing/` must be synchronized separately. This file does not rewrite implementation or core-rule files.

---

## 8. Hydra scale progression — powers of nine

### Confirmed direction

Hydra maximum scale may follow powers of nine:

> 9^1, 9^2, 9^3, ...

Early values can remain ordinary decimal numbers. Once ordinary decimal display becomes cognitively or comically unwieldy, the UI can switch to exponential notation such as:

> **9^n**

A useful natural breakpoint exists between Hydra IX and Hydra X:

- 9^9 = 387,420,489
- 9^10 = 3,486,784,401

The desired effect is a **change of perceived scale**, not merely a formatting optimization.

### Provisional conceptual arc

> snake head
> → many snake heads
> → crowd / mass
> → number
> → huge number
> → 9^n
> → tree
> → generation
> → mathematical structure

Hydra III does not necessarily need a new special rule. The same regrowth logic at a much larger cap (for example 9^3) may itself create the next experiential step.

---

## 9. Main visual head limit and abstraction

### Confirmed direction

The main Hydra view has a visual ceiling of approximately:

> **99 visible heads**

Above that scale:

- the main Hydra becomes a visual proxy for overwhelming multiplicity;
- the real numeric count may continue far beyond the visible heads;
- increasingly large counts can migrate toward compact mathematical notation.

The game should change how the player **perceives** Hydra instead of trying to render hundreds or millions of literal head sprites.

---

## 10. Tree view

### Confirmed direction

A tree representation becomes available around Hydra III / the next major scale step and simplifies as scale grows.

### Current progression hypothesis

**Early — observation:** tree view acts as an X-ray / data visualization while play remains in the normal Hydra view.

**Later — understanding:** generations / branches become meaningful structural information.

**Much later / endgame — operation:** selecting a generation, branch, or structural location to cut may become an endgame mechanic.

Direct tree interaction is intentionally deferred.

---

## 11. Hydra death / corpse overlap

### Confirmed visual direction

When a Hydra is killed:

1. the body loses tension;
2. it becomes limp / ragdoll-like / plush-like;
3. it begins fading out;
4. the next Hydra may enter **before the previous corpse has disappeared**.

Fast early kills may therefore visibly pile up multiple Hydra bodies.

The game does not currently need to explain whether successive Hydras are reincarnations, separate organisms, clones, stages, or something else. The unexplained overlap itself can create dark comedy and narrative ambiguity.

---

## 12. Current player-facing progression hypothesis

One useful working model is:

> **Manual suppression → self-created pressure → cap stalemate → 3-second NP rule-breaking window → APS that initially accelerates both player and problem → learned NP rhythm → NP-only multistrike / longer time-stop control → scale abstraction → structural understanding**

The meaning of a head transforms roughly as:

> enemy → pressure → NP input / resource → population → abstract quantity → leaf of a structure

The player's power transforms roughly as:

> hand → extra autonomous hands → special NP technique where one click becomes many visible cuts → increasingly controlled stopped time → later automation inside the stopped world

---

## 13. Open design questions

1. **Hydra II regrowth timing below cap:** how long should severed-head → regrowth delay be so cause remains legible under rapid play?
2. **Hydra II cap feedback:** what exact animation communicates successful cutting with no population progress without visual exhaustion?
3. **Three-second NP lethality:** how many heads do real near-full-speed two-thumb players remove in 3 seconds, and does that produce the desired one-cycle / multi-cycle split?
4. **Command Spell I readability:** how should APS cuts and manual clicks coexist visually / aurally so automation feels like extra hands rather than background noise?
5. **Command Spell II ladder:** at which levels do NP duration upgrades occur, when do 6-cut / 9-cut sequences unlock, and what other NP-only rewards belong between them?
6. **NP timer placement:** top-center is preferred, but should the compact timer display tenths or hundredths?
7. **Hydra III tree reveal:** what exactly does the first tree view expose?
8. **Text / micro-story:** how much Souls-like encounter naming / death text should coexist with corpse-conveyor dark comedy?
9. **Visual abstraction >99:** what exact grammar communicates continued growth once literal head rendering stops?
10. **Sound:** what should cutting, regrowth, cap stalemate, NP time stop, multistrike, and time resume sound like under high-frequency play?
