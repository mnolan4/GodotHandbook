# Nodes, signals, and the lifecycle

The editor will call your script. Your job is to put work in the method that matches the moment.

## Order

When a node enters the tree:

1. `_init()` runs when the object is constructed. Children may not exist. Do not touch `$Child` here.
2. `_enter_tree()` runs as the node joins the tree, parent before children.
3. `_ready()` runs after the node **and its children** are in the tree. Children are ready first, then the parent. This is the usual place to cache nodes and connect signals.
4. `_process(delta)` runs every rendered frame.
5. `_physics_process(delta)` runs on the fixed physics tick (60 Hz unless you change it). Movement and collision belong here.
6. `_exit_tree()` runs when the node leaves the tree.
7. `queue_free()` frees the node at the end of the frame. Do not use the object after that.

`_unhandled_input(event)` is where gameplay keys go if the UI did not already consume them. UI controls get first chance at the event.

The [Ready order](../07-visualizations/ready-order.md) page summarizes step 3, and its website version animates the child-before-parent sequence. Start the local website as described in the handbook README to use the interactive version.

## Getting nodes

```gdscript
@onready var sprite: Sprite2D = $Sprite2D
@onready var camera: Camera2D = %GameCamera
```

`$Sprite2D` is a path relative to this node. `%GameCamera` finds a node you marked with the Unique Name flag (the `%` icon in the scene dock). Unique names survive reparenting. Deep `$Path/To/Thing` strings do not.

Cache the lookup. Calling `$Sprite2D` or `get_node` inside `_process` walks the tree every frame.

## Signals

A signal is a list of callables. The emitter does not know who is listening.

```gdscript
signal health_changed(current: int, maximum: int)

func take_damage(amount: int) -> void:
	health = maxi(health - amount, 0)
	health_changed.emit(health, maximum)

func _ready() -> void:
	health_changed.connect(_on_health_changed)

func _on_health_changed(current: int, maximum: int) -> void:
	label.text = "%d / %d" % [current, maximum]
```

Connect in the editor when the listener is a different node sitting in the same scene: select the emitter, open the Signals dock, double-click the signal, pick the target method.

Connect in code when the listener is created at runtime.

Godot 4 connects callables, not strings. This is the old form, and it will not catch a renamed method:

```gdscript
# Godot 3 style. Do not write this.
connect("health_changed", self, "_on_health_changed")
```

Disconnect when a short-lived node subscribes to a long-lived autoload. Otherwise the autoload can retain or invoke a callback associated with a node that has left the tree. In this example, `Events` is an event-bus autoload like the one defined in [GDScript patterns](patterns.md).

```gdscript
func _exit_tree() -> void:
	if Events.level_loaded.is_connected(_on_level_loaded):
		Events.level_loaded.disconnect(_on_level_loaded)
```

## Signal up, call down

Children emit signals. Parents call methods on children. A child that modifies `get_parent().get_parent().score` depends on an exact hierarchy and stops working when either ancestor changes. Emitting a signal preserves the child's behavior when it is reused or reparented.

```gdscript
# coin.gd
signal collected(id: StringName)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		collected.emit(coin_id)
		queue_free()
```

The level, or a manager the level connected, listens and updates the score. The coin does not know the HUD exists.

The [Signal flow](../07-visualizations/signal-flow.md) page illustrates a child emitting an event to its parent, followed by the parent calling a method on another child.

## `await`

`await` pauses the function, not the game.

```gdscript
func play_intro() -> void:
	title.visible = true
	await get_tree().create_timer(1.0).timeout
	title.visible = false
	await faded_in
```

Here, `faded_in` represents a custom signal declared by this script or provided by a fade-overlay node. You can await a custom signal, a built-in signal such as `await animation_player.animation_finished`, or a timer. The suspended function belongs to the script instance; if that node is freed while the function is waiting, execution does not resume. This behavior prevents a removed scene object from continuing its sequence, but persistent work such as saving should be owned by an autoload or another node that outlives the scene.

Do not `await` inside `_process`. You will stack a new waiting function every frame.

## Groups

```gdscript
add_to_group("enemies")
get_tree().call_group(&"enemies", &"notify_player_seen")
```

Groups are a tag. They are the right tool for "every enemy, do this." They are the wrong tool for "the one player," which should be a unique node, a signal, or an exported reference.

Prefer `call_group_flags(SceneTree.GROUP_CALL_DEFERRED, ...)` when many nodes must react but their methods do not need to run immediately. Deferred calls are distributed after the current operation, reducing the chance that a large group update causes a visible frame pause.

## Instancing

```gdscript
const BulletScene := preload("res://scenes/bullet.tscn")

func shoot() -> void:
	var bullet := BulletScene.instantiate() as Node2D
	bullet.global_position = muzzle.global_position
	get_tree().current_scene.add_child(bullet)
```

`instantiate()` creates the nodes. They are not in the tree, and `_ready` has not run, until `add_child`.

Add bullets to a stable gameplay parent rather than automatically adding them to `self`. If the firing node is removed, its child bullets are removed with it; adding them to the level or a projectile container allows their lifetime to remain independent of the shooter.

## Queue free, do not free

`queue_free()` schedules deletion for the end of the current frame, after physics and signal dispatch complete. `free()` deletes the object immediately and can invalidate an object that the engine or another callback is still using. Use `queue_free()` for scene-tree nodes unless immediate destruction is explicitly required and known to be safe.

## Frames versus physics frames

| Method | Clock | Put this here |
| --- | --- | --- |
| `_process` | Rendered frames, variable `delta` | Animation blending, UI that tracks the mouse, cameras that ease |
| `_physics_process` | Fixed step | `move_and_slide`, forces, and raycasts that must remain synchronized with collision updates |

The [Game loop](../07-visualizations/game-loop.md) page shows the render and physics clocks. Depending on frame time, a rendered frame can contain zero, one, or several fixed physics ticks. Code that assumes one physics step per rendered frame therefore behaves differently across machines and under temporary performance load.

## Lab

Build three nodes: `Level` (`Node2D`), `Player` (`CharacterBody2D` is fine even if it does not move yet), and `Coin` (`Area2D` with a `CollisionShape2D`). Give the coin a `collected` signal. Connect it in the editor to `Level`. Print the id from the level, not from the coin. Free the coin with `queue_free` after the emit.
