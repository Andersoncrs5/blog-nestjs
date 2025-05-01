import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: Boolean(process.env.JWT_IGNORE_EXPIRATION || false),
      secretOrKey: process.env.JWT_SECRET || '4713657431567431568346571438956173465974318659743185143965',
    });
  }

  async validate(payload: any) {
    return { 
      sub: payload.sub, 
      email: payload.email, 
      isAdm: payload.isAdm, 
      isBlocked: payload.isBlocked 
    };
  }
}
