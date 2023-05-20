const { exec } = require("child_process");
const bytes = require("bytes");

// console.log(
//   bytes(
//     bytes("12.82GB") +
//       bytes("181.54GB") +
//       bytes("20KB") +
//       bytes("9.8GB") +
//       bytes("2.39GB")
//   )
// );

main();
function main() {
  getDiskInfo().then((diskInfo) => {
    console.log(convertFromBytes(diskInfo));
    console.log(
      "关于",
      bytes(diskInfo.Size - (diskInfo.Data + diskInfo.disk1 + diskInfo.disk2 + diskInfo.Recovery)),
      "/",
      bytes(diskInfo.Size)
    );
    console.log("----");
    console.log("容量", bytes(diskInfo.Size));
    console.log("未使用", bytes(diskInfo.FreeSize));
    console.log("已使用", bytes(diskInfo.usedSize));
  });
}

function getDiskInfo() {
  return new Promise((resolve, reject) => {
    exec("diskutil list", (err, stdout, stderr) => {
      if (err) {
        console.error(`exec error: ${err}`);
        reject(err);
        return;
      }

      const lines = stdout.trim().split("\n");

      console.log("lines", lines);

      let result = {};

      const map = new Map([
        ["GUID_partition_scheme", "Total"],
        ["Apple_APFS_ISC Container", "disk1"],
        ["Apple_APFS_Recovery Container", "disk2"],
        ["Apple_APFS Container", "Size"],
        ["APFS Volume Macintosh HD", "Macintosh HD"],
        ["com.apple.os", "Snapshot"],
        ["APFS Volume Preboot", "Preboot"],
        ["APFS Volume Recovery", "Recovery"],
        ["APFS Volume Data", "Data"],
        ["APFS Volume VM", "VM"],
      ]);

      const getSize = (item) => {
        const match = item.match(/\d+\.\d+\s(?:B|KB|MB|GB|TB)/);
        return match ? match[0] : 0;
      };
      lines.forEach((item) => {
        for (const [str, prop] of map.entries()) {
          if (item.includes(str)) {
            result[prop] = getSize(item);
          }
        }
      });

      result = convertToBytes(result);

      result.usedSize = result["Macintosh HD"] + result.Snapshot + result.Data;

      result.FreeSize =
        result.Size - (result.Data + result.Snapshot + result["Macintosh HD"]);

      resolve(result);
    });
  });
}

function convertToBytes(data) {
  const convertedData = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      const convertedValue = bytes(value);
      convertedData[key] = convertedValue;
    }
  }

  return convertedData;
}

function convertFromBytes(data) {
  const convertedData = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      const convertedValue = bytes(value, { unitSeparator: " " });
      convertedData[key] = convertedValue;
    }
  }

  return convertedData;
}
