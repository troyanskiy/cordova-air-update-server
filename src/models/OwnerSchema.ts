import { Schema, Types } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;

export interface IOwnerMeta extends Types.Subdocument {
  userId: string;
  rights: string[];
}


export const ownerSchema = new Schema({

  userId: {type: ObjectId, ref: 'User'},
  rights: [String]

});
