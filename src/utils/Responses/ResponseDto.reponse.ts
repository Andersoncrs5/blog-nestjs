export class ResponseDto<T> {
  constructor(
    public message: string,
    public data: T,
    public url: string
  ) {}

  static of<T>(message: string, data: T, url: string): ResponseDto<T> {
    return new ResponseDto(message, data, url);
  }
}
