import { UserRole } from '@edtech/contracts';

export interface CurrentUser {
  id: string;
  externalUserId: string;
  email: string;
  status: string;
  roles: UserRole[];
}

