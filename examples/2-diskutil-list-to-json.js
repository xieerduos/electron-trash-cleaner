const util = require("util");
const exec = util.promisify(require("child_process").exec);
const bytes = require("bytes");
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const translationTable = {
  AllDisksAndPartitions: "所有磁盘和分区",
  Partitions: "分区",
  DiskUUID: "磁盘UUID",
  Content: "内容",
  Size: "大小",
  DeviceIdentifier: "设备标识符",
  OSInternal: "操作系统内部",
  APFSPhysicalStores: "APFS物理存储",
  APFSVolumes: "APFS卷",
  MountPoint: "挂载点",
  MountedSnapshots: "已挂载快照",
  VolumeName: "卷名",
  CapacityInUse: "已用容量",
  VolumeUUID: "卷UUID",
  SnapshotMountPoint: "快照挂载点",
  SnapshotUUID: "快照UUID",
  SnapshotName: "快照名称",
  SnapshotBSD: "快照BSD",
  Sealed: "密封",
  VolumesFromDisks: "来自磁盘的卷",
  AllDisks: "所有磁盘",
  WholeDisks: "整个磁盘",
};
// 使用示例
executeCommand("diskutil list -plist | plutil -convert json -o - -")
  .then((output) => {
    // console.log(JSON.stringify(JSON.parse(output), null, 2));
    const diskInfo = JSON.parse(output);

    const result = translateKeys(diskInfo, translationTable);
    console.log("result", JSON.stringify(result, null, 2));

    const result2 = calculateDiskSpace(diskInfo);
    console.log(`Total Size: ${result2.totalSize} GB`);
    console.log(`Total Available: ${result2.totalAvailable} GB`);
  })
  .catch((error) => {
    console.error("命令执行出错:", error);
  });

function calculateDiskSpace(diskInfo) {
  let totalSize = 0;
  let totalUsed = 0;

  for (let disk of diskInfo.AllDisksAndPartitions) {
    if (disk.APFSVolumes) {
      // console.log("disk.OSInternal", disk.OSInternal);
      disk.APFSVolumes.forEach((item) => {
        totalUsed += item.CapacityInUse;

        if (item.MountPoint === "/System/Volumes/Data") {
          console.log(
            `[${item.MountPoint}]`,
            "Size",
            bytes(item.Size - item.CapacityInUse),
            "CapacityInUse",
            bytes(item.CapacityInUse)
          );
        }
      });
    }
    if (disk.Content === "GUID_partition_scheme") {
      console.log("disk", disk.Content, bytes(disk.Size));
    } else {
      totalSize += disk.Size;
    }
  }
  console.log(bytes(totalSize));

  let totalAvailable = totalUsed;

  // 返回以 GB 为单位的容量和可用空间
  return {
    totalSize: bytes(totalSize),
    totalAvailable: bytes(totalAvailable),
  };
}

function translateKeys(obj, translationTable) {
  if (Array.isArray(obj)) {
    return obj.map((item) => translateKeys(item, translationTable));
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((newObj, key) => {
      const newKey = translationTable[key] || key;
      if (newKey === "已用容量" || newKey === "大小") {
        newObj[newKey] = bytes(obj[key]);
      } else {
        newObj[newKey] = translateKeys(obj[key], translationTable);
      }
      return newObj;
    }, {});
  }
  return obj;
}
