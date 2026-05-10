import { Module } from '@nestjs/common';
import { RabbitMqConsumer } from './rabbitmq.consumer';
import { RabbitMqPublisher } from './rabbitmq.publisher';

@Module({
  providers: [RabbitMqPublisher, RabbitMqConsumer],
  exports: [RabbitMqPublisher, RabbitMqConsumer],
})
export class QueueModule {}

