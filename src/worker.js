const fs = require("fs").promises;
const path = require("path");
const { parentPort, workerData } = require("worker_threads");
const logger = require("./logger.js");
const logScan = require("./logger-scan.js");

// 计算目录大小
async function calculateDirectorySize(directoryPath) {
  let totalSize = 0;
  const files = await fs.readdir(directoryPath);

  const filePromises = files.map(async (file) => {
    const filePath = path.join(directoryPath, file);
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      return calculateDirectorySize(filePath);
    } else {
      // logScan.info(filePath + " " + stats.size);
      return stats.size;
    }
  });

  const fileSizes = await Promise.all(filePromises);
  totalSize = fileSizes.reduce((acc, fileSize) => acc + fileSize, 0);
  return totalSize;
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

(async () => {
  try {
    // logger.info(`${workerData.filePath} 计算中...`);
    const totalSize = await calculateDirectorySize(workerData.filePath);
    logger.info(`${workerData.filePath} ${formatFileSize(totalSize)}`);
  } catch (error) {
    logger.error(error);
  } finally {
    parentPort.close();
  }
})();
