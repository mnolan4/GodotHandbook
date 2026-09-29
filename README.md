# Godot Studio Handbook

A structured guide for college students learning Godot 4. The source chapters are plain-text Markdown files in `docs/`. The searchable website in `site/` renders the same material and adds interactive p5.js diagrams for concepts such as lifecycle order, signal flow, physics timing, and collision layers.

This edition targets **Godot 4.7**. Godot APIs can change between releases, so verify version-sensitive details against the [official documentation](https://docs.godotengine.org/en/stable/) and the version shown in your editor.

## How to read it

Choose the path that best matches your experience and immediate goal. The reference chapters are designed for selective reading: begin with the setup material, complete the examples relevant to your project, and return to the reference when you need a specific API or pattern.

| Path | Who it is for | Order |
| --- | --- | --- |
| Studio | You are new to Godot and plan to use GDScript | Start here → Setup → GDScript → Examples → Engine |
| Unity transfer | You have Unity and C# experience | Start here → Setup → C# from Unity → Examples (read the GDScript example, then its C# notes) → Engine |
| Native extension | You have C++ experience and a measured bottleneck or native-library requirement | Start here → Setup → GDScript or C# → GDExtension → Debug and performance |
| Course project | You are planning a ten-week class or club project | Start here → Setup → Semester project → consult the referenced chapters for each milestone |

## Text

1. [Start here](docs/00-start-here.md)
2. Setup: [Installing](docs/01-setup/installing.md) · [Editor and project](docs/01-setup/editor-and-project.md) · [First scene](docs/01-setup/first-scene.md)
3. GDScript: [Language reference](docs/02-gdscript/reference.md) · [Nodes, signals, lifecycle](docs/02-gdscript/nodes-signals-lifecycle.md) · [Patterns](docs/02-gdscript/patterns.md)
4. C#: [From Unity](docs/03-csharp/from-unity.md)
5. GDExtension: [C++ and GDScript](docs/03-gdextension/cpp-and-gdscript.md)
6. Examples: [Platformer](docs/04-examples/platformer.md) · [Collectibles and saves](docs/04-examples/collectibles-and-saves.md) · [Dialogue and turns](docs/04-examples/dialogue-and-turns.md)
7. Engine: [Scenes and architecture](docs/05-engine/scenes-architecture.md) · [Input, physics, navigation](docs/05-engine/input-physics-navigation.md) · [UI, animation, audio](docs/05-engine/ui-animation-audio.md) · [Debug, performance, export](docs/05-engine/debug-performance-export.md)
8. [Semester brief](docs/06-labs/semester-project.md) · [Cheatsheet](docs/cheatsheet.md) · [Glossary](docs/glossary.md)
9. Diagrams: [Ready order](docs/07-visualizations/ready-order.md) · [Signal flow](docs/07-visualizations/signal-flow.md) · [Game loop](docs/07-visualizations/game-loop.md) · [Coyote time](docs/07-visualizations/coyote-time.md) · [Collision layers](docs/07-visualizations/collision-layers.md)

## Site

From this folder:

```bash
python3 -m http.server 8765
```

Open `http://localhost:8765/site/`. The search field indexes the full text of every chapter, including code examples. Interactive diagrams are grouped under **Visualizations** and also appear beside related chapters.
