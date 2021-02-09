const { ipcRenderer } = require('electron');
const ProgressBar = require('progressbar.js');
const ffpath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

// constants
const REGEX = /[\\\/\:\*\?\"\<\>\|]/g;

// global
let bar, videoInfo, opts, currentStream;

// failed
const failed = (msg) => {
  document.querySelector('.bottom').classList.toggle('hidden', true);
  document.querySelector('.video').classList.toggle('hidden', true);

  document.querySelector('.done-big').className = 'fas fa-times-circle done-big';
  document.querySelector('.done span').innerText = msg;

  document.querySelector('.done').classList.toggle('hidden', false);
}

// get video format
const getVideoFormat = (info) => {
  return new Promise((res, rej) => {
    var formats = ytdl.filterFormats(info.formats, 'videoonly');
    var corrects = formats.filter(item => item.mimeType.includes(opts.format.toLowerCase()));
    var tryFind = corrects.find(item => item.qualityLabel.includes(opts.res));
    if (tryFind) res(tryFind);
    else {
      var sorted = corrects.sort((i1, i2) => {
        if (Number(i1.qualityLabel.split('p')[0]) < Number(i2.qualityLabel.split('p')[0])) return 1;
        else if (Number(i1.qualityLabel.split('p')[0]) > Number(i2.qualityLabel.split('p')[0])) return -1;
        else return 0;
      });
      res(sorted[0]);
    }
  });
}

// get audio format
const getAudioFormat = (info) => {
  return new Promise((res, rej) => {
    var formats = ytdl.filterFormats(info.formats, 'audioonly');
    var correct = formats.find(item => item.mimeType.includes(opts.format.toLowerCase()));
    res(correct);
  });
}

// download thumbs
const downloadThumbs = (info, videoPath) => {
  return new Promise(async (res, rej) => {
    fs.mkdirSync(path.join(videoPath, 'thumbnails'), { recursive: true });
    var thumbs = info.videoDetails.thumbnails, i = 0;
    while (i < thumbs.length) {
      var filename = path.basename(thumbs[i].url.split('?')[0]), ext = path.extname(filename);
      var output = path.join(videoPath, 'thumbnails', filename);
      if (fs.existsSync(output)) output = path.join(videoPath, 'thumbnails', filename.replace(ext, `_${i}${ext}`));
      var resp = await fetch(thumbs[i].url);
      resp.body.pipe(fs.createWriteStream(output));
      i++;
    }
    res();
  });
}

// download video
const downloadVideo = (info, videoPath) => {
  return new Promise(async (res, rej) => {
    currentStream = fs.createWriteStream(path.join(videoPath, 'video.ytdl'));
    currentStream.on('finish', () => res());
    var format = await getVideoFormat(info);
    var inst = ytdl.downloadFromInfo(info, { format });
    inst.on('error', (e) => {
      if (e.message == 'Status code: 404') failed('Could not get video: 404 Not Found');
      else if (e.message == 'Status code: 403' || e.message == 'Status code: 401') failed('Could not get video: 403 Forbidden or 401 Unathorized');
      else failed(`Unknown error occured: ${e.message}`);
    });
    inst.on('progress', (chunk, prog, total) => {
      var percentage = (prog * 100) / total;
      videoInfo.innerText = `Downloading video (${Math.round(percentage)}%)`;
      bar.animate(percentage / 100);
    });
    inst.pipe(currentStream);
  });
}

// download audio
const downloadAudio = (info, videoPath) => {
  return new Promise(async (res, rej) => {
    currentStream = fs.createWriteStream(path.join(videoPath, 'audio.ytdl'));
    currentStream.on('finish', () => res());
    var format = await getAudioFormat(info);
    var inst = ytdl.downloadFromInfo(info, { format });
    inst.on('error', (e) => {
      if (e.message == 'Status code: 404') failed('Could not get audio: 404 Not Found');
      else if (e.message == 'Status code: 403' || e.message == 'Status code: 401') failed('Could not get audio: 403 Forbidden or 401 Unathorized');
      else failed(`Unknown error occured: ${e.message}`);
    });
    inst.on('progress', (chunk, prog, total) => {
      var percentage = (prog * 100) / total;
      videoInfo.innerText = `Downloading audio (${Math.round(percentage)}%)`;
      bar.animate(percentage / 100);
    });
    inst.pipe(currentStream);
  });
}

// join files
const joinFiles = (videoPath, title) => {
  return new Promise((res, rej) => {
    ffmpeg()
      .input(path.join(videoPath, 'video.ytdl'))
      .input(path.join(videoPath, 'audio.ytdl'))
      .audioCodec('copy')
      .videoCodec('copy')
      .on('progress', (prog) => {
        videoInfo.innerText = `Joining audio and video (${(isNaN(prog.percent) ? 0 : Math.round(prog.percent))}%)`;
        bar.animate(prog.percent / 100);
      })
      .on('end', () => res())
      .save(path.join(videoPath, `${title}.${opts.format.toLowerCase()}`));
  });
}

window.addEventListener('load', async () => {
  ffmpeg.setFfmpegPath(ffpath.replace('app.asar', 'app.asar.unpacked')); // set path to ffmpeg-static

  opts = JSON.parse(localStorage.getItem('options'));
  var arr = JSON.parse(localStorage.getItem('playlist'));

  var overallProgress = document.querySelector('#overall-progress');
  var videoTitle = document.querySelector('#video-title');
  var videoThumb = document.querySelector('.video-left');
  videoInfo = document.querySelector('#video-info');

  bar = new ProgressBar.Line('#video-loader', {
    strokeWidth: 2,
    easing: 'linear',
    duration: 100,
    color: '#fff',
    trailColor: '#1c1c1c',
    trailWidth: 2,
    svgStyle: {width: '100%', height: '100%'}
  });

  var homebtn = document.querySelector('#homebtn');
  homebtn.addEventListener('click', () => {
    ipcRenderer.send('window', 'files/start.html');
  });

  var exitbtn = document.querySelector('#exitbtn');
  exitbtn.addEventListener('click', () => {
    ipcRenderer.send('goodbye');
  });

  var cancelbtn = document.querySelector('#cancelbtn');
  cancelbtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel the download?')) {
      if (currentStream) currentStream.destroy();
      ipcRenderer.send('window', 'files/start.html');
    }
  });

  var i = opts.continueNum;
  while (arr.length != i) {
    overallProgress.innerText = `Download progress: ${i + 1} / ${arr.length}`;

    // information download
    videoInfo.innerText = 'Getting info';
    var info = await ytdl.getInfo(arr[i]);

    // title and shit
    var title = info.videoDetails.title.toString();
    videoTitle.innerText = title;
    videoThumb.src = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
    videoInfo.innerText = 'Exporting info';

    // create path
    var videoPath = path.join(opts.outputPath, `${title.replace(REGEX, '_')}_${arr[i]}`);
    fs.mkdirSync(videoPath, { recursive: true });

    // downoad thumbs if user wants
    if (opts.thumb) await downloadThumbs(info, videoPath);

    // only save videodata to disk if user wants it
    if (opts.data) {
      // check visibility
      if (info.videoDetails.isPrivate) var visibility = 'private';
      else if (info.videoDetails.isUnlisted) var visibility = 'unlisted';
      else var visibility = 'public';

      // data to download
      var data = {
        id: arr[i],
        title: title,
        visibility: visibility,
        uploaded: info.videoDetails.uploadDate,
        tags: info.videoDetails.keywords,
        views: info.videoDetails.viewCount,
        live: info.videoDetails.isLiveContent,
        age_restricted: info.videoDetails.age_restricted
      };

      // only add likes and dislikes if they exist
      if (info.videoDetails.allowRatings) {
        data.likes = info.videoDetails.likes;
        data.dislikes = info.videoDetails.dislikes;
      }

      // if description should be sepeate or not
      if (opts.seperate) {
        fs.writeFileSync(path.join(videoPath, 'description.txt'), info.videoDetails.description, 'utf8');
      } else {
        data.description = info.videoDetails.description;
      }

      // write to disk
      // also saves it as a more readable file
      fs.writeFileSync(path.join(videoPath, 'data.json'), JSON.stringify(data, null, 2), 'utf8');
    }

    // download everything!
    await downloadVideo(info, videoPath);
    bar.set(0);
    await downloadAudio(info, videoPath);
    bar.set(0);
    currentStream = null;
    videoInfo.innerText = 'Preparing ffmpeg...';
    await joinFiles(videoPath, title.replace(REGEX, '_'));
    bar.set(0);
    fs.unlinkSync(path.join(videoPath, 'audio.ytdl'));
    fs.unlinkSync(path.join(videoPath, 'video.ytdl'));

    i++;
  }

  document.querySelector('.bottom').classList.toggle('hidden', true);
  document.querySelector('.video').classList.toggle('hidden', true);
  document.querySelector('.done').classList.toggle('hidden', false);
});
