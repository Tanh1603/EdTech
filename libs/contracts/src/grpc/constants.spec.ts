import { GrpcMethods } from './methods';
import { GrpcServices } from './services';

describe('grpc constants', () => {
  it('exposes stable service and method names', () => {
    expect(GrpcServices.learningRoadmaps).toBe('LearningRoadmapsService');
    expect(GrpcMethods.learningRoadmaps.createRoadmap).toBe('CreateRoadmap');
    expect(GrpcServices.academicCourses).toBe('AcademicCoursesService');
    expect(GrpcMethods.academicCourses.getCourses).toBe('GetCourses');
    expect(GrpcServices.jobs).toBe('JobsService');
    expect(GrpcMethods.jobs.getJobStatus).toBe('GetJobStatus');
    expect(GrpcServices.notifications).toBe('NotificationsService');
    expect(GrpcMethods.notifications.listMyNotifications).toBe('ListMyNotifications');
  });
});
