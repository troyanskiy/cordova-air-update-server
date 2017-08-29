import * as mongoose from 'mongoose';

import { IMongoConfig } from '../declarations';

export class Mongoose {

  static instance = mongoose;

  static config: IMongoConfig;

  static init(config: IMongoConfig) {

    this.config = config;

    (<any>this.instance).Promise = global.Promise;

    this.connectWithRetry();

    this.instance.connection.on('open', () => {
      console.info('MongoDB Connected');
    });

    this.instance.connection.on('error', (err: Error) => {
      console.log('MongoDB Connection error', err);
    });

  }

  private static connectWithRetry() {
    (<any>this.instance.connect(this.config.server, this.config.options))
      .$opPromise
      .catch((err: Error) => {
        console.info(err.message, ' - Reconnect in 1 sec');
        setTimeout(() => this.connectWithRetry(), 1000);
      });
  }

}
