import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchLessonDetail } from '../../services/academic';
import { 
  ArrowLeft, 
  Loader2, 
  BookOpen, 
  Layers, 
  FileText, 
  UploadCloud 
} from 'lucide-react';
import { useAuthStore } from '../../state/useAuthStore';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { activeRole } = useAuthStore();

  // Fetch Lesson Detail
  const { data: lessonResp, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLessonDetail(lessonId || ''),
    enabled: !!lessonId,
  });

  const lesson = lessonResp?.data;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-xl mx-auto">
        Không tìm thấy thông tin bài học yêu cầu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to course detail */}
      <Link 
        to={`/courses/${lesson.courseId}`}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Quay lại chi tiết khóa học</span>
      </Link>

      {/* Lesson Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wide">
          <BookOpen size={14} />
          <span>Bài giảng {lesson.orderNo}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight">
          {lesson.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lesson.description || 'Chưa có tóm tắt học thuật chi tiết cho bài giảng này.'}
        </p>
      </div>

      {/* Study Materials Section (Adapted in Phase 3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <span>Tài liệu học tập đính kèm</span>
          </h3>

          {/* Teacher Upload Option (Triggered in Phase 3) */}
          {activeRole === 'teacher' && (
            <button
              onClick={() => Link} // placeholder click
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border hover:border-primary/20 text-muted-foreground hover:text-primary rounded-xl text-xs font-semibold transition-all"
            >
              <UploadCloud size={14} />
              <span>Tải lên tài liệu mới</span>
            </button>
          )}
        </div>

        {/* Placeholder files panel (Will be populated by actual API files in Phase 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Study Guide PDF placeholder */}
          <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between shadow-sm hover:shadow transition-all group">
            <div className="flex gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Giáo trình bài học PDF
                </span>
                <span className="text-[10px] text-muted-foreground">PDF Document • 4.2 MB</span>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full mt-2 w-max uppercase tracking-wider">
                  Sẵn sàng (RAG Ready)
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Slide lecture placeholder */}
          <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between shadow-sm hover:shadow transition-all group">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Slide bài giảng Powerpoint
                </span>
                <span className="text-[10px] text-muted-foreground">PPTX Document • 12.8 MB</span>
                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full mt-2 w-max uppercase tracking-wider">
                  Sẵn sàng (RAG Ready)
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage;
