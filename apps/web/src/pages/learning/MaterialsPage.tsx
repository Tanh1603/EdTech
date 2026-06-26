import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCourses, fetchLessonsByCourse, Course, Lesson } from '../../services/academic';
import { fetchMaterials, createMaterial, uploadFile, Material, generateMaterialSummary } from '../../services/learning';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Layers,
  FolderOpen,
  Download,
  Sparkles,
  X
} from 'lucide-react';

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


export const MaterialsPage: React.FC = () => {
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeSummaryMaterialId, setActiveSummaryMaterialId] = useState<string | null>(null);
  const [waitingForSummaryIds, setWaitingForSummaryIds] = useState<string[]>([]);

  // 1. Fetch Courses
  const { data: coursesResp, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => fetchCourses(),
  });
  const courses = coursesResp?.data || [];

  // 2. Fetch Lessons in Selected Course
  const { data: lessonsResp, isLoading: isLessonsLoading } = useQuery({
    queryKey: ['lessons', selectedCourseId],
    queryFn: () => fetchLessonsByCourse(selectedCourseId),
    enabled: !!selectedCourseId,
  });
  const lessons = lessonsResp?.data || [];

  // 3. Fetch Materials for Selected Lesson (with smart polling)
  const { data: materialsResp, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['materials', selectedLessonId],
    queryFn: () => fetchMaterials({ lessonId: selectedLessonId }),
    enabled: !!selectedLessonId,
    refetchInterval: (query) => {
      const items = query.state.data?.data || [];
      const hasIndexing = items.some(item => item.status === 'uploaded' || item.status === 'indexing');
      const isWaitingForAnySummary = items.some(item => item.status === 'ready' && !item.summary && waitingForSummaryIds.includes(item.id));
      return (hasIndexing || isWaitingForAnySummary) ? 3000 : false; // Poll every 3 seconds if indexing or waiting for summary
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
      queryClient.invalidateQueries({ queryKey: ['materials', selectedLessonId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo tóm tắt: ${error.message || 'Không thể bắt đầu tóm tắt'}`);
    }
  });


  // Upload Mutations
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      // Step 1: Upload file byte payload
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

      // Step 2: Save metadata linked to the lesson
      return createMaterial({
        lessonId: selectedLessonId,
        title: file.name,
        storageUrl,
        publicId,
        mimeType,
        size
      });
    },
    onSuccess: () => {
      toast.success('Tải lên tài liệu thành công! AI đang tiến hành phân tách & lập chỉ mục RAG.');
      queryClient.invalidateQueries({ queryKey: ['materials', selectedLessonId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tải lên: ${error.message || 'Không thể tải tài liệu lên'}`);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadMutation.mutate(e.dataTransfer.files[0]);
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
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <CheckCircle2 size={12} />
            <span>Sẵn sàng (RAG Ready)</span>
          </span>
        );
      case 'indexing':
      case 'uploaded':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Đang chỉ mục...</span>
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <XCircle size={12} />
            <span>Chỉ mục lỗi</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Kho tài liệu học tập
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {activeRole === 'teacher' 
              ? 'Tải lên giáo trình bài giảng và tự động nạp cơ sở tri thức RAG cho AI Tutor.'
              : 'Tra cứu và tải tài liệu học tập được chia sẻ bởi giáo viên.'
            }
          </p>
        </div>
      </div>

      {/* Selectors Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
        {/* Course Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chọn khóa học</label>
          <div className="relative">
            {isCoursesLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border border-border rounded-xl">
                <Loader2 className="animate-spin text-primary" size={14} />
                <span>Đang tải khóa học...</span>
              </div>
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedLessonId('');
                }}
                className="w-full px-4 py-2.5 bg-muted/30 border border-input focus:outline-none focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all"
              >
                <option value="">-- Chọn khóa học --</option>
                {courses.map((course: Course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lesson Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chọn bài học</label>
          <div className="relative">
            {isLessonsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border border-border rounded-xl">
                <Loader2 className="animate-spin text-primary" size={14} />
                <span>Đang tải bài giảng...</span>
              </div>
            ) : (
              <select
                value={selectedLessonId}
                disabled={!selectedCourseId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/30 border border-input focus:outline-none focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all disabled:opacity-50"
              >
                <option value="">-- Chọn bài học --</option>
                {lessons.map((lesson: Lesson) => (
                  <option key={lesson.id} value={lesson.id}>Bài {lesson.orderNo}: {lesson.title}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      {!selectedLessonId ? (
        <div className="p-16 text-center border border-dashed border-border rounded-2xl bg-card flex flex-col items-center">
          <BookOpen size={44} className="text-muted-foreground mb-3 opacity-60" />
          <h3 className="font-bold mb-1">Chưa chọn bài học</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Vui lòng lựa chọn Khóa học và Bài học ở bảng điều khiển trên để xem danh sách tài liệu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List Section (Left Column) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              <span>Tài liệu đính kèm</span>
            </h3>

            {isMaterialsLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : materials.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-2xl flex flex-col items-center">
                <FolderOpen size={36} className="text-muted-foreground mb-3 opacity-60" />
                <h4 className="font-bold mb-1 text-sm">Chưa có tài liệu học tập</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {activeRole === 'teacher'
                    ? 'Hãy kéo thả file vào khung bên phải để tải lên tài liệu học tập đầu tiên.'
                    : 'Giáo viên hiện chưa chia sẻ tài liệu nào cho bài giảng này.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((file: Material) => (
                  <div 
                    key={file.id} 
                    className="bg-card border border-border hover:border-primary/20 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition-all group"
                  >
                    <div className="flex gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                          {file.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'} • {formatBytes(file.size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-border/50">
                      {getStatusBadge(file.status)}
                      
                      <div className="flex items-center gap-1.5">
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Section (Right Column for Teachers) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-outfit">
              {activeRole === 'teacher' ? 'Quản trị tài liệu' : 'AI Tutor RAG'}
            </h3>

            {activeRole === 'teacher' ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card/50 hover:bg-card hover:border-primary/20'
                }`}
              >
                <div className="p-4 bg-muted/60 rounded-full text-muted-foreground mb-3 group-hover:text-primary transition-colors">
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-primary" />
                  ) : (
                    <UploadCloud size={32} />
                  )}
                </div>
                
                <h4 className="font-bold text-sm mb-1">
                  {isUploading ? 'Đang upload file...' : 'Tải tài liệu lên'}
                </h4>
                
                <p className="text-[11px] text-muted-foreground max-w-[200px] mb-4">
                  Kéo thả file vào đây hoặc bấm để chọn file PDF, DOCX, TXT.
                </p>

                <label className="relative">
                  <input
                    type="file"
                    disabled={isUploading}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.txt"
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-colors">
                    Chọn file máy tính
                  </span>
                </label>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white font-bold">
                  <span>AI</span>
                </div>
                <h4 className="font-extrabold font-outfit text-sm">Học tập thông minh hơn</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Các tài liệu có biểu tượng <span className="text-emerald-500 font-semibold">Ready</span> đã được hệ thống AI bóc tách nội dung và nạp vào cơ sở dữ liệu vector.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bạn có thể hỏi trực tiếp AI Tutor về nội dung các tài liệu này thông qua thanh chat bất cứ lúc nào!
                </p>
              </div>
            )}
          </div>

        </div>
      )}

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

export default MaterialsPage;
