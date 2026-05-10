import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobType, JobTypeToQueue } from '@edtech/contracts';

type AmqpChannel = {
  assertExchange: (...args: unknown[]) => Promise<unknown>;
  assertQueue: (...args: unknown[]) => Promise<unknown>;
  bindQueue: (...args: unknown[]) => Promise<unknown>;
  publish: (...args: unknown[]) => boolean;
  close: () => Promise<void>;
};

type AmqpConnection = {
  createChannel: () => Promise<AmqpChannel>;
  close: () => Promise<void>;
};

export interface PublishJobMessage {
  jobId: string;
  type: JobType | string;
  payload?: unknown;
  requestId?: string | null;
  correlationId?: string | null;
}

@Injectable()
export class RabbitMqPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqPublisher.name);
  private connection?: AmqpConnection;
  private channel?: AmqpChannel;
  private initPromise?: Promise<AmqpChannel | undefined>;

  constructor(private readonly configService: ConfigService) {}

  async publishJob(
    message: PublishJobMessage,
    options: { delayMs?: number } = {},
  ): Promise<void> {
    const channel = await this.getChannel();
    if (!channel) {
      return;
    }

    const exchange = this.getExchange();
    const routingKey = this.getQueueForJobType(message.type);
    const publishRoutingKey = options.delayMs ? `${routingKey}.retry` : routingKey;
    channel.publish(
      exchange,
      publishRoutingKey,
      Buffer.from(JSON.stringify(message)),
      {
        contentType: 'application/json',
        deliveryMode: 2,
        messageId: message.jobId,
        correlationId: message.correlationId ?? undefined,
        expiration: options.delayMs ? String(options.delayMs) : undefined,
        timestamp: Math.floor(Date.now() / 1000),
      },
    );
  }

  async publishDeadLetter(message: PublishJobMessage): Promise<void> {
    const channel = await this.getChannel();
    if (!channel) {
      return;
    }

    const exchange = this.getDeadLetterExchange();
    const routingKey = `${this.getQueueForJobType(message.type)}.dlq`;
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        contentType: 'application/json',
        deliveryMode: 2,
        messageId: message.jobId,
        correlationId: message.correlationId ?? undefined,
        timestamp: Math.floor(Date.now() / 1000),
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async getChannel(): Promise<AmqpChannel | undefined> {
    if (!this.configService.get<string>('RABBITMQ_URL')) {
      return undefined;
    }

    if (this.channel) {
      return this.channel;
    }

    this.initPromise ??= this.createChannel();
    return this.initPromise;
  }

  private async createChannel(): Promise<AmqpChannel | undefined> {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      return undefined;
    }

    let amqp: { connect: (url: string) => Promise<AmqpConnection> };
    try {
      // amqplib is an optional runtime dependency for local development.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      amqp = require('amqplib');
    } catch {
      this.logger.warn('RABBITMQ_URL is set but amqplib is not installed; RabbitMQ publishing is disabled.');
      return undefined;
    }

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.assertTopology(this.channel);
    this.logger.log('RabbitMQ publisher connected.');
    return this.channel;
  }

  private async assertTopology(channel: AmqpChannel): Promise<void> {
    const exchange = this.getExchange();
    const dlx = this.getDeadLetterExchange();
    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertExchange(dlx, 'direct', { durable: true });

    for (const queue of Object.values(JobTypeToQueue)) {
      const dlq = `${queue}.dlq`;
      const retryQueue = `${queue}.retry`;
      await channel.assertQueue(dlq, { durable: true });
      await channel.bindQueue(dlq, dlx, dlq);
      await channel.assertQueue(retryQueue, {
        durable: true,
        deadLetterExchange: exchange,
        deadLetterRoutingKey: queue,
      });
      await channel.bindQueue(retryQueue, exchange, retryQueue);
      await channel.assertQueue(queue, {
        durable: true,
        deadLetterExchange: dlx,
        deadLetterRoutingKey: dlq,
      });
      await channel.bindQueue(queue, exchange, queue);
    }
  }

  private getQueueForJobType(type: string): string {
    return JobTypeToQueue[type as JobType] ?? type;
  }

  private getExchange(): string {
    return this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'edtech.jobs';
  }

  private getDeadLetterExchange(): string {
    return `${this.getExchange()}.dlx`;
  }
}
