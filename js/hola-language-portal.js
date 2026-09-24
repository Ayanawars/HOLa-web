/* HOLa · language picker portal: keeps the full menu above clipped headers on mobile. */
(() => {
  "use strict";
  function init() {
    const toggle = document.getElementById("languageToggle");
    const list = document.getElementById("languageList");
    if (!toggle || !list || list.dataset.holaPortalReady === "1") return;
    list.dataset.holaPortalReady = "1";
    function place() {
      if (list.hidden) return;
      if (list.parentElement !== document.body) document.body.appendChild(list);
      const rect = toggle.getBoundingClientRect();
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const vh = window.visualViewport?.height || window.innerHeight;
      const width = Math.min(208, vw - 24);
      const top = Math.max(8, Math.min(rect.bottom + 7, vh - 110));
      const left = Math.max(12, Math.min(rect.right - width, vw - width - 12));
      const maxHeight = Math.max(92, Math.min(438, vh - top - 12));
      Object.assign(list.style, {
        position: "fixed",
        top: top + "px",
        left: left + "px",
        right: "auto",
        bottom: "auto",
        width: width + "px",
        maxHeight: maxHeight + "px",
        overflowY: "auto",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        zIndex: "2147483000",
        pointerEvents: "auto",
        touchAction: "pan-y"
      });
    }
    toggle.addEventListener("click", () => {
      if (!list.hidden) {
        place();
        list.scrollTop = 0;
      }
    });
    // Existing page handlers still select and close a language.
    // Keep clicks within the portalled list from being mistaken for outside clicks.
    list.addEventListener("click", event => event.stopPropagation());
    window.addEventListener("resize", place, {passive: true});
    window.visualViewport?.addEventListener("resize", place, {passive: true});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});
  else init();
})();
