import { NextFunction, Request, RequestHandler, Response } from 'express';
import { pick } from 'lodash';

// tslint:disable-next-line:no-var-requires no-require-imports
// const ERRORS: { [errCode: string]: string } = require('../../static/errors.json');

export enum DataCheckDataType {
  Any = 1,
  Number = 2,
  String = 3,
  Boolean = 4,
  Object = 5,
  Array = 6
}

export enum DataCheckWhere {
  Query,
  Body,
  Params
}

export class RequestHelper {

  /**
   * Check is session exists
   *
   * @param {IRequestSession} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  static sessionCheck(req: IRequestSession, res: Response, next: NextFunction) {

    const session: any = req.session;

    if (!session || !session._id) {
      this.responseError(res, 401, 'E5');

      return;
    }

    next();
  }

  /**
   * Check incoming fields
   *
   * @param {IDataCheckFields} fields
   * @param {IDataCheckOptions} options
   * @returns {RequestHandler}
   */
  static dataCheck(fields: IDataCheckFields, options: IDataCheckOptions = {}): RequestHandler {

    const keys = Object.keys(fields);
    const keysLength = keys.length;

    let where: string;

    switch (options.where) {
      case DataCheckWhere.Query:
        where = 'query';
        break;
      case DataCheckWhere.Params:
        where = 'params';
        break;
      case DataCheckWhere.Body:
      default:
        where = 'body';
    }

    for (let i = 0; i < keysLength; i++) {
      if (typeof fields[keys[i]] === 'string') {
        fields[keys[i]] = <IDataCheckFieldOptions>{
          type: fields[keys[i]]
        };
      }
    }

    return (req: IRequestSession, res: Response, next: NextFunction) => {

      if (!req[where]) {
        this.responseError(res, 400, 'E6');

        return;
      }

      let field: IDataCheckFieldOptions;
      let key: string;
      const data: any = req[where];
      let isValid: boolean = true;

      for (let i = 0; i < keysLength; i++) {

        key = keys[i];
        field = <IDataCheckFieldOptions>fields[key];

        if (data[key] === undefined) {

          if (field.optional) {
            continue;
          }

          if (field.def !== undefined) {
            data[key] = field.def;
          } else {
            this.responseError(res, 400, 'E7', {field: key});

            return;
          }

        }


        if (field.type && field.type !== DataCheckDataType.Any) {

          switch (field.type) {
            case DataCheckDataType.String:
              // data[key] = sanitizeHtml(data[key], {
              //   allowedTags: false,
              //   allowedAttributes: false
              // });
              isValid = this.checkFieldString(data[key], field);
              break;
            case DataCheckDataType.Number:
              data[key] = parseInt(data[key], 10);
              isValid = this.checkFieldNumber(data[key], field);
              break;
            case DataCheckDataType.Boolean:
              if (data[key] === 'true') {
                data[key] = true;
              } else if (data[key] === 'false') {
                data[key] = false;
              } else {
                data[key] = !!data[key];
              }
              break;
            case DataCheckDataType.Object:
              isValid = typeof data[key] === 'object';
              break;
            case DataCheckDataType.Array:
              isValid = Array.isArray(data[key]);
          }

        }

        if (isValid && field.validator) {
          isValid = field.validator(req);
        }

        if (!isValid) {
          this.responseError(res, 400, 'E13', {field: key});

          return;
        }

      }

      if (!options.acceptOther) {
        req[where] = pick(data, keys);
      }

      next();

    };

  }


  /**
   * Check multi incoming fields
   *
   * @param {IDataCheckMulti} arrOfDatas
   * @return {RequestHandler[]}
   */
  static dataCheckMulti(arrOfDatas: IDataCheckMulti[]): RequestHandler[] {
    return arrOfDatas.map((data: IDataCheckMulti) => this.dataCheck(data.fields, data.options));
  }


  /**
   * Response with error
   *
   * @param {Response} res
   * @param {number} status
   * @param {string} errorCode
   * @param data
   */
  static responseError(res: Response, status: number, errorCode: string, data: any = null): void {

    const dataResp: IResponseError = {
      success: false,
      code: errorCode
      // message: ERRORS[errorCode]
    };

    if (data) {
      dataResp.data = data;
    }

    res.locals.isSent = true;

    res.status(status).send(dataResp);

  }


  /**
   * Used on catch
   *
   * @param {Response} res
   * @param {string} message
   * @param {Error} err
   */
  static catchErrorResponse(res: Response, message: string, err: Error): void {
    console.log('CatchErrorResponse', message, err.message);
    res.sendStatus(500);
  }


  /**
   * Check string field
   *
   * @param {string} value
   * @param {IDataCheckFieldOptions} field
   * @returns {boolean}
   */
  private static checkFieldString(value: string, field: IDataCheckFieldOptions): boolean {

    if (typeof value !== 'string') {
      return false;
    }

    if (field.trim) {
      value = value.trim();
    }

    if (field.min !== undefined && value.length < field.min) {
      return false;
    }

    if (field.max !== undefined && value.length > field.max) {
      return false;
    }

    if (field.from && (<string>field.from).indexOf(value) === -1) {
      return false;
    }

    return true;

  }


  /**
   * Check number field
   *
   * @param {number} value
   * @param {IDataCheckFieldOptions} field
   * @returns {boolean}
   */
  private static checkFieldNumber(value: number, field: IDataCheckFieldOptions): boolean {

    if (isNaN(value) || typeof value !== 'number') {
      return false;
    }

    if (field.min !== undefined && value < field.min) {
      return false;
    }

    if (field.max !== undefined && value > field.max) {
      return false;
    }

    if (field.from && (<number[]>field.from).indexOf(value) === -1) {
      return false;
    }

    return true;

  }

}



export interface IDataCheckMulti {
  fields: IDataCheckFields;
  options: IDataCheckOptions;
}

export interface IDataCheckOptions {
  where?: DataCheckWhere;
  acceptOther?: boolean;
}

export interface IDataCheckFields {
  [fieldName: string]: IDataCheckFieldOptions | DataCheckDataType | boolean;
}

export interface IDataCheckFieldOptions {
  type: DataCheckDataType;
  def?: any;
  min?: number;
  max?: number;
  trim?: boolean;
  optional?: boolean;
  from?: string[] | string | number[];
  validator?(req: IRequestSession): boolean;
}


export interface IResponseBase {
  success: boolean;
  message?: string;
  data?: any;
}

export interface IResponseError extends IResponseBase {
  code: string;
}

export interface IRequestSession extends Request {
  session?: any;
  [prop: string]: any;
}
