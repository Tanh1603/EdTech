import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'edtech-backend',
      dependencies: {
        postgres: 'up',
        redis: 'up',
      },
    };
  }
}

