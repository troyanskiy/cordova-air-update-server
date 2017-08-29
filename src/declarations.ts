import { ConnectionOptions } from 'mongoose';

export interface IAppConfig {
  apiServer?: IApiServerConfig;
  pathApps?: string;
  pathTemp?: string;
  pathCache?: string;
  mongo: IMongoConfig;
}

export interface IApiServerConfig {
  port?: number;
  apiPathPrefix?: string;
}

export interface IMongoConfig {
  server: string;
  options?: ConnectionOptions;
}

