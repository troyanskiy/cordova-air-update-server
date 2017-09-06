import { Document, Model, Schema, Types } from 'mongoose';
import { Mongoose } from '../system/mongoose';
import { ChannelModel } from './Channel';


const ObjectId = Schema.Types.ObjectId;

const mongoose = Mongoose.instance;

export interface IDeviceChanges extends Types.Subdocument {

  date: Date;

  deviceModel?: string;
  devicePlatform?: string;
  deviceVersion?: string;

  appVersion?: string;

}

const deviceChangesSchema = new Schema({

  date: {
    type: Date,
    default: Date.now
  },

  deviceModel: String,
  devicePlatform: String,
  deviceVersion: String,

  appVersion: String

});


export interface IDevice extends Document {

  uuid: string;

  channel: string | ChannelModel;

  lastUpdate: Date;

  deviceModel: string;
  devicePlatform: string;
  deviceVersion: string;

  appVersion: string;

  changes: IDeviceChanges[];

}


const deviceSchema = new Schema({

  uuid: {
    type: String,
    index: true
  },

  channel: {type: ObjectId, ref: 'Channel'},

  created: {
    type: Date,
    default: Date.now
  },

  lastUpdate: {
    type: Date,
    default: Date.now
  },

  deviceModel: String,
  devicePlatform: String,
  deviceVersion: String,

  appVersion: String,

  changes: [deviceChangesSchema]

});


export type DeviceModel = Model<IDevice> & IDevice;

//tslint:disable-next-line variable-name
export const Device: DeviceModel = <DeviceModel>mongoose.model<IDevice>('Device', deviceSchema);
