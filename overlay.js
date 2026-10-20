// Injected on demand into the tab you land on while rotating. Draws a small switcher
// panel listing recent tabs, with the current one highlighted, and fades it out.
(() => {
  if (window.__prevTabOverlay) return;

  let host = null;
  let panel = null;
  let hideTimer = null;

  function build() {
    host = document.createElement("div");
    host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;";
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap { position: fixed; inset: 0; display: grid; place-items: center;
                font: 14px system-ui, "Segoe UI", sans-serif; }
        .panel { min-width: 320px; max-width: min(560px, 90vw); padding: 10px; border-radius: 14px;
                 background: rgba(30, 32, 40, 0.94); color: #eceef5;
                 box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.1);
                 opacity: 0; transform: scale(0.97); transition: opacity .12s, transform .12s; }
        .panel.show { opacity: 1; transform: scale(1); }
        .row { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 9px; }
        .row.active { background: #5b6cff; color: #fff; }
        .icon { width: 18px; height: 18px; flex: none; border-radius: 4px; background: rgba(255, 255, 255, 0.15); }
        .title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .count { margin: 6px 12px 2px; font-size: 12px; opacity: .6; }
      </style>
      <div class="wrap"><div class="panel"></div></div>`;
    document.documentElement.append(host);
    panel = root.querySelector(".panel");
  }

  function render(panel, tabs, index) {
    panel.replaceChildren();
    const first = Math.max(0, index - 7);
    tabs.slice(first, first + 8).forEach((tab, i) => {
      const row = document.createElement("div");
      row.className = "row" + (first + i === index ? " active" : "");
      const icon = document.createElement("img");
      icon.className = "icon";
      if (tab.favIconUrl) icon.src = tab.favIconUrl;
      icon.onerror = () => icon.removeAttribute("src");
      const title = document.createElement("span");
      title.className = "title";
      title.textContent = tab.title || tab.url || "Untitled";
      row.append(icon, title);
      panel.append(row);
    });
    const count = document.createElement("div");
    count.className = "count";
    count.textContent = `${index + 1} of ${tabs.length}`;
    panel.append(count);
  }

  function hide() {
    if (host) host.remove();
    host = null;
    panel = null;
  }

  window.__prevTabOverlay = {
    show(tabs, index, hideAfter) {
      clearTimeout(hideTimer);
      if (!host || !host.isConnected) build();
      const current = panel;
      render(current, tabs, index);
      requestAnimationFrame(() => current.classList.add("show"));
      hideTimer = setTimeout(() => {
        current.classList.remove("show");
        setTimeout(hide, 150);
      }, hideAfter);
    },
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "show-overlay") {
      window.__prevTabOverlay.show(message.tabs, message.index, message.hideAfter);
    }
  });
})();
