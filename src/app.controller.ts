import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Render,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import RegisterDto from './register.dto';
import User from './user.entity';
import * as bcrypt from 'bcrypt';
import ChangeUserDto from './changeuser.dto';
import { userInfo } from 'os';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private dataSource: DataSource,
  ) {}

  @Get()
  @Render('index')
  index() {
    return { message: 'Welcome to the homepage' };
  }

  @Post('/register')
  @HttpCode(200)
  async register(@Body() registerDto: RegisterDto) {
    if (
      !registerDto.email ||
      !registerDto.password ||
      !registerDto.passwordAgain
    ) {
      throw new BadRequestException('All fields are required');
    }
    if (!registerDto.email.includes('@')) {
      throw new BadRequestException('Email must contain a @ character');
    }
    if (registerDto.password !== registerDto.passwordAgain) {
      throw new BadRequestException('The two passwords must match');
    }
    if (registerDto.password.length < 8) {
      throw new BadRequestException(
        'The password must be at least 8 characters long',
      );
    }

    const userRepo = this.dataSource.getRepository(User);
    const user = new User();
    user.email = registerDto.email;
    user.password = await bcrypt.hash(registerDto.password, 15);
    await userRepo.save(user);

    delete user.password;

    return user;
  }

  @Patch('/user/:id')
  async updateUser(
    @Param('id') id: number,
    @Body() ChangeUserDto: ChangeUserDto,
  ) {
    if (!ChangeUserDto.email) {
      throw new BadRequestException('Email field is required');
    }
    if (!ChangeUserDto.profilePicture) {
      return (ChangeUserDto.profilePicture = null);
    }
    if (!ChangeUserDto.email.includes('@')) {
      throw new BadRequestException('Email must contain a @ character');
    }
    if (
      ChangeUserDto.profilePicture.startsWith('http://') == false &&
      ChangeUserDto.profilePicture.startsWith('https://') == false
    ) {
      ChangeUserDto.profilePicture = null;
    }
    const userRepo = this.dataSource.getRepository(User);
    userRepo.update(
      { id: id },
      {
        email: ChangeUserDto.email,
        profilePicture: ChangeUserDto.profilePicture,
      },
    );
    return ChangeUserDto;
  }
}
