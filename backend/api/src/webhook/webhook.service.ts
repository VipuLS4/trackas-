import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../common/enums';
import { WebhookRepository } from './webhook.repository';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class WebhookService {
  constructor(private readonly webhookRepository: WebhookRepository) {}

  async create(dto: CreateWebhookDto, user: CurrentUserPayload) {
    if (user.role !== Role.SHIPPER) {
      throw new ForbiddenException('Only SHIPPER can create webhook subscriptions');
    }
    return this.webhookRepository.create(user.id, dto.url, dto.secret);
  }

  async list(user: CurrentUserPayload) {
    if (user.role !== Role.SHIPPER) {
      throw new ForbiddenException('Only SHIPPER can list webhook subscriptions');
    }
    return this.webhookRepository.findByShipperId(user.id);
  }

  async disable(id: string, user: CurrentUserPayload) {
    if (user.role !== Role.SHIPPER) {
      throw new ForbiddenException('Only SHIPPER can disable webhook subscriptions');
    }
    const sub = await this.webhookRepository.findById(id);
    if (!sub) {
      throw new NotFoundException('Webhook subscription not found');
    }
    if (sub.shipperId !== user.id) {
      throw new ForbiddenException('Not your webhook subscription');
    }
    return this.webhookRepository.disable(id);
  }
}
