import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyMastery, fetchMyMasteryAnalytics, fetchRiskStudents, TopicMastery, RiskStudent } from '../../services/learning';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { 
  Loader2, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  User, 
  Mail, 
  ArrowRight,
  ShieldAlert,
  Percent,
  Bookmark
} from 'lucide-react';

// Custom SVG Radar Chart component to avoid external dependency issues on React 19
const CustomRadarChart: React.FC<{ data: TopicMastery[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const N = data.length;
  const cx = 160;
  const cy = 160;
  const rMax = 110;

  // Compute angles for each vertex
  const angles = Array.from({ length: N }, (_, i) => (i * 2 * Math.PI) / N - Math.PI / 2);

  // Concentric grid polygon points (e.g., 25%, 50%, 75%, 100%)
  const grids = [0.25, 0.5, 0.75, 1.0];

  const getPolygonPoints = (scale: number) => {
    return angles
      .map((angle) => {
        const x = cx + rMax * scale * Math.cos(angle);
        const y = cy + rMax * scale * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Data polygon points mapping masteryScore
  const dataPoints = angles.map((angle, i) => {
    const score = Math.max(0, Math.min(1, data[i].masteryScore));
    const x = cx + rMax * score * Math.cos(angle);
    const y = cy + rMax * score * Math.sin(angle);
    return { x, y, score, label: data[i].topic };
  });

  const dataPolygonString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative flex justify-center items-center p-4">
      <svg width="340" height="340" className="max-w-full">
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
          </radialGradient>
        </defs>

        {/* Draw grid lines */}
        {grids.map((g, idx) => (
          <polygon
            key={idx}
            points={getPolygonPoints(g)}
            fill="none"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth="1"
          />
        ))}

        {/* Draw grid labels for values (0.5, 1.0) */}
        <text x={cx + 5} y={cy - rMax * 0.5} className="fill-muted-foreground/60 text-[8px] font-semibold">0.5</text>
        <text x={cx + 5} y={cy - rMax * 1.0} className="fill-muted-foreground/60 text-[8px] font-semibold">1.0</text>

        {/* Draw axes (spokes) */}
        {angles.map((angle, i) => {
          const x = cx + rMax * Math.cos(angle);
          const y = cy + rMax * Math.sin(angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* Draw values polygon */}
        <polygon
          points={dataPolygonString}
          fill="url(#radarGrad)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="drop-shadow-[0_2px_8px_rgba(var(--primary),0.3)]"
        />

        {/* Draw vertex dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            className={p.score < 0.5 ? 'fill-red-500 stroke-card' : 'fill-primary stroke-card'}
            strokeWidth="1.5"
          />
        ))}

        {/* Draw vertex labels */}
        {angles.map((angle, i) => {
          const x = cx + (rMax + 20) * Math.cos(angle);
          const y = cy + (rMax + 10) * Math.sin(angle);
          
          // Adjust text alignment anchor based on angle quadrant
          let textAnchor: 'inherit' | 'end' | 'middle' | 'start' = 'middle';
          if (Math.cos(angle) > 0.1) textAnchor = 'start';
          if (Math.cos(angle) < -0.1) textAnchor = 'end';

          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              textAnchor={textAnchor}
              className="fill-foreground text-[10px] font-bold font-outfit"
            >
              {data[i].topic}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const TopicMasteryPage: React.FC = () => {
  const { activeRole } = useAuthStore();

  // 1. Fetch Mastery scores (Student)
  const { data: masteryResp, isLoading: isMasteryLoading } = useQuery({
    queryKey: ['myMastery'],
    queryFn: () => fetchMyMastery(),
    enabled: activeRole === 'student',
  });
  const myMastery = masteryResp?.data || [];

  // 2. Fetch Mastery Analytics (Student)
  const { data: analyticsResp, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['masteryAnalytics'],
    queryFn: () => fetchMyMasteryAnalytics(),
    enabled: activeRole === 'student',
  });
  const analytics = analyticsResp?.data;

  // 3. Fetch Risk Students list (Teacher)
  const { data: riskResp, isLoading: isRiskLoading } = useQuery({
    queryKey: ['riskStudents'],
    queryFn: () => fetchRiskStudents(),
    enabled: activeRole === 'teacher',
  });
  const riskStudents = riskResp?.data || [];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          {activeRole === 'teacher' ? 'Theo dõi năng lực lớp học' : 'Năng lực học tập (Topic Mastery)'}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {activeRole === 'teacher'
            ? 'Theo dõi mức độ thành thạo và cảnh báo nguy cơ học yếu của học sinh trong lớp.'
            : 'Đánh giá mức độ thông hiểu các chủ đề kiến thức học thuật dựa trên lịch sử kiểm tra.'
          }
        </p>
      </div>

      {activeRole === 'student' ? (
        // STUDENT DASHBOARD VIEW
        isMasteryLoading || isAnalyticsLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : myMastery.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-border rounded-3xl bg-card max-w-xl mx-auto flex flex-col items-center">
            <Award size={36} className="text-muted-foreground mb-3 opacity-60" />
            <h3 className="font-bold mb-1">Chưa có dữ liệu năng lực</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Dữ liệu năng lực sẽ tự động xuất hiện sau khi bạn hoàn thành các bài thi hoặc bài tập đánh giá năng lực từ giáo viên.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Radar Chart (Left 2 columns) */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <span>Bản đồ năng lực chủ đề</span>
              </h3>
              
              <CustomRadarChart data={myMastery} />

              <p className="text-[10px] text-center text-muted-foreground max-w-md mx-auto mt-4 leading-relaxed">
                * Chỉ số mastery từ 0.0 đến 1.0 (1.0 tương đương hoàn toàn thành thạo chủ đề).
              </p>
            </div>

            {/* Stats Summary (Right Column) */}
            <div className="space-y-6">
              
              {/* Average Mastery Score Card */}
              {analytics && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Độ thành thạo TB</span>
                    <span className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Percent size={16} />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-outfit text-primary">
                      {Math.round(analytics.averageMastery * 100)}%
                    </span>
                    <span className="text-[11px] text-muted-foreground">Mastery Score</span>
                  </div>
                </div>
              )}

              {/* Strongest and Weakest List */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                
                {/* Strongest */}
                {analytics && analytics.strongestTopics.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span>Chủ đề vững nhất</span>
                    </h4>
                    <div className="space-y-1.5">
                      {analytics.strongestTopics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <Bookmark size={12} className="fill-current" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weakest */}
                {analytics && analytics.weakestTopics.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown size={14} className="text-red-500" />
                      <span>Chủ đề cần cải thiện</span>
                    </h4>
                    <div className="space-y-1.5">
                      {analytics.weakestTopics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
                          <AlertTriangle size={12} className="fill-current" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )
      ) : (
        // TEACHER RISK STUDENTS VIEW
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" />
            <span>Danh sách học sinh học yếu (Risk Alert)</span>
          </h3>

          {isRiskLoading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : riskStudents.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl flex flex-col items-center">
              <Award size={36} className="text-emerald-500 mb-3 bg-emerald-500/10 p-2 rounded-full" />
              <h4 className="font-bold mb-1 text-sm">Lớp học phát triển rất tốt</h4>
              <p className="text-xs text-muted-foreground">Hiện tại không ghi nhận học sinh nào có chỉ số năng lực đáng báo động.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskStudents.map((student: RiskStudent) => (
                <div 
                  key={student.userId}
                  className="bg-card border border-red-500/20 hover:border-red-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all"
                >
                  <div className="flex gap-4">
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl shrink-0 h-max">
                      <User size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{student.fullName}</span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Mail size={10} />
                        <span>{student.email}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-[10px] font-bold text-red-600 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Độ thấu hiểu TB: {Math.round(student.averageMastery * 100)}%
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Chủ đề yếu nhất: {student.weakestTopic}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 pt-3 border-t border-border/50">
                    <button 
                      onClick={() => toast.info('Đã gửi thông báo nhắc nhở học sinh này!')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] rounded-lg shadow transition-colors uppercase tracking-wider"
                    >
                      <span>Hỗ trợ học tập</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TopicMasteryPage;
