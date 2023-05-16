const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { Worker } = require("worker_threads");
const winston = require("winston");
const dayjs = require("dayjs");
const util = require("util");

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// 创建日志记录器
const logger = winston.createLogger({
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
    new winston.transports.File({ filename: "result.log" }),
    new winston.transports.Console()
  ]
});

// 封装异步递归遍历目录的函数
async function traverseDirectory(directoryPath, targetDirectoryName) {
  let totalSize = 0;
  try {
    const files = await readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      let stats;

      try {
        stats = await stat(filePath);
      } catch (error) {
        if (error.code === "EACCES") {
          continue;
        } else {
          logger.error(error);
        }
      }

      if (stats.isDirectory()) {
        if (file === targetDirectoryName) {
          logger.info(filePath);
          const size = await calculateDirectorySize(filePath);
          logger.info(`目录大小：${formatFileSize(size)} bytes`);
          totalSize += size;
        } else {
          totalSize += await traverseDirectory(filePath, targetDirectoryName);
        }
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    logger.error(`遍历目录时发生错误: ${error}`);
  }
  return totalSize;
}

// 计算目录大小
async function calculateDirectorySize(directoryPath) {
  let totalSize = 0;

  const files = await readdir(directoryPath);
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      totalSize += await calculateDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

// 获取系统中的所有驱动器盘符
function getAllDriveLetters() {
  const driveLetters = [];

  for (let letter = "A".charCodeAt(0); letter <= "Z".charCodeAt(0); letter++) {
    const drivePath = `${String.fromCharCode(letter)}:\\`;
    if (fs.existsSync(drivePath)) {
      driveLetters.push(drivePath);
    }
  }

  return driveLetters;
}

if (process.argv[2] === "child") {
  // 子进程，用于计算目录大小
  const driveLetter = process.argv[3];
  const targetDirectoryName = "node_modules";

  traverseDirectory(driveLetter, targetDirectoryName)
    .then((size) => {
      process.send({ path: driveLetter, size });
    })
    .catch((error) => {
      console.error(error);
      process.send({ path: driveLetter, size: 0 });
    });
} else {
  // 主进程，遍历驱动器并启动子进程计算目录大小
  console.time("traverseDirectories");
  const driveLetters = getAllDriveLetters();

  for (const driveLetter of driveLetters) {
    logger.info(`驱动器盘符: ${driveLetter}`);
    const childProcess = spawn(process.execPath, [
      __filename,
      "child",
      driveLetter
    ]);
    childProcess.on("message", (message) => {
      logger.info(message.path);
      logger.info(`目录大小：${formatFileSize(message.size)} bytes`);
    });
    childProcess.on("error", (error) => {
      logger.error(error);
    });
    childProcess.on("exit", () => {
      // Do something when the child process exits
    });
  }

  console.timeEnd("traverseDirectories");
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
