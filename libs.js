const _7z = require('7zip-min');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const FFMPEG = 'https://github.com/risbun/ffmpeg/releases/latest/download/ffmpeg-static-lite.7z';
const YOUTUBEDL = 'https://github.com/ytdl-org/youtube-dl/releases/latest/download/youtube-dl.exe';
const BASE = './files/libs/';

(async () => {
  if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });
  var resp = await fetch(FFMPEG);
  var output = fs.createWriteStream(BASE + 'temp.7z');
  output.on('finish', () => {
    _7z.unpack(BASE + 'temp.7z', BASE, async (err) => {
      if (err) throw err;
      fs.unlinkSync(BASE + 'temp.7z');
      fs.unlinkSync(BASE + 'ffprobe.exe'); // currently dont need this
      var resp2 = await fetch(YOUTUBEDL);
      resp2.body.pipe(fs.createWriteStream(BASE + 'youtube-dl.exe'));
    });
  });
  resp.body.pipe(output);
})();
