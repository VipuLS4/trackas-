import { Module } from '@nestjs/common';
import { AdminDemoController } from './admin-demo.controller';
import { AdminDemoService } from './admin-demo.service';

@Module({
  controllers: [AdminDemoController],
  providers: [AdminDemoService],
})
export class AdminDemoModule {}
