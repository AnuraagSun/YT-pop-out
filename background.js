let popupWindowId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopUp') {
    const { videoUrl, currentTime, isPlaying } = message;

    // Create a pop-up window
    chrome.windows.create(
      {
        url: 'data:text/html,' + encodeURIComponent(createPopupHTML(videoUrl, currentTime, isPlaying)),
        type: 'popup',
        width: 640,
        height: 360,
        focused: true,
      },
      (window) => {
        popupWindowId = window.id;

        // Remove window borders (requires Chrome flag or workaround)
        chrome.windows.update(window.id, { state: 'normal' });
      }
    );
  }
});

// Handle pop-up window closure
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    popupWindowId = null;
    // Optionally notify the YouTube tab to resume playback
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'resumeVideo' });
      }
    });
  }
});

// Generate HTML for the pop-up window
function createPopupHTML(videoUrl, currentTime, isPlaying) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body, html { margin: 0; padding: 0; overflow: hidden; }
        video { width: 100%; height: 100%; }
        .controls { 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
          display: none; 
          background: rgba(0, 0, 0, 0.7); 
          padding: 10px; 
          border-radius: 5px; 
          transition: opacity 0.2s ease; 
        }
        .controls button { 
          background: none; 
          border: none; 
          color: white; 
          font-size: 24px; 
          cursor: pointer; 
          margin: 0 10px; 
        }
        video:hover + .controls, .controls:hover { display: flex; }
      </style>
    </head>
    <body>
      <video id="popupVideo" src="${videoUrl}" ${isPlaying ? 'autoplay' : ''}></video>
      <div class="controls">
        <button id="skipBackward">⏪</button>
        <button id="playPause">${isPlaying ? '⏸️' : '▶️'}</button>
        <button id="skipForward">⏩</button>
        <button id="close">❌</button>
      </div>
      <script>
        const video = document.getElementById('popupVideo');
        const playPauseButton = document.getElementById('playPause');

        video.currentTime = ${currentTime};

        document.getElementById('skipBackward').addEventListener('click', () => {
          video.currentTime -= 10;
        });

        document.getElementById('skipForward').addEventListener('click', () => {
          video.currentTime += 10;
        });

        document.getElementById('playPause').addEventListener('click', () => {
          if (video.paused) {
            video.play();
            playPauseButton.textContent = '⏸️';
          } else {
            video.pause();
            playPauseButton.textContent = '▶️';
          }
        });

        document.getElementById('close').addEventListener('click', () => {
          window.close();
        });

        // Sync video state with the original tab
        video.addEventListener('timeupdate', () => {
          chrome.runtime.sendMessage({
            action: 'syncVideo',
            currentTime: video.currentTime,
            isPlaying: !video.paused,
          });
        });
      </script>
    </body>
    </html>
  `;
}
