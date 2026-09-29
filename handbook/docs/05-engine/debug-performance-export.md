# Debug, performance, and export

## When it breaks

Read the first error. The stack names a script and a line. Open that line before you change anything else.

| Symptom | Look at |
| --- | --- |
| Script did nothing | Is it attached? Does `extends` match the node? Did the build fail (C#)? |
| `$Path` is null | Scene dock names, case, and whether the node is a child of the script's node |
| Works in editor, fails in build | You wrote to `res://`, or an export preset filtered out the file |
| Input ignored | Action name typo, or a Control ate the event |
| Jump only works sometimes | Checked `just_pressed` on the wrong clock, or no coyote/buffer |
| C# change ignored | Project did not build. The game is running the old assembly |
| Exported value resets | `@export` and `@onready` on the same variable |

The Debugger dock can pause on errors and show the remote tree: the tree that actually exists at runtime, which is not always the tree you edited. Autoloads appear there. Freed nodes do not.

`push_error` and `push_warning` land in Output and are easier to spot than a `print` you scroll past. Remove debug prints before you call a build final, or guard them with `OS.is_debug_build()`.

## Performance, in the order that actually matters

1. **Measure.** The debugger's profiler and the monitors (Visual Profiler) tell you if you are in scripts, physics, or rendering. Guessing sends you into the wrong chapter.
2. **Stop doing work per frame that could be once.** Node lookups, allocations in `_process`, raycasts you could cache for a tenth of a second.
3. **Physics.** Configure named collision layers and masks so that unrelated objects are not tested against one another. Use simple convex collision shapes for moving bodies; complex concave shapes are intended primarily for static world geometry.
4. **Rendering.** Use `TileMapLayer`, batching, and shared materials for repeated content instead of creating large numbers of independent visual nodes. Reuse particle systems and disable lights that do not contribute to the visible scene.
5. **Loading.** Preload small, frequently used scenes when their paths are fixed. Load large levels asynchronously before a transition so disk access and resource parsing do not interrupt active gameplay.

Object pools (a stack of bullets you hide instead of `queue_free`) matter when the profiler says allocation in the shoot function is hot. They do not matter for a coin you pick up once.

Use `StringName` literals such as `&"run"` for animation names, input actions, and other identifiers compared frequently. Godot interns `StringName` values, which makes repeated equality checks less expensive than comparing newly constructed `String` values.

## Export

Project → Export. You need export templates for your exact editor version (Editor → Manage Export Templates). A template from 4.3 will not serve a 4.7 project.

Use **Export Release** for distribution. Debug exports include diagnostic features, run with development settings, and may expose debugging or test functionality that should not be present in a release build.

Each preset has filters. A common student bug is excluding `.json` dialogue and then wondering why the build has no lines. If the file is not under `res://`, it is not in the game.

| Platform | Extra fact |
| --- | --- |
| Windows, Linux, macOS | Easiest. macOS apps you distribute outside a store should be signed and notarized or Gatekeeper will block classmates. |
| Web | GDScript is the smooth path. C# web export is a different, stricter setup. Test keyboard focus: the page must hold it or input dies. |
| Android | SDK, a keystore, and environment variables for passwords. Do not commit the keystore or the password. |
| iOS | A Mac, certificates, and more patience than this paragraph has room for. |

Run the export once on a machine that is not your editor. "It runs in the editor" is not a test.

Saves still go to `user://`. Confirm the path by printing `OS.get_user_data_dir()` once in a debug build.

Feature tags let one project behave differently per preset:

```gdscript
if OS.has_feature("web"):
	show_touch_controls()
if OS.has_feature("release"):
	cheat_button.visible = false
```

## A release checklist

- Main scene is set.
- Input actions exist for every control the README mentions.
- Debug prints and god-mode keys are off, or behind `OS.is_debug_build()`.
- Credits for third-party art and fonts sit in the game and in the repo.
- A classmate can start a new game, pick up an item, save, quit, relaunch, and see the item still gone.
- The zip you hand in contains the export plus a note of the Godot version. It does not contain your `.godot` cache as a substitute for an export.

## Lab

Introduce one deliberate bug: a bad node path. Read the error, fix only that, and write one sentence in your notes about the wording Godot used. Then export a release build for your desktop OS and run it without the editor open.
