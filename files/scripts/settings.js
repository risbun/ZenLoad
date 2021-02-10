const { ipcRenderer } = require('electron');
const path = require('path');
const ytpl = require('ytpl');
const fs = require('fs');
const os = require('os');

let outputPath = path.join(os.homedir(), 'Videos', 'ZenLoad');
let ignoredVids = [];

const clickVid = (e) => {
  if (e.path[0].tagName != 'DIV') var elem = e.path[1];
  else var elem = e.path[0];
  var index = ignoredVids.indexOf(elem.dataset.index);
  if (index > -1) {
    ignoredVids.splice(index, 1);
    elem.querySelector('i').className = 'fas fa-check-square';
  } else {
    ignoredVids.push(elem.dataset.index);
    elem.querySelector('i').className = 'far fa-square';
  }
}

const extractIDs = (items) => {
  return new Promise((res, rej) => {
    var arr = [], last;
    items.forEach((item, i) => {
      if (item.isPlayable && !ignoredVids.includes(i.toString())) arr.push(item.id);
      if (i == items.length - 1) res(arr);
    });
  });
};

ipcRenderer.on('directory', (event, data) => {
  if (!data.canceled) {
    var dir = fs.readdirSync(data.filePaths[0]);
    console.log(dir);
    if (dir.length > 0) {
      if (confirm(`Selected directory is not empty. Do you still want to use ${data.filePaths[0]}?`)) {
        outputPath = data.filePaths[0];
        document.querySelector('#chosen').innerText = outputPath;
      }
    } else {
      outputPath = data.filePaths[0];
      document.querySelector('#chosen').innerText = outputPath;
    }
  }
});

window.addEventListener('load', async () => {
  var playlist = localStorage.getItem('playlist');
  if (!playlist) return ipcRenderer.send('window', 'files/start.html');

  var pl = await ytpl(playlist, { limit: 'Infinity' });
  document.querySelector('#settings-img').src = pl.bestThumbnail.url;
  document.querySelector('#settings-title').innerText = pl.title;
  document.querySelector('#settings-info').innerText = `${pl.estimatedItemCount} Videos | ${pl.views} Views`;
  document.querySelector('#chosen').innerText = outputPath;

  var parent = document.querySelector('.settings-vids');
  pl.items.forEach((item, i) => {
    var elem = document.createElement('div');
    elem.className = 'settings-vid';
    elem.innerHTML = `<p>${item.title}</p><i class="fas fa-check-square"></i>`;
    elem.dataset.index = i;
    elem.addEventListener('click', clickVid);
    parent.appendChild(elem);
  });

  document.querySelector('.loading').classList.toggle('hidden', true);
  document.querySelector('.settings').classList.toggle('hidden', false);

  var formatSelect = document.querySelector('#format');
  var formats = document.querySelector('#formats');
  formatSelect.addEventListener('change', () => {
    if (formatSelect.value == 'WebM') formats.innerHTML = 'Video: VP9\nAudio: Opus 160kb/s';
    else formats.innerHTML = 'Video: H264\nAudio: AAC ~320kb/s';
  });

  var videodata = document.querySelector('#videodata');
  var seperate = document.querySelector('#seperate');
  videodata.addEventListener('change', () => {
    if (videodata.checked) seperate.removeAttribute('disabled');
    else {
      seperate.checked = false;
      seperate.setAttribute('disabled', '');
    }
  });

  var chooseBtn = document.querySelector('#choose');
  chooseBtn.addEventListener('click', () => {
    ipcRenderer.send('directory');
  });

  var backbtn = document.querySelector('#backbtn');
  backbtn.addEventListener('click', () => {
    ipcRenderer.send('window', 'files/start.html');
  });

  var downloadBtn = document.querySelector('#download');
  var continueNum = document.querySelector('#continue');
  downloadBtn.addEventListener('click', async () => {
    if (continueNum.value < 0) return alert('Continue number can\'t be negative.');
    if (continueNum.value && continueNum.value > pl.items.length) return alert('Continue number can\'t be bigger than length silly.');
    if (ignoredVids.length >= pl.items.length) return alert('You can\'t just download 0 videos.');
    var arr = await extractIDs(pl.items);
    console.log(arr);
    localStorage.setItem('playlist', JSON.stringify(arr));
    localStorage.setItem('options', JSON.stringify({
      thumb: document.querySelector('#thumbs').checked,
      data: videodata.checked,
      seperate: seperate.checked,
      res: document.querySelector('#res').value,
      format: formatSelect.value,
      continueNum: (continueNum.value || 0),
      outputPath: outputPath
    }));
    ipcRenderer.send('window', 'files/download.html');
  });
});
