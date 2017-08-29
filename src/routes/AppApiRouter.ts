import { NextFunction, Response, Router } from 'express';
import { DataCheckDataType, IRequestSession, RequestHelper } from '../helpers/RequestHelper';
import { AppMiddleware } from '../middleware/AppMiddleware';

export class AppApiRouter {

  router: Router;

  static getRouter(): Router {
    const apiRouter = new AppApiRouter();

    return apiRouter.router;
  }

  constructor() {
    this.router = Router();
    this.init();
  }


  private init(): void {
    this.router

      .use((req: IRequestSession, res: Response, next: NextFunction) => RequestHelper.sessionCheck(req, res, next))

      .post('/', [
        RequestHelper.dataCheck({
          code: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          },
          name: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          }
        }),
        AppMiddleware.createApp
      ])

      .use('/:appId', AppMiddleware.setAppToLocal)

      .post('/:appId/channel', [
        RequestHelper.dataCheck({
          platform: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true,
            from: ['ios', 'android']
          },
          code: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          },
          name: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          }
        }),
        AppMiddleware.createAppChannel
      ])

      ;
  }

}
