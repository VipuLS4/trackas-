import { Module } from '@nestjs/common';
import { PublicTrackingController } from './public-tracking.controller';
import { PublicTrackingService } from './public-tracking.service';
import { ETAModule } from '../eta/eta.module';

@Module({
  imports: [ETAModule],
  controllers: [PublicTrackingController],
  providers: [PublicTrackingService],
})
export class PublicTrackingModule {}
