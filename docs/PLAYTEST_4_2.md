# Playtest 4.2 — NP Countdown + Command Spell II Technique Prototype

## Scope

Playtest 4.1 established NP as a 3-second manual-only time-stop window:

```text
NP active
→ Hydra head growth disabled
→ Auto Slash paused
→ Manual Cut remains available
```

Empirical feedback on Hydra II was that three seconds of pure manual cutting can feel like it "cannot cut through" the problem. This is not yet treated as a reason to lengthen NP. Player-facing design already suggests a second Command Spell technique, so Playtest 4.2 tests that missing layer first.

## A. NP window projection

`NP System` now exposes derived window status:

```js
{
  active,
  startsAt,
  endsAt,
  remainingMs
}
```

`remainingMs` is derived from simulation time and active NP modifiers. It is not persistent state and does not own lifecycle timing.

View projects this as a small `3.0 → 0.0` countdown. No View timer determines expiry.

## B. Command Spell II prototype

Only the first player-facing effect is implemented for testing:

```text
outside NP:
1 manual tap → strikeCount 1

inside NP + Command Spell II Lv.1 prototype:
1 manual tap → strikeCount 3
```

Important semantics:

- This is one Manual Attack Request containing `strikeCount: 3`.
- Combat still resolves each strike independently.
- Hydra II + NP therefore receives three real `head:cut` events and moves `9 → 8 → 7 → 6`.
- A terminal kill stops the batch at the killing strike.
- It is not implemented as `heads -= 3`.
- Auto Slash remains paused for the whole NP window.

## C. Prototype progression boundary

The player-facing effect is testable through a milestone:

```text
command-spell-2-lv1
```

but its formal economy is intentionally not implemented.

Still undecided:

- unlock encounter / generation-local kill threshold
- Humanity Evil cost
- later ×6 / ×9 steps
- NP duration upgrades
- whether a later Command Spell level allows Auto Slash during NP

TEST can add the milestone session-only without inventing kills or currency.

No state schema bump is required because the prototype uses the existing `progression.milestones` array.

## D. Visual contract

Player-facing requirement is multiple visible cuts, not only a bulk logical result.

For a manual request with `strikeCount > 1`:

```text
Combat
→ separate attack:resolved events

Application
→ reads request strikeCount on strikeIndex 0

Berserker View
→ projects the request as a rapid multi-strike weapon animation
```

The animation never decides damage and never schedules gameplay cuts.

## E. TEST path

Current useful sequence:

```text
TEST
→ COMMAND SPELL II · ×3 NP
→ NP READY
→ reach / enter Hydra II
→ NP RELEASE
→ tap stage
```

`MAX COMMAND SPELL` may remain enabled, but Auto is intentionally paused during NP.

## F. Automated tests

Required behavior:

```text
NP countdown:
release at t=0 → remaining 3000ms
advance 100ms → 2900ms
expiry → inactive / remaining 0

Command Spell II:
outside NP + unlocked → tap = 1 cut
inside NP + unlocked  → tap = 3 separate cuts
Hydra II 9 + NP + tap → 6

Economy:
TEST unlock changes no lifetime kills, Humanity Evil or APS

View:
countdown pointer-events none
countdown uses runtime simulation window status
multi-strike animation is View-only
```

## Playtest questions

1. Does ×3 turn Hydra II from "cannot cut through" into a useful but still pressured three-second window?
2. Is the visible countdown funny/tense or distracting?
3. Does one tap visibly read as three cuts on iPhone?
4. If ×3 feels right, when does the player naturally wish they had it? Use that observation to set the real unlock and cost later.
