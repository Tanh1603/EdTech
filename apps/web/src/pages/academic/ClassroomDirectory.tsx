import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { fetchClassrooms, joinClassroom, Classroom } from '../../services/academic';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  GraduationCap, 
  Key, 
  Loader2,
  FolderLock,
  ChevronRight
} from 'lucide-react';

export const ClassroomDirectory: React.FC = () => {
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // Fetch Classrooms list
  const { data: classesResp, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClassrooms(),
  });

  const classrooms = classesResp?.data || [];

  // Join Classroom Mutation (Students)
  const joinMutation = useMutation({
    mutationFn: joinClassroom,
    onSuccess: (resp) => {
      const enrollment = resp.data;
      toast.success('Tham gia lớp học thành công!');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsJoinModalOpen(false);
      setInviteCode('');
      // Navigate to the joined classroom detail
      if (enrollment && enrollment.classId) {
        navigate(`/classes/${enrollment.classId}`);
      }
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tham gia lớp: ${error.message || 'Mã mời không tồn tại hoặc đã hết hạn'}`);
    }
  });

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Vui lòng nhập mã mời');
      return;
    }
    joinMutation.mutate(inviteCode.trim());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit tracking-tight">
            Danh sách Lớp học
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeRole === 'teacher'
              ? 'Vận hành và quản lý các lớp học trực tuyến đang hoạt động.'
              : 'Theo dõi các lớp học bạn đã tham gia.'}
          </p>
        </div>

        {activeRole === 'student' ? (
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Key size={18} />
            <span>Tham gia lớp bằng mã mời</span>
          </button>
        ) : (
          <Link
            to="/courses"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Tạo lớp học từ Khóa học</span>
          </Link>
        )}
      </div>

      {/* Classrooms Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <div className="h-8 bg-muted rounded w-full pt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl max-w-xl mx-auto">
          Có lỗi xảy ra khi tải danh sách lớp học. Vui lòng thử lại sau.
        </div>
      ) : classrooms.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto flex flex-col items-center">
          <FolderLock size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-base font-bold mb-1">Chưa tham gia lớp học nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {activeRole === 'student'
              ? 'Bạn hiện tại chưa đăng ký tham gia lớp học nào. Hãy liên hệ Giáo viên để lấy Mã mời và tham gia lớp học.'
              : 'Chưa có lớp học nào được khởi tạo. Bạn có thể vào Danh mục Khóa học để khởi tạo lớp mới.'}
          </p>
          {activeRole === 'student' && (
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-md"
            >
              Nhập mã mời ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom: Classroom) => (
            <div
              key={classroom.id}
              className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition-all duration-300 group"
            >
              <div>
                {/* Class Header info */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 flex items-center gap-1">
                    <GraduationCap size={12} />
                    <span>Lớp học</span>
                  </span>
                  
                  {activeRole === 'teacher' && (
                    <span className="text-[10px] text-muted-foreground font-semibold font-mono">
                      Mã: {classroom.inviteCode}
                    </span>
                  )}
                </div>

                {/* Class Details */}
                <div className="space-y-1">
                  <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors font-outfit">
                    {classroom.name}
                  </h3>
                  <span className="text-xs text-muted-foreground block line-clamp-1">
                    Khóa học: {classroom.course?.name || 'Môn học cơ bản'}
                  </span>
                </div>

                {/* Start Date */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/60 pt-4 mt-4">
                  <Calendar size={14} />
                  <span>Ngày bắt đầu: {formatDate(classroom.startAt)}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5">
                <Link
                  to={`/classes/${classroom.id}`}
                  className="w-full flex items-center justify-center gap-1 py-2.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary text-xs font-semibold text-foreground rounded-xl transition-all shadow-sm"
                >
                  <span>Vào phòng học</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Class Invite Code Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-xl font-bold font-outfit flex items-center gap-2">
                <Key className="text-primary" size={20} />
                <span>Nhập mã mời vào lớp</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mã mời gồm 6-8 ký tự được cung cấp bởi Giáo viên giảng dạy lớp đó.
              </p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mã mời lớp học *</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: MATH66"
                  className="w-full px-3.5 py-2.5 bg-muted/50 border border-input rounded-xl text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition-all"
                />
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-accent text-xs font-semibold rounded-xl transition-all border border-border"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={joinMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                >
                  {joinMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  <span>Vào lớp</span>
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
    month: 'long',
    day: 'numeric',
  });
};

export default ClassroomDirectory;
