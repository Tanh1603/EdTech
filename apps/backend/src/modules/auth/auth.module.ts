import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ClerkClientProvider } from '../../common/providers/clerk-client.provider';
import { AuthController } from './controllers/auth.controller';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { AuthService } from './services/auth.service';
import { ClerkStrategy } from './strategies/clerk.strategy';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PassportModule , PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, ClerkStrategy, ClerkAuthGuard, ClerkClientProvider],
})
export class AuthModule { }
