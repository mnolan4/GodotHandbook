# Collision layers

Each body has a layer (what it is) and a mask (what it notices). A notices B only when A's mask shares a bit with B's layer.

Click the layer and mask bits on each card to change its collision configuration. A line appears when at least one object is configured to detect the other. Assigning every object to the same layer and enabling every mask creates unnecessary collision checks and can cause projectiles, triggers, and characters to interact with unintended targets.
