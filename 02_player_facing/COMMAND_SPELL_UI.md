# Command Spell UI — Player-Facing Proposal

> Status: provisional player-facing UI / interaction proposal.
>
> This file defines how the three Command Spells should be presented and purchased from the player's point of view. It does not define implementation details.

## 1. Core layout idea

The Command Spell system should be visually presented as a **fixed three-slot container** rather than as a generic skill tree or scrolling upgrade list.

There are two distinct player-facing surfaces:

### Combat HUD

A small group of **three Command Spell icons**, visually reminiscent of how FGO presents the Master's Command Spell marks.

Purpose:

- show which of the three major Command Spells currently exist / are owned;
- provide immediate combat-state identity;
- remain compact and readable during tapping;
- **not** serve as the primary purchase / level-up interface.

The combat HUD should feel like a status emblem rather than a shop.

### Command Spell panel

Elsewhere in the interface, a dedicated area carries a faint Chinese title:

> **令咒**

and permanently reserves **three visual slots**:

> `[ I ]   [ II ]   [ III ]`

All three slots exist from the beginning, but initially read as empty / dormant spaces.

The player therefore learns very early that the system contains exactly three major Command Spells, without seeing their future mechanics or upgrade trees.

---

## 2. Fixed three-slot principle

### Confirmed direction

Each Command Spell occupies **exactly one slot**, regardless of how many internal levels it later receives.

Therefore:

- Command Spell I occupies one slot;
- Command Spell II occupies one slot;
- Command Spell III occupies one slot;
- APS upgrades do not expand into separate cards;
- multistrike / time / efficiency upgrades under Command Spell II do not become separate visible branches on the main panel.

The player-facing complexity is kept inside the detail modal for that one Command Spell.

The main interface should always preserve the simple mental model:

> **There are three Command Spells.**

---

## 3. Initial dormant state

All three slots are present from the beginning.

Before a Command Spell becomes affordable / available:

- its slot remains visually empty or heavily ghosted;
- the faint 「令咒」 panel is already visible;
- the slot should feel intentionally dormant, not broken;
- there is no active purchase button yet;
- the future exact effect does not need to be exposed.

The intended feeling is:

> **the interface already has a place waiting for something that does not yet exist for the player.**

---

## 4. Availability appears when eligibility and affordability meet

### Confirmed direction

A Command Spell does not appear merely because the player has enough currency in an unrelated earlier chapter. Its slot becomes a real purchase affordance when **both** are true:

1. the relevant gameplay eligibility condition has been reached;
2. the player has enough Humanity Evil for that Command Spell's first purchase.

Before both conditions are satisfied:

> empty / dormant slot

When both become true:

> real sigil / purchase button appears and lights clearly

The game does not need to force-open the detail modal; the player chooses to inspect and buy it.

### Command Spell I first reveal

For Command Spell I, the gameplay eligibility condition is already active in Hydra I. Therefore its first visible reveal is effectively governed by affordability:

> Humanity Evil reaches **99**
> → first slot updates from empty to a bright purchasable sigil

### Command Spell II first reveal — hard anti-softlock rule

Command Spell II must **not** require the player to kill a Hydra II before it can be purchased.

This is a progression safety invariant:

> **Command Spell II first purchase requires zero Hydra II kills.**

Preferred first-encounter sequence:

> Hydra II encounter 1 begins at 9 heads  
> → first manual cut reveals the reversal: `9 → 10` / `CUT 1 → GROW +2`  
> → while that same first Hydra II is still alive, Command Spell II becomes eligible  
> → if the player already holds enough Humanity Evil, slot II immediately changes from empty to a bright purchasable sigil

The ideal trigger is therefore the **first Hydra II cut / rule-reversal reveal milestone**, not `Hydra II kills >= 1`.

Reason:

- the first Hydra II is precisely where the player discovers that the old solution has failed;
- requiring that Hydra to be killed before selling the new solution can create a softlock / restart trap;
- the desired teaching rhythm is **problem appears → new option appears**, not **problem must already be solved → solution unlocks**.

### Command Spell II affordability safety

The first Command Spell II price must also be low enough that a normal player entering Hydra II after following the intended Hydra I economy can actually afford it when the first-cut reveal occurs.

Under the current provisional economy, a player who buys Command Spell I through 27 APS is expected to carry roughly **792 Humanity Evil** into Hydra II. Therefore the first Command Spell II purchase should be comfortably below that guaranteed / intended entry reserve. The earlier **297 Humanity Evil** first-level candidate satisfies this safety target, but exact pricing remains subject to economy playtest.

The important invariant is stronger than the exact number:

> **Do not price the first Command Spell II level above the minimum Humanity Evil that the intended Hydra I progression guarantees at Hydra II entry.**

If later Hydra I side-spending is introduced, this guarantee must be rechecked rather than silently allowing the first Hydra II encounter to become an economy trap.

### Command Spell III

Command Spell III should use the same eligibility + affordability grammar, but its gameplay eligibility condition is intentionally still open.

---

## 5. First purchase modal

Tapping the newly available sigil opens a detail modal / pop-up.

The modal should contain at minimum:

- Command Spell name / quote;
- acquisition state or current level;
- concise mechanical description;
- Humanity Evil cost;
- **Purchase** button;
- **Cancel / Close** button.

For Command Spell I the current text identity is:

> **「幫我撐十秒。」**

For Command Spell II the current text identity is:

> **「快點……再快點……！」**

with Japanese **「速く……もっと速く……！」** as an alternate presentation candidate.

The quotes remain separate from the mechanical descriptions so the SAO-reference mismatch can remain part of the joke.

Example Command Spell I structure:

> 「幫我撐十秒。」  
> Command Spell I  
> Lv.0 → Lv.1  
> Effect: unlock / increase Auto Slash  
> Cost: 99 Humanity Evil

Example Command Spell II first purchase structure:

> 「快點……再快點……！」  
> Command Spell II  
> Lv.0 → Lv.1  
> Effect: during Noble Phantasm only, 1 click → 3 rapid visible cuts  
> Cost: XXX Humanity Evil

The modal should explain the mechanical delta without rewriting the joke-text into literal mechanics.

---

## 6. Purchased state and LV UP

After purchase:

- the sigil remains permanently visible in its slot;
- that slot is no longer treated as an empty mystery slot;
- a compact **LV UP** affordance appears;
- the next Humanity Evil requirement is visible nearby;
- clicking / tapping the owned sigil opens the same detail-modal pattern.

The main panel should not expose the entire internal upgrade sequence.

Example compact state:

> `[令咒 I]`  
> `Lv.2`  
> `LV UP · 396 人類惡`

---

## 7. Owned but unaffordable upgrade state

### Confirmed direction

Once a Command Spell has been purchased, its upgrade button / sigil **never disappears back into an empty slot**.

If the player cannot afford the next level:

- the same button remains present;
- the slot remains identifiable as that Command Spell;
- the visual treatment becomes dim / low-saturation / ghosted, similar in brightness to an empty slot;
- the next required Humanity Evil amount remains readable;
- the detail modal can still be opened;
- the purchase / LV UP action inside the modal is unavailable until sufficient Humanity Evil is held.

This produces an important distinction:

> **empty slot = this Command Spell has not entered the player's system yet**
>
> **dim owned slot = this Command Spell exists, but the next upgrade is currently unaffordable**

The geometry stays stable; only state and brightness change.

---

## 8. Affordable upgrade state

When the player gains enough Humanity Evil for the next level:

- the previously dim owned slot becomes clearly lit again;
- `LV UP` becomes visually active;
- the transition should be obvious enough to notice during play;
- no forced modal is required.

The important contrast is therefore:

> dim / dormant-looking while poor  
> → clearly lit when affordable

This is intentionally stronger than a tiny badge or subtle mobile-game notification dot.

---

## 9. Level-up modal behavior

The level-up modal should emphasize **current → next**.

Example for Command Spell I:

> Current: 9 APS  
> Next: 27 APS  
> Change: +18 APS  
> Cost: XXX Humanity Evil

Example for Command Spell II multistrike:

> Current NP manual strike: 1 cut / click  
> Next: 3 rapid cuts / click during Noble Phantasm only  
> Cost: XXX Humanity Evil

Example for time-stop progression:

> Current: 9 s  
> Next: 27 s  
> Cost: XXX Humanity Evil

Restrictions such as **"during Noble Phantasm only"** belong in this modal rather than cluttering the persistent panel.

---

## 10. Command Spell II and III use the same interaction grammar

All three Command Spells use the same simple lifecycle:

> permanent empty slot  
> → gameplay eligibility reached  
> → first purchase becomes affordable  
> → sigil / purchase affordance appears and lights up  
> → click opens detail modal  
> → purchase  
> → persistent owned sigil + LV UP  
> → unaffordable next level = same slot dimmed  
> → affordable again = same slot lights up  
> → MAX

Command Spell II does **not** expose its multistrike, NP efficiency, and time progression as separate main-panel branches.

Command Spell III should follow the same one-slot simplicity even if its internal mechanics later become unusual.

---

## 11. MAX state

At MAX:

- `MAX` replaces `LV UP`;
- the sigil remains fully established;
- no purchase affordance remains;
- MAX should visually read as completion, not as another disabled / unaffordable state.

A MAX Command Spell should therefore be visually distinct from both:

- an empty slot;
- a dim owned-but-unaffordable slot.

---

## 12. Information hierarchy

### Combat HUD answers

1. How many of the three Command Spells do I currently possess?
2. What is my Command Spell identity during combat?

### Command Spell panel answers

1. Which of the three slots are empty, purchasable, owned, upgradable, or MAX?
2. Which upgrade can I currently afford?
3. Roughly what is the next Humanity Evil requirement?

### Detail modal answers

1. What is this Command Spell called?
2. What does the current level do?
3. What exactly changes at the next level?
4. What does it cost?
5. Do I want to spend Humanity Evil now?

This keeps the surface simple even when the underlying economy becomes deep.

---

## 13. Why this UI fits the resource-allocation design

The three fixed slots make Humanity Evil allocation visible without turning the game into a conventional RPG skill-tree screen.

A player may simultaneously see:

> Command Spell I — owned, next APS upgrade unaffordable / dim  
> Command Spell II — newly affordable / bright  
> Command Spell III — still empty

That creates a direct economic question:

> **Do I spend Humanity Evil here now, or save it for another Command Spell?**

Crucially, the player is choosing between **three persistent systems**, not between dozens of individual upgrade cards.

---

## 14. Remaining open UI questions

1. Exact placement of the FGO-like three-icon group in the combat HUD.
2. Exact placement / scale of the larger 「令咒」 three-slot panel.
3. Whether first affordability should include a one-time short animation / sound in addition to the slot lighting up.
4. How visually distinct the three Command Spell sigils should be while still reading as one coherent set.
5. Exact appearance of the dim owned-but-unaffordable state versus the truly empty dormant state.
