const HISTORY_KEY = "tabHistory";
const CYCLE_KEY = "tabCycle";
const MAX_HISTORY = 20;
// Presses of the cycle shortcut closer together than this keep stepping further back.
// The overlay stays visible for the same time. Configurable on the settings page.
const DEFAULT_TIMEOUT_MS = 2000;

async function getSettings() {
  const { timeoutMs, showOverlay } = await chrome.storage.sync.get(["timeoutMs", "showOverlay"]);
  return {
    timeout: Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_TIMEOUT_MS,
    overlay: showOverlay !== false,
  };
}

// Serialize read-modify-write cycles so rapid events don't clobber each other.
let queue = Promise.resolve();
function enqueue(task) {
  queue = queue.then(task).catch(console.error);
  return queue;
}

async function getHistory() {
  const data = await chrome.storage.session.get(HISTORY_KEY);
  return data[HISTORY_KEY] || [];
}

function setHistory(history) {
  return chrome.storage.session.set({ [HISTORY_KEY]: history });
}

async function getCycle() {
  const data = await chrome.storage.session.get(CYCLE_KEY);
  return data[CYCLE_KEY] || null;
}

function setCycle(cycle) {
  return cycle
    ? chrome.storage.session.set({ [CYCLE_KEY]: cycle })
    : chrome.storage.session.remove(CYCLE_KEY);
}

async function pushToFront(tabId) {
  const history = (await getHistory()).filter((id) => id !== tabId);
  history.unshift(tabId);
  await setHistory(history.slice(0, MAX_HISTORY));
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

// While cycling, the tabs we step through are not recorded. Once the cycle ends,
// the tab we landed on becomes the most recent one.
async function commitCycle() {
  if (!(await getCycle())) return;
  await setCycle(null);
  const current = await activeTab();
  if (current) await pushToFront(current.id);
}

async function focusTab(tabId) {
  const tab = await chrome.tabs.get(tabId);
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
}

function seedWithActiveTab() {
  return enqueue(async () => {
    const current = await activeTab();
    if (current) await pushToFront(current.id);
  });
}

chrome.runtime.onInstalled.addListener(seedWithActiveTab);
chrome.runtime.onStartup.addListener(seedWithActiveTab);

// Clicking the toolbar icon opens the settings page where the shortcut can be changed.
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.tabs.onActivated.addListener(({ tabId }) =>
  enqueue(async () => {
    const cycle = await getCycle();
    if (cycle && cycle.pending === tabId) {
      await setCycle({ ...cycle, pending: null });
      return;
    }
    // The user picked a tab themselves, which ends any cycle in progress.
    await setCycle(null);
    await pushToFront(tabId);
  })
);

chrome.tabs.onRemoved.addListener((tabId) =>
  enqueue(async () => {
    const history = await getHistory();
    await setHistory(history.filter((id) => id !== tabId));
  })
);

async function switchToPrevious() {
  await commitCycle();
  const current = await activeTab();
  for (const tabId of await getHistory()) {
    if (current && tabId === current.id) continue;
    try {
      await focusTab(tabId);
      return;
    } catch {
      // Tab no longer exists; try the next one.
    }
  }
}

// Draws the rotation panel on the page we just landed on. Restricted pages (chrome://,
// the Web Store, PDFs) can't be scripted, so failures are ignored.
async function showOverlay(order, targetId, hideAfter) {
  try {
    const tabs = (
      await Promise.all(order.map((id) => chrome.tabs.get(id).catch(() => null)))
    ).filter(Boolean);
    const index = tabs.findIndex((tab) => tab.id === targetId);
    if (index === -1) return;

    const message = {
      type: "show-overlay",
      index,
      hideAfter,
      tabs: tabs.map(({ title, url, favIconUrl }) => ({ title, url, favIconUrl })),
    };
    try {
      await chrome.tabs.sendMessage(targetId, message);
    } catch {
      await chrome.scripting.executeScript({ target: { tabId: targetId }, files: ["overlay.js"] });
      await chrome.tabs.sendMessage(targetId, message);
    }
  } catch {
    // No overlay on this page.
  }
}

async function cycleBack() {
  const { timeout, overlay } = await getSettings();
  let cycle = await getCycle();
  if (cycle && Date.now() - cycle.lastPress > timeout) {
    await commitCycle();
    cycle = null;
  }

  if (!cycle) {
    const current = await activeTab();
    const order = (await getHistory()).filter((id) => !current || id !== current.id);
    cycle = {
      order: current ? [current.id, ...order] : order,
      index: 0,
      pending: null,
      lastPress: 0,
    };
  }

  const { order } = cycle;
  for (let step = 1; step <= order.length; step++) {
    const index = (cycle.index + step) % order.length;
    try {
      await focusTab(order[index]);
      await setCycle({ order, index, pending: order[index], lastPress: Date.now() });
      if (overlay) await showOverlay(order, order[index], timeout);
      return;
    } catch {
      // Tab no longer exists; try the next one.
    }
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "switch-last-tab") enqueue(switchToPrevious);
  else if (command === "cycle-tabs") enqueue(cycleBack);
});
