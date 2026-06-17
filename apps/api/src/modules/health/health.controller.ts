import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { HealthPayload } from '@visepanda/shared-types';

class HealthResponseDto {
  service!: 'visepanda-api';
  status!: 'ok';
}

@ApiTags('Platform')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: '读取统一 API 健康状态',
    description: '用于本地启动验证、网关探活和部署前检查。',
  })
  @ApiOkResponse({
    description: 'API 已启动并可接收请求。',
    type: HealthResponseDto,
  })
  getHealth(): HealthPayload {
    return {
      service: 'visepanda-api',
      status: 'ok',
    };
  }
}
