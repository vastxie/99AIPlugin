import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../api-key/api-key.guard';
import { ExecutePluginDto } from './dto/execute-plugin.dto';
import { ExecutePluginResultDto } from './dto/execute-plugin-result.dto';

@ApiTags('plugins')
@ApiBearerAuth()
@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @UseGuards(ApiKeyGuard)
  @Post(':pluginName')
  @ApiOperation({ summary: 'Execute a plugin' })
  @ApiParam({ name: 'pluginName', description: 'Name of the plugin' })
  @ApiBody({ type: ExecutePluginDto })
  @ApiResponse({
    status: 200,
    description: 'The plugin has been executed successfully.',
    type: ExecutePluginResultDto,
  })
  async executePlugin(
    @Param('pluginName') pluginName: string,
    @Body() params: ExecutePluginDto,
  ): Promise<ExecutePluginResultDto> {
    return this.pluginsService.executePlugin(pluginName, params);
  }
}
