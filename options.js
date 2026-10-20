function renderShortcut(keysEl, shortcut) {
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

async function showShortcuts() {
  const commands = await chrome.commands.getAll();
  document.querySelectorAll("[data-command]").forEach((el) => {
    const cmd = commands.find((c) => c.name === el.dataset.command);
    renderShortcut(el, cmd && cmd.shortcut);
  });
}

document.getElementById("change").addEventListener("click", () => {
  const scheme = navigator.userAgent.includes("Edg/") ? "edge" : "chrome";
  chrome.tabs.create({ url: `${scheme}://extensions/shortcuts` });
});

showShortcuts();
// The user edits the shortcuts in another tab; refresh when they come back.
window.addEventListener("focus", showShortcuts);

const DEFAULT_TIMEOUT_MS = 2000;
const timeoutInput = document.getElementById("timeout");
const timeoutValue = document.getElementById("timeout-value");
const overlayInput = document.getElementById("overlay");
const savedEl = document.getElementById("saved");
let savedTimer;

function flashSaved() {
  savedEl.textContent = "Saved";
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (savedEl.textContent = ""), 1500);
}

function showTimeout() {
  timeoutValue.textContent = `${timeoutInput.value} s`;
}

async function loadSettings() {
  const { timeoutMs, showOverlay } = await chrome.storage.sync.get(["timeoutMs", "showOverlay"]);
  timeoutInput.value = (Number(timeoutMs) || DEFAULT_TIMEOUT_MS) / 1000;
  overlayInput.checked = showOverlay !== false;
  showTimeout();
}

timeoutInput.addEventListener("input", showTimeout);
timeoutInput.addEventListener("change", async () => {
  await chrome.storage.sync.set({ timeoutMs: Number(timeoutInput.value) * 1000 });
  flashSaved();
});

overlayInput.addEventListener("change", async () => {
  await chrome.storage.sync.set({ showOverlay: overlayInput.checked });
  flashSaved();
});

loadSettings();
