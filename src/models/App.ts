import { Document, Model, Schema, Types } from 'mongoose';
import { Mongoose } from '../system/mongoose';
import { IOwnerMeta, ownerSchema } from './OwnerSchema';
import { ChannelModel } from './Channel';

const ObjectId = Schema.Types.ObjectId;

const mongoose = Mongoose.instance;


export interface IApp extends Document {

  code?: string;
  name?: string;

  owners?: Types.DocumentArray<IOwnerMeta>;

  channels?: string[] | ChannelModel[];

}


const appSchema = new Schema({

  code: String,
  name: String,

  owners: [ownerSchema],

  channels: [{type: ObjectId, ref: 'Channel'}]

});


export type AppModel = Model<IApp> & IApp;

//tslint:disable-next-line variable-name
export const App: AppModel = <AppModel>mongoose.model<IApp>('App', appSchema);
