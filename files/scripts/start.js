const { ipcRenderer } = require('electron')
const ytpl = require('ytpl');

window.addEventListener('load', () => {
  var startBtn = document.querySelector('#startBtn');
  var startUrl = document.querySelector('#startUrl');
  startBtn.addEventListener('click', async () => {
    try {
      var id = await ytpl.getPlaylistID(startUrl.value);
    } catch (e) {
      return document.querySelector('#startError').innerText = e;
    }
    localStorage.setItem('playlist', id);
    ipcRenderer.send('window', 'files/settings.html');
  });
});
