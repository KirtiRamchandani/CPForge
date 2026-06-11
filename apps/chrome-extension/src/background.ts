chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    cpForgeSettings: {
      theme: "dark",
      telemetry: false,
      leetcodeGraphql: false
    }
  });
});
