import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCourseDetail, 
  fetchLessonsByCourse, 
  createLesson, 
  fetchClassrooms, 
  createClassroom,
  Classroom,
  Lesson
} from '../../services/academic';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Layers,
  Link as LinkIcon
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = (queryParams.get('tab') as 'lessons' | 'classrooms') || 'lessons';
  const shouldCreate = queryParams.get('create') === 'true';

  const [activeTab, setActiveTab] = useState<'lessons' | 'classrooms'>(defaultTab);

  // Modal States
  const [isLessModalOpen, setIsLessModalOpen] = useState(false);
  const [lessTitle, setLessTitle] = useState('');
  const [lessDesc, setLessDesc] = useState('');
  const [lessOrder, setLessOrder] = useState(1);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classStart, setClassStart] = useState('');
  const [classEnd, setClassEnd] = useState('');

  // Automatically trigger classroom creation modal if create=true query param is set
  useEffect(() => {
    if (shouldCreate && activeRole === 'teacher') {
      setIsClassModalOpen(true);
    }
  }, [shouldCreate, activeRole]);

  // 1. Fetch Course Detail
  const { data: courseResp, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetail(courseId || ''),
    enabled: !!courseId,
  });

  // 2. Fetch Lessons in this Course
  const { data: lessonsResp, isLoading: isLessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => fetchLessonsByCourse(courseId || ''),
    enabled: !!courseId,
  });

  // 3. Fetch Classrooms running this Course
  const { data: classroomsResp, isLoading: isClassesLoading } = useQuery({
    queryKey: ['classrooms', { courseId }],
    queryFn: () => fetchClassrooms({ courseId }),
    enabled: !!courseId,
  });

  const course = courseResp?.data;
  const lessons = lessonsResp?.data || [];
  const classrooms = classroomsResp?.data || [];

  // Create Lesson Mutation
  const createLessMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      toast.success('Tạo bài học mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setIsLessModalOpen(false);
      setLessTitle('');
      setLessDesc('');
      setLessOrder(lessons.length + 1);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo bài học: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // Create Classroom Mutation
  const createClassMutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: () => {
      toast.success('Tạo lớp học mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['classrooms', { courseId }] });
      setIsClassModalOpen(false);
      setClassName('');
      setClassStart('');
      setClassEnd('');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo lớp học: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  const handleCreateLessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessTitle.trim()) {
      toast.error('Tiêu đề bài học không được bỏ trống');
      return;
    }
    createLessMutation.mutate({
      courseId: courseId || '',
      title: lessTitle,
      description: lessDesc,
      orderNo: Number(lessOrder) || 1,
    });
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      toast.error('Tên lớp học không được bỏ trống');
      return;
    }
    createClassMutation.mutate({
      courseId: courseId || '',
      name: className,
      startAt: classStart || undefined,
      endAt: classEnd || undefined,
    });
  };

  if (isCourseLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto">
        Không tìm thấy thông tin khóa học yêu cầu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link 
        to="/courses"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh sách khóa học</span>
      </Link>

      {/* Course Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-1 h-32 rounded-xl bg-slate-900 border border-border overflow-hidden flex items-center justify-center shrink-0">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.name} className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={36} className="text-muted-foreground/60" />
          )}
        </div>
        
        <div className="md:col-span-3 space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight">
            {course.name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {course.description || 'Chưa có mô tả chi tiết cho môn học này.'}
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all font-outfit ${
              activeTab === 'lessons'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Bài học ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('classrooms')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all font-outfit ${
              activeTab === 'classrooms'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Lớp học ({classrooms.length})
          </button>
        </div>

        {/* Action Button depending on tab */}
        {activeRole === 'teacher' && (
          <button
            onClick={() => activeTab === 'lessons' ? setIsLessModalOpen(true) : setIsClassModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground text-xs font-semibold rounded-xl transition-all mb-2"
          >
            <Plus size={14} />
            <span>Thêm {activeTab === 'lessons' ? 'bài học' : 'lớp học'}</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'lessons' ? (
        isLessonsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-lg mx-auto flex flex-col items-center">
            <Layers size={40} className="text-muted-foreground mb-3" />
            <h4 className="font-bold mb-1">Chưa có bài học</h4>
            <p className="text-xs text-muted-foreground">
              Khóa học này hiện chưa được giáo viên đăng tải bài học nào.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson: Lesson) => (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
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
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {lesson.description || 'Chưa có tóm tắt nội dung bài học.'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Vào bài học</span>
                  <ArrowLeft size={12} className="rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        isClassesLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-lg mx-auto flex flex-col items-center">
            <Calendar size={40} className="text-muted-foreground mb-3" />
            <h4 className="font-bold mb-1">Chưa có lớp học</h4>
            <p className="text-xs text-muted-foreground">
              Khóa học này hiện chưa được vận hành trong lớp học cụ thể nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((classroom: Classroom) => (
              <div
                key={classroom.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-sm mb-2">{classroom.name}</h4>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>Bắt đầu: {formatDate(classroom.startAt)}</span>
                    </div>
                    {activeRole === 'teacher' && (
                      <div className="flex items-center gap-1.5">
                        <LinkIcon size={14} />
                        <span>Mã mời: <code className="font-mono bg-muted px-1.5 py-0.5 rounded font-bold text-primary">{classroom.inviteCode}</code></span>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  to={`/classes/${classroom.id}`}
                  className="mt-4 flex items-center justify-center gap-1 py-2 bg-muted hover:bg-primary/10 border border-border hover:border-primary/20 text-xs font-semibold text-muted-foreground hover:text-primary rounded-xl transition-all"
                >
                  <span>Quản lý lớp học</span>
                  <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Lesson Modal */}
      {isLessModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-xl font-bold font-outfit">Thêm bài học mới</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thiết lập bài soạn thảo mới nằm trong khóa học.
              </p>
            </div>

            <form onSubmit={handleCreateLessSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  value={lessTitle}
                  onChange={(e) => setLessTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 1 - Giới thiệu về JSX"
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mô tả tóm tắt</label>
                <textarea
                  value={lessDesc}
                  onChange={(e) => setLessDesc(e.target.value)}
                  placeholder="Viết tóm tắt nội dung bài học..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Thứ tự hiển thị (Số thứ tự)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lessOrder}
                  onChange={(e) => setLessOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
              </div>

              {/* Modal buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsLessModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-accent text-xs font-semibold rounded-xl transition-all border border-border"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLessMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md"
                >
                  {createLessMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  <span>Tạo bài học</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Classroom Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-xl font-bold font-outfit">Tạo lớp học mới</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thiết lập phòng học thực tế từ giáo trình khóa học này.
              </p>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: K66 - ReactJS lớp sáng"
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={classStart}
                    onChange={(e) => setClassStart(e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={classEnd}
                    onChange={(e) => setClassEnd(e.target.value)}
                    className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                  />
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-accent text-xs font-semibold rounded-xl transition-all border border-border"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createClassMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md"
                >
                  {createClassMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  <span>Tạo lớp học</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Utility function to format dates
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Chưa set';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default CourseDetailPage;
