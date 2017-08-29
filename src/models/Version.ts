import { Document, Model, Schema } from 'mongoose';
import { Mongoose } from '../system/mongoose';
import { ChannelModel } from './Channel';

const ObjectId = Schema.Types.ObjectId;

const mongoose = Mongoose.instance;

export interface IVersion extends Document {

  channel?: string | ChannelModel;

  deployTime?: Date;

  version?: string;

  signedData?: string;

  isRevoked?: boolean;


}

const versionSchema = new Schema({

  channel: {
    type: ObjectId,
    ref: 'Channel',
    index: true
  },

  deployTime: { type: Date, default: Date.now },

  version: {
    type: String,
    index: true
  },

  signedData: String,

  isRevoked: Boolean

});

export type VersionModel = Model<IVersion> & IVersion;

//tslint:disable-next-line variable-name
export const Version: VersionModel = <VersionModel>mongoose.model<IVersion>('Version', versionSchema);
