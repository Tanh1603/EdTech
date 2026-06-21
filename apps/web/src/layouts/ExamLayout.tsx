import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, LogOut } from 'lucide-react';

export const ExamLayout: React.FC = () => {
  const navigate = useNavigate();

  // Prevent back/unload and alert user when they try to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // standard browser behavior for warning
      return (e.returnValue = 'Bạn có chắc chắn muốn rời khỏi bài thi? Tiến trình làm bài sẽ không được lưu.');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Prevent navigation keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5 and Ctrl+R, etc.
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
        e.preventDefault();
        alert('Làm mới trang đã bị vô hiệu hóa để bảo vệ bài làm thi.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleExit = () => {
    const confirmExit = window.confirm(
      'CẢNH BÁO: Rời khỏi bài thi sẽ KHÔNG tự động nộp bài và bạn có thể bị mất điểm. Bạn vẫn muốn thoát?'
    );
    if (confirmExit) {
      navigate('/assessments');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-outfit select-none">
      {/* Locked Down Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide text-slate-300">
            CHẾ ĐỘ THI TẬP TRUNG (FOCUS MODE)
          </span>
        </div>

        {/* Warning Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs">
          <AlertTriangle size={14} />
          <span>Vui lòng không chuyển tab hoặc làm mới trang</span>
        </div>

        {/* Exit Button */}
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-900/50 text-slate-300 hover:text-red-400 rounded-xl text-xs font-semibold transition-all duration-200"
        >
          <LogOut size={14} />
          <span>Thoát phòng thi</span>
        </button>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.15),rgba(255,255,255,0))]">
        <div className="max-w-5xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
