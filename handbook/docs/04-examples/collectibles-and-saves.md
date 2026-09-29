# Example: collectibles and saves

Pickups and save files fail in the same way: the game remembers the wrong identity. A coin's place in the tree is not an identity. A node path changes the moment someone reparents the scene. Store an id you assigned.

## Collect

The coin script below reads from `Save`, the persistence autoload defined later in this chapter. Before running the coin scene, add `save.gd` under **Project Settings → Globals → Autoload** with the name `Save`.

`Coin` (`Area2D`)

- `CollisionShape2D`
- `@export var coin_id: StringName`
- `body_entered` connected to the coin

```gdscript
extends Area2D

signal collected(id: StringName)

@export var coin_id: StringName

var _taken := false

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	if Save.collected.has(coin_id):
		queue_free()

func _on_body_entered(body: Node) -> void:
	if _taken or not body.is_in_group("player"):
		return
	_taken = true
	collected.emit(coin_id)
	queue_free()
```

`_taken` matters because `body_entered` can fire again if the body jitters on the shape. Emit once.

The level listens:

```gdscript
func _on_coin_collected(id: StringName) -> void:
	Save.mark_collected(id)
```

The coin does not know about `Save` or the HUD. If you want fewer connections, the level can be the only subscriber, and the HUD listens to `Save.changed`.

Put the player in the `player` group. Checking `body is Player` is fine if `Player` is a `class_name`, and it is stricter. Groups are easier when the player might be a C# class and the coin is GDScript.

## The save service

An autoload `Save` (`save.gd`):

```gdscript
extends Node

signal changed

const PATH := "user://save.json"
const VERSION := 1

var collected: Dictionary = {}
var checkpoint: StringName = &""

func mark_collected(id: StringName) -> void:
	collected[id] = true
	changed.emit()
	write()

func write() -> void:
	var file := FileAccess.open(PATH, FileAccess.WRITE)
	if file == null:
		push_error("Cannot write save: %s" % error_string(FileAccess.get_open_error()))
		return
	var payload := {
		"version": VERSION,
		"collected": collected.keys().map(func(k): return String(k)),
		"checkpoint": String(checkpoint),
	}
	file.store_string(JSON.stringify(payload))

func read() -> void:
	if not FileAccess.file_exists(PATH):
		return
	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot read save")
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Save was not an object")
		return
	if int(parsed.get("version", 0)) > VERSION:
		push_error("Save is from a newer build")
		return
	collected.clear()
	for id in parsed.get("collected", []):
		collected[StringName(id)] = true
	checkpoint = StringName(parsed.get("checkpoint", ""))
	changed.emit()
```

Call `read()` from the autoload's `_ready()`.

`user://` is writable in an export. `res://` is not. A save that works in the editor and vanishes in a build is almost always a `res://` path.

JSON is readable, which helps you debug a course project. It is also easy for a player to edit. That is acceptable here. A released game that must resist editing wants a binary format and still wants a version field.

Always store a `version` value. Save formats normally gain fields as the project develops, and older files should either continue to load with defaults or pass through an explicit migration function.

## Checkpoints

A checkpoint is an `Area2D` with an exported id. On `body_entered` for the player, set `Save.checkpoint` and write. When the level loads, if `Save.checkpoint` matches an id in this level, place the player there.

Do not store `player.global_position` without also identifying the level and save-data version to which that position belongs. Coordinates are meaningful only within a particular scene layout. After a level is renamed or redesigned, an old position may place the player outside the playable area or inside collision geometry. Stable checkpoint ids are usually safer than arbitrary coordinates because each level can resolve an id to a current spawn marker.

## HUD

```gdscript
extends Label

func _ready() -> void:
	Save.changed.connect(_refresh)
	_refresh()

func _refresh() -> void:
	text = "%d found" % Save.collected.size()
```

The label mirrors the autoload. It is not the authority. If the label and the save disagree, the save wins.

## C# note

The same design: a `partial` autoload, `[Signal] public delegate void ChangedEventHandler()`, `System.Text.Json` or Godot's `Json` class, and `Godot.FileAccess`. Keep ids as strings in the file. Do not serialize node references.

`using Godot.Collections` when you pass dictionaries into the engine. `System.Collections.Generic.Dictionary` does not cross the GDScript boundary cleanly.

## Lab

Place five coins with distinct ids. Collect two, stop the game, run it again. Those two should be gone and the label should say 2. Rename a coin's parent node and confirm the collected ones stay collected. If they respawn, you saved a path.
