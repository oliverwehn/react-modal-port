# Demos

Two demos for the **CodePen 2.0 editor**. Each folder is a complete pen:

| Folder | Shows |
| --- | --- |
| `codepen/` | Confirm with dismiss, persistent modal state across a nested modal, async resolver with retry, programmatic close |
| `codepen-animated/` | Enter and exit animations: dialog, drawer and bottom sheet, plus stacked modals shown as a deck with direction-aware motion |

Each pen has four files:

| File | Purpose |
| --- | --- |
| `index.html` | A complete HTML page that links `./style.css` and loads `./script.js` as a module. |
| `style.css` | Styles, including light and dark themes. |
| `script.jsx` | The demo. The `.jsx` extension turns on CodePen's **Babel block**, which compiles it to `script.js`. |
| `package.json` | Pins the package versions that CodePen's **Packages block** loads from esm.sh. |

## Setting up a pen

1. Create a new pen. 2.0 pens start with `index.html`, `style.css` and `script.js`.
2. Replace the contents of `index.html` and `style.css` with the files from the demo folder.
3. Rename `script.js` to **`script.jsx`** and paste the demo's `script.jsx`. The extension is what enables Babel for the JSX. You don't need to add the block by hand.
4. Add a `package.json` file with the demo's `package.json`. If CodePen has already generated one from the imports, replace its contents.
5. Save, and point the matching link in the root `readme.md` at the pen.

The bare imports (`'react'`, `'react-modal-port'`) are resolved by CodePen through an import map that it generates from `package.json`.

### Notes

- **File limit:** free plans allow three authored files per pen. `index.html`, `style.css` and `script.jsx` count; `package.json` and CodePen's own config files don't.
- **One copy of React:** `"react-modal-port": "1.0.0?deps=react@19.3.0,react-dom@19.3.0"` tells esm.sh to build the library against the same React as the pen. Keep the three versions in sync when you update them. If package versions get into a bad state, delete `package.json`; CodePen regenerates it with the latest versions.
- **`import React`:** the Babel block compiles JSX to `React.createElement(...)`, so `script.jsx` imports `React` even though it never uses it directly.
- **Classic editor:** these files target CodePen 2.0. In the classic editor, the HTML panel would be just `<div id="root"></div>`, and the imports would need full esm.sh URLs, because classic Babel turns bare imports into `require()` calls.
