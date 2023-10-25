const path = require('path');
const os = require('os');
const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;
let aboutWindow;

// Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 1000 : 800,
    height: 800,
    icon: `${__dirname}/assets/icons/school.png`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Show devtools automatically if in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// About Window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: isDev ? 800 : 500,
    height: 500,
    title: 'About School Management',
    icon: `${__dirname}/assets/icons/school.png`
  });

  aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// When the app is ready, create the window
app.on('ready', () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove variable from memory
  mainWindow.on('closed', () => (mainWindow = null));
});

// Menu template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow
            }
          ]
        }
      ]
    : []),
  {
    role: 'fileMenu'
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: createAboutWindow
            }
          ]
        }
      ]
    : []),
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' }
          ]
        }
      ]
    : [])
];

const dataFolderPath = path.join(os.homedir(), 'TLG-Student-Management');
if (!fs.existsSync(dataFolderPath)) {
  fs.mkdirSync(dataFolderPath);
}

// add student
ipcMain.on('student:add', function (event, studentData) {
  const { fullName, cls, age, imgPath } = studentData;
  const classNameFormatted = cls.replace(/\s+/g, '-').toLowerCase();
  const fullNm = fullName.replace(/\s+/g, '-').toLowerCase();

  const student = {
    fullName,
    cls,
    age,
    profilePic: imgPath
  };

  const studentFilePath = path.join(
    os.homedir(),
    'TLG-Student-Management',
    `${classNameFormatted}.json`
  );

  let students = [];

  if (fs.existsSync(studentFilePath)) {
    students = JSON.parse(fs.readFileSync(studentFilePath));
  }

  students.push(student);

  fs.writeFileSync(studentFilePath, JSON.stringify(students)); // Save student data as JSON

  event.sender.send('student:saved', student);
});

ipcMain.on('student:fetch', (event) => {
  const studentFolderPath = path.join(os.homedir(), 'TLG-Student-Management');

  if (!studentFolderPath) {
    event.sender.send('student:fetched', []);
  }

  const students = [];

  const files = fs.readdirSync(studentFolderPath);
  files.forEach((file) => {
    const filePath = path.join(studentFolderPath, file);
    if (fs.statSync(filePath).isFile() && path.extname(filePath) === '.json') {
      const fileContent = JSON.parse(fs.readFileSync(filePath));
      students.push(...fileContent);
    }
  });

  if (students) {
    event.sender.send('student:fetched', students);
  } else {
    event.sender.send('student:fetched', []);
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

// Open a window if none are open (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
