const winston = require("winston");
const dayjs = require("dayjs");

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
    new winston.transports.File({ filename: "process.log" }),
    new winston.transports.Console()
  ]
});

module.exports = loggerProcess;
