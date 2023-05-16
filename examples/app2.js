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

if (isMainThread) {
  // 遍历每个驱动器盘符并获取所有的 node_modules 目录路径
  console.time("traverseDirectories");
  const driveLetters = getAllDriveLetters();
  (async () => {
    for (const driveLetter of driveLetters) {
      logger.info(`驱动器盘符: ${driveLetter}`);
      await new Promise((resolve) => {
        const worker = new Worker(__filename, {
          workerData: { driveLetter, target: "node_modules" }
        });
        worker.on("exit", resolve);
      });
    }
    console.timeEnd("traverseDirectories");
  })();
} else {
  (async () => {
    await traverseDirectory(workerData.driveLetter, workerData.target);
  })();
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
