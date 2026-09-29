# Input, physics, and navigation

## Input

The Input Map is a project setting. An action has a name (`jump`) and a list of events (keyboard, mouse, gamepad). Scripts ask about the action.

```gdscript
var dir := Input.get_axis("move_left", "move_right")
if Input.is_action_just_pressed("jump"):
	try_jump()
```

| Method | True when |
| --- | --- |
| `is_action_pressed` | Held |
| `is_action_just_pressed` | The frame it went down |
| `is_action_just_released` | The frame it went up |
| `get_axis` | Negative to positive, with deadzone for sticks |

`just_pressed` is easy to miss if you check it in `_process` and act in `_physics_process` a tick later. Check it where you act, or store a buffer timer, as the platformer example does.

Use `_unhandled_input(event)` for gameplay events that should run only when the user interface has not consumed them. `Control` nodes receive the event first and can mark it as handled; the event then does not reach `_unhandled_input`. This ordering prevents a click on a menu button from also firing a weapon or moving the player beneath the menu.

Input remapping replaces the physical events assigned to a named action and persists the player's choices in `user://`. Gameplay code should query actions such as `jump` instead of physical constants such as `KEY_SPACE`. Centralizing the mapping allows keyboard, controller, and accessibility bindings to change without modifying gameplay scripts.

Deadzones live on the action's deadzone property. A stick at rest should not walk the player.

## Physics layers

Every collision object has a **layer** (what it is) and a **mask** (what it notices). They are bits. Name the bits in Project Settings → Layer Names so the Inspector shows words.

A player on layer `player` with a mask containing `world` can collide with the ground. An enemy bullet on layer `enemy_hit` with a mask containing only `player` detects the player while ignoring enemies and unrelated triggers. Assigning every object to layer 1 with mask 1 causes unnecessary collision pairs and makes it difficult to distinguish friendly targets, hazards, pickups, and world geometry.

The [Collision layers](../07-visualizations/collision-layers.md) page lets you toggle layer and mask bits and observe which bodies detect each other. The governing rule is: object A detects object B when at least one bit in A's mask overlaps a bit in B's layer.

Do not resize a `CollisionShape` by applying non-uniform scale to its node transform. Edit the shape resource's radius, height, or size instead. Non-uniform transform scaling can produce inaccurate contact normals, unstable separation, and collision geometry that does not match the visual object.

Move `CharacterBody` and kinematic work in `_physics_process`. Moving a physics body in `_process` jitters against the fixed step.

`RayCast2D` / `RayCast3D` are for thin questions ("is there ground just here"). A single ray is a bad floor test on stairs. A `ShapeCast` with a short capsule or sphere matches what the body actually is.

Continuous collision (`CCD`) is for fast bullets, not for every static wall. It costs.

## Character bodies and rigid bodies

| Node | Use |
| --- | --- |
| `CharacterBody2D` / `3D` | Players, enemies you steer with code |
| `RigidBody2D` / `3D` | Crates, debris, anything the solver should own |
| `AnimatableBody2D` / `3D` | Moving platforms, doors |
| `StaticBody2D` / `3D` | Floors, walls |
| `Area2D` / `3D` | Pickups, triggers. Not walls. |

`move_and_slide()` on a character body handles slopes. `move_and_collide()` stops at the first hit and leaves you to slide yourself. Use `move_and_slide` unless you are writing a custom solver on purpose.

On a `RigidBody3D`, do not assign `global_position` every frame. Apply impulses or forces, or make controlled state changes inside `_integrate_forces`. Repeated transform assignments bypass the velocity and contact state calculated by the physics solver, which can produce tunneling, jitter, and inconsistent collision responses.

## Navigation

`NavigationAgent2D` or `NavigationAgent3D` on the actor, and a `NavigationRegion` that has been baked. The agent does not know about the mesh until the navigation server is ready.

```gdscript
func _ready() -> void:
	call_deferred("_start")

func _start() -> void:
	await get_tree().physics_frame
	agent.target_position = goal
```

Setting `target_position` inside `_ready` before the first physics frame often produces an empty path and no error.

Do not assign `target_position` every frame for a chase. Update on a timer (around 0.2 seconds) or when the target moves far enough. Check that a path exists before you walk toward `get_next_path_position()`.

Avoidance needs a radius. The default of 0 lets agents occupy the same point.

Use `NavigationObstacle` nodes or navigation-mesh rebaking when runtime objects can block or reshape traversable space. Synchronous rebaking runs on the gameplay thread and can cause a visible frame pause on complex geometry. Use asynchronous baking when the navigation layout must change during play. For projects with mostly static levels, pre-baked regions and `NavigationLink` connections for doors or jumps are simpler and less expensive.

## Lab

Create two `CharacterBody2D` nodes and a floor. Put them on different layers so they do not collide, then fix the mask until they do. Add a third body, an `Area2D` pickup, whose mask includes only the player. Stand in the area and print once, not once per frame.
