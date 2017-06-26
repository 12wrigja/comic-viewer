// ./main.js
var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, ipcMain = _a.ipcMain, session = _a.session;
var path = require('path').path;
var url = require('url').url;
var http = require('http');
require('dotenv').config();
var IPCResponse = (function () {
    function IPCResponse() {
    }
    return IPCResponse;
}());
var win = null;
app.on('ready', function () {
    session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['*'] }, function (details, callback) {
        details.requestHeaders['Referer'] = '';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
    createWindow();
});
function createWindow() {
    // Initialize the window to our specified dimensions
    win = new BrowserWindow({
        width: 1000,
        height: 600,
        backgroundColor: '#252A2C'
    });
    // Specify entry point
    if (process.env.PACKAGE === 'true') {
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
    else {
        win.loadURL('http://localhost:4200');
        // Show dev tools
        win.webContents.openDevTools();
        win.setMenu(null);
    }
    // Remove window once app is closed
    win.on('closed', function () {
        win = null;
    });
}
app.on('activate', function () {
    if (win === null) {
        createWindow();
    }
});
app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});
ipcMain.on('webget', function (event, args) {
    console.log('Getting ' + args);
    http.get(args, function (response) {
        var headers = response.headers;
        var status = response.statusCode;
        if (status != 200) {
            var responseMap = {
                status: status,
                headers: headers,
                error: status + ' error when getting ' + args
            };
            event.sender.send(args, responseMap);
            return;
        }
        var body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            var responseMap = {
                status: status,
                headers: headers,
                body: body
            };
            console.log('Sending valid response back for URL ' + args);
            event.sender.send(args, responseMap);
        });
        response.on('login', function () {
            console.log('Getting URL ' + args + ' requires Auth.');
            var responseMap = {
                status: status,
                headers: headers,
                error: 'Auth required for ' + args
            };
            event.sender.send(args, responseMap);
        });
        response.on('error', function (err) {
            console.log('Getting URL ' + args + ' caused error: ' + err);
            var responseMap = {
                status: status,
                headers: headers,
                error: 'Auth required for ' + args
            };
            event.sender.send(args, responseMap);
        });
        response.on('abort', function () {
            console.log('Getting URL ' + args + ' caused abort.');
            var responseMap = {
                status: status,
                headers: headers,
                error: 'Abort while getting ' + args
            };
            event.sender.send(args, responseMap);
        });
    });
});
