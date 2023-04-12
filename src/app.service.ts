import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { dummyData } from './app.controller';

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  access_token: string;
}

@Injectable()
export class AppService {
  createUser(userData: IUser) {
    userData['id'] = uuidv4();
    userData['role'] = 'user';
    return userData;
  }
  loginUser(credEmail: string) {
    return dummyData.find(({ email }) => credEmail === email);
  }
  authorizeUser(access_token: string) {
    const token = access_token.split(' ')[1];
    return token;
  }
}
