import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchRoadmapDetail, 
  fetchRoadmapProgress, 
  completeRoadmapItem, 
  uncompleteRoadmapItem, 
  fetchNextRecommendedLesson,
  RoadmapItem 
} from '../../services/learning';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Circle, 
  Star, 
  Map, 
  CheckSquare, 
  AlertCircle
} from 'lucide-react';

export const RoadmapViewPage: React.FC = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const queryClient = useQueryClient();

  // 1. Fetch Roadmap Detail (includes items)
  const { data: roadmapResp, isLoading: isRoadmapLoading, error } = useQuery({
    queryKey: ['roadmapDetail', roadmapId],
    queryFn: () => fetchRoadmapDetail(roadmapId || ''),
    enabled: !!roadmapId,
  });
  const roadmap = roadmapResp?.data;
  const items = roadmap?.items || [];

  // 2. Fetch Progress Stats
  const { data: progressResp } = useQuery({
    queryKey: ['roadmapProgress', roadmapId],
    queryFn: () => fetchRoadmapProgress(roadmapId || ''),
    enabled: !!roadmapId,
  });
  const progress = progressResp?.data;

  // 3. Fetch Next recommended lesson suggestion
  const { data: nextLessonResp } = useQuery({
    queryKey: ['recommendedLesson'],
    queryFn: () => fetchNextRecommendedLesson(),
  });
  const recommendedStep = nextLessonResp?.data;

  // Mutations
  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      if (isCompleted) {
        return uncompleteRoadmapItem(itemId);
      } else {
        return completeRoadmapItem(itemId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmapDetail', roadmapId] });
      queryClient.invalidateQueries({ queryKey: ['roadmapProgress', roadmapId] });
      toast.success('Cập nhật tiến độ thành công!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi cập nhật: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  if (isRoadmapLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto space-y-4">
        <AlertCircle size={40} className="text-red-500 mx-auto" />
        <h3 className="text-lg font-bold">Lỗi tải lộ trình</h3>
        <p className="text-xs text-muted-foreground">Không tìm thấy lộ trình được yêu cầu.</p>
        <Link to="/learning/roadmap" className="inline-block px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Sort items by order number
  const sortedItems = [...items].sort((a, b) => a.orderNo - b.orderNo);

  const getRecommendedFlag = (item: RoadmapItem) => {
    if (!recommendedStep) return false;
    const itemTitle = item.title.toLowerCase();
    const recTitle = recommendedStep.title.toLowerCase();
    return itemTitle.includes(recTitle) || recTitle.includes(itemTitle);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link 
        to="/learning/roadmap"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Quay lại danh sách lộ trình</span>
      </Link>

      {/* Roadmap Header & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
        
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wide">
            <Map size={14} />
            <span>Lộ trình thích ứng</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold font-outfit tracking-tight">
            {roadmap.title}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Mục tiêu: {roadmap.targetGoal}
          </p>
        </div>

        {/* Progress Column */}
        {progress && (
          <div className="flex flex-col justify-center items-center p-4 bg-muted/30 rounded-xl border border-border/50 text-center space-y-2">
            <div className="relative flex items-center justify-center">
              {/* Circular progress display */}
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-muted" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="34" 
                  className="stroke-primary transition-all duration-500" 
                  strokeWidth="6" 
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - progress.progressPercent / 100)}
                />
              </svg>
              <span className="absolute text-sm font-extrabold font-outfit">{progress.progressPercent}%</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Hoàn thành các cột mốc</span>
              <span className="text-[10px] text-muted-foreground">{progress.completedItems} trên {progress.totalItems} mục tiêu</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation Alert */}
      {recommendedStep && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shrink-0">
            <Star size={18} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-amber-600 dark:text-amber-400 font-outfit flex items-center gap-1.5">
              <span>Đề xuất tiếp theo từ AI Tutor</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bạn nên học bài: <strong className="text-foreground font-semibold">"{recommendedStep.title}"</strong>.
              {recommendedStep.reason && ` Lý do: ${recommendedStep.reason}`}
            </p>
          </div>
        </div>
      )}

      {/* Vertical Timeline Checkpoints */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
          <CheckSquare size={18} className="text-primary" />
          <span>Danh sách công việc</span>
        </h3>

        {sortedItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Lộ trình học tập hiện chưa có cột mốc chi tiết nào.
          </div>
        ) : (
          <div className="relative pl-8 border-l border-border/80 ml-4 space-y-8 py-2">
            
            {sortedItems.map((item: RoadmapItem) => {
              const isRecommended = getRecommendedFlag(item);

              return (
                <div key={item.id} className="relative group">
                  
                  {/* Timeline bullet node */}
                  <span className={`absolute -left-[45px] top-1.5 h-6.5 w-6.5 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                    item.isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/15'
                      : isRecommended
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/15 ring-4 ring-amber-500/10'
                        : 'bg-card border-muted-foreground/40 text-muted-foreground'
                  }`}>
                    {item.isCompleted ? (
                      <CheckCircle2 size={14} className="stroke-[3]" />
                    ) : isRecommended ? (
                      <>
                        <Star size={12} className="fill-white" />
                        {/* Ping radar effect */}
                        <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-60 pointer-events-none" />
                      </>
                    ) : (
                      <Circle size={10} className="fill-muted-foreground/10" />
                    )}
                  </span>

                  {/* Card Container */}
                  <div className={`border rounded-2xl p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.isCompleted 
                      ? 'bg-emerald-500/[0.01] border-emerald-500/15 hover:border-emerald-500/30'
                      : isRecommended
                        ? 'bg-amber-500/[0.01] border-amber-500/25 hover:border-amber-500/40 ring-1 ring-amber-500/5'
                        : 'bg-card border-border hover:border-primary/20'
                  }`}>
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide bg-muted px-2 py-0.5 rounded">
                          Bước {item.orderNo}
                        </span>
                        {isRecommended && (
                          <span className="text-[9px] font-extrabold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            Đề xuất kế tiếp
                          </span>
                        )}
                      </div>
                      
                      <h4 className={`font-semibold text-sm transition-colors ${
                        item.isCompleted ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-85' : 'text-foreground'
                      }`}>
                        {item.title}
                      </h4>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Action toggle button */}
                    <button
                      disabled={toggleItemMutation.isPending}
                      onClick={() => toggleItemMutation.mutate({ itemId: item.id, isCompleted: item.isCompleted })}
                      className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow-sm border transition-all ${
                        item.isCompleted
                          ? 'bg-muted border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-muted-foreground'
                          : 'bg-primary border-primary hover:bg-primary/95 text-primary-foreground shadow-primary/10'
                      }`}
                    >
                      {item.isCompleted ? 'Đánh dấu chưa học' : 'Đã học xong'}
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

    </div>
  );
};

export default RoadmapViewPage;
