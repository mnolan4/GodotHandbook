# GDScript reference

GDScript is Godot's built-in scripting language. Its indentation-based syntax resembles Python, while its types, annotations, signals, and lifecycle callbacks are designed specifically for the engine. This chapter is a working language reference for Godot 4.7 (GDScript 2.0). Godot 3 tutorials that use `export`, `onready`, and `yield` require migration; the corresponding Godot 4 forms are `@export`, `@onready`, and `await`.

Type your variables and function returns. The editor catches mistakes before you play, and typed code runs faster.

## Files and types

A script starts by naming the node it sits on.

```gdscript
extends Node2D
class_name Spinner
```

`class_name Spinner` registers a global type. Other scripts can then write `var s: Spinner`. Use `class_name` for reusable concepts that need a stable project-wide type. Scene-local helper scripts usually do not need it; omitting it prevents duplicate or overly generic names such as `Player` from accumulating in the global type list.

## Variables

```gdscript
var hp: int = 10
var speed: float = 200.0
var title: String = "Level 1"
var alive: bool = true
var direction := Vector2.RIGHT   # := infers the type from the value
const MAX_HP := 10
```

Inference with `:=` is still a static type. Prefer it when the right-hand side is obvious.

`StringName` (often written `&"jump"`) is the right type for keys you compare every frame: input actions, animation names, dictionary keys in hot paths. Plain `String` allocates more and compares more slowly.

## Operators and control flow

```gdscript
if hp <= 0:
	die()
elif hp < 3:
	play_low_health()
else:
	play_idle()

match state:
	State.IDLE:
		stand()
	State.RUN:
		run()
	_:
		push_error("Unknown state")

for i in range(3):
	print(i)

for child in get_children():
	child.queue_free()

while packets > 0:
	packets -= 1
```

Indentation is syntax, as in Python. Use tabs; the editor inserts them.

There is no `++`. Write `i += 1`.

## Functions

```gdscript
func add(a: int, b: int) -> int:
	return a + b

func greet(name: String = "student") -> void:
	print("Hello, %s" % name)
```

A function without an explicit return type is dynamically typed. Add `-> void` when the function intentionally returns no value. Explicit return types document the function's contract and allow the parser to report accidental return values or incompatible call sites.

Call the parent implementation with `super.method()` or `super()`.

## Collections

```gdscript
var scores: Array[int] = [1, 2, 3]
scores.append(4)

var item := {
	"id": &"coin",
	"value": 1,
}
var coins: int = item["value"]
```

Typed arrays (`Array[int]`, `Array[PackedScene]`) reject the wrong element while you write. Untyped `Array` will not.

Do not add or remove dictionary keys while you iterate the dictionary. Iterate `keys().duplicate()` if you must delete.

```gdscript
for key in flags.keys().duplicate():
	if flags[key] == false:
		flags.erase(key)
```

## Frequently used engine types

| Type | What it is | Watch out |
| --- | --- | --- |
| `Vector2` | x, y | In 2D, **+Y points down** |
| `Vector3` | x, y, z | In 3D, +Y points up |
| `Color` | r, g, b, a in 0..1 | `Color.WHITE`, `Color.html("#c45c26")` |
| `NodePath` | a path stored as data | `$Sprite2D` is a shorthand `get_node` |
| `PackedScene` | a scene you can instance | `preload("res://scenes/coin.tscn")` |
| `Resource` | data, not a node in the tree | items, dialogue lines, stats |

Useful math, all frame-rate safe when you pass `delta` yourself:

```gdscript
var x := lerpf(a, b, 1.0 - exp(-speed * delta))
var v := move_toward(current, target, accel * delta)
var damped := clampf(value, 0.0, 1.0)
```

Use `is_equal_approx(a, b)` when two floating-point values should be considered equal within a small tolerance. Direct `==` comparisons can fail after arithmetic because many decimal values cannot be represented exactly in binary floating-point format.

## Enums

```gdscript
enum State { IDLE, RUN, JUMP }

var state: State = State.IDLE
```

Prefer an enum over stringly modes (`"idle"`, `"Idle"`, `"IDLE"`).

## Null, `is`, and `as`

```gdscript
var area := body as Area2D
if area == null:
	return
```

`as` returns null when the cast fails. Avoid performing a separate `is` check followed later by a cast, because the reference can become invalid between the two operations if the object is freed. Cast once, store the result, and check that result for null before using it.

`is_instance_valid(node)` is the check when a node might already be freed.

## Lambdas and Callable

```gdscript
button.pressed.connect(func() -> void:
	score += 1
)
```

A lambda that captures `self` can keep a node alive longer than you expect. For anything that outlives the current function, connect a real method and `disconnect` it when the node exits.

## Preload and load

```gdscript
const CoinScene := preload("res://scenes/coin.tscn")  # resolved at parse time
var maybe := load("res://resources/level_%d.tres" % index) as LevelData
```

`preload` only accepts a constant path. Use `load` when the path is computed. For large levels, `ResourceLoader.load_threaded_request` performs resource loading without blocking the main thread and helps prevent a visible frame pause. Scene-tree operations are not thread-safe: complete the resource request first, then instantiate and add nodes on the main thread, using `call_deferred` when necessary.

## Printing and errors

```gdscript
print("score ", score)
push_warning("Missing portrait for %s" % speaker)
push_error("Save version %d is newer than this build" % version)
```

`print` is for the hour you are debugging. `push_error` is for failures a player build should still report in the log. Strip leftover prints before you export, or gate them:

```gdscript
if OS.is_debug_build():
	print(state)
```

## Annotations you will use

```gdscript
@export var title: String = "Level 1"
@export_range(0.0, 20.0, 0.1) var zoom: float = 1.0
@export_enum("Easy", "Normal", "Hard") var difficulty: String = "Normal"
@export_file("*.json") var table_path: String
@export_group("Movement")
@export var speed: float = 200.0
@export var waves: Array[PackedScene] = []

@onready var sprite: Sprite2D = $Sprite2D
```

`@onready` runs when the node enters the tree, which is the first moment children exist. Do not read `$Sprite2D` from `_init()`.

Do not combine `@export` and `@onready` on the same variable. The exported value is deserialized from the scene, but the `@onready` expression assigns a new value when the node becomes ready, overwriting the Inspector value. Use `@export` for externally configured data and a separate `@onready` variable for node references.

`@tool` at the top of the file runs the script inside the editor. Guard gameplay:

```gdscript
@tool
extends Node2D

func _process(delta: float) -> void:
	if Engine.is_editor_hint():
		return
```

`@icon("res://icon.svg")` changes the icon of a `class_name` in the Create Node dialog.

## Comments and names

```gdscript
## Shown in the inspector tooltip.
@export var speed: float = 200.0
```

`##` is a documentation comment. `#` is a note to yourself.

Godot style is `snake_case` for methods and variables, `PascalCase` for classes and nodes, `SCREAMING_SNAKE` for constants.

## A compact legal script

```gdscript
extends Node
class_name Health

signal changed(current: int, maximum: int)

@export var maximum: int = 100
var current: int

func _ready() -> void:
	current = maximum
	changed.emit(current, maximum)

func apply_damage(amount: int) -> void:
	current = maxi(current - amount, 0)
	changed.emit(current, maximum)
	if current == 0:
		died()

func died() -> void:
	pass
```

`maxi` / `mini` are the integer clamp helpers. `max` / `min` exist for floats as well, and will take mixed types more loosely. Prefer the typed ones when you know the type.

## Common introductory errors

| Message you see | What it usually means |
| --- | --- |
| Unexpected "indent" | Mixed tabs and spaces, or a missing colon |
| Identifier not found: Sprite2D | The node path is wrong, or the line runs before the node is in the tree |
| Cannot call method on null | A `$Path` failed, or a cast returned null |
| A custom signal conflicts with an inherited signal | The script declared a signal such as `pressed` on a node type that already provides a signal with that name. Rename the custom signal to express its distinct meaning. |
| Parser Error: Assigned value type | The annotation says `int` and you stored a float |

## Lab

Write a `class_name Counter` with an exported start value, a typed `changed` signal, and `add(amount: int) -> void`. Attach it to a node. Connect the signal in the editor (the node → Signals dock → connect) to a function that updates a `Label`. Run it from `_ready` by calling `add(1)`.
