import { IsString, IsUrl, MinLength } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl()
  url: string;

  @IsString()
  @MinLength(16, { message: 'secret must be at least 16 characters' })
  secret: string;
}
