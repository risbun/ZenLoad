# ZenLoad
Download entire playlists or channels from YT.
<br>
Supported platforms: Win x64
<br>
<br>
<b>Features:</b>

* Download playlist or channel
* Simple to use gui
* MP4 or WebM file format
* Choose specific videos or index
* Save video metadata and thumbnails
* Based on <a href="https://github.com/ytdl-org/youtube-dl/">youtube-dl</a>


## Download
If you just want to download the program you can do that <a href="https://github.com/risbun/ZenLoad/releases">here</a>.
### Building
Clone the repo using git or download the source code as a zip. Navigate to the correct directory and then run this command to install all dependencies
<pre>npm i</pre>
Download all external libraries
<pre>npm run libs</pre>
Finally build it
<pre>npm run dist</pre>
Or you can just test it out
<pre>npm start</pre>

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
