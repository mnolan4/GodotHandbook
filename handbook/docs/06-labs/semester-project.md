# Semester project

This ten-week project brief can be used by a class, student organization, or independent study group. It evaluates concrete development outcomes: a working project structure, responsive controls, clear communication between systems, persistent data, playtesting, and a distributable release build. The final checklist can also serve as an assessment rubric.

## The game

A single-player 2D game that can be completed in under ten minutes. In addition to movement, choose one primary interaction such as collecting, attacking, hiding, talking, or solving a switch-based puzzle. Suitable scopes include a platformer that collects parts for a door, a small stealth level, or a three-fight turn-based encounter preceded by one conversation.

Out of scope, on purpose: multiplayer, an open world, a custom engine feature, a tool pipeline longer than the game.

## Weeks

| Week | Outcome | Handbook |
| --- | --- | --- |
| 1 | Editor installed, project in git, input actions named, a scene that runs | Setup, Start here |
| 2 | A body moves on the physics tick and collides with a tilemap | Platformer, Input and physics |
| 3 | One custom signal from a child to a parent. A HUD that only listens | Nodes and signals, Patterns |
| 4 | Collectible ids and a save file in `user://` that survives restart | Collectibles and saves |
| 5 | Either dialogue with one flag, or a turn order with three units | Dialogue and turns |
| 6 | A pause menu that remains interactive while gameplay is paused, one animation, and one configured audio bus | UI, animation, audio |
| 7 | A responsiveness and presentation pass: coyote time, input buffering, camera smoothing, or equivalent feedback appropriate to the genre | Platformer, the diagrams |
| 8 | Playtest with two people who are not you. Write down where they failed | — |
| 9 | Fix the playtest notes. Cut a feature rather than add one | Debug and performance |
| 10 | Release export, version noted, credits, a README with controls | Export |

C# projects follow the same milestones because the underlying Godot concepts are language-independent. Read each GDScript example to understand the relevant nodes and engine lifecycle, then use [From Unity](../03-csharp/from-unity.md) to implement the behavior in C#. Prioritize a working vertical slice over translating examples that the project does not yet use.

## Repository

```
README.md          # version, controls, how to run the export
project.godot
scenes/ scripts/ resources/ assets/
exports/           # the build you actually hand in, or a link
```

The project README should state the exact Godot version, the required editor build (standard or .NET), the controls, the game objective, instructions for running the project or export, and known limitations. This information allows an instructor or collaborator to reproduce the intended environment without relying on prior conversation.

## Checklist

- F5 from a fresh clone opens the game, after Godot imports.
- Main scene is set. No one's path is `C:/Users/you/...`.
- At least one signal you declared, not only built-in `pressed` on a button you forgot to mention.
- Save uses `user://` and a version field.
- No `@export` combined with `@onready` on the same variable.
- Player motion is in `_physics_process` or `_PhysicsProcess`.
- A second person completed the goal once.
- Release export launches with the editor closed.

## If you are stuck

Run the smallest relevant scene with F6 and verify one boundary at a time. For example, if collecting a coin does not emit or print its id, diagnose the coin and its signal connection before investigating save serialization. Once that boundary works, continue outward to the level, persistent state, and interface.
