import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async register(username: string, password: string) {
    const existingUser = await this.userService.findByUsername(username);
   if (existingUser) {
  throw new ConflictException('Username already exists');
}

    const newUser = await this.userService.createUser(username, password);

    const payload = { username: newUser.username, sub: newUser.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
