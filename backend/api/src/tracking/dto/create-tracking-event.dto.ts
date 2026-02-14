import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { TrackingEventType } from '../../common/enums';

export class CreateTrackingEventDto {
  @IsString()
  shipmentId: string;

  @IsEnum(TrackingEventType, {
    message: 'eventType must be PICKUP or DELIVERY',
  })
  eventType: TrackingEventType;

  @IsNumber()
  @Min(-90, { message: 'latitude must be between -90 and 90' })
  @Max(90, { message: 'latitude must be between -90 and 90' })
  latitude: number;

  @IsNumber()
  @Min(-180, { message: 'longitude must be between -180 and 180' })
  @Max(180, { message: 'longitude must be between -180 and 180' })
  longitude: number;
}
