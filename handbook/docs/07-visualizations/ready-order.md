# Ready order

`_ready` runs on children before their parent. The diagram pulses a small tree in that order. Click a node to read when it runs. The button at the bottom replays the pulse.

Parents that cache `$Child` in `_ready` are safe, because the child is already in the tree. The same line in `_init` is not.
