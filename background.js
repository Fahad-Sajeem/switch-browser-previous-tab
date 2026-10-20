const HISTORY_KEY = "tabHistory";
const MAX_HISTORY = 20;

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

function recordActivation(tabId) {
  return enqueue(async () => {
    const history = (await getHistory()).filter((id) => id !== tabId);
    history.unshift(tabId);
    await setHistory(history.slice(0, MAX_HISTORY));
  });
}

function forgetTab(tabId) {
  return enqueue(async () => {
    const history = await getHistory();
    await setHistory(history.filter((id) => id !== tabId));
  });
}

async function seedWithActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) await recordActivation(tab.id);
}

chrome.runtime.onInstalled.addListener(seedWithActiveTab);
chrome.runtime.onStartup.addListener(seedWithActiveTab);

// Clicking the toolbar icon opens the settings page where the shortcut can be changed.
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.tabs.onActivated.addListener(({ tabId }) => recordActivation(tabId));
chrome.tabs.onRemoved.addListener((tabId) => forgetTab(tabId));

chrome.commands.onCommand.addListener((command) => {
  if (command !== "switch-last-tab") return;

  enqueue(async () => {
    const [current] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const history = await getHistory();

    for (const tabId of history) {
      if (current && tabId === current.id) continue;
      try {
        const tab = await chrome.tabs.get(tabId);
        await chrome.windows.update(tab.windowId, { focused: true });
        await chrome.tabs.update(tabId, { active: true });
        return;
      } catch {
        // Tab no longer exists; try the next one.
      }
    }
  });
});
