# Demos

Two CodePen demos, each split into the three CodePen panels:

| Folder | Shows |
| --- | --- |
| `codepen/` | Confirm with dismiss, stacked modals with modal state, async resolver with retry, programmatic close |
| `codepen-animated/` | Enter and exit animations: dialog, drawer and bottom sheet, plus stacked modals |

## Setting up a pen

1. Create a new pen.
2. **HTML panel:** paste `index.html` (just the root element).
3. **CSS panel:** paste `style.css`.
4. **JS panel:** paste `script.jsx`, then open the panel settings (⚙) and set **JavaScript Preprocessor** to **Babel**. The imports are full esm.sh URLs on purpose: CodePen's Babel turns bare imports such as `'react'` into `require()` calls, which fail in the browser. `?deps=` makes react-modal-port use the same React version as the pen.
5. Save, and point the matching link in the root `readme.md` at the pen. The basics link already points to the existing pen `YzMyoBr`, so updating that pen's code is enough. The animated link points to `demo/codepen-animated/` on GitHub until its pen exists.

The pens load `react-modal-port@^1.0.0`, so they work only once 1.0.0 is published to npm.
