import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateWebhookDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.webhookService.create(dto, user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.webhookService.list(user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SHIPPER)
  disable(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.webhookService.disable(id, user);
  }
}
