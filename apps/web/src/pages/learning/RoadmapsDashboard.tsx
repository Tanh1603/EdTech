import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchRoadmaps, createRoadmap, fetchRoadmapProgress, Roadmap } from '../../services/learning';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  Map, 
  Loader2, 
  Calendar, 
  ArrowRight
} from 'lucide-react';

// Subcomponent to fetch and render progress details for each roadmap card
const RoadmapProgressBadge: React.FC<{ roadmapId: string }> = ({ roadmapId }) => {
  const { data: progressResp } = useQuery({
    queryKey: ['roadmapProgress', roadmapId],
    queryFn: () => fetchRoadmapProgress(roadmapId),
  });

  const progress = progressResp?.data;

  if (!progress) {
    return <div className="h-4 w-12 bg-muted animate-pulse rounded" />;
  }

  return (
    <div className="space-y-1.5 w-full mt-4">
      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
        <span>Tiến độ học tập</span>
        <span>{progress.completedItems}/{progress.totalItems} bài ({progress.progressPercent}%)</span>
      </div>
      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-primary to-violet-500 h-full rounded-full transition-all duration-500" 
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export const RoadmapsDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetGoal, setTargetGoal] = useState('');

  // 1. Fetch Student Roadmaps
  const { data: roadmapsResp, isLoading } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: () => fetchRoadmaps(),
  });
  const roadmaps = roadmapsResp?.data || [];

  // 2. Create Roadmap Mutation
  const createMutation = useMutation({
    mutationFn: createRoadmap,
    onSuccess: () => {
      toast.success('Gửi yêu cầu tới AI thành công! Lộ trình đang được khởi tạo.');
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      setIsModalOpen(false);
      setTitle('');
      setTargetGoal('');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo lộ trình: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetGoal.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      targetGoal: targetGoal.trim()
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 relative min-h-[80vh]">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Lộ trình học tập cá nhân (Adaptive Roadmaps)
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Yêu cầu trợ lý AI tạo bản đồ bài học chi tiết dựa trên nhu cầu học và năng lực thực tế của bạn.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-xs shadow-md shadow-primary/10 transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} />
          <span>Yêu cầu lộ trình mới</span>
        </button>
      </div>

      {/* Main List Workspace */}
      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-3xl bg-card flex flex-col items-center max-w-2xl mx-auto mt-8">
          <div className="p-4 bg-primary/10 text-primary rounded-full mb-4">
            <Map size={36} />
          </div>
          <h3 className="text-lg font-bold mb-2">Chưa có lộ trình học tập cá nhân</h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-6">
            Lộ trình cá nhân sẽ giúp bạn định hướng mục tiêu học tập, kết nối trực tiếp với các bài kiểm tra năng lực và hệ thống bài học thích hợp.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-primary/10"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Tạo lộ trình AI đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmaps.map((roadmap: Roadmap) => (
            <Link
              key={roadmap.id}
              to={`/learning/roadmap/${roadmap.id}`}
              className="bg-card border border-border hover:border-primary/30 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <span className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Map size={18} />
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar size={12} />
                    <span>{formatDate(roadmap.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {roadmap.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    Mục tiêu: {roadmap.targetGoal}
                  </p>
                </div>
              </div>

              <div>
                {/* Progress bar and metadata */}
                <RoadmapProgressBadge roadmapId={roadmap.id} />
                
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-4 pt-3 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Vào học</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Premium Create Roadmap Modal Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!createMutation.isPending) setIsModalOpen(false);
              }}
              className="fixed inset-0 bg-black"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl z-10 flex flex-col"
            >
              {createMutation.isPending && (
                <div className="absolute inset-0 bg-card/85 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="animate-spin text-primary" size={44} />
                    <Sparkles className="absolute -top-1 -right-1 text-amber-500 animate-pulse" size={16} />
                  </div>
                  <h4 className="font-extrabold font-outfit text-sm">AI đang khởi tạo lộ trình cá nhân...</h4>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Hệ thống đang phân tích mục tiêu học tập và thiết lập sơ đồ cây kiến thức bài giảng thích hợp nhất. Vui lòng đợi trong giây lát.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={18} />
                  <span>Yêu cầu Lộ trình AI</span>
                </h3>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tên lộ trình (Ví dụ: React.js Advanced)</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên khóa học/chủ đề chính mong muốn"
                    className="px-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Mục tiêu học tập cụ thể</label>
                  <textarea
                    required
                    rows={4}
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    placeholder="Hãy mô tả chi tiết: Trình độ hiện tại, mục tiêu cần đạt, và thời gian bạn muốn dành để học tập (ví dụ: tôi muốn nắm vững React Query, custom hooks và SSR trong vòng 4 tuần để làm dự án)."
                    className="px-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 hover:bg-muted border border-border text-muted-foreground text-xs font-semibold rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapsDashboard;
