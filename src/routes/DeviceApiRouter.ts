import { Request, Response, Router } from 'express';
import { DataCheckDataType, RequestHelper } from '../helpers/RequestHelper';
import { DeviceMiddleware } from '../middleware/DeviceMiddleware';


export class DeviceApiRouter {

  router: Router;

  static getRouter(): Router {
    const apiRouter = new DeviceApiRouter();

    return apiRouter.router;
  }

  constructor() {
    this.router = Router();
    this.init();
  }

  private init(): void {

    this.router

      .post('/:channelId', [

        RequestHelper.dataCheck({

          uuid: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          },
          deviceModel: DataCheckDataType.String,
          devicePlatform: DataCheckDataType.String,
          deviceVersion: DataCheckDataType.String,
          appVersion: DataCheckDataType.String

        }),

        (req: Request, res: Response) => DeviceMiddleware.devicePost(req, res)

      ]);

  }


}
