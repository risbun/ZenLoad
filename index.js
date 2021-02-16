const { app, BrowserWindow, ipcMain, dialog } = require('electron');

var mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#2c2c2c',
    title: 'ZenLoad',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('files/start.html');
};

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('window', (event, arg) => {
  mainWindow.loadFile(arg);
});

ipcMain.on('directory', async (event, arg) => {
  var dir = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  event.reply('directory', dir);
});

ipcMain.on('goodbye', (event, arg) => {
  mainWindow.close();
});
