import 'reflect-metadata';
import { RolePermissions } from '@edtech/contracts';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

jest.mock('../../modules/academic/lessons/lessons.service', () => ({
  LessonsService: class {},
}));

jest.mock(
  '../../modules/assessments/shared/assessments-shared.service',
  () => ({
    AssessmentsSharedService: class {},
  }),
);

jest.mock('../../modules/notifications/notifications.service', () => ({
  NotificationsService: class {},
}));

import { LessonsGrpcController } from '../../modules/academic/lessons/lessons.grpc.controller';
import { AssessmentsGrpcController } from '../../modules/assessments/shared/assessments.grpc.controller';
import { NotificationsGrpcController } from '../../modules/notifications/notifications.grpc.controller';

describe('gRPC permission mapping', () => {
  function methodPermissions(controller: Function, methodName: string) {
    return Reflect.getMetadata(
      PERMISSIONS_KEY,
      controller.prototype[methodName],
    );
  }

  it('allows learning read or lesson manage on lesson read paths', () => {
    expect(methodPermissions(LessonsGrpcController, 'getLessonDetail')).toEqual(
      [RolePermissions.learningRead, RolePermissions.lessonsManage],
    );
  });

  it('requires exam manage on teacher assessment write paths', () => {
    expect(methodPermissions(AssessmentsGrpcController, 'createExam')).toEqual([
      RolePermissions.examsManage,
    ]);
  });

  it('requires own notification read on notification inbox paths', () => {
    expect(
      methodPermissions(NotificationsGrpcController, 'listMyNotifications'),
    ).toEqual([RolePermissions.notificationsReadOwn]);
  });
});
