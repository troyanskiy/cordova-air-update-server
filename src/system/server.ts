// tslint:disable-next-line:no-duplicate-imports
import * as express from 'express';
import { Application, NextFunction, Request, Response, Router } from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as http from 'http';
// tslint:disable-next-line:no-duplicate-imports
import { Server } from 'http';

import { Mongoose } from './mongoose';

import { IAppConfig } from '../declarations';

import { AuthMiddleware } from '../middleware/AuthMiddleware';

import { AuthApiRouter } from '../routes/AuthApiRouter';
import { AppApiRouter } from '../routes/AppApiRouter';
import { DeployApiRouter } from '../routes/DeployApiRouter';


// Creates and configures an ExpressJS web server.
export class CordovaAirUpdateServer {

  // ref to Express instance
  public express: Application;
  public router: Router;

  private server: Server;

  //Run configuration methods on the Express instance.
  constructor(private config: IAppConfig) {

    this.prepareConfig();

    Mongoose.init(this.config.mongo);
    this.express = express();
    this.middleware();
    this.routes();

  }

  run(): Server {

    if (this.server) {
      return this.server;
    }

    const server = http.createServer(this.express);
    this.server = server;

    server.on('error', (err: any) => this.onError(err));
    server.on('listening', () => this.onListening());

    process.on('SIGINT', () => {
      console.log('SIGINT received');
      this.shutdown();
    });

    server.listen(this.getPort());

    return this.server;

  }

  getPort(): number {
    return this.config.apiServer && this.config.apiServer.port ? this.config.apiServer.port : 3000;
  }

  getPathPrefix(): string {
    return this.config.apiServer && this.config.apiServer.apiPathPrefix ? this.config.apiServer.apiPathPrefix : '/api';
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(morgan('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({extended: false}));
    this.express.use((req: Request, res: Response, next: NextFunction) => AuthMiddleware.expressJWT(req, res, next));
  }

  // Configure API endpoints.
  private routes(): void {

    this.router = Router();

    this.router.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.config = this.config;
      next();
    });

    this.router
      .use('/auth', AuthApiRouter.getRouter())
      .use('/app', AppApiRouter.getRouter())
      .use('/deploy', DeployApiRouter.getRouter(this.config))
    ;

    this.express.use(this.getPathPrefix(), this.router);

  }

  private prepareConfig() {
    this.config.apiServer = this.config.apiServer || {};
    this.config.pathTemp = this.config.pathTemp || 'uploads';
    this.config.pathApps = this.config.pathApps || 'apps';
  }

  private shutdown() {

    (<any>this.server)._connections = 0;

    Promise.all([
      Mongoose.instance.disconnect(),
      new Promise((resolve) => this.server.close(() => resolve()))
    ])
      .then(() => {
        console.info('Closed out remaining connections.');
        process.exit();
      })
      .catch(() => 1);
  }

  private onListening(): void {
    const addr = this.server.address();
    const bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening on ${bind}`);
  }

  private onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const port = this.getPort();

    const bind = (typeof port === 'string') ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

}
