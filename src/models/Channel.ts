import { Document, Model, Schema, Types } from 'mongoose';
import { Mongoose } from '../system/mongoose';
import { VersionModel } from './Version';
import { IOwnerMeta, ownerSchema } from './OwnerSchema';
import { AppModel } from './App';
import { DeviceModel } from './Device';

const ObjectId = Schema.Types.ObjectId;

const mongoose = Mongoose.instance;

export interface IChannel extends Document {

  app?: string | AppModel;

  platform?: string;
  code?: string;
  name?: string;

  owners?: Types.DocumentArray<IOwnerMeta>;

  versions?: string[] | VersionModel[];
  latestVersion?: string | VersionModel;

  devices?: string[] | DeviceModel[];

}

const channelSchema = new Schema({

  app: {
    type: ObjectId,
    ref: 'App'
  },

  platform: String,
  code: String,
  name: String,

  owners: [ownerSchema],

  versions: [{type: ObjectId, ref: 'Version'}],
  latestVersion: {type: ObjectId, ref: 'Version'},

  devices: [{type: ObjectId, ref: 'Device'}]

});

export type ChannelModel = Model<IChannel> & IChannel;

//tslint:disable-next-line variable-name
export const Channel: ChannelModel = <ChannelModel>mongoose.model<IChannel>('Channel', channelSchema);
