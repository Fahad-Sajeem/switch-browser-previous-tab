const keysEl = document.getElementById("keys");

function renderShortcut(shortcut) {
  keysEl.replaceChildren();

  if (!shortcut) {
    const unset = document.createElement("span");
    unset.className = "unset";
    unset.textContent = "Not set";
    keysEl.append(unset);
    return;
  }

  // Chrome joins keys with "+" (macOS shows glyphs with no separator).
  const parts = shortcut.includes("+") ? shortcut.split("+") : [...shortcut];
  parts.forEach((part, i) => {
    if (i > 0) {
      const plus = document.createElement("span");
      plus.className = "plus";
      plus.textContent = "+";
      keysEl.append(plus);
    }
    const key = document.createElement("kbd");
    key.textContent = part;
    keysEl.append(key);
  });
}

async function showShortcut() {
  const commands = await chrome.commands.getAll();
  const cmd = commands.find((c) => c.name === "switch-last-tab");
  renderShortcut(cmd && cmd.shortcut);
}

document.getElementById("change").addEventListener("click", () => {
  const scheme = navigator.userAgent.includes("Edg/") ? "edge" : "chrome";
  chrome.tabs.create({ url: `${scheme}://extensions/shortcuts` });
});

showShortcut();
// The user edits the shortcut in another tab; refresh when they come back.
window.addEventListener("focus", showShortcut);
