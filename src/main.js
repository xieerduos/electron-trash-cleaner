const fs = require("fs");
const path = require("path");
const logger = require("./logger.js");
const { fork } = require("child_process");
const os = require("os");

// 获取系统中的所有驱动器盘符或根目录
function getAllDriveLetters() {
  const driveLetters = [];

  if (os.platform() === "win32") {
    for (
      let letter = "A".charCodeAt(0);
      letter <= "Z".charCodeAt(0);
      letter++
    ) {
      const drivePath = String.fromCharCode(letter) + ":\\";
      if (fs.existsSync(drivePath)) {
        driveLetters.push(drivePath);
      }
    }
  } else {
    const homeDir = os.homedir();
    console.log("homeDir", homeDir);
    const downloadDir = homeDir + "/Downloads";

    driveLetters.push(
      ...[downloadDir, homeDir + "/project", homeDir + "/Desktop"]
    );
  }

  return driveLetters;
}

(async () => {
  console.time("traverseDirectories");
  const driveLetters = getAllDriveLetters();
  await Promise.all(
    driveLetters.map(async (driveLetter) => {
      logger.info(`驱动器盘符或根目录: ${driveLetter}`);
      const child = fork(path.join(__dirname, "child.js"), [], {});
      child.send({ driveLetter, target: "node_modules" });
    })
  );
  console.timeEnd("traverseDirectories");
})();
