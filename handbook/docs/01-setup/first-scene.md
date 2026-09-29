# First scene

You are going to make a scene that runs, draws something, and rotates it from a script. The point is the loop: edit the tree, save, attach a script, run, read the error if there is one.

## Build the tree

1. Scene → New Scene → Other Node → `Node2D`. Name it `Main`.
2. Add a child `Sprite2D`. Godot's icon is a fine texture for today: drag `icon.svg` from the FileSystem onto the sprite's Texture property, or assign it in the Inspector.
3. Select `Main`. Scene → Save Scene As `res://scenes/main.tscn`.
4. Project → Project Settings → Application → Run, and set the main scene to that file. You can also press F5 and confirm the prompt.

`Node2D` is a position in 2D space. `Sprite2D` draws a texture. The sprite is a child, so it moves when `Main` moves. That parent-child rule is the whole scene system in one sentence.

## A first script

Select `Main` and attach a script at `res://scripts/main.gd`. Choose GDScript for the standard editor or for a GDScript-based project. Choose C# only when the project is open in the .NET editor and the .NET SDK has already been verified.

```gdscript
extends Node2D

@export var speed_degrees: float = 90.0

func _process(delta: float) -> void:
	rotation_degrees += speed_degrees * delta
```

`extends Node2D` must match the node. `_process` runs once per rendered frame. `delta` is seconds since the last frame. Multiplying by `delta` is what makes 90 degrees per second mean 90 degrees per second when the frame rate wobbles.

`@export` puts `speed_degrees` in the Inspector. Change it there, run again, and watch the spin change. You did not edit the script. That is the designer-facing half of Godot.

## Run

F5. The icon turns. F8 stops.

If nothing happens:

- The script is on a different node than the one you are watching.
- You edited a scene you did not save.
- The main scene is still an empty default.
- An error in Output stopped the script. The first line is the one to fix.

## The same idea in C#

On the .NET editor, attach a C# script instead. The class is `partial`. The method is `_Process`, and `delta` is a `double`.

```csharp
using Godot;

public partial class Main : Node2D
{
    [Export] public float SpeedDegrees = 90.0f;

    public override void _Process(double delta)
    {
        RotationDegrees += SpeedDegrees * (float)delta;
    }
}
```

Build, then F5. `GD.Print` is what shows up in Output. `Console.WriteLine` often does not.

## What you just proved

- A scene file remembers the tree.
- A script's lifecycle method is called by the engine.
- Exported properties are data, not code.
- Frame-rate independence is `amount * delta`.

## Lab

Add a second child, a `Label`, with the text "Studio". Export a `Color` on the script and assign it to the label's `modulate` property in `_ready()`. As an experiment, move that assignment to `_process()` and observe that the visible result is unchanged. The implementation is nevertheless less efficient because it repeats an identical assignment every rendered frame. Restore it to `_ready()`, which is the appropriate lifecycle method for one-time initialization.
