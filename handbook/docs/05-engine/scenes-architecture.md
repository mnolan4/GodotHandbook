# Scenes and architecture

In a Godot project, architecture defines which nodes own state, which nodes may call one another directly, and which interactions are communicated through signals. Clear ownership limits the number of files affected by a feature and prevents unrelated systems from depending on the internal structure of the same scene.

## Scenes are functions made of nodes

A scene you instance twice is two objects. They do not share variables. They can share a resource (one `.tres` assigned on both), and then they do share that data. That distinction matters for items: the definition is a resource, the stack count in a pocket is not.

Instance with `PackedScene.instantiate()` and `add_child`. Free with `queue_free`. The parent decides when a child exists.

## A scalable project layout

```
res://
├── scenes/
│   ├── main.tscn              # entry scene; autoloads already exist when it runs
│   ├── levels/
│   ├── entities/
│   └── ui/
├── scripts/
├── resources/
│   ├── items/
│   └── dialogue/
└── assets/
```

Keep `main.tscn` small and focused on application startup or high-level scene flow. Store level geometry, menus, and player behavior in separate reusable scenes. Smaller scenes reduce merge conflicts, shorten load and edit times, and allow each subsystem to be tested with F6.

## Who may know whom

| From | May | May not |
| --- | --- | --- |
| Child | Emit a signal | Call up through `get_parent().get_parent()` |
| Parent | Call methods on children it owns | Reach into a child's children by long path |
| UI | Listen to signals and autoload events | Own the score variable |
| Autoload | Hold run-long state and signals | Spawn level geometry |
| Resource | Store designer data | Hold live node references |

If you cannot describe a new feature with that table, the feature is probably a new scene plus one signal, not a new branch in `GameManager`.

## State

Begin with an enum and a `match` statement on the node that owns the behavior. When individual states acquire substantial entry, exit, timing, and transition logic, move them into dedicated child nodes with a shared interface. Behavior trees or entity-component-system architectures solve different scaling problems and are unnecessary for a small state set.

Setting `get_tree().paused = true` stops nodes whose process mode inherits the default pausable behavior. A pause-menu root usually uses **When Paused** (`PROCESS_MODE_WHEN_PAUSED`), which activates it only while the tree is paused. Use **Always** (`PROCESS_MODE_ALWAYS`) only when the node must process both during normal play and while paused. Without one of these modes, the menu can appear while its buttons and input callbacks are also paused. The [UI, animation, and audio](ui-animation-audio.md) lab applies this configuration.

## Scene flow

`get_tree().change_scene_to_file("res://scenes/levels/level_02.tscn")` frees the current scene and keeps autoloads. Put "what level is loaded" in the autoload if more than one system asks. Put "where is the player standing" on the player, and copy what must survive into the save before the change.

Use threaded loading when synchronous level loading causes a visible frame pause. Start the request with `ResourceLoader.load_threaded_request`, check its status from the main thread, and instantiate the returned resource when loading completes. Worker threads must not modify the scene tree; node creation and `add_child` calls belong on the main thread.

## A note on managers

An autoload named `Save` with a focused persistence API is a service. A general `Game` autoload that exposes the player, UI, spawning, quest state, and audio combines unrelated responsibilities and allows every system to depend on every other system. Split such an autoload into focused services when its responsibilities or dependency graph become difficult to describe—for example, `Save`, `SceneFlow`, and `Events`.

## Lab

Draw the current scene tree. For every script, mark direct calls that travel upward through `get_parent()` or depend on a grandparent's structure. Choose one of those dependencies and replace it with a signal emitted by the child and connected by the parent. If the project has no upward calls, practice the same design with a coin or button: the child emits an event, while its parent decides how the application responds.
