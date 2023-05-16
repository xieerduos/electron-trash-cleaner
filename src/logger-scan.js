const winston = require("winston");
const dayjs = require("dayjs");
const DailyRotateFile = require("winston-daily-rotate-file");

const loggerProcess = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")
    }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] - ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: "scan.log" }),
    // new DailyRotateFile({
    //   filename: "scan.log",
    //   datePattern: "YYYY-MM-DD",
    //   maxSize: "2m", // 设置单个日志文件的最大大小，例如 10m 表示 10MB
    //   // tailable: true // 当日志文件达到最大大小时，清空文件并继续写入
    // }),
    new winston.transports.Console()
  ]
});

module.exports = loggerProcess;
