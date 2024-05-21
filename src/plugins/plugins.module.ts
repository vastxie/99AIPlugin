import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { NetSearchModule } from './net-search/net-search.module';
import { MindMapService } from './mind-map/mind-map.service';
import { MindMapModule } from './mind-map/mind-map.module';

@Module({
  providers: [PluginsService, MindMapService],
  controllers: [PluginsController],
  imports: [NetSearchModule, MindMapModule],
})
export class PluginsModule {}
