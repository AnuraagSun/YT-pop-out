// Wait for the YouTube player to load
function waitForPlayer(callback) {
  const player = document.querySelector('#movie_player');
  if (player) {
    callback(player);
  } else {
    setTimeout(() => waitForPlayer(callback), 100);
  }
}

// Add the Pop-Out button to the YouTube player controls
function addPopOutButton(player) {
  const controls = document.querySelector('.ytp-right-controls');
  if (!controls || document.querySelector('#yt-pop-out-button')) return; // Avoid duplicates

  const popOutButton = document.createElement('button');
  popOutButton.id = 'yt-pop-out-button';
  popOutButton.className = 'ytp-button';
  popOutButton.innerHTML = '🔲'; // Pop-Out icon
  popOutButton.title = 'Pop-Out Video';

  // Add click event to open pop-up
  popOutButton.addEventListener('click', () => {
    const video = player.querySelector('video');
    if (video) {
      const videoUrl = video.src;
      const currentTime = video.currentTime;
      const isPlaying = !video.paused;

      // Send message to background script to open pop-up
      chrome.runtime.sendMessage({
        action: 'openPopUp',
        videoUrl,
        currentTime,
        isPlaying,
      });

      // Optionally pause the original video (based on user settings)
      chrome.storage.sync.get({ autoPause: true }, (settings) => {
        if (settings.autoPause) {
          video.pause();
        }
      });
    }
  });

  controls.insertBefore(popOutButton, controls.firstChild);
}

// Initialize the content script
waitForPlayer((player) => {
  addPopOutButton(player);
});
// Add this to the existing content.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncVideo') {
    const player = document.querySelector('#movie_player');
    const video = player.querySelector('video');
    if (video) {
      video.currentTime = message.currentTime;
      if (message.isPlaying && video.paused) {
        video.play();
      } else if (!message.isPlaying && !video.paused) {
        video.pause();
      }
    }
  } else if (message.action === 'resumeVideo') {
    const player = document.querySelector('#movie_player');
    const video = player.querySelector('video');
    if (video && video.paused) {
      video.play();
    }
  }
});
