const _7z = require('7zip-min');
const fs = require('fs');
const fetch = require('node-fetch');

const URL = 'https://github.com/risbun/FFmpeg/releases/download/N-101028/ffmpeg-static-lite.7z';
const BASE = './files/ffmpeg/';

(async () => {
  if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });
  var resp = await fetch(URL);
  var output = fs.createWriteStream(BASE + 'temp.7z');
  output.on('finish', () => {
    _7z.unpack(BASE + 'temp.7z', BASE, (err) => {
      if (err) throw err;
      fs.unlinkSync(BASE + 'temp.7z');
    });
  });
  resp.body.pipe(output);
})();
