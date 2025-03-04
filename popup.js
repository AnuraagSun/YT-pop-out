document.addEventListener('DOMContentLoaded', () => {
  const autoPauseCheckbox = document.getElementById('autoPause');

  // Load saved settings
  chrome.storage.sync.get({ autoPause: true }, (settings) => {
    autoPauseCheckbox.checked = settings.autoPause;
  });

  // Save settings on change
  autoPauseCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ autoPause: autoPauseCheckbox.checked }, () => {
      console.log('Settings saved.');
    });
  });
});
