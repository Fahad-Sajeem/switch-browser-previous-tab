# Previous Tab Switcher

A tiny Chromium extension that toggles between your two most recently used tabs with a single keyboard shortcut — like Alt+Tab, but for browser tabs.

Press the shortcut once to jump to the previous tab, press it again to come back.

## Features

- One-key switching between your last two tabs
- Rotate through your recently used tabs with a second shortcut
- On-screen overlay while rotating that lists your recent tabs and highlights where you are
- Configurable overlay (on/off) and rotation timeout (1–10 seconds, default 2)
- Works across multiple browser windows
- Skips tabs that have been closed
- Customizable shortcuts (defaults: **Alt+Q** to toggle, **Alt+Shift+Q** to rotate)
- Settings page that shows your current shortcuts and holds the options
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

| Shortcut | Action |
| --- | --- |
| Alt+Q | Toggle between the two most recent tabs (A→B, then B→A) |
| Alt+Shift+Q | Rotate through recent tabs: tap repeatedly to go further back |

When rotating, each press moves one tab further back, wrapping around at the end. Pause for about two seconds (configurable) to stay on the tab you reached; the next press starts a fresh rotation from there. Tabs you pass through are not recorded, so only the one you land on becomes the most recent tab.

Browsers don't tell extensions when a modifier key like Alt is released, so a true hold-Alt-and-tap Alt+Tab experience isn't possible. Two shortcuts are used instead.

## Settings

Click the extension's toolbar icon to open its settings page (or right-click the icon and choose **Options**).

| Setting | Default | What it does |
| --- | --- | --- |
| Show the tab overlay while rotating | On | Turn the overlay panel on or off. Rotation works either way. |
| Rotation timeout | 2 seconds | How long the overlay stays on screen, and how long you have between presses to keep rotating (1–10 seconds). It also applies when the overlay is off. |

Changes are saved automatically and apply on the next rotation. Settings sync with your browser profile.

## Change the shortcuts

Extensions can't set their own global shortcuts from code, so the keys are changed in the browser's shortcut settings:

1. Click the extension's toolbar icon to open its settings page.
2. Click **Change shortcuts**. This opens `chrome://extensions/shortcuts`.
3. Find **Previous Tab Switcher**, click the box next to the action you want to change, and press the keys you want (include Ctrl or Alt).

If Alt+Q does nothing, another extension or app may already use it. Pick a different combination there.

## How it works

The background service worker records every tab activation in a most-recent-first history (kept in `chrome.storage.session`, so it survives the worker being suspended). When the shortcut fires, it activates the most recent tab that isn't the current one and focuses its window. Closed tabs are removed from the history.

Rotating takes a snapshot of that history on the first press and steps through it, ending after a pause.

## Rotation overlay

While rotating with Alt+Shift+Q, a small panel appears over the page you land on. It lists up to eight recent tabs with their icons and titles, highlights where you are, shows a count such as "2 of 5", and fades out after you pause. The overlay and its timeout are configurable in the [settings](#settings).

It can't appear on pages the browser blocks extensions from, such as `chrome://` pages, the new tab page, the Web Store and PDFs. Rotation still works there, just without the panel.

## Permissions

| Permission | Why |
| --- | --- |
| `tabs` | Find and activate the previous tab |
| `storage` | Keep the tab history in session storage and save your settings |
| `scripting` and access to all sites | Draw the rotation overlay on the page you land on. Nothing is read from or sent from pages. |

## Project structure

```
manifest.json    Extension manifest (Manifest V3)
background.js    Tab history and switching logic
overlay.js       Rotation overlay injected into the tab you land on
options.html     Settings page
options.js       Settings page script
icons/           Extension icons (16, 32, 48, 128 px)
```

## Limitations

- The history starts empty after a browser restart, apart from the tab that's open at the time.
- Browser-reserved shortcuts can't be overridden.

## License

MIT
