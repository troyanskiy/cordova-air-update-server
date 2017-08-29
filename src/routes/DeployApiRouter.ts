import * as multer from 'multer';

import { NextFunction, Response, Router } from 'express';
import { DataCheckDataType, DataCheckWhere, IRequestSession, RequestHelper } from '../helpers/RequestHelper';
import { DeployMiddleware } from '../middleware/DeployMiddleware';

// tslint:disable-next-line:no-duplicate-imports
import { Instance } from 'multer';
import { IAppConfig } from '../declarations';


export class DeployApiRouter {

  router: Router;

  private upload: Instance;

  static getRouter(config: IAppConfig): Router {
    const apiRouter = new DeployApiRouter(config);

    return apiRouter.router;
  }

  constructor(private config: IAppConfig) {
    this.router = Router();
    this.init();
  }


  private init(): void {

    this.upload = multer({dest: this.config.pathTemp});

    this.router


      .use('/:channelId', DeployMiddleware.setChannelToLocal)

      .get('/:channelId/meta/:version', DeployMiddleware.getVersionMeta)

      .get('/:channelId/download/:version', DeployMiddleware.downloadVersion)



      .use((req: IRequestSession, res: Response, next: NextFunction) => RequestHelper.sessionCheck(req, res, next))

      .use('/:channelId', DeployMiddleware.setOwnersToLocal)

      .post('/:channelId', this.upload.single('update'), [
        RequestHelper.dataCheck({
          signedData: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          }
        }),
        RequestHelper.dataCheck({
          check: {
            type: DataCheckDataType.Number,
            optional: true
          }
        }, {where: DataCheckWhere.Query}),
        DeployMiddleware.deployNewVersion
      ])


    // .post('/:channelId')
    //
    //
    // .post('/', [
    //   RequestHelper.dataCheck({
    //     code: {
    //       type: DataCheckDataType.String,
    //       min: 1,
    //       trim: true
    //     },
    //     name: {
    //       type: DataCheckDataType.String,
    //       min: 1,
    //       trim: true
    //     }
    //   }),
    //   AppMiddleware.createApp
    // ])
    //
    // .use('/:appId', AppMiddleware.setAppToLocal)
    //
    // .post('/:appId/channel', [
    //   RequestHelper.dataCheck({
    //     platform: {
    //       type: DataCheckDataType.String,
    //       min: 1,
    //       trim: true,
    //       from: ['ios', 'android']
    //     },
    //     code: {
    //       type: DataCheckDataType.String,
    //       min: 1,
    //       trim: true
    //     },
    //     name: {
    //       type: DataCheckDataType.String,
    //       min: 1,
    //       trim: true
    //     }
    //   }),
    //   AppMiddleware.createAppChannel
    // ])

    ;
  }

}
