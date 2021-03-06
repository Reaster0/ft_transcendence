import { HttpException, forwardRef, Inject, Injectable, Req } from '@nestjs/common';
import { Response } from 'express';
import { authenticator } from 'otplib';
import { CreateUserDto } from 'src/users/user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/services/users.service';
import { toFileStream } from 'qrcode';
import { Socket } from 'socket.io';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { parse } from 'cookie';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  //    constructor(private readonly jwtService: JwtService) {}
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(user: CreateUserDto) {
    return this.userService.retrieveOrCreateUser(user);
  }

  async getUser(username: string): Promise<User> {
    return this.userService.findUserByUsername(username);
  }

  async generateTwoFASecret(user: User) /*: Promise<twoFaI> */ {
    const secret: string = authenticator.generateSecret();
    const authUrl: string = authenticator.keyuri(
      user.username,
      process.env.APPNAME,
      secret,
    );
    await this.userService.setTwoFASecret(user, secret);
    return { secret, authUrl };
  }

  public async pipeQrCodeStream(stream: Response, url: string) {
    return toFileStream(stream, url);
  }

  is2FAValide(twoFACode: string, user: User): boolean {
    return authenticator.verify({
      token: twoFACode,
      secret: user.decryptSecret(),
    });
  }

  async enableTwoFA(user: User): Promise<void> {
    if (user.is2FAEnabled) return;
    this.userService.enableTwoFA(user.id);
  }

  async disableTwoFA(user: User): Promise<void> {
    if (!user.is2FAEnabled) return;
    this.userService.disableTwoFA(user.id);
  }

  async getUserBySocket(client: Socket): Promise<User> {
    const cookie = String(client.handshake.headers.auth);
    if (!cookie) throw new HttpException('cookie absent', 401);
    const { jwt: token } = parse(cookie);
    const payload: JwtPayload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    const { username, twoFA } = payload;
    const user: User = await this.userService.findUserByUsername(username);
    if (!user) {
      throw new HttpException('User not found', 401);
    }
    if (user.is2FAEnabled) {
      if (!twoFA) {
        throw new HttpException('Should have validate 2FA', 418);
      }
    }
    return user;
  }


  /// ----------------------------------------------------------------
  async getUserNameFromRequest(res: any) {
    console.log(res)
    const result = await res.username;
    return result;
    //return res.user.username;
  }

}
