import { Request, Response } from 'express';
import { Device, DeviceModel, IDevice, IDeviceChanges } from '../models/Device';
import { Channel, ChannelModel } from '../models/Channel';

export class DeviceMiddleware {

  static async devicePost(req: Request, res: Response) {

    res.sendStatus(202);

    const channelId = req.params.channelId;

    let device = <IDevice> await Device
      .findOne({uuid: req.body.uuid, channel: channelId})
      .exec();

    if (device) {

      device.lastUpdate = new Date();

    } else {

      const channel = <ChannelModel> await Channel.findById(channelId).exec();

      if (!channel) {
        return;
      }

      device = new Device();
      device.channel = channel;
      device.uuid = req.body.uuid;

      (<any[]>channel.devices).push(device);

      channel.save().catch();

    }

    this.setChangesToDevice(device, req.body);

    device.save().catch();

  }

  private static setChangesToDevice(device: DeviceModel | IDevice, data: IDevicePostRequest) {

    const change = {
      date: new Date()
    } as IDeviceChanges;

    let addChange = false;

    if (device.deviceModel !== data.deviceModel) {
      device.deviceModel = data.deviceModel;
      change.deviceModel = data.deviceModel;

      addChange = true;
    }

    if (device.devicePlatform !== data.devicePlatform) {
      device.devicePlatform = data.devicePlatform;
      change.devicePlatform = data.devicePlatform;

      addChange = true;
    }

    if (device.deviceVersion !== data.deviceVersion) {
      device.deviceVersion = data.deviceVersion;
      change.deviceVersion = data.deviceVersion;

      addChange = true;
    }

    if (device.appVersion !== data.appVersion) {
      device.appVersion = data.appVersion;
      change.appVersion = data.appVersion;

      addChange = true;
    }

    if (addChange) {
      device.changes.push(change);
    }

  }

}

export interface IDevicePostRequest {
  uuid: string;
  deviceModel: string;
  devicePlatform: string;
  deviceVersion: string;
  appVersion: string;
}

