import { IUser, User } from '../models/User';
import { AuthHelper } from './AuthHelper';

export class UserHelper {

  static async createUser(login: string, password: string): Promise<IUser> {
    const user = new User();

    user.login = login;
    user.password = await AuthHelper.hashPassword(password);

    return user.save();
  }

}
