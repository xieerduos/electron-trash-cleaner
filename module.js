const fs = require("fs");
const path = require("path");

// 封装递归遍历目录的函数
function traverseDirectory(directoryPath, targetDirectoryName, callback) {
  try {
    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      let stats;

      try {
        stats = fs.statSync(filePath);
      } catch (error) {
        if (error.code === "EACCES") {
          return;
        } else {
          console.log(error);
        }
      }

      if (stats.isDirectory()) {
        if (file === targetDirectoryName) {
          callback(filePath);
        } else {
          traverseDirectory(filePath, targetDirectoryName, callback);
        }
      }
    });
  } catch (error) {
    console.error("遍历目录时发生错误:", error);
  }
}

// 封装获取所有指定目录路径的函数
function getAllDirectories(directoryPath, targetDirectoryName) {
  const directoryList = [];

  traverseDirectory(directoryPath, targetDirectoryName, (filePath) => {
    console.log(filePath);
    directoryList.push(filePath);
  });

  return directoryList;
}

// 获取系统中的所有驱动器盘符
function getAllDriveLetters() {
  const driveLetters = [];

  for (let letter = "A".charCodeAt(0); letter <= "Z".charCodeAt(0); letter++) {
    const drivePath = String.fromCharCode(letter) + ":\\";
    if (fs.existsSync(drivePath)) {
      driveLetters.push(drivePath);
    }
  }

  return driveLetters;
}

// 遍历每个驱动器盘符并获取所有的 node_modules 目录路径
const driveLetters = getAllDriveLetters();
driveLetters.forEach((driveLetter) => {
  console.log(`驱动器盘符: ${driveLetter}`);
  const allNodeModules = getAllDirectories(driveLetter, "node_modules");
  console.log(JSON.stringify(allNodeModules));
});
