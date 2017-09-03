// import * as jwt from 'jsonwebtoken';
import * as semver from 'semver';
import * as fs from 'fs-extra';

import { NextFunction, Response } from 'express';

import { IRequestSession } from '../helpers/RequestHelper';
import { AuthHelper } from '../helpers/AuthHelper';
import { Channel, ChannelModel } from '../models/Channel';
import { Version, VersionModel } from '../models/Version';
import { IAppConfig } from '../declarations';
import { IZipFileEntry, ZipHelper } from '../helpers/ZipHelper';
import { DeployerHelper } from '../helpers/DeployerHelper';
import { IOwnerMeta } from '../models/OwnerSchema';
import { AppModel } from '../models/App';


export class DeployMiddleware {

  static async setChannelToLocal(req: IRequestSession, res: Response, next: NextFunction) {

    try {
      const channel = await Channel
        .findById(req.params.channelId)
        .populate('app')
        .populate('latestVersion')
        .exec();

      if (!channel) {
        res.sendStatus(404);

        return;
      }

      res.locals.channel = channel;

      next();

    } catch (err) {

      console.log(err);
      res.sendStatus(500);

    }


  }

  static async setOwnersToLocal(req: IRequestSession, res: Response, next: NextFunction) {

    const channel = <ChannelModel>res.locals.channel;

    if (!channel.owners) {
      res.sendStatus(404);

      return;
    }

    const channelOwner = channel
      .owners
      .find((own: IOwnerMeta) => own.userId.toString() === req.session._id);

    const appOwner = (<AppModel>channel.app)
      .owners
      .find((own: IOwnerMeta) => own.userId.toString() === req.session._id);

    if (!channelOwner && !appOwner ||
      !AuthHelper.hasOwnerRights(appOwner, 'read') && !AuthHelper.hasOwnerRights(channelOwner, 'read')) {

      res.sendStatus(403);

      return;
    }

    res.locals.appOwner = appOwner;
    res.locals.channelOwner = channelOwner;

    next();
  }

  static async getVersionMeta(req: IRequestSession, res: Response) {

    const channel = res.locals.channel;
    const versionNumber = req.params.version;

    const version = await DeployMiddleware.getVersion(channel, versionNumber);

    if (!version) {
      res.sendStatus(404);

      return;
    }

    res.send(version.signedData);

  }

  static async downloadVersion(req: IRequestSession, res: Response) {

    try {
      const channel = res.locals.channel;
      const versionNumber = req.params.version;

      if (versionNumber === 'latest') {
        res.sendStatus(404);

        return;
      }

      const version = await DeployMiddleware.getVersion(channel, versionNumber);

      if (!version) {
        res.sendStatus(404);

        return;
      }

      let fromVersionDecodedData: ISignedData = null;
      let fromVersionFileName: string = '';
      if (req.query.from) {
        const fromVersion = await DeployMiddleware.getVersion(channel, req.query.from);
        if (fromVersion) {
          fromVersionDecodedData = <ISignedData>JSON.parse(fromVersion.signedData);
          fromVersionFileName = `D${fromVersionDecodedData.version}`;
        }
      }


      const config = <IAppConfig>res.locals.config;

      const versionDecodedData = <ISignedData>JSON.parse(version.signedData);

      const cacheDir = DeployerHelper.getAppPathChannel(config.pathCache, channel);
      let zipFileName = `${cacheDir}/${versionDecodedData.version}${fromVersionFileName}.zip`;

      if (!await fs.pathExists(zipFileName)) {
        const repoPath = DeployerHelper.getAppRepoPath(config.pathApps, channel);

        const filesToZip: IZipFileEntry[] = Object.keys(versionDecodedData.filesMap)
          .filter((file: string) => {
            return !(fromVersionDecodedData && fromVersionDecodedData.filesMap[file] === versionDecodedData.filesMap[file]);
          })
          .map((file: string) => {

            const fileName = versionDecodedData.filesMap[file];

            return {
              src: repoPath + fileName,
              dst: fileName
            } as IZipFileEntry;

          });

        await fs.ensureDir(cacheDir);

        await ZipHelper.zip(filesToZip, zipFileName);
      }

      if (!zipFileName.startsWith('/')) {
        zipFileName = `${process.cwd()}/${zipFileName}`;
      }

      res.sendFile(zipFileName);

    } catch (err) {

      console.log(err);
      res.sendStatus(500);

    }


  }

  static async deployNewVersion(req: IRequestSession, res: Response) {

    try {

      const signedData = req.body.signedData;

      // todo add verification of the signature
      const decodedData = <ISignedData>JSON.parse(signedData);

      const channel = <ChannelModel> res.locals.channel;

      if (channel.latestVersion && semver.lte(decodedData.version, (<VersionModel>channel.latestVersion).version)) {
        res.sendStatus(412);

        return;
      }

      const repoPath = DeployerHelper.getAppRepoPath(res.locals.config.pathApps, channel);
      await fs.ensureDir(repoPath);

      // Check files to send
      if (req.query.check) {

        const fileMap = decodedData.filesMap;
        const missingFilesMap: any = {};

        for (const path in fileMap) {
          if (fileMap.hasOwnProperty(path)) {
            const checkPath = repoPath + fileMap[path];
            if (!await fs.pathExists(checkPath)) {
              missingFilesMap[path] = fileMap[path];
            }
          }
        }


        res.send({
          version: decodedData.version,
          filesMap: missingFilesMap
        } as ISignedData);

        return;
      }


      if (req.file) {
        await ZipHelper.unzip(req.file.path, repoPath);
        await fs.unlink(req.file.path);
        // todo verify checksums after unzip
      }


      const version = new Version();

      version.channel = channel._id;
      version.version = decodedData.version;
      version.signedData = signedData;

      await version.save();

      channel.latestVersion = version._id;
      (<string[]>channel.versions).push(version._id);

      await channel.save();

      res.sendStatus(200);
    } catch (err) {

      res.sendStatus(500);

      console.log(err);

    }

  }

  private static async getVersion(channel: ChannelModel, versionNumber: string): Promise<VersionModel> {

    if (channel.latestVersion) {

      if (versionNumber === 'latest') {
        return Promise.resolve(<VersionModel>channel.latestVersion);
      } else {
        return <Promise<VersionModel>>Version.findOne({channel, version: versionNumber}).exec();
      }

    }

    return null;
  }

}


interface ISignedData {
  version: string;
  filesMap: { [file: string]: string };
  extras?: any;
}
