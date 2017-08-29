import { NextFunction, Response } from 'express';

import { IRequestSession, RequestHelper } from '../helpers/RequestHelper';
import { App, AppModel, Channel, IChannel, IOwnerMeta } from '../models';
import { AuthHelper } from '../helpers/AuthHelper';


export class AppMiddleware {

  static async createApp(req: IRequestSession, res: Response) {

    const code = req.body.code;

    let app = await App.findOne({code}).exec();

    if (app) {
      res.status(400).send({message: 'App with the code already exists'});

      return;
    }

    app = new App();

    app.code = req.body.code;
    app.name = req.body.name;

    app.owners.push({
      userId: req.session._id,
      rights: ['admin']
    });


    try {
      app = await app.save();
      res.send({_id: app._id});
    } catch (err) {
      RequestHelper.catchErrorResponse(res, 'App creation', err);
    }

  }


  static async setAppToLocal(req: IRequestSession, res: Response, next: NextFunction) {

    try {
      const app = await App
        .findById(req.params.appId)
        .populate('channels')
        .exec();

      if (!app || !app.owners) {
        res.sendStatus(404);

        return;
      }

      const appOwner = app
        .owners
        .find((own: IOwnerMeta) => own.userId.toString() === req.session._id);

      if (!appOwner) {
        res.sendStatus(404);

        return;
      }

      res.locals.app = app;
      res.locals.appOwner = appOwner;

      next();
    } catch (err) {

      console.log(err);
      res.sendStatus(500);

    }


  }

  static async createAppChannel(req: IRequestSession, res: Response) {

    const owner: IOwnerMeta = res.locals.appOwner;
    if (!AuthHelper.hasOwnerRights(owner, 'write')) {
      res.sendStatus(403);

      return;
    }

    const app: AppModel = res.locals.app;

    const data = req.body;

    const existsChannel = (<IChannel[]>app.channels)
      .find((channel: IChannel) => channel.platform === data.platform && channel.code === data.code);

    if (existsChannel) {
      res.sendStatus(409);

      return;
    }

    const channel = new Channel();

    channel.app = app._id;
    Object.assign(channel, req.body);

    channel.owners.push({
      userId: req.session._id,
      rights: ['admin']
    });

    await channel.save();

    if (!app.channels) {
      app.channels = [];
    }

    (<string[]>app.channels).push(channel._id);
    await app.save();

    res.send({_id: channel._id});

  }


}
