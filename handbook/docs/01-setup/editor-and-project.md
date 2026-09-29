# Editor and project

A Godot project is a folder with a `project.godot` file. Scenes, scripts, and imported assets live beside it. There is no separate "solution" the way Visual Studio has one, unless you are on the .NET build, which also writes a `.sln` and `.csproj` the first time you add a C# script.

## Create the project

1. Project Manager → New Project.
2. Pick an empty folder. The folder name is not the game title; `project.godot` holds the name.
3. Choose a renderer. **Forward+** provides the full desktop rendering feature set and is appropriate for modern desktop GPUs. **Mobile** reduces rendering cost and is intended for mobile devices and lower-powered hardware. **Compatibility** supports the broadest range of older hardware and web targets, with fewer rendering features. The renderer can be changed later in Project Settings, but materials and visual effects may require adjustment after a change, so select the likely deployment target early.
4. Create & Edit.

## The docks you will actually use

| Dock | What it is |
| --- | --- |
| Scene | The node tree of the scene you have open. This is the game's structure. |
| FileSystem | Files on disk under the project. `res://` means "this project folder." |
| Inspector | Properties of the selected node, including anything your script `@export`s or `[Export]`s. |
| Output | `print` / `GD.Print`, warnings, and script errors. |
| Debugger | Pause, stack, remote scene tree while the game runs. |
| Bottom panel, 2D or 3D | The viewport. |

Arrange the docks so that the Scene tree and FileSystem remain visible while you edit, and keep the Inspector available for the selected node. Saving a consistent editor layout reduces navigation time and makes written instructions easier to follow because the referenced docks remain in predictable locations.

## Keys worth memorizing

| Key | Action |
| --- | --- |
| F5 | Run the main scene |
| F6 | Run the scene you are editing |
| F8 | Stop |
| Ctrl+S or Cmd+S | Save the scene. Unsaved scenes do not run the edits you think they do. |
| Ctrl+D or Cmd+D | Duplicate a node |

Set the main scene when Godot asks, or under Project → Project Settings → Application → Run → Main Scene.

## Folder layout

Create a basic folder structure before adding substantial content. Separating scenes, scripts, resources, and source assets makes files easier to locate, prevents naming collisions, and allows import or export rules to target an entire category of files.

```
res://
├── scenes/
│   ├── levels/
│   ├── entities/
│   └── ui/
├── scripts/
├── resources/
├── assets/
│   ├── art/
│   ├── audio/
│   └── fonts/
└── project.godot
```

`assets/` holds source files that Godot imports, such as PNG images, WAV audio, and TTF fonts. Godot records import metadata for these files and stores generated data in the `.godot/` cache. Keep one authoritative copy of each source asset under version control; duplicate asset folders can be imported twice, consume repository space, and make it unclear which copy a scene references.

Add an empty `.gdignore` file to folders that contain project-adjacent material rather than game content, such as design documents or reference images. Godot excludes that folder and its descendants from resource importing, which avoids unnecessary `.import` metadata and keeps those files out of resource searches.

## `res://` and `user://`

| Prefix | Meaning | Use it for |
| --- | --- | --- |
| `res://` | The project as exported | Scenes, scripts, art, data you authored |
| `user://` | A writable folder per user | Saves, settings, logs |

Exported games cannot write into `res://`. If a save works in the editor and fails in a build, this is the usual reason.

## Project settings you will touch

- **Application → Run → Main Scene.** What F5 launches.
- **Display → Window.** A 1280×720 viewport is a practical starting resolution for a desktop 2D project. Stretch mode `canvas_items` scales 2D content with the window, while aspect mode `expand` reveals additional space instead of cropping when the aspect ratio changes. For pixel art, set nearest-neighbor filtering in the texture import settings to preserve hard pixel edges during scaling.
- **Input Map.** Define named actions such as `move_left` and `jump`, then query those actions from scripts. Actions allow one gameplay command to support keyboard, controller, and remapped inputs without changing gameplay code.
- **Autoload.** An autoload is a script or scene instantiated when the project starts and retained across scene changes. Use autoloads for focused, application-wide services such as saving or an event bus; ordinary entities should remain owned by their level or parent scene.

## .NET projects

The first C# script creates the solution. Build from the editor (the Build button) or with `dotnet build` in the project folder. If the editor says the SDK is missing, fix that before you debug gameplay. See [From Unity](../03-csharp/from-unity.md).

## Lab

Create a project named after your game, not `New Game Project`. Add the folders above. Set the window size. Add input actions `move_left`, `move_right`, and `jump` with sensible keys and gamepad buttons. Save. Commit.
