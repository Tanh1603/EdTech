import { of, throwError } from 'rxjs';
import { NotificationsGatewayController } from './notifications.gateway.controller';

describe('NotificationsGatewayController', () => {
  it('returns page response from gRPC list notifications', async () => {
    const controller = new NotificationsGatewayController(
      {
        notifications: {
          listMyNotifications: jest.fn().mockReturnValue(of({
            items: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          })),
        },
      } as any,
      { build: jest.fn().mockReturnValue({}) } as any,
      {} as any,
    );

    const result = await controller.listMyNotifications(
      { page: 1, limit: 20 } as any,
      {} as any,
    );

    expect(result).toEqual({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('lets gRPC NOT_FOUND errors bubble to the gateway error filter', async () => {
    const error = { code: 5, details: 'Resource not found' };
    const controller = new NotificationsGatewayController(
      {
        notifications: {
          markNotificationRead: jest.fn().mockReturnValue(throwError(() => error)),
        },
      } as any,
      { build: jest.fn().mockReturnValue({}) } as any,
      {} as any,
    );

    await expect(
      controller.markRead('notification-1', {} as any),
    ).rejects.toBe(error);
  });
});

