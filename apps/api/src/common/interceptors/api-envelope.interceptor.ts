import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { ApiEnvelope } from '@visepanda/shared-types';

type RequestWithId = {
  headers?: Record<string, string | string[] | undefined>;
  requestId?: string;
};

type ResponseWithHeader = {
  setHeader(name: string, value: string): void;
};

@Injectable()
export class ApiEnvelopeInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithId>();
    const response = httpContext.getResponse<ResponseWithHeader>();
    const requestId = this.resolveRequestId(request);

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        requestId,
      })),
    );
  }

  private resolveRequestId(request: RequestWithId): string {
    const rawRequestId = request.headers?.['x-request-id'];

    if (typeof rawRequestId === 'string' && rawRequestId.trim()) {
      return rawRequestId;
    }

    if (Array.isArray(rawRequestId) && rawRequestId[0]?.trim()) {
      return rawRequestId[0];
    }

    return randomUUID();
  }
}
