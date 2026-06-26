import React, { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLessonDetail } from '../../services/academic';
import { fetchMaterials, createMaterial, uploadFile, Material, generateMaterialSummary } from '../../services/learning';
import { 
  ArrowLeft, 
  Loader2, 
  BookOpen, 
  Layers, 
  FileText, 
  UploadCloud,
  CheckCircle2,
  XCircle,
  Download,
  Sparkles,
  X
} from 'lucide-react';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const renderInlineMarkdown = (text: string) => {
  let parts: (string | React.ReactNode)[] = [text];

  // Bold **text**
  parts = parts.flatMap((part) => {
    if (typeof part !== 'string') return part;
    const regex = /\*\*([\s\S]*?)\*\*/g;
    const split = part.split(regex);
    return split.map((chunk, i) => (i % 2 === 1 ? <strong key={i} className="font-extrabold text-foreground">{chunk}</strong> : chunk));
  });

  // Inline code `code`
  parts = parts.flatMap((part) => {
    if (typeof part !== 'string') return part;
    const regex = /`([^`]+)`/g;
    const split = part.split(regex);
    return split.map((chunk, i) => (i % 2 === 1 ? <code key={i} className="px-1.5 py-0.5 bg-muted text-violet-500 rounded text-xs font-mono">{chunk}</code> : chunk));
  });

  return parts;
};

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground/90">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc pl-5 my-1 space-y-1">
              <li className="text-xs md:text-sm">{renderInlineMarkdown(trimmed.substring(2))}</li>
            </ul>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-extrabold font-outfit mt-4 mb-1.5 text-foreground flex items-center gap-1.5">
              {renderInlineMarkdown(trimmed.substring(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base font-extrabold font-outfit mt-5 mb-2 text-foreground flex items-center gap-1.5 border-b border-border/50 pb-1">
              {renderInlineMarkdown(trimmed.substring(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg font-extrabold font-outfit mt-6 mb-3 text-foreground border-b border-border pb-1.5">
              {renderInlineMarkdown(trimmed.substring(2))}
            </h2>
          );
        }
        return (
          <p key={idx} className={trimmed ? 'min-h-[1rem]' : 'h-2'}>
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeSummaryMaterialId, setActiveSummaryMaterialId] = useState<string | null>(null);
  const [waitingForSummaryIds, setWaitingForSummaryIds] = useState<string[]>([]);

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
      const isWaitingForAnySummary = items.some(item => item.status === 'ready' && !item.summary && waitingForSummaryIds.includes(item.id));
      return (hasIndexing || isWaitingForAnySummary) ? 3000 : false;
    }
  });

  const materials = materialsResp?.data || [];

  // Cleanup completed summary IDs from waiting list
  React.useEffect(() => {
    if (materials.length > 0 && waitingForSummaryIds.length > 0) {
      const stillWaiting = waitingForSummaryIds.filter(id => {
        const mat = materials.find(m => m.id === id);
        return mat && !mat.summary;
      });
      if (stillWaiting.length !== waitingForSummaryIds.length) {
        setWaitingForSummaryIds(stillWaiting);
      }
    }
  }, [materials, waitingForSummaryIds]);

  // Generate Summary Mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const resp = await generateMaterialSummary(materialId);
      if (!resp.success) {
        throw new Error('Không thể tạo yêu cầu tóm tắt tài liệu');
      }
      return materialId;
    },
    onSuccess: (materialId) => {
      toast.success('Đã gửi yêu cầu tóm tắt tới AI. Tiến trình tóm tắt bắt đầu...');
      setWaitingForSummaryIds(prev => [...prev, materialId]);
      queryClient.invalidateQueries({ queryKey: ['materials', lessonId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo tóm tắt: ${error.message || 'Không thể bắt đầu tóm tắt'}`);
    }
  });

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

      const data = uploadResp.data as any;
      const storageUrl = data.storageUrl || data.secure_url || data.url;
      const publicId = data.publicId || data.public_id;
      const mimeType = data.mimeType || file.type;
      const size = data.size || data.bytes || file.size;

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

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {file.status === 'ready' && (
                    <button
                      onClick={() => setActiveSummaryMaterialId(file.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20 rounded-lg hover:bg-violet-500 hover:text-white transition-all duration-200"
                      title="Xem tóm tắt AI"
                    >
                      <Sparkles size={12} />
                      <span>Tóm tắt AI</span>
                    </button>
                  )}
                  <a
                    href={file.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border rounded-lg text-muted-foreground transition-all"
                    title="Tải về"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        {/* AI Summary Modal */}
      <AnimatePresence>
        {activeSummaryMaterialId && (
          (() => {
            const selectedMaterial = materials.find(m => m.id === activeSummaryMaterialId);
            if (!selectedMaterial) return null;
            const isGeneratingSummary = waitingForSummaryIds.includes(activeSummaryMaterialId);

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveSummaryMaterialId(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                  className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl z-10 flex flex-col max-h-[85vh]"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-violet-500/10 text-violet-500 rounded-lg shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold font-outfit text-foreground leading-tight">
                          Tóm tắt tài liệu bằng AI
                        </h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[400px]">
                          {selectedMaterial.title}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSummaryMaterialId(null)}
                      className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground transition-all shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="overflow-y-auto pr-1 flex-1 py-2 max-h-[60vh]">
                    {selectedMaterial.summary ? (
                      <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                        {renderMarkdown(selectedMaterial.summary)}
                      </div>
                    ) : isGeneratingSummary ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="relative">
                          <Loader2 className="animate-spin text-primary" size={44} />
                          <Sparkles className="absolute -top-1 -right-1 text-amber-500 animate-pulse" size={16} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm font-outfit">AI đang tóm tắt tài liệu...</h4>
                          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mt-1">
                            Hệ thống đang bóc tách và tóm tắt những nội dung quan trọng nhất. Vui lòng đợi trong giây lát.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full text-muted-foreground">
                          <FileText size={32} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Tài liệu chưa có bản tóm tắt</h4>
                          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mt-1">
                            Tài liệu này đã sẵn sàng nhưng chưa có bản tóm tắt AI. Hãy nhấn nút bên dưới để bắt đầu tạo.
                          </p>
                        </div>
                        <button
                          onClick={() => generateSummaryMutation.mutate(selectedMaterial.id)}
                          disabled={generateSummaryMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl shadow-md disabled:opacity-50 transition-colors"
                        >
                          {generateSummaryMutation.isPending ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Đang gửi yêu cầu...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              <span>Tạo tóm tắt AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
                    <button
                      onClick={() => setActiveSummaryMaterialId(null)}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs rounded-xl transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonDetailPage;
