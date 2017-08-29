import { ChannelModel } from '../models/Channel';
import { AppModel } from '../models/App';

export class DeployerHelper {

  static getAppPathChannel(pathApps: string, channel: ChannelModel, postFix: string = null): string {

    let path = `${pathApps}/${(<AppModel>channel.app).code}/${channel.code}/`;

    if (postFix) {
      path += `${postFix}/`;
    }

    return path;

  }

  static getAppRepoPath(pathApps: string, channel: ChannelModel): string {
    return `${pathApps}/${(<AppModel>channel.app).code}/repo/`;
  }

}
