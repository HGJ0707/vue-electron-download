const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron')
const path = require('path')
const http = require('http');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// 菜单
const myMenuTemplate = [
  {
    label: '退出',
    role: 'quit'
  },
  {
    label: '全屏',
    role: 'togglefullscreen'
  },
  {
    label: '重新加载',
    role: 'reload'
  },

  {
    label: '开发者工具',
    role: 'toggledevtools'
  },
];

/**
 * 监听视频下载
 */
ipcMain.on("window-new", (event, data = { videoUrl: '', videoName: '' }) => {
  console.log(data, '==data');
  if (!data.videoUrl || !data.videoName) return;

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

    // 保存下载的视频的本地路径
    const downloadPath = path.join(app.getPath('downloads'), data.videoName);
    const fileStream = fs.createWriteStream(downloadPath);
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

/**
 * 监听打开本地下载文件夹
 */
ipcMain.on("open-file", () => {
  shell.openPath(app.getPath('downloads'));
})

/**
 * 创建窗口
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 750,
    height: 800,
    titlestring: '下载',
    icon: path.join(__dirname, 'icon.png'), // 设置窗口图标
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:3304/');
    win.webContents.openDevTools();
  } else {
    win.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`);
  }

  //  创建菜单对象
  const menu = Menu.buildFromTemplate(myMenuTemplate);
  //  设置应用菜单
  Menu.setApplicationMenu(menu);
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