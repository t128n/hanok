/***
 * hanok — user-overrides.js
 *
 * Appended after the pinned arkenfox user.js. Later prefs win.
 * Delete a line to unfreeze that setting.
 *
 * This is the daily-driver profile: FPP (not RFP), logins/cookies kept,
 * session + workspace restore kept, UI pinned.
 ***/

// ---------------------------------------------------------------------------
// arkenfox adjustments
// ---------------------------------------------------------------------------

// Keep session restore and Zen's new tab
user_pref("browser.startup.page", 3);
user_pref("browser.startup.homepage", "about:newtab");
user_pref("browser.newtabpage.enabled", true);

// Keep logins and workspace state; cache/form data are still cleared on exit
user_pref("privacy.clearOnShutdown_v2.cookiesAndStorage", false);
user_pref("browser.sessionstore.privacy_level", 0);

// Daily-driver performance: arkenfox disables the disk cache
user_pref("browser.cache.disk.enable", true);

// Do not narrow extension scopes; Zen may rely on system-scope add-ons
user_pref("extensions.enabledScopes", 15);

// Required for chrome/userChrome.css and chrome/userContent.css
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);

// FPP instead of RFP. RFP breaks Zen theming, timezone and letterboxing.
user_pref("privacy.fingerprintingProtection", true);
user_pref("privacy.fingerprintingProtection.pbmode", true);

// ---------------------------------------------------------------------------
// Built-in password manager and form autofill
// ---------------------------------------------------------------------------

// Firefox password manager off; Proton Pass is unaffected.
user_pref("signon.rememberSignons", false);
user_pref("signon.autofillForms", false);
user_pref("signon.generation.enabled", false);
user_pref("signon.management.page.breach-alerts.enabled", false);

// No address/payment capture or autofill, even if policies.json is missing.
user_pref("extensions.formautofill.addresses.enabled", false);
user_pref("extensions.formautofill.addresses.capture.enabled", false);
user_pref("extensions.formautofill.creditCards.enabled", false);

// Keep bookmarks/tabs/history sync, but never sync credentials or form data.
user_pref("services.sync.engine.passwords", false);
user_pref("services.sync.engine.addresses", false);
user_pref("services.sync.engine.creditcards", false);

// Extensions and prefs are managed by hanok, not by Sync.
user_pref("services.sync.engine.addons", false);
user_pref("services.sync.engine.prefs", false);

// Generic form history is already disabled by arkenfox:
// user_pref("browser.formfill.enable", false);

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

// Never offer to translate German. Other languages can still be offered.
user_pref("browser.translations.neverTranslateLanguages", "de");

// ---------------------------------------------------------------------------
// Zen: startup, noise and updates
// ---------------------------------------------------------------------------

user_pref("zen.welcome-screen.seen", true);
user_pref("zen.updates.show-update-notification", false);
user_pref("zen.mods.auto-update", false);
user_pref("zen.workspaces.continue-where-left-off", true);

// ---------------------------------------------------------------------------
// Zen: tabs
// ---------------------------------------------------------------------------

user_pref("zen.ctrlTab.show-pending-tabs", false);
user_pref("zen.tabs.vertical", true);
user_pref("zen.tabs.vertical.right-side", false);
user_pref("zen.tabs.show-newtab-vertical", false);
user_pref("zen.tabs.essentials.max", 12);
user_pref("zen.tabs.ctrl-tab.ignore-essential-tabs", false);
user_pref("zen.tabs.ctrl-tab.ignore-pending-tabs", false);
user_pref("zen.tabs.close-on-back-with-no-history", true);
user_pref("zen.tabs.close-window-with-empty", true);
user_pref("zen.tabs.select-recently-used-on-close", true);
user_pref("zen.tabs.rename-tabs", true);
user_pref("zen.tabs.open-pinned-in-new-tab", true);
user_pref("zen.tabs.dnd-switch-space-delay", 500);
user_pref("zen.tabs.folder-dragover-threshold-percent", 20);

// ---------------------------------------------------------------------------
// Zen: sidebar, toolbar and window
// ---------------------------------------------------------------------------

user_pref("zen.view.use-single-toolbar", true);
user_pref("zen.view.sidebar-expanded", true);
user_pref("zen.view.sidebar-expanded.max-width", 500);
user_pref("zen.view.show-newtab-button-top", false);
user_pref("zen.view.show-clear-tabs-button", true);
user_pref("zen.view.show-scroll-to-selected-tab", true);
user_pref("zen.view.hide-window-controls", true);
user_pref("zen.view.grey-out-inactive-windows", true);
user_pref("zen.view.borderless-fullscreen", true);
user_pref("zen.view.enable-loading-indicator", true);
user_pref("zen.view.overflow-webext-toolbar", true);
user_pref("zen.view.overflow-webext-toolbar-threshold", 55);
user_pref("zen.view.drag-window-from-content", true);
user_pref("zen.view.drag-window-from-content.height-percentage", 5);
user_pref("zen.view.draggable-sidebar", true);
user_pref("zen.view.context-menu.refresh", false);
user_pref("zen.view.shift-down-site-on-hover", false);
user_pref("zen.view.experimental-force-window-controls-left", false);
user_pref("zen.view.experimental-no-window-controls", false);
user_pref("zen.view.window.scheme", 2);
user_pref("zen.view.mac.show-three-dot-menu", false);

user_pref("zen.widget.mac.mono-window-controls", true);
user_pref("zen.widget.macos.override-system-swipe-gestures", true);
user_pref("zen.widget.macos.window-material", 1);
user_pref("zen.widget.macos.window-vibrancy", true);

// ---------------------------------------------------------------------------
// Zen: compact mode
// ---------------------------------------------------------------------------

user_pref("zen.view.compact.enable-at-startup", false);
user_pref("zen.view.compact.animate-sidebar", true);
user_pref("zen.view.compact.hide-tabbar", true);
user_pref("zen.view.compact.hide-toolbar", false);
user_pref("zen.view.compact.show-background-tab-toast", true);
user_pref("zen.view.compact.show-sidebar-and-toolbar-on-hover", true);
user_pref("zen.view.compact.sidebar-keep-hover.duration", 150);
user_pref("zen.view.compact.toolbar-flash-popup", false);
user_pref("zen.view.compact.toolbar-flash-popup.duration", 800);
user_pref("zen.view.compact.toolbar-hide-after-hover.duration", 1000);
user_pref("zen.view.compact.outside-window-edge-offset.horizontal", 200);
user_pref("zen.view.compact.outside-window-edge-offset.vertical", 100);
user_pref("zen.view.compact.debug", false);

// ---------------------------------------------------------------------------
// Zen: URL bar
// ---------------------------------------------------------------------------

user_pref("zen.urlbar.behavior", "floating-on-type");
user_pref("zen.urlbar.replace-newtab", true);
user_pref("zen.urlbar.open-on-startup", true);
user_pref("zen.urlbar.hide-one-offs", true);
user_pref("zen.urlbar.show-sponsored", false);
user_pref("zen.urlbar.show-pinned", true);
user_pref("zen.urlbar.show-pip-button", false);
user_pref("zen.urlbar.show-protections-icon", false);
user_pref("zen.urlbar.show-contextual-id", false);
user_pref("zen.urlbar.show-domain-only-in-sidebar", true);
user_pref("zen.urlbar.single-toolbar-show-copy-url", true);
user_pref("zen.urlbar.enable-overrides", false);
user_pref("zen.urlbar.suggestions.quick-actions", true);
user_pref("zen.urlbar.wait-to-clear", 45000);

// ---------------------------------------------------------------------------
// Zen: theme
// ---------------------------------------------------------------------------

user_pref("zen.theme.accent-color", "AccentColor");
user_pref("zen.theme.use-system-colors", false);
user_pref("zen.theme.dark-mode-bias", "0.3");
user_pref("zen.theme.disable-lightweight", true);
user_pref("zen.theme.acrylic-sidebar", false);
user_pref("zen.theme.acrylic-urlbar", false);
user_pref("zen.theme.border-radius", -1);
user_pref("zen.theme.content-element-separation", 8);
user_pref("zen.theme.essentials-favicon-bg", true);
user_pref("zen.theme.gradient.show-custom-colors", false);
user_pref("zen.theme.hide-tab-throbber", true);
user_pref("zen.theme.hide-unified-extensions-button", true);
user_pref("zen.theme.styled-status-panel", true);

// ---------------------------------------------------------------------------
// Zen: workspaces
// ---------------------------------------------------------------------------

user_pref("zen.workspaces.separate-essentials", true);
user_pref("zen.workspaces.wrap-around-navigation", true);
user_pref("zen.workspaces.natural-scroll", false);
user_pref("zen.workspaces.hide-default-container-indicator", true);
user_pref("zen.workspaces.force-container-workspace", false);
user_pref("zen.workspaces.open-new-tab-if-last-unpinned-tab-is-closed", false);
user_pref("zen.workspaces.scroll-modifier-key", "ctrl");
user_pref("zen.workspaces.dnd-switch-padding", 20);
user_pref("zen.workspaces.switch-animation-duration", 250);
user_pref("zen.workspaces.swipe-actions", true);
user_pref("zen.workspaces.swipe-actions.edge-actions", true);
user_pref("zen.workspaces.swipe-actions.delta-multiplier", 100);
user_pref("zen.workspaces.debug", false);

// ---------------------------------------------------------------------------
// Zen: window sync
// ---------------------------------------------------------------------------

user_pref("zen.window-sync.enabled", true);
user_pref("zen.window-sync.sync-only-pinned-tabs", true);
user_pref("zen.window-sync.open-link-in-new-unsynced-window", true);
user_pref("zen.window-sync.prefer-unsynced-windows", false);
user_pref("zen.window-sync.log", false);

// ---------------------------------------------------------------------------
// Zen: folders, split view, glance, library, downloads
// ---------------------------------------------------------------------------

user_pref("zen.folders.max-subfolders", 5);
user_pref("zen.folders.owned-tabs-in-folder", false);
user_pref("zen.folders.search.enabled", true);
user_pref("zen.folders.search.hover-delay", 500);

user_pref("zen.splitView.enable-drag-over-split", true);
user_pref("zen.splitView.enable-tab-click-split", true);
user_pref("zen.splitView.enable-tab-drop", true);
user_pref("zen.splitView.min-resize-width", 7);
user_pref("zen.splitView.rearrange-hover-size", 24);
user_pref("zen.splitView.drag-over-split-delayMC", 500);
user_pref("zen.splitView.drag-over-split-threshold", 40);

user_pref("zen.glance.enabled", true);
user_pref("zen.glance.activation-method", "alt");
user_pref("zen.glance.animation-duration", 350);
user_pref("zen.glance.deactivate-docshell-during-animation", false);
user_pref("zen.glance.enable-contextmenu-search", true);
user_pref("zen.glance.open-essential-external-links", true);

user_pref("zen.library.enabled", true);
user_pref("zen.library.history.closed-tabs", false);
user_pref("zen.library.media.enabled", false);
user_pref("zen.library.media.folders", "downloads,documents,pictures");

user_pref("zen.downloads.download-animation", true);
user_pref("zen.downloads.download-animation-duration", 1000);
user_pref("zen.downloads.icon-popup-position", 0);

// ---------------------------------------------------------------------------
// Zen: pinned tabs, boosts, containers, misc
// ---------------------------------------------------------------------------

user_pref("zen.pinned-tab-manager.close-shortcut-behavior", "reset-unload-switch");
user_pref("zen.pinned-tab-manager.restore-pinned-tabs-to-pinned-url", false);
user_pref("zen.pinned-tab-manager.wheel-close-if-pending", true);
user_pref("zen.pinned-tab-manager.debug", false);

user_pref("zen.boosts.enabled", true);
user_pref("zen.boosts.custom-fonts", false);
user_pref("zen.boosts.disable-on-anonymous-content", true);
user_pref("zen.boosts.dissolve-on-zap", true);
user_pref("zen.boosts.invert-channel-floor", 15);

user_pref("zen.containers.create-default-identities", false);
user_pref("zen.haptic-feedback.enabled", true);
user_pref("zen.mediacontrols.enabled", true);
user_pref("zen.startup.smooth-scroll-in-tabs", true);
