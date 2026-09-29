# Signal up, call down

A coin does not need a reference to the HUD. It emits a `collected` signal, the level receives that signal, and the level calls a method on the HUD to update the display. This keeps the reusable coin scene independent of a particular interface.

In the website visualization, press the coin or the space bar. The blue-green packet represents the signal traveling from child to parent. The copper packet represents the method call traveling from parent to child. In the text-only version, the same rule is summarized as **signal up, call down**.
