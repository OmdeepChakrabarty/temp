# Interaction director

## PURPOSE
Translate browser input into deterministic, scoped scene commands without coupling the UI to capability internals.

## RESPONSIBILITIES
Plan interaction.pointer, raycast, hover, click, drag, scroll and keyboard; Pointer Events support mouse/pen/touch where practical. Normalize canvas coordinates, track pointer capture, expose semantic commands/typed outputs and configurable camera-control routing.

## NON-RESPONSIBILITIES
No document-wide permanent listeners, automatic material mutation, hidden camera ownership, full gesture recognition framework or direct arbitrary object-property writes.

## DEPENDENCIES
Core, browser events, Three.js Raycaster/math. Targets are explicitly supplied object handles.

## DEPENDENCY DIRECTION
Interaction → core. Composition binds outputs; app supplies canvas/focus/input adapter. Cameras accept commands through public channels, not interaction imports.

## PUBLIC API
Factories emit interaction-source/event channels with subscribe/dispose and optional numeric PropertyHandles. Parameters declare pick layers, target refs, drag plane, scroll scale, gesture policy and throttling. Listener installation is an activation hook, not a side effect during prepare.

## DATA FLOW
DOM event → canvas-local normalized input record → bounded command queue → frame sample/raycast → semantic hover/click/drag/scroll/key commands → declared bindings next tick or camera phase.

## IMPLEMENTATION ORDER
Scoped pointer/keyboard adapter → NDC/raycast → hover/click → captured drag → scroll → touch and cancellation/accessibility qualification.

## IMPORTANT PSEUDOCODE
```text
pointer event:
  rect = current canvas CSS bounds
  x = 2*(clientX-rect.left)/rect.width - 1
  y = 1-2*(clientY-rect.top)/rect.height
  coalesce move record by pointerId; preserve down/up order
frame pick:
  update relevant matrices; raycast explicit pick targets once
  compare stable object/instance IDs; emit enter/leave only on change
drag:
  capture pointer on down; intersect fixed declared drag plane
  emit delta through a typed command, never mutate target directly
  on up/cancel/lostcapture/blur/dispose: end drag and release capture
```

Use CSS rect coordinates, not device-pixel canvas size. Click requires a bounded travel threshold and matching down/up target; touch scrolling is preserved unless an active gesture explicitly captures it.

## CONSTRAINTS
Only canvas/focused controls own shortcuts; do not intercept text inputs or browser shortcuts. Explicit single/multi-touch policy; initial implementation supports single-pointer drag. Raycast instanced objects retains instanceId. Object sorting/selection semantics are deterministic.

## PERFORMANCE REQUIREMENTS
Coalesce pointer moves to one pick per frame; restrict pick layers/targets and reuse hit arrays/vectors. Add spatial acceleration only after profiling, with explicit dependencies. Bound queues and report overflow rather than unbounded event retention.

## RESOURCE LIFECYCLE
Scope owns listeners, pointer capture, subscriptions and queued records. Activation occurs only after scene commit; disposal cancels gestures even mid-drag. Borrowed objects are never disposed.

## ERROR HANDLING
INVALID_PICK_TARGET, DEGENERATE_DRAG_PLANE, INPUT_QUEUE_OVERFLOW. Degenerate intersections skip movement instead of emitting NaNs; record actionable diagnostics without logging every pointer move.

## TESTING REQUIREMENTS
Offset/scaled canvas NDC, hover transitions, click threshold, instanced picking, drag cancellation/lost capture, focus/text-input rules, touch defaults, scroll scaling, writer conflicts and no duplicate listeners after scene/HMR replacement.

## INTEGRATION REQUIREMENTS
Core consumes queued commands at declared phases; animation writer arbitration prevents conflicting ownership. App offers keyboard-accessible alternatives and inspector visibility of active controls.

## COMPLETION CHECKLIST
- [ ] Pointer/raycast/hover/click/drag/scroll/key vocabulary scoped.
- [ ] Touch/focus defaults preserve browser behavior.
- [ ] Command ordering and writer rules tested.
- [ ] No leaked listeners/capture after replacement.
