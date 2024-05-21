import { Module } from '@nestjs/common';
import { MindMapService } from './mind-map.service';

@Module({
  providers: [MindMapService],
  exports: [MindMapService],
})
export class MindMapModule {}
