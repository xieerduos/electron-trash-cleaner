const { exec } = require("child_process");
const { formatFileSize } = require("./utils.js");

exec("df -k", (err, stdout, stderr) => {
  if (err) {
    console.error(`exec error: ${err}`);
    return;
  }

  let lines = stdout.trim().split("\n");

  // 第一行为标题，第二行开始为数据
  lines = lines.slice(0);

  console.log("lines", lines);
  const volumes = lines
    .map((line) => {
      let parts = line.split(/\s+/);
      if (parts.length < 9) {
        return null; // skip this line
      }
      let totalSpace = parseInt(parts[1]) * 1024;
      let usedSpace = parseInt(parts[2]) * 1024;
      let availableSpace = parseInt(parts[3]) * 1024;
      if (isNaN(totalSpace) || isNaN(usedSpace) || isNaN(availableSpace)) {
        return null; // skip this line if we can't parse the sizes
      }
      return {
        volumeName: parts[8],
        totalSpace,
        usedSpace,
        availableSpace,
        usedPercentage: parts[4],
      };
    })
    .filter(Boolean); // remove null entries

  console.log(volumes);

  volumes.forEach((volume) => {
    if (volume.volumeName === "/") {
      console.log(
        volume.volumeName,
        "totalSpace: ",
        formatFileSize(volume.totalSpace)
      );
      console.log(
        volume.volumeName,
        "usedSpace: ",
        formatFileSize(volume.usedSpace)
      );
      console.log(
        volume.volumeName,
        "availableSpace: ",
        formatFileSize(volume.availableSpace)
      );
    }
  });
});
