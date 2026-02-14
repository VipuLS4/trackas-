import { Module } from '@nestjs/common';
import { ETAService } from './eta.service';

@Module({
  providers: [ETAService],
  exports: [ETAService],
})
export class ETAModule {}
