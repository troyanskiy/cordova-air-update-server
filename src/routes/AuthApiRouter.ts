import { NextFunction, Response, Router } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { DataCheckDataType, IRequestSession, RequestHelper } from '../helpers/RequestHelper';

export class AuthApiRouter {

  router: Router;

  static getRouter(): Router {
    const apiRouter = new AuthApiRouter();

    return apiRouter.router;
  }

  constructor() {
    this.router = Router();
    this.init();
  }


  private init(): void {
    this.router

      .post('/login', [
        RequestHelper.dataCheck({
          login: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          },
          password: {
            type: DataCheckDataType.String,
            min: 1,
            trim: true
          }
        }),
        (req: IRequestSession, res: Response, next: NextFunction) => AuthMiddleware.loginMain(req, res, next),
        (req: IRequestSession, res: Response, next: NextFunction) => AuthMiddleware.loginValidate(req, res)
      ])

      .post('/logout', [
        (req: IRequestSession, res: Response, next: NextFunction) => RequestHelper.sessionCheck(req, res, next),
        (req: IRequestSession, res: Response, next: NextFunction) => AuthMiddleware.logoutMain(req, res)
      ])

      // .post('/create', async (req: Request, res: Response) => {
      //
      //   const data = req.body;
      //
      //   if (!data.login || !data.password) {
      //     res.sendStatus(400);
      //
      //     return;
      //   }
      //
      //   const user = await UserHelper.createUser(data.login, data.password);
      //
      //   console.log(`Created user with ${user._id}`);
      //
      //
      //   res.sendStatus(200);
      // })
    ;
  }

}
