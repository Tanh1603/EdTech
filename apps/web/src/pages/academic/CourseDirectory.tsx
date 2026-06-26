import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCourses, createCourse, Course } from '../../services/academic';
import { useAuthStore } from '../../state/useAuthStore';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  BookOpen, 
  GraduationCap, 
  ArrowRight,
  Loader2,
  FolderOpen
} from 'lucide-react';

export const CourseDirectory: React.FC = () => {
  const { activeRole } = useAuthStore();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseThumb, setNewCourseThumb] = useState('');

  // Fetch Courses with React Query
  const { data: coursesResp, isLoading, error } = useQuery({
    queryKey: ['courses', { search: searchTerm }],
    queryFn: () => fetchCourses({ search: searchTerm }),
  });

  const courses = coursesResp?.data || [];

  // Create Course Mutation
  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success('Tạo khóa học mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreateModalOpen(false);
      // Reset form
      setNewCourseName('');
      setNewCourseDesc('');
      setNewCourseThumb('');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo khóa học: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) {
      toast.error('Tên khóa học không được bỏ trống');
      return;
    }
    createMutation.mutate({
      name: newCourseName,
      description: newCourseDesc,
      thumbnailUrl: newCourseThumb || undefined,
      teacherId: user?.id || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit tracking-tight">
            Danh mục Khóa học
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeRole === 'teacher' 
              ? 'Quản lý, chỉnh sửa giáo trình và cấu trúc các khóa học.'
              : 'Tra cứu giáo trình các môn học có trong hệ thống.'}
          </p>
        </div>

        {activeRole === 'teacher' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Tạo khóa học mới</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center relative max-w-md">
        <Search className="absolute left-3.5 text-muted-foreground" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm tên khóa học..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-40 bg-muted rounded-xl" />
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl max-w-xl mx-auto">
          Có lỗi xảy ra khi tải danh sách khóa học. Vui lòng thử lại sau.
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto flex flex-col items-center">
          <FolderOpen size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-base font-bold mb-1">Không tìm thấy khóa học</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Hiện tại chưa có khóa học nào được đăng tải trên hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: Course) => (
            <div 
              key={course.id}
              className="bg-card border border-border hover:border-primary/40 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <Link to={`/courses/${course.id}`}>
                {/* Course Thumbnail */}
                <div className="h-44 bg-slate-900 border-b border-border relative overflow-hidden flex items-center justify-center">
                  {course.thumbnailUrl ? (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/60">
                      <BookOpen size={40} className="mb-2" />
                      <span className="text-xs">Không có hình ảnh</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur text-[10px] font-semibold text-slate-300 flex items-center gap-1 border border-slate-800">
                    <GraduationCap size={12} />
                    <span>LMS Core</span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors font-outfit text-foreground">
                    {course.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {course.description || 'Chưa có mô tả chi tiết cho môn học này.'}
                  </p>
                </div>
              </Link>

              {/* Course Footer button */}
              <div className="p-5 pt-0">
                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4 mt-2">
                  <Link 
                    to={`/courses/${course.id}`}
                    className="flex-1 flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Chi tiết giáo trình</span>
                    <ArrowRight size={14} />
                  </Link>

                  {activeRole === 'teacher' && (
                    <Link
                      to={`/courses/${course.id}?tab=classrooms&create=true`}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-xl text-[11px] font-semibold transition-all shrink-0"
                    >
                      Tạo lớp học
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-xl font-bold font-outfit">Tạo khóa học mới</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cung cấp các thông tin cơ bản để bắt đầu soạn thảo bài học.
              </p>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tên khóa học *</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Ví dụ: Lập trình React căn bản"
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mô tả chi tiết</label>
                <textarea
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Viết tóm tắt nội dung môn học..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Thumbnail Image URL</label>
                <input
                  type="url"
                  value={newCourseThumb}
                  onChange={(e) => setNewCourseThumb(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-accent text-xs font-semibold rounded-xl transition-all border border-border"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  <span>Xác nhận tạo</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CourseDirectory;
