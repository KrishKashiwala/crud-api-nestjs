import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AppService, IUser } from './app.service';
import { JwtService } from '@nestjs/jwt';

export const dummyData: IUser[] = [
  {
    id: 'a8b3de99-c904-4c80-8f51-90b5fa4964aa',
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    password: 'john',
    role: 'user',
    access_token:
      'eyJhbGciOiJIUzI1NiJ9.dXNlcg.GpQuEkPY_oQqmqrWp9LKBQZBOHp_6-GGNBAuzvsRFhw',
  },
  {
    id: '098765432112d48971-4adc-41ca-bf89-8b44eb4dacba',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'janedoe@example.com',
    password: 'jane',
    role: 'user',
    access_token:
      'eyJhbGciOiJIUzI1NiJ9.dXNlcg.GpQuEkPY_oQqmqrWp9LKBQZBOHp_6-GGNBAuzvsRFhw',
  },
  {
    id: '2112d48971-4adc-41ca-bf89-8b44eb4dacba',
    firstName: 'Krish',
    lastName: 'Kashiwala',
    email: 'k@mail.com',
    password: 'k',
    role: 'admin',
    access_token:
      'eyJhbGciOiJIUzI1NiJ9.YWRtaW4.7roaFQ7hD-Qo2bzTwxOZnuNN3OSjuXwyaN8WpJjCEnQ',
  },
];

@Controller()
export class AppController {
  appService = new AppService();
  jwtService = new JwtService();
  // create a user/admin
  @Post('/api/signup')
  createUser(@Body() userData: IUser): IUser {
    try {
      //basic request body check we can use class-validator package as well
      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'password',
        'role',
      ];
      const missingFields = requiredFields.filter(
        (field) => !(field in userData),
      );
      if (missingFields.length > 0)
        throw new HttpException(
          'Invalid request body or missing required fields.',
          HttpStatus.BAD_REQUEST,
        );

      // check for email already exists
      if (
        dummyData.filter((user) => user.email === userData.email).length > 0
      ) {
        throw new HttpException(
          'Email already exists in the system',
          HttpStatus.CONFLICT,
        );
      }
      const user = this.appService.createUser(userData);
      return user;
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  //login
  @Post('/api/signin')
  async login(@Body() cred: { email: string; password: string }) {
    try {
      const user = this.appService.loginUser(cred.email);
      if (user) {
        console.log('user found: ', cred.password, user.password);
        if (user.password !== cred.password) {
          throw new HttpException(
            'unauthorized access',
            HttpStatus.UNAUTHORIZED,
          );
        }
        //create a jwt service
        return {
          ...user,
          access_token: await this.jwtService.signAsync(user.role, {
            secret: 'secret_key',
          }),
        };
      }
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  //admin api - get all users
  @Get('/api/users')
  async getUsers(@Headers('Authorization') headers) {
    try {
      const token = this.appService.authorizeUser(headers);
      const role = await this.jwtService
        .verifyAsync(token, {
          secret: 'secret_key',
        })
        .catch((err) => {
          if (err.status === '401')
            throw new HttpException(
              'The user making the request is not authenticated.',
              err.status,
            );
          else throw new HttpException(err.response, err.status);
        });
      //admin
      if (role === 'admin') {
        return dummyData.filter((user) => user.role !== 'admin');
      } else {
        throw new HttpException(
          'The user making the request is not authorized to access this endpoint.',
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }
}
