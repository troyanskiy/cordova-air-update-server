import { NextFunction, Response } from 'express';

import { IRequestSession, RequestHelper } from '../helpers/RequestHelper';
import { AuthHelper, ITokenBody } from '../helpers/AuthHelper';

import { IUser, User, UserModel } from '../models/User';

export class AuthMiddleware {


  /**
   * Login main check
   *
   * @param {IRequestSession} req
   * @param {Response} res
   * @param {e.NextFunction} next
   * @return {Promise<void>}
   */
  static async loginMain(req: IRequestSession, res: Response, next: NextFunction) {

    const login = req.body.login;

    try {

      const [passwordHash, user]: [string, UserModel] = await Promise.all([
        AuthHelper.hashPassword(req.body.password), // passwordHash
        <Promise<UserModel>>User.findOne({login}).select('_id password loginHashes').exec() // user
      ]);


      if (user) {

        res.locals.user = user;

        if (user.password === passwordHash) {

          next();

          return;
        }

      }

      // Wrong login or password
      RequestHelper.responseError(res, 401, 'E2');

    } catch (err) {
      RequestHelper.catchErrorResponse(res, 'at login 1', err);
    }


  }

  /**
   * Login validate
   *
   * @param {IRequestSession} req
   * @param {Response} res
   * @return {Promise<void>}
   */
  static async loginValidate(req: IRequestSession, res: Response) {
    const user = res.locals.user;

    const loginData = {
      hash: AuthHelper.generatePassword(128, true),
      created: new Date(),
      entries: [{
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        time: new Date(),
        device: req.get('user-agent')
      }]
    };

    user.loginHashes.push(loginData);

    user.save().catch((err: any) => console.log('Error saving user', err));

    try {

      const token = await AuthHelper.createJWT({
        _id: user._id,
        token: loginData.hash
      });

      res
        .set('X-USER-TOKEN', token)
        .send({
          success: true
        });

    } catch (err) {

      RequestHelper.catchErrorResponse(res, 'at login 2', err);

    }


  }


  /**
   * Logout main handler
   *
   * @param {IRequestSession} req
   * @param {Response} res
   */
  static logoutMain(req: IRequestSession, res: Response) {

    res.status(202).send({success: true});

    const session = (<any>req).session;

    const user = session.user;

    const token = session.token;
    for (let i = 0; i < user.loginHashes.length; i++) {
      if (user.loginHashes[i].hash === token) {
        user.loginHashes.splice(i, 1);
        user.save();
      }
    }

  }


  /**
   * Create session from JWT header
   *
   * @param {IRequestSession} req
   * @param {Response} res
   * @param {e.NextFunction} next
   * @return {Promise<void>}
   */
  static async expressJWT(req: IRequestSession, res: Response, next: NextFunction) {

    let token = req.get('authorization');

    if (token && token.startsWith('Bearer ')) {

      token = token.substr(7).trim();

      try {
        const [tokenBody, user]: [ITokenBody, IUser] = await
          AuthHelper.authorizeTokenAndGetUser(token);

        const session: any = tokenBody;
        session.user = user;

        req.session = session;

      } catch (e) {
        RequestHelper.responseError(res, 401, 'E8');

        return;
      }

    }

    next();

  }

}
