import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { NetSearchModule } from './net-search/net-search.module';

@Module({
  providers: [PluginsService],
  controllers: [PluginsController],
  imports: [NetSearchModule],
})
export class PluginsModule {}
