import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="flex flex-col items-center max-w-md p-8 bg-card border border-border rounded-2xl shadow-xl"
      >
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6 animate-pulse">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-bold font-outfit mb-3">
          Không có quyền truy cập
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Tài khoản của bạn với vai trò hiển thị hiện tại không có quyền truy cập trang này. Vui lòng thử chuyển đổi vai trò ở Header hoặc quay lại trang chủ.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-all w-full shadow-md shadow-primary/20"
        >
          <ArrowLeft size={16} />
          <span>Quay lại trang chủ</span>
        </button>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
