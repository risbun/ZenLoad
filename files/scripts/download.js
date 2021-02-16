const { ipcRenderer, shell } = require('electron');
const ProgressBar = require('progressbar.js');
const cp = require('child_process');
const youtubedl = require('youtube-dl-wrap');
const phin = require('phin');
const path = require('path');
const fs = require('fs');

// constants
const REGEX = /[\\\/\:\*\?\"\<\>\|]/g;
const PROGRESSBAR_OPTS = {
  strokeWidth: 2,
  easing: 'linear',
  duration: 100,
  color: '#fff',
  trailColor: '#1c1c1c',
  trailWidth: 2,
  svgStyle: {width: '100%', height: '100%'}
};
const FFMPEG_PATH = path.join(__dirname, 'libs', 'ffmpeg.exe').replace('app.asar', 'app.asar.unpacked');
const YOTUBEDL_PATH = path.join(__dirname, 'libs', 'youtube-dl.exe').replace('app.asar', 'app.asar.unpacked');
const DEFAULT_OPTIONS = ['--no-color', '--no-cache-dir', '--newline', '--ffmpeg-location', FFMPEG_PATH];

// global
let opts, videoElems, queueElems, current;
const ytdl = new youtubedl(YOTUBEDL_PATH);

// failed
const failed = (msg) => {
  document.querySelector('.video-bottom').classList.toggle('hidden', true);
  document.querySelector('.video').classList.toggle('hidden', true);
  document.querySelector('.queue').classList.toggle('hidden', true);

  document.querySelector('.video-done-icon').className = 'fas fa-times-circle done-big';
  document.querySelector('.video-done span').innerText = msg;

  document.querySelector('.video-done').classList.toggle('hidden', false);
  if (current) current.kill();
}

// download thumbs
const downloadThumbs = (thumbs, videoPath) => {
  return new Promise(async (res, rej) => {
    fs.mkdirSync(path.join(videoPath, 'thumbnails'), { recursive: true });
    var i = 0;
    while (i < thumbs.length) {
      var ext = thumbs[i].url.split(/[#?]/)[0].split('.').pop().trim();
      var output = fs.createWriteStream(path.join(videoPath, 'thumbnails', `${thumbs[i].resolution}.${ext}`));
      var resp = await phin({
        url: thumbs[i].url,
        stream: true
      });
      resp.pipe(output);
      i++;
    }
    res();
  });
}

// download video
const downloadVideo = (info, videoPath) => {
  return new Promise(async (res, rej) => {
    var af = opts.format == 'MP4' ? 'm4a' : opts.format.toLowerCase(), vh = opts.res.split('p')[0], vf = opts.format.toLowerCase();
    var formatLine = `bestvideo[height<=?${vh}][ext=${vf}]+bestaudio[ext=${af}]/best[ext=${vf}]`;
    var options = DEFAULT_OPTIONS.concat(['-o', path.join(videoPath, `${info.fulltitle.replace(REGEX, '_')}_${info.id}.%(ext)s`), '-f', formatLine, info.id]);

    var audio = false;
    var proc = ytdl.exec(options)
      .on('progress', (prog) => {
        if (prog.percent == 100) audio = true;
        videoElems[2].innerText = `Downloading ${audio ? 'audio' : 'video'} (${Math.floor(prog.percent)}%, ${prog.currentSpeed}, ${prog.eta})`
        videoElems[3].animate(prog.percent / 100);
      })
      .on('error', (error) => {
        return failed(error);
      })
      .on('close', () => {
        res();
        current = null;
      });
    current = proc.youtubeDlProcess;
  });
}

// get all metadata of video
const getVideo = (id) => {
  return new Promise((res, rej) => {
    var options = DEFAULT_OPTIONS.concat(['-j', id]);
    var proc = cp.execFile(YOTUBEDL_PATH, options, (err, stdout, stderr) => {
      if (err) return failed(stderr);
      res(JSON.parse(stdout.toString()));
    });
  });
}

// when loaded
window.addEventListener('load', async () => {
  // get saved options and playlist
  opts = JSON.parse(localStorage.getItem('options'));
  var arr = JSON.parse(localStorage.getItem('playlist'));

  // get all elements
  videoElems = [...document.querySelectorAll('#videoThumb, #videoTitle, #videoTask')];
  queueElems = [...document.querySelectorAll('#queueThumb, #queueTitle')];
  var progress = document.querySelector('#videoProgress');

  // push loading bars
  videoElems.push(new ProgressBar.Line('#videoLoading', PROGRESSBAR_OPTS));

  // handlers for buttons
  document.querySelector('#videoHome').addEventListener('click', () => {
    ipcRenderer.send('window', 'files/start.html');
  });
  document.querySelector('#videoExit').addEventListener('click', () => {
    ipcRenderer.send('goodbye');
  });
  document.querySelector('#videoOpenFolder').addEventListener('click', () => {
    shell.openPath(opts.outputPath);
  });
  document.querySelector('#videoCancel').addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel the download?')) {
      if (current) current.kill();
      ipcRenderer.send('window', 'files/start.html');
    }
  });

  // prepare video and queue
  var info = await getVideo(arr[0]);
  videoElems[0].src = info.thumbnail;
  videoElems[1].innerText = info.fulltitle;
  if (arr.length > 1) {
    queueInfo = await getVideo(arr[1]);
    queueElems[0].src = queueInfo.thumbnail;
    queueElems[1].innerText = queueInfo.fulltitle;
  } else {
    document.querySelector('.queue').classList.toggle('hidden', true);
  }

  // video download loop
  var i = 0;
  while (i < arr.length) {
    progress.innerText = `Download progress: ${i + 1} / ${arr.length}`;

    // information download
    videoElems[2].innerText = 'Getting info';
    if (i != 0) {
      // get to da choppa
      info = {...queueInfo};

      // title and shit
      videoElems[1].innerText = info.fulltitle;
      videoElems[0].src = info.thumbnail;

      // get next in queue if exist
      if (arr[i + 1]) {
        queueInfo = await getVideo(arr[i + 1]);
        queueElems[0].src = queueInfo.thumbnail;
        queueElems[1].innerText = queueInfo.fulltitle;
      } else {
        document.querySelector('.queue').classList.toggle('hidden', true);
      }
    }
    videoElems[2].innerText = 'Exporting info';

    // create path
    var videoPath = path.join(opts.outputPath, `${info.fulltitle.replace(REGEX, '_')}_${arr[i]}`);
    if (fs.existsSync(videoPath)) fs.rmdirSync(videoPath, { recursive: true });
    fs.mkdirSync(videoPath, { recursive: true });

    // downoad thumbs if user wants
    if (opts.thumb) await downloadThumbs(info.thumbnails, videoPath);

    // only save videodata to disk if user wants it
    if (opts.data) {
      // data to download
      var data = {
        id: arr[i],
        title: info.fulltitle,
        uploaded: info.upload_date,
        tags: info.tags,
        views: info.view_count,
        live: info.is_live,
        age_limit: info.age_limit,
        categories: info.categories,
        likes: info.like_count,
        dislikes: info.dislike_count,
        rating: info.average_rating
      };

      // if description should be sepeate or not
      if (opts.seperate) {
        fs.writeFileSync(path.join(videoPath, 'description.txt'), info.description, 'utf8');
      } else {
        data.description = info.description;
      }

      // write to disk
      // also saves it as a more readable file
      fs.writeFileSync(path.join(videoPath, 'data.json'), JSON.stringify(data, null, 2), 'utf8');
    }

    // download it!
    await downloadVideo(info, videoPath);
    videoElems[3].set(0);

    i++;
  }

  document.querySelector('.video-bottom').classList.toggle('hidden', true);
  document.querySelector('.video').classList.toggle('hidden', true);
  document.querySelector('.queue').classList.toggle('hidden', true);
  document.querySelector('.video-done').classList.toggle('hidden', false);
});
