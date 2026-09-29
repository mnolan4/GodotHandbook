# UI, animation, and audio

## UI

Godot user interfaces are built from `Control` nodes. Place screen-space interfaces under a `CanvasLayer` when they must remain fixed relative to the window and render independently of the game camera. A `Label` parented to the player inherits the player's transform and is appropriate for a world-space nameplate; a persistent HUD health bar should instead be placed in a screen-space UI hierarchy.

Layout is containers, not a pile of absolute rectangles you nudge by hand.

| Container | Behavior |
| --- | --- |
| `MarginContainer` | Padding |
| `VBoxContainer` / `HBoxContainer` | Stack children |
| `GridContainer` | Columns of equal cells |
| `CenterContainer` | Center one child |
| `PanelContainer` | A background panel behind one child |

Anchors determine how a `Control` node's offsets are measured relative to its parent when the control is not being laid out by a container. The **Full Rect** preset anchors all four edges to the corresponding parent edges, allowing the control to resize with its parent while offsets define margins. A control anchored only to the top-left remains fixed in size and position when the window changes. Configure the project's window size and stretch mode before finalizing layouts so that anchor behavior is tested under the same scaling rules the game will use.

Themes (`Theme` resource) are how you stop restyling every button by hand. Build one theme, assign it on a root control, and let children inherit it.

`RichTextLabel` is for dialogue with a few BBCode tags (`[b]`, color). It is not a web view.

Mouse filter: `Stop` eats clicks, `Ignore` lets them through, `Pass` sees them and forwards them. A full-screen invisible control with filter `Stop` is why your game "ignores" the mouse. Check the remote scene tree while the game runs.

## Animation

`AnimationPlayer` plays clips you authored: sprite frames, property tracks, method calls at a frame. `AnimationTree` blends those clips with a state machine or a blend space. Start with `AnimationPlayer`. Add the tree when you need blend, not before.

```gdscript
@onready var anim: AnimationPlayer = $AnimationPlayer

func _physics_process(_delta: float) -> void:
	if not is_on_floor():
		anim.play(&"jump")
	elif absf(velocity.x) > 10.0:
		anim.play(&"run")
	else:
		anim.play(&"idle")
```

`play` on the same animation is safe. It does not restart every frame.

Call methods from an animation track when the frame must match the art (a footstep, a hitbox that turns on). Do not poll `frame == 4` from gameplay code.

Tweens are appropriate for interface transitions and short presentation effects such as squash, flashes, or fades. Do not use them to drive a player's collision body, because tween timing is not integrated with character collision resolution.

```gdscript
var tween := create_tween()
tween.tween_property(sprite, "scale", Vector2(1.2, 0.8), 0.08)
tween.tween_property(sprite, "scale", Vector2.ONE, 0.12)
```

Scale the sprite. Leave the collision shape alone.

`await anim.animation_finished` sequences a cutscene. Remember that `await` suspends the function, not the engine.

## Audio

`AudioStreamPlayer` is non-positional. `AudioStreamPlayer2D` and `3D` attenuate with distance. Buses (`Master`, `Music`, `SFX`) live in the Audio panel. Players change bus volume. They should not have to find every player node.

Footsteps and UI clicks belong on SFX. Music belongs on Music, so a pause menu can duck one bus.

```gdscript
$AudioStreamPlayer.play()
```

A stream set to loop in the import dock will loop. If a sting loops, you imported it wrong, not the player.

Avoid creating an `AudioStreamPlayer` for every short sound without removing or reusing it afterward. Reuse a player when sounds may interrupt one another, or maintain a small pool when several copies must overlap. This bounds node count and prevents completed audio players from remaining in the scene tree.

## Lab

Make a pause menu on a `CanvasLayer`: a `CenterContainer`, a `PanelContainer`, a `VBoxContainer`, and Resume and Quit buttons. Set the menu root's process mode to **When Paused** (`PROCESS_MODE_WHEN_PAUSED`) so it receives input only while the SceneTree is paused. A gameplay controller that runs during normal play should handle the `pause` action, show the menu, and then set `get_tree().paused = true`. The Resume button reverses those steps by setting `get_tree().paused = false` and hiding the menu. Verify that gameplay nodes stop processing while the menu remains interactive.
