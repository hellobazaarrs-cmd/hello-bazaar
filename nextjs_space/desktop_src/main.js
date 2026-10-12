const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

function checkLocalServer(port, callback) {
  const req = http.get(`http://localhost:${port}`, { timeout: 1200 }, (res) => {
    callback(true);
  });
  req.on('error', () => callback(false));
  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Hello Bazaar",
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // If local Next.js dev/prod server is running, connect locally for testing; otherwise load production URL
  checkLocalServer(4600, (is4600) => {
    if (is4600) {
      win.loadURL('http://localhost:4600');
    } else {
      checkLocalServer(3000, (is3000) => {
        if (is3000) {
          win.loadURL('http://localhost:3000');
        } else {
          win.loadURL('https://electrobazaars.com');
        }
      });
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
