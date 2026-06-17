import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

class RootResponseDto {
  service!: 'visepanda-api';
  status!: 'ok';
  links!: {
    health: '/health';
    docs: '/docs';
    openapiJson: '/docs-json';
    openapiYaml: '/docs-yaml';
  };
}

@ApiTags('Platform')
@Controller()
export class RootController {
  @Get()
  @ApiOperation({
    summary: '读取平台入口信息',
    description: '为本地联调与探活提供统一入口，避免访问 / 时返回 404。',
  })
  @ApiOkResponse({ type: RootResponseDto })
  getRoot(): RootResponseDto {
    return {
      service: 'visepanda-api',
      status: 'ok',
      links: {
        health: '/health',
        docs: '/docs',
        openapiJson: '/docs-json',
        openapiYaml: '/docs-yaml',
      },
    };
  }
}

