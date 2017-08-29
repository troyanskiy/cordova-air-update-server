import { Document, Model, Schema } from 'mongoose';
import { Mongoose } from '../system/mongoose';

const mongoose = Mongoose.instance;

export interface IUserLoginHash {
  hash: string;
  created: Date;
  lastActivityTime: Date;
  entries: IUserLoginHashEntry[];
}

export interface IUserLoginHashEntry {
  ip: string;
  time: Date;
  device: string;
}




export interface IUser extends Document {

  login?: string;
  password?: string;
  lastActivityTime: Date;
  loginHashes?: IUserLoginHash[];

}


const userSchema = new Schema({

  login: {
    type: String,
    index: true,
    unique: true
  },

  password: String,

  lastActivityTime: Date,

  loginHashes: [{
    hash: String,
    created: Date,
    lastActivityTime: Date,
    entries: [{
      ip: String,
      time: Date,
      device: String
    }]
  }]


});



export type UserModel = Model<IUser> & IUser;

//tslint:disable-next-line variable-name
export const User: UserModel = <UserModel>mongoose.model<IUser>('User', userSchema);
