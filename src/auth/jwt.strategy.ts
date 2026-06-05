import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Organizer } from '../entities';

export type JwtPayload = { sub: string; email: string; role?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Organizer)
    private readonly organizerRepo: Repository<Organizer>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<Organizer> {
    const organizer = await this.organizerRepo.findOne({
      where: { id: payload.sub },
    });
    if (!organizer) {
      throw new UnauthorizedException();
    }
    return organizer;
  }
}
