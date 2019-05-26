const sharp = require("sharp");
const exif = require("exif-reader");
const path = require("path");
const fs = require("fs").promises;
const moment = require("moment");
const config = require("./config.json");

function getShootingDate(filePath) {
  return new Promise(resolve => {
    sharp(filePath)
      .metadata()
      .then(function(metadata) {
        if (exif(metadata.exif).exif) {
          resolve(exif(metadata.exif).exif.DateTimeOriginal);
        }
        resolve();
      });
  });
}

async function getFiles(targetPath) {
  const dirents = await fs.readdir(targetPath, { withFileTypes: true });
  const files = dirents
    .filter(dirent => dirent.isFile() && /.*\.jpg$/.test(dirent.name))
    .map(dirent => path.join(targetPath, dirent.name));
  return files;
}

function getNewFileName(shootingDate) {
  return `${moment(shootingDate).format("YYYYMMDD_HHmmss")}.jpg`;
}

async function main() {
  const target = config.targetDir;
  const output = config.outputDir;

  await fs.mkdir(output, { recursive: true });

  const files = await getFiles(target);
  Promise.all(
    files.map(async filePath => {
      const shootingDate = await getShootingDate(filePath);
      if (!shootingDate) {
        return;
      }
      return fs.rename(
        filePath,
        path.join(output, getNewFileName(shootingDate))
      );
    })
  );
}

main();
