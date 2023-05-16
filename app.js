const fs = require("fs");
const path = require("path");
const {
  Worker,
  isMainThread,
  parentPort,
  workerData
} = require("worker_threads");
const winston = require("winston");
const dayjs = require("dayjs");

// 创建两个日志文件: 遍历过程和结果
const loggerProcess = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => dayjs().format("YYYY/MM/DD HH:mm:ss.SSS")
    }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] - ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: "process.log" }),
    new winston.transports.Console()
  ]
});

const loggerResult = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => dayjs().format("YYYY/MM/DD HH:mm:ss.SSS")
    }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] - ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: "result.log" }),
    new winston.transports.Console()
  ]
});

// 封装递归遍历目录的函数
function traverseDirectory(directoryPath, targetDirectoryName) {
  const directoryList = [];
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
          loggerProcess.error(error);
        }
      }

      if (stats.isDirectory()) {
        if (file === targetDirectoryName) {
          loggerResult.info(filePath);
          directoryList.push(filePath);
        } else {
          directoryList.push(
            ...traverseDirectory(filePath, targetDirectoryName)
          );
        }
      }
    });
  } catch (error) {
    loggerProcess.error(`遍历目录时发生错误: ${error}`);
  }
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

if (isMainThread) {
  // 遍历每个驱动器盘符并获取所有的 node_modules 目录路径
  const driveLetters = getAllDriveLetters();
  driveLetters.forEach((driveLetter) => {
    loggerProcess.info(`驱动器盘符: ${driveLetter}`);
    new Worker(__filename, {
      workerData: { driveLetter, target: "node_modules" }
    });
  });
} else {
  const allNodeModules = traverseDirectory(
    workerData.driveLetter,
    workerData.target
  );

  allNodeModules.forEach((directory) => loggerResult.info(directory));
}
