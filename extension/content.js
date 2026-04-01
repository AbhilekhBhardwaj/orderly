(() => {
  const PANEL_ID = "orderly-sidebar";
  let hasInjected = false;

  // Safety guard in case manifest scope changes later.
  if (!window.location.href.startsWith("https://web.whatsapp.com/")) return;

  function injectSidebar() {
    if (hasInjected) return;
    if (!document.body) return;
    if (document.getElementById(PANEL_ID)) {
      hasInjected = true;
      return;
    }

    const sidebar = document.createElement("aside");
    sidebar.id = PANEL_ID;
    sidebar.className = "orderly-assistant-panel";
    sidebar.textContent = "Orderly Panel Loading...";

    // Keep WhatsApp content visible by reserving space on the right.
    document.documentElement.style.setProperty("--orderly-sidebar-width", "300px");
    document.body.style.marginRight = "var(--orderly-sidebar-width)";

    document.body.appendChild(sidebar);
    hasInjected = true;
  }

  if (document.body) {
    injectSidebar();
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSidebar, { once: true });
  } else {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      injectSidebar();
      observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
