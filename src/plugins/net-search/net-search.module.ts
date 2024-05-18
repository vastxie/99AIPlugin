import { Module } from '@nestjs/common';
import { NetSearchService } from './net-search.service';

@Module({
  providers: [NetSearchService],
  exports: [NetSearchService],
})
export class NetSearchModule {}
