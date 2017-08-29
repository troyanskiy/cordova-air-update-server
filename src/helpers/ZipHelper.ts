import * as fs from 'fs';
import * as archiver from 'archiver';

const decompress: any = require('decompress');

export class ZipHelper {

  static unzip(zipFIle: string, dst: string): Promise<IZipHelperFileMeta[]> {
    return decompress(zipFIle, dst);
  }

  static zip(files: IZipFileEntry[], zipFileName: string): Promise<number> {
    return new Promise((resolve, reject) => {

      const output = fs.createWriteStream(zipFileName);
      const archive = archiver('zip', {
        zlib: {level: 9} // Sets the compression level.
      });

      // listen for all archive data to be written
      output.on('close', function () {
        resolve(archive.pointer());
      });

      // good practice to catch warnings (ie stat failures and other non-blocking errors)
      archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
          // log warning
          console.log(err);
        } else {
          // throw error
          reject(err);
        }
      });

      // good practice to catch this error explicitly
      archive.on('error', function (err) {
        reject(err);
      });

      // pipe archive data to the file
      archive.pipe(output);

      files.forEach((file: IZipFileEntry) => {
        archive.file(file.src, {name: file.dst});
      });

      archive.finalize().catch();

    });
  }

}

export interface IZipHelperFileMeta {
  data: Buffer;
  mode: number;
  mtime: string;
  path: string;
  type: string;
}

export interface IZipFileEntry {
  src: string;
  dst: string;
}
