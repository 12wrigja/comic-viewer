// ./main.js
const {app, BrowserWindow, ipcMain, session} = require('electron');
const {path} = require('path');
const {url} = require('url');
const http = require('http');

require('dotenv').config();

let win = null;

app.on('ready', function() {

  session.defaultSession.webRequest.onBeforeSendHeaders(
      ['*'], (details, callback) => {
        console.log('something interesting here.');
        details.requestHeaders['Referer'] = '';
        callback({cancel: false, requestHeaders: details.requestHeaders});
      });

  // Initialize the window to our specified dimensions
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    backgroundColor: '#252A2C',
    titleBarStyle: 'hidden'
  });

  // Specify entry point
  if (process.env.PACKAGE === 'true') {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true,
    }));
  } else {
    win.loadURL('http://localhost:4200');

    // Show dev tools
    win.webContents.openDevTools()

    win.setMenu(null);
  }

  // Remove window once app is closed
  win.on('closed', function() {
    win = null;
  });

});

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

ipcMain.on('webget', (event, args) => {
  console.log('webgetting!');
  http.get(args, (response) => {
    console.log('get response.');
    var body = '';
    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      console.log('get response END');
      event.sender.send(args, body);
    });
  });
});