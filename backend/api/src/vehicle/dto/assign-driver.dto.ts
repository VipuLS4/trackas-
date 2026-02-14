import { IsString, MinLength } from 'class-validator';

export class AssignDriverDto {
  @IsString()
  @MinLength(1)
  driverId: string;
}
