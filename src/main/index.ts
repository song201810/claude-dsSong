import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })
  mainWindow.loadURL('data:text/html,<h1>Claude Code Desktop</h1>')
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
