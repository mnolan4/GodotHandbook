# C# from Unity

This chapter is for students who already write Unity gameplay in C#. Godot C# is still C#, on .NET 8, but the objects you subclass are nodes, not `MonoBehaviour` on a `GameObject`. The engine will not call `Update`. It will call `_Process` if the name and signature are exact.

Use the **.NET** editor build. The standard editor cannot run C# scripts. Confirm `dotnet --version` is 8.x before you debug a blank screen.

Even when C# is the project's implementation language, reading basic GDScript remains useful because many official examples, editor templates, community tutorials, and plugins use it. The [GDScript language reference](../02-gdscript/reference.md) provides the syntax needed to interpret those examples without requiring a language change in your own project.

## The map

Many Unity concepts have direct Godot counterparts, but their lifecycle, ownership, and serialization rules differ. The following table identifies both the closest equivalent and the behavioral difference that matters during a port.

| Unity | Godot 4 C# | The part that bites |
| --- | --- | --- |
| `GameObject` + components | A `Node` (and child nodes) | There is no empty object that merely holds components. The node is the object. Composition is children plus scripts. |
| `MonoBehaviour` | `public partial class Player : CharacterBody2D` | The class must be `partial`. The file name should match the class name. |
| `Awake` | `_EnterTree` or field initializers | `_Init` is the constructor equivalent and runs before the node is in the tree. Children are not ready. |
| `Start` | `_Ready` | Children run `_Ready` first, then the parent. |
| `Update` | `_Process(double delta)` | PascalCase. `delta` is `double`, not `float`. |
| `FixedUpdate` | `_PhysicsProcess(double delta)` | Physics and `MoveAndSlide` go here. |
| `LateUpdate` | No direct hook | Use `CallDeferred` when work must occur after the current callbacks, or control callback order so a camera or dependent node updates after its target inside `_Process`. |
| `OnEnable` / `OnDisable` | `_EnterTree` / `_ExitTree`, or process modes | `_EnterTree` and `_ExitTree` describe scene-tree membership, not Unity's enabled flag. Use a process mode to keep a node in the tree while disabling selected callbacks. See [Nodes, signals, and the lifecycle](../02-gdscript/nodes-signals-lifecycle.md). |
| `OnDestroy` | `_ExitTree`, then the node is freed | Prefer `QueueFree()` over `Free()`. |
| `[SerializeField]` | `[Export]` | Godot does not expose a C# member in the Inspector merely because it is public. Add `[Export]` explicitly. |
| Prefab | `PackedScene` (`.tscn`) | `Instantiate<T>()`, then `AddChild`. `_Ready` runs on add. |
| `Instantiate` / `Destroy` | `Instantiate` / `QueueFree` | Accessing a freed Godot object produces an invalid-instance error. Clear or validate cached references after the target is queued for deletion. |
| `ScriptableObject` | `Resource` subclass | Create `.tres` assets in the inspector. |
| `DontDestroyOnLoad` | Autoload | Project Settings → Autoload. It outlives `ChangeSceneToFile`. |
| `SceneManager.LoadScene` | `GetTree().ChangeSceneToFile("res://...")` | Scene paths use `res://`. |
| `GetComponent<T>()` | The script often **is** the node. Otherwise `GetNode<T>("Child")` | There is no component list on one object. Look at children, or the node itself. |
| `transform.position` | `Position` (local) or `GlobalPosition` | 2D **+Y is down**. 3D +Y is up, like Unity. |
| `Time.deltaTime` | the `delta` argument | Godot passes elapsed time directly to each process callback. Use that argument for frame-rate-independent motion. |
| `Input.GetAxis("Horizontal")` | `Input.GetAxis("move_left", "move_right")` | Two actions, not one axis asset. Define them in the Input Map. |
| `Rigidbody` | `RigidBody2D` / `RigidBody3D`, or `CharacterBody2D` for a player | Do not `MovePosition` a dynamic body from `_Process`. |
| Coroutine / `yield` | `await ToSignal(...)` | Avoid turning lifecycle callbacks into `async void` methods because exceptions and object lifetime become difficult to track. Prefer a separate asynchronous method that awaits signals. |
| `Debug.Log` | `GD.Print` | `Console.WriteLine` misses the Output dock. |
| Layers and tags | Collision layers and masks, plus groups | Names are in Project Settings. The runtime value is a bitmask. |
| `Vector3` mutable fields | `Vector2` / `Vector3` are structs | `Velocity.X = 1` does not compile the way you hope. Copy, edit, assign. |

## A node script

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 220.0f;
    [Export] public float JumpVelocity = -380.0f;

    public override void _PhysicsProcess(double delta)
    {
        Vector2 v = Velocity;
        if (!IsOnFloor())
            v.Y += 1100.0f * (float)delta;
        if (Input.IsActionJustPressed("jump") && IsOnFloor())
            v.Y = JumpVelocity;

        float dir = Input.GetAxis("move_left", "move_right");
        v.X = dir * Speed;
        Velocity = v;
        MoveAndSlide();
    }
}
```

Why the copy into `v`: `Velocity` returns a struct. You cannot assign `Velocity.X` and have it stick. Edit the local copy, then write `Velocity` back.

`JumpVelocity` is negative because Godot's 2D coordinate system uses negative Y for upward motion. A positive jump velocity moves the character downward and can force it into the floor; this differs from Unity's common Y-up mental model.

`MoveAndSlide` takes no arguments in Godot 4. It reads `Velocity`. Do not multiply that velocity by `delta` first. Gravity is an acceleration, so gravity times `delta` is correct. Horizontal speed is already units per second, and `MoveAndSlide` applies the timestep.

## Signals are C# events, with a naming rule

```csharp
using Godot;

public partial class Health : Node
{
    [Signal]
    public delegate void HealthChangedEventHandler(int current, int maximum);

    private int _hp = 100;

    public void TakeDamage(int amount)
    {
        _hp = Mathf.Max(_hp - amount, 0);
        EmitSignal(SignalName.HealthChanged, _hp, 100);
    }

    public override void _Ready()
    {
        HealthChanged += OnHealthChanged;
    }

    private void OnHealthChanged(int current, int maximum)
    {
        GD.Print($"HP {current}/{maximum}");
    }
}
```

The delegate name must end in `EventHandler`. The generator then creates a C# event named `HealthChanged` and a `SignalName.HealthChanged` constant. If you name the delegate `HealthChanged`, the build error is confusing and the event does not appear.

Subscribe with `+=`. Emit with `EmitSignal`. You can also connect in the editor to a method on another node.

Unsubscribe in `_ExitTree` when the publisher outlives you (an autoload, a persistent player bus).

## Scenes, prefabs, and spawning

```csharp
public partial class Spawner : Node2D
{
    [Export] public PackedScene BulletScene { get; set; }

    public void Shoot()
    {
        Node2D bullet = BulletScene.Instantiate<Node2D>();
        bullet.GlobalPosition = GlobalPosition;
        GetTree().CurrentScene.AddChild(bullet);
    }
}
```

Exporting the `PackedScene` lets you assign the scene in the Inspector, which is the prefab slot you are used to. `GD.Load<PackedScene>("res://scenes/bullet.tscn")` is the code path when the path is fixed.

`Instantiate` does not enter the tree. `AddChild` does, and that is when `_Ready` runs.

## Resources instead of ScriptableObjects

```csharp
using Godot;

[GlobalClass]
public partial class ItemDef : Resource
{
    [Export] public string Id { get; set; } = "";
    [Export] public int MaxStack { get; set; } = 1;
}
```

`[GlobalClass]` is what makes the type show up when you create a `.tres` in the FileSystem dock. Without it, the resource exists only as a C# type the inspector may not offer you.

## Input

Define actions in Project Settings → Input Map. In code:

```csharp
if (Input.IsActionJustPressed("jump"))
{
}
float dir = Input.GetAxis("move_left", "move_right");
```

`IsActionJustPressed` is true during the current input polling interval—the rendered frame in `_Process` or the physics tick in `_PhysicsProcess`. Query it in the same callback that consumes the action. If input must remain valid across callbacks or shortly before landing, store an explicit buffer timer as shown in the [platformer](../04-examples/platformer.md) chapter.

UI listens first. Gameplay that should not steal clicks from a button belongs in `_UnhandledInput`.

## Calls into GDScript

You will meet GDScript nodes in examples and plugins.

```csharp
Node gd = GetNode("GDScriptNode");
gd.Call("take_damage", 10);
int score = (int)gd.Get("score");
gd.Set("score", score + 5);
gd.Connect("died", Callable.From(OnDied));
```

`Call` / `Get` / `Set` resolve member names at runtime, so renaming a method or property does not produce a C# compile-time error. Prefer statically typed C# APIs for nodes you control, and reserve the dynamic methods for interoperation with GDScript or third-party content.

## Async

```csharp
public async void PlayIntro()
{
    await ToSignal(GetTree().CreateTimer(1.0), SceneTreeTimer.SignalName.Timeout);
    GD.Print("go");
}
```

Be careful with `async void`: exceptions disappear, and the method can outlive the node. Check `IsInsideTree()` after each `await` before you touch siblings. For gameplay sequencing, a short state machine is often clearer than a chain of awaits.

## Exports you will want

`[Export]`, `[ExportGroup("Movement")]`, `[ExportSubgroup("Air")]`. Ranges and file paths exist as attribute variants. See the official C# exports page before you invent a custom inspector.

Arrays of resources export cleanly when the element type is a `Resource` subclass marked `[GlobalClass]`.

## Build and IDE

The first C# script generates `.csproj` and `.sln` files. Open the solution in an external C# editor if you need its refactoring, navigation, or completion tools. Build before running the project. If compilation fails, Godot may retain the last successful assembly, so the running game will not contain the latest source changes even though the file was saved.

Do not commit `.godot/`, `bin/`, or `obj/`.

## Exporting a C# game

Desktop exports include the .NET runtime data that Godot places beside the application binary. Web and mobile exports have additional platform and ahead-of-time compilation requirements that vary by Godot release. Confirm support for the intended platform early by reading the current .NET export documentation and producing a small test build. If browser deployment is a primary requirement, evaluate GDScript before committing to C#, because GDScript web exports generally require less platform-specific setup.

## Habits to drop

| Unity habit | In Godot |
| --- | --- |
| Public field shows up in the Inspector | Add `[Export]` |
| `Update` moves a character controller | `_PhysicsProcess` and `MoveAndSlide` |
| Y is up in 2D | Y is down in 2D |
| `Destroy(gameObject)` mid-physics | `QueueFree()` |
| Find every object by tag each frame | Groups sparingly, or keep a reference |
| A manager singleton on a prefab marked DontDestroyOnLoad | An autoload |
| Coroutines as the only sequencer | Signals, await, or an enum state |

## Lab

Port one Unity behaviour you already understand: a moving platform or a health pickup. Write it as a `partial` node script. Export the numbers. Print with `GD.Print`. If you came from 2D Unity, draw an arrow in a comment showing which way +Y points, and make the motion respect it.
