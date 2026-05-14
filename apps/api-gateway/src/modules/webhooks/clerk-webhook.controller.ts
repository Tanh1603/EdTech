import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { Webhook } from 'svix';
import { Public } from '../auth/public.decorator';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

type ClerkWebhookEvent = {
  type: string;
  data: Record<string, any>;
};

@ApiTags('Webhooks')
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
  ) { }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Receive Clerk user webhooks' })
  async handleClerkWebhook(
    @Req() req: RequestWithContext & { rawBody?: Buffer },
    @Body() body: ClerkWebhookEvent,
    @Headers('svix-id') svixId: string | undefined,
    @Headers('svix-timestamp') svixTimestamp: string | undefined,
    @Headers('svix-signature') svixSignature: string | undefined,
  ) {
    const payload = req.rawBody?.toString('utf8') ?? JSON.stringify(body);
    const event = this.verifySvixSignature(
      payload,
      svixId,
      svixTimestamp,
      svixSignature,
    );

    const metadata = this.metadata.buildFromContext({
      requestId: req.requestId ?? 'unknown',
      correlationId: req.correlationId ?? req.requestId ?? 'unknown',
    });
    const clerkUserId = event.data.id;

    this.logger.log(
      `Received Clerk webhook type=${event.type} user=${clerkUserId ?? 'unknown'} requestId=${req.requestId ?? 'unknown'}`,
    );

    try {
      if (event.type === 'user.created') {
        await lastValueFrom(
          this.grpc.users.syncClerkUserCreated(
            this.toSyncUserPayload(event.data, 'active'),
            metadata,
          ),
        );
        this.logger.log(
          `Synced Clerk user.created user=${clerkUserId} requestId=${req.requestId ?? 'unknown'}`,
        );
      }

      if (event.type === 'user.updated') {
        await lastValueFrom(
          this.grpc.users.syncClerkUserUpdated(
            this.toSyncUserPayload(event.data, 'active'),
            metadata,
          ),
        );
        this.logger.log(
          `Synced Clerk user.updated user=${clerkUserId} requestId=${req.requestId ?? 'unknown'}`,
        );
      }

      if (event.type === 'user.deleted') {
        await lastValueFrom(
          this.grpc.users.syncClerkUserDeleted({ id: event.data.id }, metadata),
        );
        this.logger.log(
          `Synced Clerk user.deleted user=${clerkUserId} requestId=${req.requestId ?? 'unknown'}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync Clerk webhook type=${event.type} user=${clerkUserId ?? 'unknown'} requestId=${req.requestId ?? 'unknown'} message=${error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    return {
      received: true,
      type: event.type,
    };
  }

  private verifySvixSignature(
    payload: string,
    svixId: string | undefined,
    svixTimestamp: string | undefined,
    svixSignature: string | undefined,
  ): ClerkWebhookEvent {
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new UnauthorizedException('Missing Clerk webhook signature headers');
    }

    const secret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Missing Clerk webhook secret');
    }

    try {
      return new Webhook(secret).verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (error) {
      this.logger.warn(
        `Rejected Clerk webhook signature message=${error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new UnauthorizedException('Invalid Clerk webhook signature');
    }
  }

  private toSyncUserPayload(data: Record<string, any>, status: string) {
    return {
      id: data.id,
      email: this.getPrimaryEmail(data) ?? '',
      firstName: data.first_name ?? '',
      lastName: data.last_name ?? '',
      imageUrl: data.image_url ?? '',
      status,
    };
  }

  private getPrimaryEmail(data: Record<string, any>): string | undefined {
    const emails = Array.isArray(data.email_addresses) ? data.email_addresses : [];
    const primary = emails.find(
      (email: Record<string, any>) => email.id === data.primary_email_address_id,
    );

    return primary?.email_address ?? emails[0]?.email_address;
  }
}
