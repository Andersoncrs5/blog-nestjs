import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Erro interno no servidor';
    let errorResponse: any = {};

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      errorResponse = typeof response === 'string' ? { message: response } : response;
      message = errorResponse.message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorResponse = { message: exception.message };
    }

    this.logger.error(
      `Erro ${status} em ${request.method} ${request.url}: ${message}`,
      (exception instanceof Error && exception.stack) || JSON.stringify(exception),
    );

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}