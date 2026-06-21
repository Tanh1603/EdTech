import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../lib/api-client';
import { toast } from 'sonner';
import { useUIStore } from '../state/useUIStore';
import { 
  Play, 
  RefreshCw, 
  Terminal, 
  Users, 
  Clock, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react';

export const DashboardPlaceholder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeRole } = useUIStore();

  const handleTestApiCall = async (status: number) => {
    toast.promise(
      // We call a mock or non-existent endpoint to verify interceptors
      // Under backend gateway, it might return 404 or we can specify status code if we have a test route.
      // But since we want to test client side response, we can just trigger a call to /api/test/error-status
      apiClient.get(`/test/error?status=${status}`),
      {
        loading: 'Đang gửi yêu cầu kiểm tra...',
        success: 'Gọi API thành công!',
        error: (err: { status?: number; message?: string }) => {
          return `Lỗi HTTP ${err.status || 'mạng'}: ${err.message || 'Có lỗi xảy ra'}`;
        }
      }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-violet-600 p-6 md:p-8 text-white shadow-lg"
      >
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold font-outfit mb-2">
            Chào mừng bạn đến với EdTech AI Platform!
          </h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Hệ thống quản lý học tập thông minh tích hợp trí tuệ nhân tạo.
            Bạn đang truy cập với vai trò <span className="font-bold underline capitalize">{activeRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span>.
          </p>
        </div>
        
        {/* Animated background shape */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
      </motion.div>

      {/* Path info and debug card */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Route Details Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-outfit mb-4 flex items-center gap-2">
              <Terminal size={18} className="text-primary" />
              <span>Thông tin định tuyến</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Đường dẫn hiện tại:</span>
                <code className="font-semibold text-primary">{location.pathname}</code>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Vai trò hiển thị:</span>
                <span className="font-semibold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-muted">
                  {activeRole}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Layout tự động điều chỉnh danh mục Sidebar menu dựa trên vai trò đang chọn ở Header.
          </p>
        </div>

        {/* API Error Interceptor Testing */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-base font-bold font-outfit mb-3 flex items-center gap-2">
            <RefreshCw size={18} className="text-primary" />
            <span>Kiểm thử Axios Interceptors & Sonner Toasts</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Nhấn các nút bên dưới để mô phỏng phản hồi lỗi từ máy chủ. Axios client sẽ tự động bắt lỗi qua interceptors và hiển thị thông báo toast thích hợp.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleTestApiCall(403)}
              className="px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-border text-xs font-semibold rounded-xl transition-all duration-200"
            >
              Lỗi 403 (Forbidden)
            </button>
            <button
              onClick={() => handleTestApiCall(404)}
              className="px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-border text-xs font-semibold rounded-xl transition-all duration-200"
            >
              Lỗi 404 (Not Found)
            </button>
            <button
              onClick={() => handleTestApiCall(429)}
              className="px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-border text-xs font-semibold rounded-xl transition-all duration-200"
            >
              Lỗi 429 (Rate Limit)
            </button>
            <button
              onClick={() => handleTestApiCall(500)}
              className="px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-border text-xs font-semibold rounded-xl transition-all duration-200"
            >
              Lỗi 500 (Internal Error)
            </button>
          </div>
        </div>

      </motion.div>

      {/* Focus mode navigation */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold font-outfit mb-1 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <span>Chế độ kiểm tra (Exam Runner Layout)</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Nhấn vào nút bên dưới để thử nghiệm giao diện làm bài thi toàn màn hình. Layout này sẽ ẩn toàn bộ thanh điều hướng sidebar và bật cảnh báo an toàn ngăn rời khỏi phòng thi.
            </p>
          </div>
          <button
            onClick={() => navigate('/assessments/exam/test-exam-123')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 font-semibold text-sm rounded-xl shadow-md transition-all shrink-0"
          >
            <Play size={16} fill="white" />
            <span>Vào phòng thi thử</span>
          </button>
        </div>
      </motion.div>

      {/* Simple stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">24</div>
            <div className="text-xs text-muted-foreground">Học sinh tích cực</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">12</div>
            <div className="text-xs text-muted-foreground">Khóa học xuất bản</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">124 giờ</div>
            <div className="text-xs text-muted-foreground">Thời gian học tháng này</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
export default DashboardPlaceholder;
