// ./main.js
const {app, BrowserWindow, ipcMain, session} = require('electron');
const {path} = require('path');
const {url} = require('url');
const http = require('http');

require('dotenv').config();

class IPCResponse {
  status: number;
  headers: string;
  body: string;
  error?: string;
}

let win = null;

app.on('ready', function() {

  session.defaultSession.webRequest.onBeforeSendHeaders(
      {urls: ['*']}, (details, callback) => {
        details.requestHeaders['Referer'] = '';
        callback({cancel: false, requestHeaders: details.requestHeaders});
      });

  createWindow();
});

function createWindow() {
  // Initialize the window to our specified dimensions
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    backgroundColor: '#252A2C',
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
}

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
  console.log('Getting ' + args);
  http.get(args, (response) => {
    const headers = response.headers;
    const status = response.statusCode;
    if (status != 200) {
      const responseMap = {
        status: status,
        headers: headers,
        error: status + ' error when getting ' + args
      } as IPCResponse;
      event.sender.send(args, responseMap);
      return;
    }
    var body = '';
    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      const responseMap = {
        status: status,
        headers: headers,
        body: body,
      } as IPCResponse;
      console.log('Sending valid response back for URL ' + args);
      event.sender.send(args, responseMap);
    });
    response.on('login', () => {
      console.log('Getting URL ' + args + ' requires Auth.');
      const responseMap = {
        status: status,
        headers: headers,
        error: 'Auth required for ' + args
      } as IPCResponse;
      event.sender.send(args, responseMap);
    });
    response.on('error', (err) => {
      console.log('Getting URL ' + args + ' caused error: ' + err);
      const responseMap = {
        status: status,
        headers: headers,
        error: 'Auth required for ' + args,
      } as IPCResponse;
      event.sender.send(args, responseMap);
    });
    response.on('abort', () => {
      console.log('Getting URL ' + args + ' caused abort.');
      const responseMap = {
        status: status,
        headers: headers,
        error: 'Abort while getting ' + args,
      } as IPCResponse;
      event.sender.send(args, responseMap);
    })
  });
});