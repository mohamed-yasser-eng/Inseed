export class HttpException extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public error?: object,
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
