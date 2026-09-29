# Installing Godot

Choose the editor build that matches the project's scripting language and use that build consistently. The standard build supports GDScript but cannot compile C#. The .NET build supports both GDScript and C#. Opening a C# project in the standard build leaves its C# scripts unavailable, which can make nodes appear to have missing behavior.

## Which download

| You will write | Download |
| --- | --- |
| GDScript only | Godot Engine, standard build |
| C#, or GDScript plus C# | Godot Engine **.NET** |

Download Godot from [godotengine.org](https://godotengine.org/download). This handbook follows **4.7**. Projects created with an earlier Godot 4.x release can generally be opened by a later 4.x editor, although the editor may update project metadata or resources. Godot 3 projects require the [official 3-to-4 migration process](https://docs.godotengine.org/en/stable/tutorials/migrating/upgrading_to_godot_4.html). Tutorials that use `yield` or `export var` without the `@` prefix target Godot 3; consult a Godot 4 version of the tutorial or translate the APIs using that migration guide.

For C# you also need the **.NET 8 SDK**. The SDK includes the compiler and build tools; installing only the .NET runtime is insufficient. After installation, run `dotnet --version` in a terminal and confirm that it prints an 8.x version. Godot's .NET build cannot compile C# scripts without a compatible SDK.

## macOS

Move the Godot application to your Applications folder and open it once. If macOS blocks the application because it was downloaded from the internet, follow the current instructions on Godot's official download page or Apple's Privacy & Security panel. Use the official Godot download rather than an unofficial mirror so that the file and version can be verified.

## Windows and Linux

Unzip the official build into a stable folder that you control, such as `~/Applications` or a course tools directory. Godot is a portable application, so multiple versions can coexist without an installer managing them. Record or label the editor path clearly to avoid opening the project in an older copy by mistake.

## Check that it worked

1. Launch the editor. The project manager appears, not a game window.
2. The title or About dialog shows 4.7 (or the 4.x version your lab image actually has). Write that version in your project README.
3. If you need C#, the About dialog should mention .NET. Create a throwaway project, add a Node, attach a C# script, and build. A missing SDK fails here, before you have written a game.

## What not to install yet

- Export templates. These platform-specific files are required to create distributable builds, but they are not required for running a project in the editor. Install the templates that exactly match your editor version when you begin export testing. See [Debug, performance, export](../05-engine/debug-performance-export.md).
- A dozen asset-store plugins. Add one when a chapter names it.
- Godot 3 "because the tutorial used it." Translate the idea, or find a 4.x source.

## Version control

Initialize git in the project folder after you create the project, not around the editor download. Godot's own `.gitignore` should exclude `.godot/` (imported cache) and, for C#, `bin/` and `obj/`. Commit `project.godot`, scenes, scripts, and the assets you authored.

## Lab

Install the editor that matches your language choice. Launch the project manager. Write down the exact version string. If you chose C#, run `dotnet --version` and confirm it is .NET 8.
