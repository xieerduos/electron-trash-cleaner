const winston = require("winston");
const dayjs = require("dayjs");

const loggerProcess = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => dayjs().format("YYYY-MM-DD HH:mm:ss.SSS"),
    }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] - ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: "process.log",
      maxsize: 5242880, // 限制文件大小为5MB，超过则创建新文件
      maxFiles: 2, // 最多保留5个日志文件，超过则删除最旧的文件
    }),
    new winston.transports.Console(),
  ],
});

module.exports = loggerProcess;
