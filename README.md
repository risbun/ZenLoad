# ZenLoad
![Size](https://img.shields.io/github/languages/code-size/risbun/ZenLoad)
![Downloads](https://img.shields.io/github/downloads/risbun/ZenLoad/total)
![Version](https://img.shields.io/github/package-json/v/risbun/ZenLoad)

## Overview
Download playlists or channels from YouTube including metadata and thumbnails. \
\
**Features:**
* Download playlist or channel
* Simple to use gui
* MP4 or WebM file format
* Choose specific videos or index
* Save video metadata and thumbnails
* Based on [youtube-dl](https://youtube-dl.org/)

Supported platforms:
* Windows x86_64

Support for other platforms are planned but not yet done.

## Download
If you just want to download the program you can do that [here](https://github.com/risbun/ZenLoad/releases)
### Building
Clone the repo using git or download the source code as a zip.\
Navigate to the correct directory and then run this command to install all dependencies
```
npm i
```
Download all external libraries
```
npm run libs
```
Finally build it
```
npm run dist
```
Or you can just test it out
```
npm start
```

## Libraries used
* [youtube-dl](https://youtube-dl.org/)
* [ffmpeg](https://ffmpeg.org/)
* [adm-zip](https://github.com/cthackers/adm-zip)
* [electron](https://www.electronjs.org)
* [electron-builder](https://www.electron.build/)
* [node-fetch](https://github.com/bitinn/node-fetch)
* [progressbar.js](https://kimmobrunfeldt.github.io/progressbar.js/)
* [youtube-dl-wrap](https://github.com/ghjbnm/youtube-dl-wrap)
* [ytpl](https://github.com/TimeForANinja/node-ytpl)
