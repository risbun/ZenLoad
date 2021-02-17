// modules
const { ipcRenderer } = require('electron');
const path = require('path');
const ytpl = require('ytpl');
const fs = require('fs');
const os = require('os');

// global variables
let outputPath = path.join(os.homedir(), 'Videos', 'ZenLoad');
let ignoredVids = [];

// when u click a video in the video list
const clickVid = (e) => {
  if (e.path[0].tagName != 'DIV') var elem = e.path[1];
  else var elem = e.path[0];
  var index = ignoredVids.indexOf(Number(elem.dataset.index));
  if (index > -1) {
    ignoredVids.splice(index, 1);
    elem.querySelector('i').className = 'fas fa-check-square';
  } else {
    ignoredVids.push(Number(elem.dataset.index));
    elem.querySelector('i').className = 'far fa-square';
  }
}

// extract all ids from playlist object
const extractIDs = (items) => {
  return new Promise((res, rej) => {
    var arr = [], last;
    items.forEach((item, i) => {
      if (item.isPlayable && !ignoredVids.includes(i)) arr.push(item.id);
      if (i == items.length - 1) res(arr);
    });
  });
}

// custom checkbox function
const checkbox = (e) => {
  if (e.target.className == 'far fa-square') e.target.className = 'fas fa-check-square';
  else e.target.className = 'far fa-square';
}

// when ipcMain returns with a directory
ipcRenderer.on('directory', (event, data) => {
  if (!data.canceled) {
    if (fs.readdirSync(data.filePaths[0]).length > 0) {
      if (confirm(`Selected directory is not empty. Do you still want to use ${data.filePaths[0]}?`)) outputPath = data.filePaths[0];
    } else outputPath = data.filePaths[0];
    document.querySelector('#settingsChosen').innerText = outputPath;
  }
});

// wait for the page to load
window.addEventListener('load', async () => {
  // get the current playlist
  var playlist = localStorage.getItem('playlist');
  if (!playlist) return ipcRenderer.send('window', 'files/start.html');

  // get all items
  var pl = await ytpl(playlist, { limit: 'Infinity' });
  document.querySelector('#settingsImg').src = pl.bestThumbnail.url;
  document.querySelector('#settingsTitle').innerText = pl.title;
  document.querySelector('#settingsInfo').innerText = `${pl.estimatedItemCount} Videos | ${pl.views} Views`;
  document.querySelector('#settingsChosen').innerText = outputPath;

  // put all videos in list
  var parent = document.querySelector('.settings-vids');
  pl.items.forEach((item, i) => {
    var elem = document.createElement('div');
    elem.className = 'settings-vid';
    elem.innerHTML = `<p>${item.title}</p><i class="fas fa-check-square"></i>`;
    elem.dataset.index = i;
    elem.addEventListener('click', clickVid);
    parent.appendChild(elem);
  });

  // hide loading animation
  document.querySelector('.settings-loading').classList.toggle('hidden', true);
  document.querySelector('.settings').classList.toggle('hidden', false);

  // toggle all videos
  document.querySelector('#settingsToggle').addEventListener('click', () => {
    var vids = document.querySelector('.settings-vids');
    pl.items.forEach((item, i) => {
      var index = ignoredVids.indexOf(i);
      if (index > -1) {
        ignoredVids.splice(index, 1);
        vids.children[i].querySelector('i').className = 'fas fa-check-square';
      } else {
        ignoredVids.push(i);
        vids.children[i].querySelector('i').className = 'far fa-square';
      }
    });
  });

  // button handlers
  document.querySelector('#settingsChoose').addEventListener('click', () => {
    ipcRenderer.send('directory');
  });
  document.querySelector('#settingsBack').addEventListener('click', () => {
    ipcRenderer.send('window', 'files/start.html');
  });

  // checkboxes
  document.querySelector('#settingsThumbs').addEventListener('click', checkbox);
  document.querySelector('#settingsVideodata').addEventListener('click', checkbox);
  document.querySelector('#settingsSeperate').addEventListener('click', checkbox);

  // final download button
  document.querySelector('#settingsDownload').addEventListener('click', async () => {
    var index = document.querySelector('#settingsContinue');
    if (index.value && index.value < 1) alert('Continue number can\'t be negative.');
    else if (ignoredVids.length >= pl.items.length) alert('You can\'t just download 0 videos.');
    else if (index.value && index.value > (pl.items.length - ignoredVids.length)) alert('Continue number can\'t be bigger than length silly.');
    else {
      var arr = await extractIDs(pl.items);
      localStorage.setItem('playlist', JSON.stringify(arr));
      localStorage.setItem('options', JSON.stringify({
        thumb: (document.querySelector('#settingsThumbs').className == 'fas fa-check-square'),
        data: (document.querySelector('#settingsVideodata').className == 'fas fa-check-square'),
        seperate: (document.querySelector('#settingsSeperate').className == 'fas fa-check-square'),
        res: document.querySelector('#settingsRes').value,
        format: document.querySelector('#settingsFormat').value,
        outputPath: outputPath,
        index: index.value
      }));
      ipcRenderer.send('window', 'files/download.html');
    }
  });
});
