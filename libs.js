const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const FFMPEG = 'https://github.com/risbun/ffmpeg/releases/latest/download/ffmpeg-static-lite.zip';
const YOUTUBEDL = 'https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl.exe';
const BASE = path.join(__dirname, 'files', 'libs');

(async () => {
  // fix dirs
  if (fs.existsSync(BASE)) fs.rmdirSync(BASE, { recursive: true });
  fs.mkdirSync(BASE, { recursive: true });
  // download ffmpeg zip
  var resp = await fetch(FFMPEG);
  // create and handle output
  var output = fs.createWriteStream(path.join(BASE, 'temp.zip'));
  output.on('finish', async () => {
    // unzip ffmpeg.exe
    var zip = new AdmZip(path.join(BASE, 'temp.zip'));
    zip.extractEntryTo('ffmpeg.exe', BASE, false, true);
    // delete temp zip
    fs.unlinkSync(path.join(BASE, 'temp.zip'));
    // get youtube dl
    var resp2 = await fetch(YOUTUBEDL);
    // pipe out to file
    resp2.body.pipe(fs.createWriteStream(path.join(BASE, 'youtube-dl.exe')));
  });
  resp.body.pipe(output);
})();
