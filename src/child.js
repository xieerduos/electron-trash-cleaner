const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const util = require("util");
const os = require("os");
const logger = require("./logger.js");

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const paddingTaskMap = new Map();

function createWorker(filePath) {
  const worker = new Worker(path.join(__dirname, "./worker.js"), {
    workerData: { filePath },
  });

  paddingTaskMap.set(filePath, worker);

  worker.on("message", (message) => {
    logger.info(message);
  });
  worker.on("error", (error) => {
    logger.error(error);
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      logger.error(`Worker stopped with exit code ${code}`);
    }

    paddingTaskMap.delete(filePath);

    if (paddingTaskMap.size === 0) {
      process.exit(0);
    }
  });
}

async function traverseDirectory(directoryPath, targetDirectoryName) {
  try {
    const files = await readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      try {
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
          if (file === targetDirectoryName) {
            logger.info(filePath);

            if (os.platform() !== "win32") {
              createWorker(filePath);
            }
          } else {
            await traverseDirectory(filePath, targetDirectoryName);
          }
        }
      } catch (error) {
        if (error.code !== "EACCES") {
          // logger.error(error);
        }
      }
    }
  } catch (error) {
    // logger.error(`Error while traversing directory: ${error?.message}`);
  }
}

process.on("message", async ({ driveLetter, target }) => {
  try {
    await traverseDirectory(driveLetter, target);
    logger.info(`${driveLetter} traversal completed`);
  } catch (error) {
    // logger.error(`Error during traversal: ${error}`);
  }

  if (paddingTaskMap.size === 0) {
    process.exit(0);
  }
});
