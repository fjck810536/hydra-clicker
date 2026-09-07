# Command Spell UI — Player-Facing Proposal

> Status: provisional player-facing UI / interaction proposal.
>
> This file defines how the three Command Spells should be presented and purchased from the player's point of view. It does not define implementation details.

## 1. Core layout idea

The Command Spell system should be visually presented as a **three-slot container** rather than as a generic skill tree or scrolling upgrade list.

Recommended composition:

- one compact area shows **three Command Spell icons / slots** corresponding to Command Spell I, II, and III;
- another nearby area contains a faint, low-contrast title text: **「令咒」**;
- beneath / beside that title, the interface visually implies **three reserved slots** even before all three Command Spells are available;
- empty slots should look intentionally empty, not broken or disabled by accident.

Player-facing purpose:

> the player knows from early on that there are three major Command Spell objects, but does not yet know what all three will become.

This supports anticipation without exposing the full upgrade tree.

---

## 2. Empty / locked state

Before a Command Spell can be purchased:

- its slot remains visually empty or ghosted;
- the faint 「令咒」 container remains visible;
- the player should not see a long list of future level rewards;
- the slot may show only minimal locked / dormant visual language.

The goal is:

> **reserved mystery, not disabled-menu clutter.**

The player should feel that the interface is waiting for something to appear there.

---

## 3. First Command Spell purchase reveal

When Humanity Evil first reaches the required purchase threshold for Command Spell I (currently discussed around **99 Humanity Evil**):

1. the first previously empty Command Spell slot gains the Command Spell I sigil / icon;
2. this should read as **something becoming available**, not as an automatic purchase;
3. the player can tap / click the newly visible sigil;
4. a detail modal / pop-up opens.

The purchase modal should contain at minimum:

- Command Spell name / quote;
- current level or acquisition state;
- concise effect description;
- Humanity Evil cost;
- **Purchase** button;
- **Cancel / Close** button.

For Command Spell I the text identity is currently:

> **「幫我撐十秒。」**

The text should remain separate from the mechanical description so that the SAO-reference mismatch can remain part of the joke.

Example player-facing structure:

> 「幫我撐十秒。」  
> Command Spell I  
> Lv.0 → Lv.1  
> Effect: unlock / increase Auto Slash  
> Cost: 99 Humanity Evil

The modal should explain what the upgrade does without rewriting the joke-text into literal mechanics.

---

## 4. Purchased Command Spell state

After purchase:

- the Command Spell sigil remains permanently visible in its slot;
- the slot now represents a persistent owned system rather than a one-time item;
- a compact **LV UP** label becomes visible on or near the sigil;
- the next upgrade cost is shown compactly nearby, preferably as:

> **LV UP**  
> `next cost / Humanity Evil`

The persistent HUD should stay compact. It should not display the full effect description, all future levels, or the entire branch tree at once.

Clicking / tapping the owned Command Spell opens the same detail modal pattern used for the first purchase.

The modal then shows:

- current level;
- next level;
- exact change from current → next;
- next cost;
- Purchase / Cancel.

This keeps the main play screen visually clean while making detailed information available on demand.

---

## 5. Level-up modal behavior

The level-up modal should emphasize **delta**, not just the new total.

Example for Command Spell I:

> Current: 9 APS  
> Next: 27 APS  
> Change: +18 APS  
> Cost: 891 Humanity Evil

Example for Command Spell II:

> Current NP manual strike: 1 cut / click  
> Next: 3 rapid cuts / click during Noble Phantasm only  
> Cost: XXX Humanity Evil

For time-stop upgrades:

> Current: 9 s  
> Next: 27 s  
> Cost: XXX Humanity Evil

The modal is the correct place for exact numbers and restrictions such as **"during Noble Phantasm only"**.

---

## 6. Command Spell II / III use the same interaction grammar

Command Spell II and Command Spell III should use the same interaction pattern as Command Spell I:

> empty / dormant slot  
> → availability threshold reached  
> → sigil becomes purchasable  
> → click opens detail modal  
> → purchase  
> → permanent sigil + LV UP state  
> → future upgrades through the same modal

This consistency is important because the **content and mechanics can become increasingly strange while the interaction remains stable**.

The player should not need to learn a new shop UI for each Command Spell.

---

## 7. Recommended information hierarchy

Main play HUD should answer only:

1. Which Command Spells exist / are owned?
2. Which one can currently be purchased or leveled?
3. Roughly how much Humanity Evil does the next upgrade cost?

The detail modal answers:

1. What is this Command Spell called?
2. What exactly does my current level do?
3. What exactly will the next level change?
4. What does it cost?
5. Do I want to buy it now?

This keeps resource allocation legible without turning the main screen into an RPG character sheet.

---

## 8. Availability / affordability visual states

Each slot should distinguish at least these player-facing states:

### A. Dormant / not yet available

- empty or ghosted slot;
- no purchase action;
- minimal mystery.

### B. Revealed but unaffordable

- sigil visible;
- next cost visible;
- purchase modal can be opened;
- Purchase button clearly unavailable because Humanity Evil is insufficient.

This state is desirable. It allows the player to see long-term goals such as a much more expensive APS upgrade before they can afford it.

### C. Affordable

- subtle but clear readiness cue;
- no mandatory pop-up;
- slot / LV UP label gains emphasis;
- player chooses when to inspect and purchase.

### D. Purchased / current level active

- permanent sigil;
- current level shown compactly;
- next cost shown.

### E. MAX

- `MAX` replaces `LV UP`;
- no purchase affordance;
- sigil remains visible as a completed major progression object.

---

## 9. Do not auto-open the purchase modal at threshold

Recommended behavior:

When Humanity Evil crosses a purchase threshold, the Command Spell slot becomes available and gains a visible cue, but the game should **not forcibly interrupt play with a modal**.

Reason:

- the player may be in the middle of rapid tapping or NP timing;
- purchase is a resource-allocation decision, not a tutorial confirmation;
- the player should feel that Humanity Evil belongs to them and can be saved.

The reveal can be noticeable, but opening the detailed modal should remain a player action.

---

## 10. Why this structure fits the economy

The three-slot Command Spell container supports the planned economy better than a single linear upgrade track.

The player may simultaneously see:

- Command Spell I: expensive APS level-up;
- Command Spell II: multistrike / NP efficiency / time-stop upgrades;
- Command Spell III: future unknown branch.

Humanity Evil therefore becomes a real allocation resource:

> **Which Command Spell do I feed next?**

The fixed three-slot interface makes that choice visible without exposing dozens of individual upgrade cards at once.

---

## 11. Open questions

1. At what exact gameplay milestone should Command Spell II's dormant slot become a real purchasable sigil?
2. Should Command Spell III's slot be visible as an empty reserved slot from the beginning, or only appear after Command Spell II is acquired?
3. Should the faint 「令咒」 text sit behind the three slots as decorative typography, or function as the title of a dedicated small panel?
4. How strong should the affordability cue be when Humanity Evil becomes sufficient: glow, pulse, sound, badge, or only color/value change?
5. When an expensive next level is revealed but unaffordable, should the player see only the price, or also the exact future effect?
6. Should each Command Spell have a distinct sigil / visual identity while still sharing the same interaction grammar?
