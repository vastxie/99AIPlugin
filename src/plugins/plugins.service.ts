import { Injectable } from '@nestjs/common';
import { NetSearchService } from './net-search/net-search.service';
import { ExecutePluginDto } from './dto/execute-plugin.dto';
import { ExecutePluginResultDto } from './dto/execute-plugin-result.dto';

@Injectable()
export class PluginsService {
  constructor(private readonly netSearchService: NetSearchService) {}

  async executePlugin(
    pluginName: string,
    params: ExecutePluginDto,
  ): Promise<ExecutePluginResultDto> {
    console.log(`Executing plugin ${pluginName}`);
    switch (pluginName) {
      case 'net-search':
        return { result: await this.netSearchService.execute(params) };
      default:
        return { result: `Plugin ${pluginName} not found` };
    }
  }
}
