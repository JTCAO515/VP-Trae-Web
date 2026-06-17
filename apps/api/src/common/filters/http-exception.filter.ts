import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { ApiEnvelope } from '@visepanda/shared-types';

type RequestWithId = {
  headers?: Record<string, string | string[] | undefined>;
  requestId?: string;
};

type ResponseWriter = {
  status(code: number): ResponseWriter;
  json(body: ApiEnvelope<null>): void;
  setHeader(name: string, value: string): void;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<ResponseWriter>();
    const request = httpContext.getRequest<RequestWithId>();
    const requestId = this.resolveRequestId(request);

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ?? 'Internal server error';

    response.setHeader('x-request-id', requestId);
    response.status(status).json({
      success: false,
      data: null,
      requestId,
      error: {
        code: this.resolveErrorCode(status),
        message: Array.isArray(message) ? message.join(', ') : message,
      },
    });
  }

  private resolveRequestId(request: RequestWithId): string {
    const rawHeader = request.requestId ?? request.headers?.['x-request-id'];

    if (typeof rawHeader === 'string' && rawHeader.trim()) {
      return rawHeader;
    }

    if (Array.isArray(rawHeader) && rawHeader[0]?.trim()) {
      return rawHeader[0];
    }

    return randomUUID();
  }

  private resolveErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
