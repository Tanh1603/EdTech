import { HttpException, HttpStatus } from '@nestjs/common';

export class AppHttpException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus,
    details?: string[],
  ) {
    super(
      {
        code,
        message,
        details,
      },
      status,
    );
  }
}

