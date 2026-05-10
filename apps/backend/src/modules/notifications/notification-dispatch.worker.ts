import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobQueues, JobTypes } from '@edtech/contracts';
import { RabbitMqConsumer } from '../queue/rabbitmq.consumer';
import { JobsService } from '../jobs/jobs.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationDispatchWorker implements OnModuleInit {
  private readonly logger = new Logger(NotificationDispatchWorker.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly consumer: RabbitMqConsumer,
    private readonly jobsService: JobsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<boolean | string>('ENABLE_BE_WORKERS');
    if (enabled !== true && enabled !== 'true') {
      return;
    }

    await this.consumer.consume(JobQueues.notificationDispatch, async (message) => {
      const jobId = String(message.jobId ?? '');
      if (!jobId) {
        this.logger.warn('Skipping notification.dispatch message without jobId.');
        return;
      }

      await this.jobsService.markRunning(jobId);
      try {
        const result = await this.notificationsService.dispatch(
          message.payload as any,
        );
        await this.jobsService.markSucceeded(jobId, {
          ...result,
          type: JobTypes.notificationDispatch,
        });
      } catch (error) {
        await this.jobsService.markFailed(jobId, {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
}

