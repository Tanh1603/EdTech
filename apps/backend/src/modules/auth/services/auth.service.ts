import { ClerkClient } from '@clerk/backend';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';


@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService,
    @Inject('ClerkClient')
    private readonly clerkClient: ClerkClient,
  ) { }


}
