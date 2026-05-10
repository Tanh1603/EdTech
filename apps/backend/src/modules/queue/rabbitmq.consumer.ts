import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AmqpMessage = { content: Buffer };
type AmqpChannel = {
  assertExchange: (...args: unknown[]) => Promise<unknown>;
  assertQueue: (...args: unknown[]) => Promise<unknown>;
  bindQueue: (...args: unknown[]) => Promise<unknown>;
  prefetch: (count: number) => Promise<unknown>;
  consume: (
    queue: string,
    handler: (message: AmqpMessage | null) => Promise<void> | void,
    options?: unknown,
  ) => Promise<unknown>;
  ack: (message: AmqpMessage) => void;
  nack: (message: AmqpMessage, allUpTo?: boolean, requeue?: boolean) => void;
  close: () => Promise<void>;
};

type AmqpConnection = {
  createChannel: () => Promise<AmqpChannel>;
  close: () => Promise<void>;
};

@Injectable()
export class RabbitMqConsumer implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqConsumer.name);
  private connection?: AmqpConnection;
  private channel?: AmqpChannel;
  private initPromise?: Promise<AmqpChannel | undefined>;

  constructor(private readonly configService: ConfigService) {}

  async consume(
    queue: string,
    handler: (message: Record<string, unknown>) => Promise<void>,
  ): Promise<void> {
    const channel = await this.getChannel();
    if (!channel) {
      return;
    }

    await channel.assertQueue(queue, { durable: true });
    await channel.consume(queue, async (message) => {
      if (!message) {
        return;
      }

      try {
        const payload = JSON.parse(message.content.toString()) as Record<string, unknown>;
        await handler(payload);
        channel.ack(message);
      } catch (error) {
        this.logger.error(`Failed consuming ${queue}: ${String(error)}`);
        channel.nack(message, false, false);
      }
    });
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      amqp = require('amqplib');
    } catch {
      this.logger.warn('RABBITMQ_URL is set but amqplib is not installed; RabbitMQ consumers are disabled.');
      return undefined;
    }

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.prefetch(Number(this.configService.get('RABBITMQ_PREFETCH') ?? 10));
    this.logger.log('RabbitMQ consumer connected.');
    return this.channel;
  }
}

