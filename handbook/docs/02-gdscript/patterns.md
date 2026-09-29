# GDScript patterns

The patterns in this chapter reduce coupling between scenes, keep runtime state separate from reusable data, and make systems easier to test or replace. They are practical design tools rather than mandatory formatting rules. Apply a pattern when it solves a specific dependency or maintenance problem; avoid adding abstraction that the project does not yet require.

## One scene, one job

`player.tscn` knows how a player moves and what it emits (`died`, `landed`). It does not load the next level. The level, or a small scene-flow autoload, does that.

If a script mentions five unrelated nodes by path, it is doing five jobs. Split it.

## Autoload, sparingly

Project Settings → Autoload. A script or scene on this list is created at startup and lives until the game exits.

Good autoloads:

- an event bus (`Events.gd`) that only declares signals
- a save game service
- scene changing, if more than one place needs it

Bad autoloads:

- the player
- the current level
- a broad "god object" such as `GameManager` that combines unrelated responsibilities in one globally accessible API

```gdscript
# events.gd
extends Node

signal coin_collected(id: StringName)
signal player_died
```

Anyone can `Events.coin_collected.emit(id)` without holding a reference. Listeners must disconnect in `_exit_tree` if they are not autoloads themselves.

## Resources for data

A custom resource is a typed file you can edit in the Inspector. Use it for items, enemy stats, and dialogue. Use it instead of a 200-line dictionary literal.

```gdscript
extends Resource
class_name ItemDef

@export var id: StringName
@export var title: String
@export var max_stack: int = 1
```

Create a `.tres` in the FileSystem (New Resource → ItemDef). Scenes reference the resource. Balancing no longer requires a code change.

## State as an enum, then as nodes if it grows

```gdscript
enum State { IDLE, RUN, JUMP }
var state := State.IDLE

func _physics_process(delta: float) -> void:
	match state:
		State.IDLE:
			pass
		State.RUN:
			pass
		State.JUMP:
			pass
```

When each state develops its own timers, animations, and transition rules, give each state a child node with `enter()`, `exit()`, and `physics_update(delta)` methods. The parent then owns the active-state reference and performs transitions. For a small set of simple states, an enum and `match` statement are easier to inspect and maintain; introduce state nodes when the state-specific logic has become difficult to navigate in one function.

## Signal up, call down

Repeated because it fails quietly. Parents may call `child.play("run")`. Children may `landed.emit()`. Children may not call `get_parent().start_next_wave()`.

## Cache node references used every frame

```gdscript
@onready var sprite: Sprite2D = $Sprite2D

func _process(delta: float) -> void:
	sprite.rotation += spin * delta
```

`$Sprite2D` inside `_process` is a search. `@onready` is one search.

## Timers you can read

```gdscript
func _physics_process(delta: float) -> void:
	coyote = maxf(coyote - delta, 0.0)
```

Subtract `delta`. Do not write `if coyote == 0.0` after a float countdown. Use `coyote <= 0.0` or `is_zero_approx`.

`get_tree().create_timer(0.5).timeout` creates a one-shot timer without adding a permanent node, which is useful for a short delay inside an asynchronous function. Use a `Timer` node when the duration should be editable in the Inspector, when the timer repeats, or when multiple nodes need to connect to its `timeout` signal.

## Scene changes

```gdscript
func go_to_level(path: String) -> void:
	get_tree().change_scene_to_file(path)
```

That frees the current scene at a safe point. Autoloads remain. Anything you stored only on the level is gone, which is why collected ids live on the save service and not on the coin nodes.

For a loading screen, load the next scene asynchronously, instantiate it after the request completes, and then remove the old scene. `change_scene_to_file` remains the simpler default until synchronous loading produces a measurable or visible pause.

## What to stop doing

| Habit | Do this instead |
| --- | --- |
| `get_node` every frame | `@onready` |
| String `connect("pressed", ...)` | `pressed.connect(_on_pressed)` |
| `print` as production logging | `push_error` / `push_warning`, prints only in debug builds |
| Saving `NodePath`s as identity | Save a stable id |
| `@export` and `@onready` on one variable | Pick one |
| Mutating a dictionary while iterating it | Iterate a duplicate of the keys |
| Gameplay in `_process` that moves a body | `_physics_process` and `move_and_slide` |
| One autoload that knows every scene path | A scene table resource, or constants next to the flow script |

## Lab

Make `Events.gd` an autoload with `signal score_changed(total: int)`. A coin emits its own `collected` signal. The level listens, updates a score variable, and emits `Events.score_changed`. A HUD listens to the autoload. The coin script must not mention the HUD or the autoload.
