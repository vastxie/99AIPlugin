import { Injectable } from '@nestjs/common';
import { NetSearchService } from './net-search/net-search.service';
import { ExecutePluginDto } from './dto/execute-plugin.dto';
import { ExecutePluginResultDto } from './dto/execute-plugin-result.dto';
import { MindMapService } from './mind-map/mind-map.service';

@Injectable()
export class PluginsService {
  constructor(
    private readonly netSearchService: NetSearchService,
    private readonly mindMapService: MindMapService,
  ) {}

  async executePlugin(
    pluginName: string,
    params: ExecutePluginDto,
  ): Promise<ExecutePluginResultDto> {
    console.log(`Executing plugin ${pluginName}`);
    switch (pluginName) {
      case 'net-search':
        return { text: await this.netSearchService.execute(params) };
      case 'mind-map':
        return { text: await this.mindMapService.execute() };
      default:
        return { text: `Plugin ${pluginName} not found` };
    }
  }
}
