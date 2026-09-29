# Start here

Godot is a free, open-source game engine for 2D and 3D applications. A Godot project is built from **nodes** arranged in trees. A saved node tree is called a **scene**, and scripts attached to nodes define their behavior. This handbook emphasizes the concepts and workflows needed to design, implement, test, and export a small game; it does not attempt to duplicate Godot's complete API reference.

## What you are actually learning

Three ideas carry almost every Godot project:

1. **A node is an object in a tree.** A player, a sprite, a collision shape, a button, and a timer are all nodes. A scene is a saved tree you can instance again, the way a function is a saved block of code.
2. **Scripts ride on nodes.** GDScript is Godot's own language. C# is available if you install the .NET build. The engine concepts are the same either way.
3. **Nodes talk with signals, and parents call down into children.** A button does not reach up and rearrange the game. It emits `pressed`. Something listening decides what that means.

If those three sentences stay clear, the rest of the handbook is detail.

## Choosing GDScript, C#, or C++

| Choice | Appropriate starting use | Tooling and tradeoff |
| --- | --- | --- |
| GDScript | Most first Godot projects; scenes, input, UI, rules, and prototypes | Works in the standard editor, has concise syntax, and provides the closest editor integration |
| C# | Projects whose developers already use C# or require .NET libraries | Requires the Godot .NET editor and .NET SDK; platform support and export requirements differ from GDScript |
| C++ through GDExtension | A measured project-specific bottleneck, integration of a native library, or a reusable native Godot class | Requires a compiler, godot-cpp, platform-specific libraries, and additional compatibility and distribution work |

Use GDScript or C# for the primary gameplay layer of a first project. Mixing languages is supported, but each additional language introduces another toolchain, debugging workflow, and interoperability boundary.

Students coming from Unity should still learn enough GDScript to read official examples, tutorials, editor templates, and plugins. The [C# from Unity](03-csharp/from-unity.md) chapter explains implementation differences. The [C++ and GDScript](03-gdextension/cpp-and-gdscript.md) chapter explains when a native extension is justified and how it is built.

## What a finished small game contains

The [semester project](06-labs/semester-project.md) applies the handbook to a complete small game. By the end of that project, you should be able to identify and explain:

- a main scene that runs with F5
- a player that moves in `_physics_process`
- input actions, not hardcoded key checks scattered through scripts
- at least one custom signal
- data that survives a scene change (an autoload or a resource)
- a save file under `user://`, not `res://`
- one export that a classmate can launch

These outcomes define the handbook's core scope. The remaining chapters provide explanations, examples, and reference material for completing each outcome independently.

## How Godot is different from a typical programming class

Your program is not `main()` and a pile of objects you `new` yourself. The engine builds the tree from scene files, calls lifecycle methods for you, and steps physics on a fixed tick. You write the methods it calls.

That is why a script that "works" in isolation can fail in the editor: `_ready()` has not run, the child node is not in the tree yet, or you wrote the work in `_process` when it needed the physics tick.

## How to use the chapters

Each chapter ends with a short lab. Do the lab before you open the next chapter. If you only read, you will recognize the words and still freeze in the editor.

When a snippet fails:

1. Read the **first** error in the Output or Debugger dock. Later errors are often fallout.
2. Check that the script is attached to the node type it `extends`.
3. Check that node paths (`$Sprite2D`, `%Player`) match the Scene dock exactly, including case.

## Official sources worth keeping open

- [Godot docs](https://docs.godotengine.org/en/stable/) for the class you are calling
- [GDScript reference](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html)
- [C# basics](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_basics.html) if you are on the .NET build
- [Your first 2D game](https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html) as a second pass after this handbook's first scene

This handbook complements, rather than replaces, the official sources. It organizes the material into a learning sequence, explains common failure modes, and highlights differences that are important when transferring experience from Unity.
