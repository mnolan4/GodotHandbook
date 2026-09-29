# Glossary

**Action.** A named input (`jump`) mapped to devices in the Input Map.

**AnimationPlayer.** Plays authored tracks. The usual first animation node.

**AnimationTree.** Blends AnimationPlayer clips. Add it when you need states or blend spaces, not before.

**Area2D / Area3D.** A region that detects overlap. Pickups and triggers. Not a wall.

**Autoload.** A node created at startup that survives scene changes. Project Settings → Autoload.

**CanvasLayer.** A draw layer for UI that should stay on screen independent of the camera.

**CharacterBody2D / 3D.** A body you move with code, typically `move_and_slide`.

**class_name.** Declares a global GDScript type.

**Collision layer.** Bits that say what a body is.

**Collision mask.** Bits that say what a body cares about.

**Control.** Base type for UI nodes.

**delta.** Seconds since the previous call of `_process` or `_physics_process`. C# passes it as `double`.

**Export.** `@export` or `[Export]`. Shows the property in the Inspector.

**GDExtension.** Godot's runtime native-extension interface. It loads a compiled shared library and exposes registered native classes and methods without requiring a custom engine build.

**godot-cpp.** The official C++ bindings for GDExtension. They provide C++ representations of Godot types and APIs for registering custom classes, methods, properties, and signals.

**Group.** A named tag on nodes. `add_to_group`, `call_group`.

**Main scene.** The scene F5 runs. Application → Run.

**Mask.** See collision mask.

**Native extension.** Compiled C or C++ code loaded through GDExtension. The project must provide a compatible binary for each target platform and architecture.

**NavigationAgent.** Node that follows a baked navigation mesh toward a target position.

**NavigationRegion.** Holds the mesh agents walk on. Must be baked, and is not ready in the first lines of `_ready`.

**Node.** One object in the scene tree.

**PackedScene.** A scene loaded as a resource you can `instantiate`.

**Process mode.** Determines whether a node receives processing and input callbacks under the SceneTree's current pause state. **When Paused** (`PROCESS_MODE_WHEN_PAUSED`) runs only while the tree is paused and is appropriate for a pause-menu root. **Always** (`PROCESS_MODE_ALWAYS`) runs whether the tree is paused or not and is appropriate for services that must remain active in both states.

**queue_free.** Frees a node safely at the end of the frame.

**res://** Project files. Read-only in an export.

**Resource.** Serialisable data (`.tres`), not a node. The stand-in for a Unity ScriptableObject.

**RigidBody2D / 3D.** A body the physics solver moves.

**Scene.** A saved node tree (`.tscn`).

**Signal.** A list of methods to call when something happens. Emit; do not reach up the tree.

**SCons.** The Python-based build system used to compile Godot, godot-cpp, and many GDExtension projects.

**StaticBody2D / 3D.** A collider that does not move.

**TileMapLayer.** 2D tile grid used for level collision and rendering. Prefer it over a field of sprite nodes.

**Tween.** Interpolates a property over time. Use it for interface transitions and presentation effects, not for collision-based character movement.

**user://** Per-user writable folder. Saves and settings.

**Unique name.** The `%` access flag on a node so `%Name` finds it without a brittle path.

**Y-down.** Godot 2D's vertical axis. Up is negative.
