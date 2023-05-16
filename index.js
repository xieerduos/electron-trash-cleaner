const fs = require("fs");
const path = require("path");

// 根据操作系统确定不同软件的本地目录路径
const softwarePaths = [
  {
    name: "Chrome",
    getPath: () => {
      // Chrome 路径获取逻辑
      if (process.platform === 'win32') {
        return path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache');
      } else if (process.platform === 'darwin') {
        return path.join(process.env.HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Code Cache');
      } else if (process.platform === 'linux') {
        return path.join(process.env.HOME, '.config', 'google-chrome', 'Default', 'Code Cache');
      } else {
        console.log('Unsupported platform:', process.platform);
        return null;
      }
    }
  },
  {
    name: "Edge",
    getPath: () => {
      // Edge 路径获取逻辑
      if (process.platform === 'win32') {
        return path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache');
      } else if (process.platform === 'darwin') {
        return path.join(process.env.HOME, 'Library', 'Application Support', 'Microsoft', 'Edge', 'Default', 'Code Cache');
      } else if (process.platform === 'linux') {
        return path.join(process.env.HOME, '.config', 'microsoft-edge', 'Default', 'Code Cache');
      } else {
        console.log('Unsupported platform:', process.platform);
        return null;
      }
    }
  }
];

// 递归遍历目录并返回文件大小
function traverseDirectory(directoryPath, fileList = []) {
  const files = fs.readdirSync(directoryPath);
  let totalSize = 0;

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      totalSize += stats.size;
      fileList.push({ path: filePath, size: stats.size });
    } else if (stats.isDirectory()) {
      const result = traverseDirectory(filePath, fileList);
      totalSize += result.totalSize;
    }
  });

  return { totalSize, fileList };
}

// 转换文件大小表示为合适的单位
function formatFileSize(size) {
  if (size < 1024) {
    return size + " B";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + " MB";
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }
}

// 遍历不同软件的目录并获取 Code Cache 目录大小
softwarePaths.forEach((software) => {
  const softwarePath = software.getPath();
  if (softwarePath) {
    const codeCacheSize = traverseDirectory(softwarePath);
    const formattedSize = formatFileSize(codeCacheSize.totalSize);
    console.log(`${software.name} Code Cache 目录大小:`, formattedSize);
  }
});
