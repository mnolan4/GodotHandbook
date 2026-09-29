# Game loop

Rendering and physics do not share a clock. The outer ring is frames. The inner ring is physics ticks at a fixed step.

Drag the frame-delay control in the website visualization. One slow rendered frame can require several fixed physics ticks, which is why collision-based movement belongs in `_physics_process`. `move_and_slide` consumes velocity using the physics timestep internally, so velocity should not be multiplied by `delta` before the call.
