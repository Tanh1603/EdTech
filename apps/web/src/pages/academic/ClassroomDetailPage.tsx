import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchClassroomDetail, 
  fetchLessonsByCourse, 
  fetchClassroomLessons, 
  publishLessonToClassroom, 
  updateClassroomLesson, 
  fetchClassroomStudents, 
  removeEnrollment, 
  regenerateInviteCode 
} from '../../services/academic';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  Users,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  UserX,
  ClipboardCheck,
  GraduationCap
} from 'lucide-react';

export const ClassroomDetailPage: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'lessons' | 'members' | 'invite'>('lessons');
  const [copied, setCopied] = useState(false);

  // 1. Fetch Classroom Detail
  const { data: classResp, isLoading: isClassLoading } = useQuery({
    queryKey: ['classroom', classroomId],
    queryFn: () => fetchClassroomDetail(classroomId || ''),
    enabled: !!classroomId,
  });

  const classroom = classResp?.data;
  const courseId = classroom?.courseId;

  // 2. Fetch Course Lessons (for cross-reference/publishing by teachers)
  const { data: courseLessonsResp, isLoading: isCourseLessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => fetchLessonsByCourse(courseId || ''),
    enabled: !!courseId,
  });

  // 3. Fetch Classroom Lessons (actual published states)
  const { data: classLessons, isLoading: isClassLessonsLoading } = useQuery({
    queryKey: ['classroomLessons', classroomId],
    queryFn: () => fetchClassroomLessons(classroomId || '', { publishedOnly: activeRole === 'student' }),
    enabled: !!classroomId,
  });

  // 4. Fetch Enrolled Students list
  const { data: students = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['classroomStudents', classroomId],
    queryFn: () => fetchClassroomStudents(classroomId || ''),
    enabled: !!classroomId,
  });

  const courseLessons = courseLessonsResp?.data || [];

  // Toggle Publish Mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ lessonId, currentlyLinked, isPublished }: { lessonId: string; currentlyLinked: boolean; isPublished: boolean }) => {
      if (!currentlyLinked) {
        // First time adding/publishing to class
        return publishLessonToClassroom(classroomId || '', { lessonId, isPublished });
      } else {
        // Toggle existing publishing state
        return updateClassroomLesson(classroomId || '', lessonId, isPublished);
      }
    },
    onSuccess: () => {
      toast.success('Cập nhật trạng thái bài học thành công!');
      queryClient.invalidateQueries({ queryKey: ['classroomLessons', classroomId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi cập nhật: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // Regenerate Invite Code Mutation
  const regenerateCodeMutation = useMutation({
    mutationFn: () => regenerateInviteCode(classroomId || ''),
    onSuccess: () => {
      toast.success('Mã mời mới được tạo thành công!');
      queryClient.invalidateQueries({ queryKey: ['classroom', classroomId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi đổi mã: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // Remove Student Mutation
  const removeStudentMutation = useMutation({
    mutationFn: removeEnrollment,
    onSuccess: () => {
      toast.success('Đã xóa học sinh khỏi lớp học!');
      queryClient.invalidateQueries({ queryKey: ['classroomStudents', classroomId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi khi xóa học sinh: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  const handleCopyInviteCode = () => {
    if (classroom?.inviteCode) {
      navigator.clipboard.writeText(classroom.inviteCode);
      setCopied(true);
      toast.success('Đã sao chép mã mời vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePublish = (lessonId: string, currentlyLinked: boolean, currentPublished: boolean) => {
    togglePublishMutation.mutate({
      lessonId,
      currentlyLinked,
      isPublished: !currentPublished
    });
  };

  const handleRemoveStudentClick = (enrollmentId: string, studentName: string) => {
    const confirmRemove = window.confirm(`Bạn chắc chắn muốn xóa học sinh ${studentName} khỏi lớp này?`);
    if (confirmRemove) {
      removeStudentMutation.mutate(enrollmentId);
    }
  };

  if (isClassLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto">
        Không tìm thấy phòng học yêu cầu hoặc bạn không có quyền xem lớp này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link 
        to="/classes"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh sách lớp học</span>
      </Link>

      {/* Classroom Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20 uppercase tracking-wide">
              {classroom.course?.name || 'Môn học cơ bản'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight">
            {classroom.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={14} className="text-muted-foreground" />
            <span>Khai giảng: {formatDate(classroom.startAt)}</span>
          </div>
        </div>

        {activeRole === 'teacher' && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground">MÃ MỜI LỚP HỌC</span>
              <span className="text-sm font-bold text-primary font-mono tracking-wider">
                {classroom.inviteCode}
              </span>
            </div>
            <button
              onClick={handleCopyInviteCode}
              className="p-1.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-2"
              title="Copy mã mời"
            >
              {copied ? <ClipboardCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border flex items-center gap-4">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all font-outfit ${
            activeTab === 'lessons'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Bài học lớp
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all font-outfit ${
            activeTab === 'members'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sĩ số lớp ({students.length})
        </button>
        {activeRole === 'teacher' && (
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all font-outfit ${
              activeTab === 'invite'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Quản lý mã mời
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'lessons' && (
        isCourseLessonsLoading || isClassLessonsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : activeRole === 'teacher' ? (
          /* Teacher Switchboard panel */
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 border border-border/80 rounded-2xl">
              <h3 className="text-sm font-bold mb-1">Bảng điều khiển xuất bản bài giảng</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bật hoặc tắt bài học bên dưới để quyết định xem học sinh trong lớp này có quyền truy cập học tập bài đó hay không.
              </p>
            </div>
            
            <div className="space-y-3">
              {courseLessons.map((lesson) => {
                // Find if lesson exists in class lessons list and check its published status
                const linkedClassLesson = classLessons?.find((cl) => cl.lessonId === lesson.id);
                const isPublished = linkedClassLesson ? linkedClassLesson.isPublished : false;

                return (
                  <div
                    key={lesson.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="h-8 w-8 rounded-lg bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center">
                        {lesson.orderNo}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{lesson.description || 'Không có mô tả.'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isPublished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {isPublished ? 'Đã xuất bản' : 'Đang ẩn'}
                      </span>
                      <button
                        onClick={() => handleTogglePublish(lesson.id, !!linkedClassLesson, isPublished)}
                        disabled={togglePublishMutation.isPending}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isPublished
                            ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/25'
                            : 'bg-muted border-border text-muted-foreground hover:bg-accent'
                        }`}
                        title={isPublished ? 'Ẩn bài học' : 'Xuất bản bài học'}
                      >
                        {isPublished ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Student visible lesson list */
          classLessons && classLessons.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-lg mx-auto flex flex-col items-center">
              <Layers size={40} className="text-muted-foreground mb-3" />
              <h4 className="font-bold mb-1">Chưa có bài học nào được xuất bản</h4>
              <p className="text-xs text-muted-foreground">
                Giáo viên hiện tại chưa mở xuất bản bài giảng nào cho lớp học này. Vui lòng quay lại sau!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classLessons?.map((cl) => {
                const lesson = cl.lesson;
                if (!lesson) return null;

                return (
                  <Link
                    key={cl.lessonId}
                    to={`/lessons/${cl.lessonId}`}
                    className="bg-card border border-border hover:border-primary/30 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="h-8 w-8 rounded-lg bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center">
                        {lesson.orderNo}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {lesson.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{lesson.description || 'Không có mô tả.'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Vào học</span>
                      <ArrowLeft size={12} className="rotate-180" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )
      )}

      {activeTab === 'members' && (
        isStudentsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-lg mx-auto flex flex-col items-center">
            <Users size={40} className="text-muted-foreground mb-3" />
            <h4 className="font-bold mb-1">Chưa có thành viên</h4>
            <p className="text-xs text-muted-foreground">
              Chưa có học sinh nào đăng ký tham gia lớp học này bằng mã mời.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {students.map((enrollment) => (
              <div
                key={enrollment.id}
                className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-900 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                    {enrollment.user?.imageUrl ? (
                      <img src={enrollment.user.imageUrl} alt={enrollment.user.fullName || 'Student'} className="h-full w-full object-cover" />
                    ) : (
                      <GraduationCap className="text-muted-foreground" size={20} />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {enrollment.user?.fullName || 'Học sinh chưa đồng bộ'}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {enrollment.user?.email || 'N/A'}
                    </span>
                  </div>
                </div>

                {activeRole === 'teacher' && (
                  <button
                    onClick={() => handleRemoveStudentClick(enrollment.id, enrollment.user?.fullName || 'Học sinh')}
                    disabled={removeStudentMutation.isPending}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Xóa học sinh khỏi lớp"
                  >
                    <UserX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'invite' && activeRole === 'teacher' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm max-w-xl space-y-6">
          <div>
            <h3 className="text-base font-bold font-outfit mb-1">Mã mời học sinh tham gia lớp</h3>
            <p className="text-xs text-muted-foreground">
              Chia sẻ mã này với học sinh để họ có thể đăng ký tham gia lớp.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground">MÃ MỜI ĐANG HOẠT ĐỘNG</span>
              <span className="text-xl font-bold font-mono tracking-widest text-primary">
                {classroom.inviteCode}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInviteCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-100 rounded-lg text-xs font-semibold transition-all"
              >
                {copied ? <ClipboardCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Regenerate Action */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold mb-1">Tạo mã mời mới (Regenerate Invite Code)</h4>
              <p className="text-xs text-muted-foreground">
                Sau khi tạo mã mời mới, mã mời cũ sẽ vô hiệu lực ngay lập tức.
              </p>
            </div>
            <button
              onClick={() => regenerateCodeMutation.mutate()}
              disabled={regenerateCodeMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 hover:border-destructive text-destructive text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0"
            >
              <RefreshCw size={14} className={regenerateCodeMutation.isPending ? 'animate-spin' : ''} />
              <span>Đổi mã mới</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Date Formatter Helper
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Chưa set';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default ClassroomDetailPage;
