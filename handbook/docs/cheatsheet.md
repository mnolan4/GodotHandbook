# Godot 4.7 Cheatsheet

Quick lookups. The chapters explain when and why to use each pattern. Code below is GDScript unless labeled C#.

## Lifecycle

| When | GDScript | C# |
| --- | --- | --- |
| Object constructed | `func _init():` | Class constructor, e.g. `public Player()` |
| Node enters scene tree | `func _enter_tree():` | `public override void _EnterTree()` |
| Node and children are ready | `func _ready():` | `public override void _Ready()` |
| Each rendered frame | `func _process(delta):` | `public override void _Process(double delta)` |
| Each physics tick | `func _physics_process(delta):` | `public override void _PhysicsProcess(double delta)` |
| Node leaves scene tree | `func _exit_tree():` | `public override void _ExitTree()` |

Order: `_enter_tree()` runs parent before child; `_ready()` runs child before parent. Get child-node references in or just before `_ready()`, not in the constructor.

## 2D direction and motion

In the default 2D canvas, +X is right and +Y is down. An upward jump sets `velocity.y` to a negative value. In 3D, +Y is up.

```gdscript
# Script extends CharacterBody2D; run inside _physics_process(delta).
if not is_on_floor():
    velocity.y += gravity * delta
if is_on_floor() and Input.is_action_just_pressed("jump"):
    velocity.y = jump_speed  # Example: -400.0
velocity.x = Input.get_axis("move_left", "move_right") * speed
move_and_slide()
```

`velocity` is in pixels per second. Multiply acceleration such as gravity by `delta`; do not multiply `velocity` by `delta` before `move_and_slide()`. Define `gravity`, `jump_speed`, and `speed` elsewhere in the script.

## Nodes and Inspector

```gdscript
@onready var sprite: Sprite2D = $Sprite2D       # Relative node path
@onready var cam: Camera2D = %MainCamera        # Scene-unique node
@export var speed: float = 200.0                # Editable in Inspector
```

Mark `MainCamera` as **Access as Unique Name** before using `%MainCamera`; the lookup is limited to its scene. Do not put `@export` and `@onready` on the same variable: the ready-time assignment can override the Inspector value.

## Signals

```gdscript
# Coin.gd: declare and emit an event.
signal collected(id: StringName)
collected.emit(coin_id)

# Listener.gd: connect to that coin, usually in _ready().
coin.collected.connect(_on_collected)
```

```csharp
// Coin.cs: declare and emit a custom signal.
[Signal] public delegate void CollectedEventHandler(string id);
EmitSignal(SignalName.Collected, id);

// Listener.cs: subscribe to a Coin instance.
coin.Collected += OnCollected;
```

Design cue: a child can signal what happened; its parent or another listener decides what to do. A parent can call a child's methods to request an action. This is a useful pattern, not a restriction on signal direction.

## Input

```gdscript
Input.get_axis("move_left", "move_right")       # -1 to +1
Input.is_action_just_pressed("jump")            # True on the press
```

Create these action names in **Project Settings → Input Map**. Poll movement in `_physics_process()` when it drives physics motion.

## Scenes, lifetime, and files

```gdscript
get_tree().change_scene_to_file("res://scenes/levels/a.tscn")
queue_free()  # Schedule this node for deletion at the end of the frame.
```

`res://` points into the project; use `user://` for writable saves and settings in an exported game.

## Collision layers and masks

**Layer** = what an object is on. **Mask** = what it looks for. A detects B when A's mask includes at least one of B's layers. For an `Area2D` overlap signal, check the area's mask against the other body's layer.

## Run

| Action | Windows / Linux | macOS default |
| --- | --- | --- |
| Run main scene | F5 | Cmd+B |
| Run current scene | F6 | Cmd+R |
| Stop | F8 | Cmd+. |
