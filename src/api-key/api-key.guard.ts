import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const apiKey = authHeader.split(' ')[1]; // 假设格式为 "Bearer <api_key>"

    if (!apiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    if (apiKey !== process.env.API_KEY) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
