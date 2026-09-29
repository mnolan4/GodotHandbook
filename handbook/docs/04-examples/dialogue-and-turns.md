# Example: dialogue and turns

Two small systems that show up in student games the moment someone says "it should have a story" or "it should be tactical." Both rot if the rules live in a single 800-line script. Keep the data in resources and the rules in one node.

## Dialogue

A line of dialogue is data.

```gdscript
extends Resource
class_name DialogueLine

@export var speaker: String
@export_multiline var text: String
@export var next: DialogueLine
@export var choices: Array[DialogueChoice] = []
```

```gdscript
extends Resource
class_name DialogueChoice

@export var label: String
@export var next: DialogueLine
@export var sets_flag: StringName
```

A `DialogueBox` (`CanvasLayer` with a `RichTextLabel` and a `VBoxContainer` for buttons) asks a runner to show the current line. The runner holds the only `current: DialogueLine`.

```gdscript
extends Node
class_name DialogueRunner

signal line_shown(line: DialogueLine)
signal finished

var current: DialogueLine

func start(root: DialogueLine) -> void:
	current = root
	_show()

func choose(index: int) -> void:
	var choice := current.choices[index]
	if choice.sets_flag != &"":
		Save.set_flag(choice.sets_flag)
	advance_to(choice.next)

func advance_to(line: DialogueLine) -> void:
	current = line
	if current == null:
		finished.emit()
		return
	_show()

func _show() -> void:
	line_shown.emit(current)
```

For a typewriter effect, reveal characters on a timer and immediately reveal the complete line when the player presses the advance action during the animation. Keep a reference to the active tween or timer and stop it before starting another. Multiple concurrent reveal operations can compete over `visible_characters`, display text out of order, or prevent the dialogue state from advancing.

Store narrative flags in persistent game state rather than on the dialogue box. The dialogue box is a view and may be removed whenever the interface closes; it should not own facts that affect later scenes. A minimal save autoload can expose a dictionary:

```gdscript
var flags: Dictionary[StringName, bool] = {}

func set_flag(id: StringName, value: bool = true) -> void:
	flags[id] = value
	write()

func has_flag(id: StringName) -> bool:
	return flags.get(id, false)
```

Extend the `Save.write()` payload with a `"flags"` entry, converting `StringName` keys to strings as required by JSON. In `Save.read()`, clear the current dictionary and rebuild it from that entry. Provide an empty dictionary as the default so save files created before flags were added still load successfully. The [collectibles and saves chapter](collectibles-and-saves.md) defines the `Save` autoload, `user://` paths, and versioned JSON format in detail.

Branching that matters is a flag plus a different `next`. A tree of nested `if` statements inside the UI script cannot be edited by anyone, including you.

Rollback history, character portraits, and voice playback can be added after the core dialogue model is reliable. First verify that at least two branches select the correct next line and that a choice flag persists through save and load. These features depend on that state model and are harder to diagnose when added simultaneously.

### C# note

`[GlobalClass] public partial class DialogueLine : Resource` with `[Export] public Godot.Collections.Array<DialogueChoice> Choices`. Assign the graph in the Inspector. The runner logic is the same.

## Turn-based combat

A turn system is a list and a rule for whose entry is current. It is not the scene tree read from left to right.

In the following example, `Combatant` represents the script or resource used for one unit. It must expose at least a stable `unit_id`, a numeric `speed`, and the current action-point value `ap`.

```gdscript
enum Phase { START, COMMAND, RESOLVE, END }

var order: Array[Combatant] = []
var index := 0
var phase := Phase.START

func begin_round() -> void:
	order = combatants.duplicate()
	order.sort_custom(func(a: Combatant, b: Combatant) -> bool:
		if a.speed == b.speed:
			return a.unit_id < b.unit_id
		return a.speed > b.speed
	)
	index = 0
	phase = Phase.COMMAND

func current() -> Combatant:
	return order[index]
```

Rules that keep the turn model deterministic and consistent:

- Sort when the round starts, and again only if a speed stat changes. Sorting on every action is wasted work and makes ties flicker.
- Break ties with a stable id, not `randi()`. A replay or a bug report should come out the same way twice.
- Do not add or remove from `order` while you iterate it. Queue the defeat, then compact the list after the loop.
- Spend action points only after the action is legal. Check cost, then subtract.
- Phases are an enum and a `match`, not `if phase == 0`.

```gdscript
func try_spend(cost: int) -> bool:
	var unit := current()
	if unit.ap < cost:
		return false
	unit.ap -= cost
	return true
```

Represent the logical battlefield with a data structure such as a dictionary keyed by `Vector2i`. Grid nodes should read that data and display it rather than serving as the only source of truth. A data model can be serialized, validated, simulated without rendering, and restored independently of the current scene tree. Treating live nodes as the board state makes save files and automated tests depend on scene structure.

Signal the UI: `turn_started(unit)`, `hp_changed(unit)`. The turn manager does not grab the label by path.

### C# note

Define `enum Phase` inside the manager and use `List<Combatant>` for C#-only logic if appropriate. Convert to a Godot collection when the data must be exposed to GDScript. Sort with a comparer that uses speed followed by a stable id, and emit `[Signal]` events at phase changes. Retain the combatant list instead of scanning the scene tree each turn; the manager already owns the authoritative roster.

## Lab

Dialogue: two lines, one choice that sets `met_npc`, and a load that skips the intro line when the flag is set.

Turns: three combatants, one of them slower. Run three rounds and confirm the order only changes when you change a speed stat. Defeat the middle unit on their turn and confirm the next unit still acts, once, without an index error.
