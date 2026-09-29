# Godot C++ and GDScript

Godot is implemented primarily in C++, while project behavior is commonly written in GDScript or C#. This division allows a project to use the engine's native rendering, physics, audio, navigation, and resource systems without compiling custom C++ code. When profiling identifies a project-specific bottleneck, or when a project must integrate an existing native library, **GDExtension** provides a supported way to add C or C++ code without rebuilding the engine.

This chapter targets Godot 4 and the official [godot-cpp](https://docs.godotengine.org/en/stable/tutorials/scripting/cpp/about_godot_cpp.html) bindings. It explains when native code is appropriate, how an extension fits into a project, and what additional build and distribution responsibilities it creates.

## How the engine and project scripts fit together

The Godot editor and runtime are compiled from the engine source with the SCons build system. Engine systems implement the scene tree, rendering, physics, audio, resource loading, and many other services in native code. GDScript is included as a built-in engine module and provides a language designed for controlling those systems.

A GDScript call can therefore initiate substantial work that is already implemented in C++. For example:

```gdscript
velocity = desired_velocity
move_and_slide()
```

The script decides the desired movement, while the engine performs collision queries and movement resolution. Rewriting the surrounding script in C++ would not replace or accelerate the solver that already runs in native code.

A useful architectural model is:

1. **Scenes and scripts coordinate behavior.** They handle input, state changes, UI, scene flow, and calls into engine APIs.
2. **Built-in engine systems perform specialized operations.** Rendering, physics, audio mixing, and resource loading already run in native code.
3. **A project-specific native extension implements isolated work when justified.** Examples include a measured simulation bottleneck, a data-processing algorithm, or a third-party C/C++ library.

This model is not a guarantee that every script call is inexpensive. Algorithm choice, update frequency, memory allocation, scene structure, and the cost of moving data across a language boundary can matter more than the implementation language.

## Choosing GDScript, C#, GDExtension, or an engine module

| Choice | Appropriate starting use | Main tradeoff |
| --- | --- | --- |
| GDScript | Scenes, input, UI, game rules, prototypes, and most student projects | Fast iteration and close editor integration; project-specific interpreted work can be slower in a genuinely computation-heavy loop |
| C# | Existing C# expertise, .NET libraries, and larger statically typed codebases | Requires the .NET editor and SDK; export support and platform requirements differ from GDScript |
| C++ through GDExtension | A measured computation bottleneck, an existing native library, or a reusable native Godot class | Adds a compiler toolchain, bindings, native binaries, and platform/version compatibility work |
| C++ engine module | Engine access that GDExtension does not expose, or development of a custom Godot build | Requires compiling the engine and every export template that needs the module |

Godot's [scripting-language guide](https://docs.godotengine.org/en/stable/getting_started/step_by_step/scripting_languages.html) recommends GDScript for beginners. It also notes that ordinary gameplay often shows little practical performance difference between languages because scripts spend much of their time calling optimized engine functions. C++ is most valuable when profiling demonstrates that the expensive work is in a project-specific algorithm rather than in an existing engine operation.

## A decision process for a project

### 1. Implement a correct version in a scripting language

Build an inspectable GDScript or C# implementation first. For an interactive installation, this version might read controller or sensor input, update scene state, and produce visual or audio output. A working reference implementation defines expected behavior before optimization changes the architecture.

### 2. Measure representative work

Use Godot's profiler and external timing tools to identify a specific slow function. Test with realistic data sizes and update rates. Before changing languages, examine:

- algorithmic complexity and data structures
- how often the function runs
- whether work can be cached, batched, or distributed across frames
- whether an existing engine API already performs the operation
- whether rendering, physics, or allocation is the actual bottleneck

An optimization should have a recorded baseline and a repeatable workload.

### 3. Define a narrow boundary

If a custom algorithm remains the bottleneck, isolate it behind a small interface such as:

```text
generate_points(input, count) -> PackedVector2Array
```

Keep scene ownership, input, presentation, and application state in GDScript or C#. A narrow native interface is easier to test, profile, rebuild, and replace than a C++ class that controls an entire scene.

### 4. Implement and measure a GDExtension

Compile the isolated operation as a GDExtension, expose its method to Godot, and call it from the existing scene controller. Compare:

- output correctness
- total frame time
- time spent inside the native function
- allocation and data-transfer cost at the script/native boundary
- development and distribution complexity

Keep the extension only when the measured benefit justifies its additional maintenance.

### 5. Use an engine module only for deeper integration

A GDExtension does not require rebuilding the editor. A [custom C++ module](https://docs.godotengine.org/en/stable/engine_details/engine_api/custom_modules_in_cpp.html) is appropriate when the extension API does not expose the required engine internals or when the project intentionally maintains a custom Godot build.

## What GDExtension and godot-cpp provide

**GDExtension** is the native extension interface that allows Godot to load a compiled shared library at runtime. **godot-cpp** is the official C++ binding for that interface. It provides C++ classes corresponding to Godot engine types and the registration machinery required to expose custom classes, methods, signals, and properties to scripts and the editor.

The workflow is different from placing a `.cpp` file beside a `.gd` script. Godot cannot attach a C++ source file directly. The source must be compiled into a library, and a `.gdextension` manifest must tell Godot which library to load for each operating system, architecture, and build configuration.

Once registered, a custom C++ class can appear in the **Add Node** dialog or resource list, depending on its base class. Explicitly bound methods and properties become available to GDScript and C#.

## Typical project structure

One practical layout is:

```text
project/
├── project.godot
├── native/
│   ├── godot-cpp/             # pinned source or submodule
│   ├── src/
│   │   ├── particle_generator.h
│   │   ├── particle_generator.cpp
│   │   └── register_types.cpp
│   └── SConstruct
├── bin/
│   ├── particle_generator.gdextension
│   ├── libparticle_generator.macos.debug.framework
│   └── ... platform-specific libraries
├── scenes/
└── scripts/
```

The exact binary names differ by platform and build setup. The important separation is between Godot project resources, extension source, the pinned binding version, build configuration, and generated native libraries.

## Extension workflow

The official [GDExtension C++ example](https://docs.godotengine.org/en/stable/tutorials/scripting/cpp/gdextension_cpp_example.html) provides a complete buildable project. The following steps explain the role of each part.

### 1. Prepare and pin the toolchain

Install:

- the target Godot 4 editor
- a supported C++ compiler for the target platform
- Python and SCons
- a `godot-cpp` version compatible with the project's minimum Godot release

Record these versions in the repository. A class or team project should be able to reproduce the extension build without relying on one developer's machine state.

### 2. Declare and implement a class

The C++ header declares a class derived from a Godot type. `GDCLASS` supplies the integration metadata used by the binding.

```cpp
class ParticleGenerator : public godot::RefCounted {
    GDCLASS(ParticleGenerator, godot::RefCounted)

protected:
    static void _bind_methods();

public:
    godot::PackedVector2Array generate_points(double input, int count);
};
```

The `.cpp` file implements the algorithm as ordinary C++ while using Godot value and collection types at the public boundary.

### 3. Bind the public interface

Godot does not automatically expose every public C++ method. Register methods explicitly in `_bind_methods()`:

```cpp
void ParticleGenerator::_bind_methods() {
    godot::ClassDB::bind_method(
        godot::D_METHOD("generate_points", "input", "count"),
        &ParticleGenerator::generate_points
    );
}
```

Inspector properties require registered setter and getter methods plus a property definition. Signals also require explicit registration.

### 4. Register the class and compile the library

An extension initialization function registers the class at the appropriate initialization level. The `SConstruct` file configures the source files, godot-cpp binding, target platform, and output library. SCons then compiles the extension rather than recompiling the Godot engine.

### 5. Describe the binaries in a `.gdextension` manifest

The manifest names the initialization entry point and maps feature tags to compiled library paths. Godot uses those mappings to select the correct debug or release library for the current operating system and architecture.

```ini
[configuration]
entry_symbol = "particle_generator_library_init"
compatibility_minimum = "4.7"

[libraries]
macos.debug = "res://bin/libparticle_generator.macos.debug.framework"
macos.release = "res://bin/libparticle_generator.macos.release.framework"
```

Treat these names as examples; use the filenames produced by the project's build configuration.

### 6. Test the editor and every export target

Opening the project tests only the editor platform and build configuration. Build and package a native library for every supported operating system and architecture, then test an exported project. A project that includes only a macOS debug library cannot load the extension in a Windows release export.

## A small script/native boundary

Consider an installation that maps one sensor value to thousands of particle positions. GDScript can own device input and scene presentation:

```gdscript
extends Node2D

var generator := ParticleGenerator.new()

func update_installation(sensor_value: float) -> void:
	var points: PackedVector2Array = generator.generate_points(sensor_value, 10_000)
	draw_points(points)
```

The extension owns only the independent calculation:

```cpp
godot::PackedVector2Array ParticleGenerator::generate_points(
        double input,
        int count) {
    godot::PackedVector2Array result;
    result.resize(count);

    // Compute each position and assign it to result.

    return result;
}
```

The GDScript remains responsible for the interaction sequence: obtain input, request computed data, and present the result. The C++ method owns one measurable algorithm. This sketch omits class registration, initialization, SCons configuration, and the `.gdextension` manifest; use the official complete example when creating a buildable extension.

The boundary itself has a cost. Benchmark the complete call, including construction or transfer of the `PackedVector2Array`, rather than timing only the inner C++ loop.

## Practical cautions

### Performance

C++ does not correct an inefficient algorithm, excessive scene-tree traversal, too many draw calls, or unnecessary per-frame work. Compare the same representative workload before and after moving code. If the native method is called repeatedly with small inputs, language-boundary and allocation costs can remove the expected benefit.

### Godot and godot-cpp compatibility

Target a documented minimum Godot 4 minor release and use a compatible godot-cpp version. According to the [godot-cpp compatibility guidance](https://docs.godotengine.org/en/stable/tutorials/scripting/cpp/about_godot_cpp.html#version-compatibility), extensions targeting an earlier Godot 4 minor release generally work in later minor releases, but the reverse is not guaranteed. Godot 4.0 extensions are a documented exception and do not work unchanged with 4.1 or later.

The extension and engine must also use the same floating-point precision. Extensions for a custom double-precision engine build require a matching API description and native build.

### Distribution

A GDExtension must ship the correct native library for every supported platform, architecture, and build type. Operating-system signing and packaging requirements also apply to those libraries.

A custom engine module has a larger distribution burden. Runtime use requires custom export templates containing the module, and collaborators may need a matching custom editor build.

### Source control and reproducibility

Do not commit only the binary produced on one workstation. Keep the C++ source, build files, manifest, dependency version, and documented build commands in version control. Decide separately whether generated binaries belong in releases, Git LFS, or a reproducible build pipeline.

## Suggested classroom exercise

Create a procedural pattern in GDScript and gradually increase the number of generated points or pixels.

1. Predict which operation will become expensive.
2. Record frame time with representative data.
3. Improve the algorithm, data structure, or update schedule in GDScript.
4. Identify a stable, measurable bottleneck that remains.
5. Implement only that calculation as a C++ GDExtension.
6. Compare correctness, development time, measured frame time, boundary cost, and distribution files.

The exercise is successful even if the GDExtension provides little improvement. A measured result demonstrating that engine calls or rendering dominate the workload is a valid optimization finding.

## Official documentation

- [Scripting languages](https://docs.godotengine.org/en/stable/getting_started/step_by_step/scripting_languages.html)
- [About godot-cpp](https://docs.godotengine.org/en/stable/tutorials/scripting/cpp/about_godot_cpp.html)
- [GDExtension C++ example](https://docs.godotengine.org/en/stable/tutorials/scripting/cpp/gdextension_cpp_example.html)
- [Custom modules in C++](https://docs.godotengine.org/en/stable/engine_details/engine_api/custom_modules_in_cpp.html)
- [Introduction to the build system](https://docs.godotengine.org/en/stable/engine_details/development/compiling/introduction_to_the_buildsystem.html)

This chapter reflects the Godot 4.7 documentation available in September 2026. Verify compiler requirements, platform support, and compatibility rules against the documentation for the exact Godot release used by the project.
