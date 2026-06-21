import React, { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLessonDetail } from '../../services/academic';
import { fetchMaterials, createMaterial, uploadFile, Material } from '../../services/learning';
import { 
  ArrowLeft, 
  Loader2, 
  BookOpen, 
  Layers, 
  FileText, 
  UploadCloud,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Lesson Detail
  const { data: lessonResp, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLessonDetail(lessonId || ''),
    enabled: !!lessonId,
  });

  const lesson = lessonResp?.data;

  // 2. Fetch Lesson Materials (with polling for RAG index status)
  const { data: materialsResp, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['materials', lessonId],
    queryFn: () => fetchMaterials({ lessonId: lessonId || '' }),
    enabled: !!lessonId,
    refetchInterval: (query) => {
      const items = query.state.data?.data || [];
      const hasIndexing = items.some(item => item.status === 'uploaded' || item.status === 'indexing');
      return hasIndexing ? 3000 : false;
    }
  });

  const materials = materialsResp?.data || [];

  // 3. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResp = await uploadFile(formData);
      if (!uploadResp.success || !uploadResp.data) {
        throw new Error('Upload thất bại');
      }

      const { storageUrl, publicId, mimeType, size } = uploadResp.data;

      return createMaterial({
        lessonId: lessonId || '',
        title: file.name,
        storageUrl,
        publicId,
        mimeType,
        size
      });
    },
    onSuccess: () => {
      toast.success('Tải lên tài liệu thành công! AI đang lập chỉ mục RAG.');
      queryClient.invalidateQueries({ queryKey: ['materials', lessonId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tải lên: ${error.message || 'Không thể tải tài liệu lên'}`);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: Material['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full mt-2 w-max uppercase tracking-wider">
            <CheckCircle2 size={10} />
            <span>Sẵn sàng (RAG Ready)</span>
          </span>
        );
      case 'indexing':
      case 'uploaded':
        return (
          <span className="flex items-center gap-1 text-[9px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full mt-2 w-max uppercase tracking-wider animate-pulse">
            <Loader2 size={10} className="animate-spin" />
            <span>Đang chỉ mục RAG...</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[9px] text-red-500 font-semibold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full mt-2 w-max uppercase tracking-wider">
            <XCircle size={10} />
            <span>Lỗi RAG</span>
          </span>
        );
      default:
        return null;
    }
  };

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

      {/* Study Materials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <span>Tài liệu học tập đính kèm</span>
          </h3>

          {/* Teacher Upload Option */}
          {activeRole === 'teacher' && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                disabled={isUploading}
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
              />
              <button
                disabled={isUploading}
                onClick={handleUploadClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UploadCloud size={14} />
                )}
                <span>{isUploading ? 'Đang tải lên...' : 'Tải lên tài liệu mới'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Files Panel */}
        {isMaterialsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : materials.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl text-xs text-muted-foreground">
            Chưa có tài liệu đính kèm cho bài học này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((file: Material) => (
              <div 
                key={file.id} 
                className="bg-card border border-border hover:border-primary/20 rounded-xl p-5 flex items-start justify-between shadow-sm hover:shadow transition-all group"
              >
                <div className="flex gap-4 min-w-0">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {file.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'} • {formatBytes(file.size)}
                    </span>
                    {getStatusBadge(file.status)}
                  </div>
                </div>

                <a
                  href={file.storageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border rounded-lg text-muted-foreground transition-all shrink-0 ml-3"
                  title="Tải về"
                >
                  <Download size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetailPage;
