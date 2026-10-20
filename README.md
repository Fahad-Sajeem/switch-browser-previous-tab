# Previous Tab Switcher

A tiny Chromium extension that toggles between your two most recently used tabs with a single keyboard shortcut — like Alt+Tab, but for browser tabs.

Press the shortcut once to jump to the previous tab, press it again to come back.

## Features

- One-key switching between your last two tabs
- Works across multiple browser windows
- Skips tabs that have been closed
- Customizable shortcut (default: **Alt+Q**)
- Settings page that shows your current shortcut
- No data collected, no network requests

Works in Chrome, Edge, Brave and other Chromium-based browsers.

## Install

1. Download or clone this repository:
   ```bash
   git clone https://github.com/Fahad-Sajeem/browser-previous-tab.git
   ```
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
5. Optional: pin the extension from the puzzle-piece menu in the toolbar.

## Usage

1. Open two or more tabs.
2. Press **Alt+Q** to switch to the previously active tab.
3. Press it again to switch back.

## Change the shortcut

Extensions can't set their own global shortcut from code, so the key is changed in the browser's shortcut settings:

1. Click the extension's toolbar icon to open its settings page.
2. Click **Change shortcut**. This opens `chrome://extensions/shortcuts`.
3. Find **Previous Tab Switcher**, click the box next to **Switch to the previously active tab**, and press the keys you want (include Ctrl or Alt).

If Alt+Q does nothing, another extension or app may already use it. Pick a different combination there.

## How it works

The background service worker records every tab activation in a most-recent-first history (kept in `chrome.storage.session`, so it survives the worker being suspended). When the shortcut fires, it activates the most recent tab that isn't the current one and focuses its window. Closed tabs are removed from the history.

## Permissions

| Permission | Why |
| --- | --- |
| `tabs` | Find and activate the previous tab |
| `storage` | Keep the tab history in session storage |

## Project structure

```
manifest.json    Extension manifest (Manifest V3)
background.js    Tab history and switching logic
options.html     Settings page
options.js       Settings page script
icons/           Extension icons (16, 32, 48, 128 px)
```

## Limitations

- The history starts empty after a browser restart, apart from the tab that's open at the time.
- Browser-reserved shortcuts can't be overridden.

## License

MIT
