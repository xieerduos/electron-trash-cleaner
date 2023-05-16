const fs = require("fs");
const path = require("path");
const logger = require("./logger.js");
const { fork } = require("child_process");

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
(async () => {
  console.time("traverseDirectories");
  await Promise.all(
    driveLetters.slice(1).map(async (driveLetter) => {
      logger.info(`驱动器盘符: ${driveLetter}`);
      const child = fork(path.join(__dirname, "child.js"), [], {});
      child.send({ driveLetter, target: "node_modules" });
    })
  );
  console.timeEnd("traverseDirectories");
})();
