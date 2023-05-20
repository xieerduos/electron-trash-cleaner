// 获取磁盘信息
const diskusage = require("diskusage");
const os = require("os");
const { formatFileSize } = require("./utils.js");

// 在 macOS 中，根路径为 '/'
let path = os.platform() === "win32" ? "c:" : "/";

diskusage.check(path, function (err, info) {
  if (err) {
    console.log(err);
  } else {
    console.log("Total: ", formatFileSize(info.total));
    console.log("Free: ", formatFileSize(info.free));
    console.log("Used: ", formatFileSize(info.total - info.free));
  }
});
