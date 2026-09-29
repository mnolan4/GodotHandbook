# Example: a 2D platformer

This example implements a complete movement body rather than a complete game. It uses `CharacterBody2D`, coyote time, a jump buffer, and variable jump height. The [Coyote time](../07-visualizations/coyote-time.md) page explains the timing windows, and its website version provides an interactive jump demonstration.

`CharacterBody2D` is intended for characters whose velocity and movement rules are controlled directly by game code. `RigidBody2D` is intended for objects such as crates and debris whose motion is calculated by the physics solver. Directly assigning a rigid body's position or velocity every frame conflicts with the solver and commonly produces jitter, unstable collisions, or inconsistent movement.

## Scene

`Player` (`CharacterBody2D`)

- `AnimatedSprite2D` or `Sprite2D`
- `CollisionShape2D` with a capsule or rectangle. Do not use a concave polygon for the player.
- Collision layer: `player`. Collision mask: `world`, `platforms`, and `hazards`. Define these names under **Project Settings → Layer Names → 2D Physics**; the [input, physics, and navigation](../05-engine/input-physics-navigation.md) chapter explains how layer and mask bits interact.

`Level` (`Node2D`)

- `TileMapLayer` for the ground. Paint collision on the physics layer of the tiles.
- An instance of `Player`.
- `Camera2D` as a child of the player, or a camera that lerps toward the player. Hard-snapping the camera to the player every frame makes people queasy in a way they will blame on "controls."

Input Map: `move_left`, `move_right`, `jump`.

In 2D, **up is negative Y**. Jump velocity is negative. Gravity adds positive Y.

## Script

```gdscript
extends CharacterBody2D

@export var speed: float = 220.0
@export var jump_velocity: float = -380.0
@export var gravity: float = 1100.0
@export var coyote_time: float = 0.10
@export var jump_buffer_time: float = 0.12

var _coyote: float = 0.0
var _buffer: float = 0.0

func _physics_process(delta: float) -> void:
	var v := velocity

	if is_on_floor():
		_coyote = coyote_time
	else:
		_coyote = maxf(_coyote - delta, 0.0)
		v.y += gravity * delta

	if Input.is_action_just_pressed("jump"):
		_buffer = jump_buffer_time
	else:
		_buffer = maxf(_buffer - delta, 0.0)

	if _buffer > 0.0 and _coyote > 0.0:
		v.y = jump_velocity
		_buffer = 0.0
		_coyote = 0.0

	# Releasing jump early should cut the arc, not reverse it.
	if Input.is_action_just_released("jump") and v.y < 0.0:
		v.y *= 0.45

	var dir := Input.get_axis("move_left", "move_right")
	v.x = dir * speed

	velocity = v
	move_and_slide()
```

What each piece is doing:

- **Coyote time.** For about a tenth of a second after walking off a ledge, jump still works. Players press jump when they see the edge, which is already too late for a one-frame floor check.
- **Jump buffer.** If jump was pressed slightly before landing, it still fires. Without this, landing feels like the game ignored you.
- **Variable jump.** Releasing the button while moving up shortens the hop. `v.y < 0.0` means "still going up" because up is negative.
- **`move_and_slide`.** Uses `velocity` as units per second. Do not multiply `v` by `delta` before the call. Gravity is the line that multiplies by `delta`, because gravity is acceleration.

`is_on_floor()` reports whether the most recent `move_and_slide()` operation detected a surface classified as a floor. Reading it at the start of the next physics frame provides the contact state produced by the previous movement step.

Float timers die with `<= 0.0`, not `== 0.0`.

## One-way platforms

Platforms the player can jump through from below are `AnimatableBody2D` (or a tile) with one-way collision enabled on the shape. Dropping down through them is a short-lived exception on the player's collision, not "turn collision off and hope." If you disable the whole collision shape, the player falls through the floor they still wanted.

Moving platforms should be `AnimatableBody2D` with `sync_to_physics` enabled. A `CharacterBody2D` platform will not carry the player reliably.

## Visual and audio feedback after movement is correct

Add the following feedback after the collision and jump behavior is consistent. Separating movement correctness from presentation makes it easier to determine whether a problem comes from physics code or visual timing.

- A `Camera2D` with position smoothing, plus a little look-ahead in the facing direction.
- Apply squash on landing and stretch on jumping to the visual node, with its pivot near the feet. Do not scale the `CollisionShape2D`; changing a collision shape's transform can alter contact geometry and produce inconsistent collision results.
- A landing sound on the frame `is_on_floor()` becomes true.
- Export the coyote-time and jump-buffer durations so they can be adjusted in the Inspector. These values affect the perceived responsiveness of the controller and usually require playtesting rather than a single hard-coded choice.

## C# shape of the same loop

```csharp
public override void _PhysicsProcess(double delta)
{
    float dt = (float)delta;
    Vector2 v = Velocity;
    if (IsOnFloor())
        _coyote = CoyoteTime;
    else
    {
        _coyote = Mathf.Max(_coyote - dt, 0f);
        v.Y += Gravity * dt;
    }
    // buffer, jump, and variable height follow the GDScript, then:
    Velocity = v;
    MoveAndSlide();
}
```

Copy `Velocity` into a local `Vector2`. Assign it back at the end.

## What this example is not

It does not include wall jumps, attack frames, or animation trees. Those are the next scenes, each with one new signal (`landed`, `attack_started`) so the animator does not have to poll five booleans from the outside.

For tile-based levels, place repeated terrain and its collision data in a `TileMapLayer`. Creating a separate `StaticBody2D` and `Sprite2D` for every tile greatly increases node count, scene-file size, and per-node processing overhead as the level grows.

## Lab

Build a three-screen-wide level with a gap the coyote time is exactly meant for. Tune `coyote_time` and `jump_buffer_time` in the Inspector until a classmate can make the jump on the second try. If they need the third try, the hole is a design bug or the buffer is too short. Write down the numbers that worked.
