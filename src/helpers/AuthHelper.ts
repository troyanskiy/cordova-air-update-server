import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { User, UserModel } from '../models/User';
import { IOwnerMeta } from '../models/OwnerSchema';

const JWT_SECRET = '23849576weifhsdkfjshdtd9gny7slifguhmo7hdflighsd'; //require('../config/components/jwt').jwt.tokenSecret;
const PASSWORD_CHARS = 'qwertyuiopasdfghjklzxcvbnm0123456789';
const PASSWORD_CHARS_ALL = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789';

export class AuthHelper {


  /**
   * Hash the password
   *
   * @param {string} pass
   * @returns {Promise<string>}
   */
  static hashPassword(pass: string): Promise<string> {

    return new Promise((resolve: any, reject: any) => {
      crypto.pbkdf2(pass, 'salt', 10000, 128, 'sha512', (err: Error, key: Buffer) => {

        if (err) {
          reject(err);

          return;
        }

        resolve(key.toString('hex'));
      });
    });

  }

  /**
   * Create JWT Token
   *
   * @param {ITokenBody} body
   * @returns {Promise<string>}
   */
  static createJWT(body: ITokenBody): Promise<string> {
    return new Promise((resolve: any, reject: any) => {
      jwt.sign(body, JWT_SECRET, {}, (err: Error, token: string) => {
        if (err) {
          console.warn('Error creating JWT', err);
          reject(err);

          return;
        }

        resolve(token);
      });
    });
  }

  /**
   * Validate JWT Token
   *
   * @param {string} token
   * @returns {Promise<ITokenBody>}
   */
  static validateJWT(token: string): Promise<ITokenBody> {
    return new Promise((resolve, reject) => {

      jwt.verify(token, JWT_SECRET, (err: Error, decoded: ITokenBody) => {

        if (err) {
          reject(err);

          return;
        }

        resolve(decoded);

      });

    });
  }

  /**
   * Authorize token and get user
   *
   * @param {string} token
   * @returns {Promise<[ITokenBody, UserModel]>}
   */
  static async authorizeTokenAndGetUser(token: string): Promise<[ITokenBody, UserModel]> {

    const tokenBody: ITokenBody = await this.validateJWT(token);
    const user: UserModel = await <any>User.findById(tokenBody._id).select('_id firstName lastName loginHashes lastActivityTime');

    if (!user) {
      console.log('User not found');
      throw new Error('User not found');
    }

    if (!user.loginHashes) {
      console.log('User loginHashes does not exists', user);
      throw new Error('User not found');
    }

    const loginHash = tokenBody.token;
    for (let i = 0; i < user.loginHashes.length; i++) {
      if (user.loginHashes[i].hash === loginHash) {

        user.lastActivityTime = new Date();
        user.loginHashes[i].lastActivityTime = user.lastActivityTime;

        return await Promise.all([tokenBody, user.save()]);

      }
    }

    throw new Error('User does not have authorized login hash');

  }

  /**
   * Generate password / random string
   *
   * @param {number} length
   * @param {boolean} all
   * @returns {string}
   */
  static generatePassword(length: number = 6, all: boolean = false): string {

    let password: string = '';
    const passChars: string = all ? PASSWORD_CHARS_ALL : PASSWORD_CHARS;
    const charsLen: number = passChars.length;

    for (let i = 0; i < length; i++) {
      password += passChars.charAt(Math.floor(Math.random() * charsLen));
    }

    return password;

  }

  /**
   * Check owner rights
   *
   * @param {IOwnerMeta} owner
   * @param {string} right
   * @return {boolean}
   */
  static hasOwnerRights(owner: IOwnerMeta, right: string): boolean {
    return (owner.rights.indexOf('admin') > -1 || owner.rights.indexOf(right) > -1);
  }


}

export interface ITokenBody {
  _id: string;
  token?: string;
}
