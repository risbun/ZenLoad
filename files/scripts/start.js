const { ipcRenderer } = require('electron')
const ytpl = require('ytpl');

window.addEventListener('load', () => {
  var gopang = document.querySelector('#gopang');
  var inputelem = document.querySelector('#url');
  gopang.addEventListener('click', async () => {
    try {
      var id = await ytpl.getPlaylistID(inputelem.value);
    } catch (e) {
      return document.querySelector('#error').innerText = e;
    }
    localStorage.setItem('playlist', id);
    ipcRenderer.send('window', 'files/settings.html');
  });
});
