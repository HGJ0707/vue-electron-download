const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const http = require('http');
const fs = require('fs');
const NODE_ENV = process.env.NODE_ENV

ipcMain.on("window-new", (event, data = { videoUrl: '', videoName: '' }) => {
  console.log(data, '==data');

  if (!data.videoUrl || !data.videoName) return;

  // 保存下载的视频的本地路径
  const downloadPath = path.join(app.getPath('downloads'), data.videoName);
  const fileStream = fs.createWriteStream(downloadPath);

  http.get(data.videoUrl, (response) => {
    const contentLength = parseInt(response.headers['content-length'], 10);
    console.log('===contentLength', contentLength)
    if (contentLength <= 242) {
      event.sender.send('download-video-status', {
        status: 'error',
        name: data?.videoName,
      });
      return
    }

    response.pipe(fileStream);

    response.on('end', () => {
      fileStream.close();
      console.log('视频下载完成');
      event.sender.send('download-video-status', {
        status: 'success',
        name: data?.videoName,
      });     // 回应异步消息
    });
  }).on('error', (error) => {
    console.error(`视频下载错误：${error.message}`);
    event.sender.send('download-video-status', {
      status: 'error',
      name: data?.videoName
    });
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titlestring: '下载',
    icon: path.join(__dirname, 'icon.png'), // 设置窗口图标
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  console.log(NODE_ENV, '====NODE_ENV')
  win.loadURL('http://127.0.0.1:3304/')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})