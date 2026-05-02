import { HttpException } from './http-exception.utils'

export class BadRequestException extends HttpException {
  constructor(
    message: string,
    public error?: object,
  ) {
    super(message, 400, error)
  }
}

export class ConflictException extends HttpException {
  constructor(
    message: string,
    public error?: object,
  ) {
    super(message, 409, error)
  }
}

export class NotFoundException extends HttpException {
  constructor(
    message: string,
    public error?: object,
  ) {
    super(message, 404, error)
  }
}

export class UnauthorizedException extends HttpException {
  constructor(
    message: string,
    public error?: object,
  ) {
    super(message, 401, error)
  }
}
