import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCourses, fetchLessonsByCourse, Course, Lesson } from '../../services/academic';
import { fetchMaterials, createMaterial, uploadFile, Material } from '../../services/learning';
import { useAuthStore } from '../../state/useAuthStore';
import { toast } from 'sonner';
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Layers,
  FolderOpen,
  Download
} from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { activeRole } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      return hasIndexing ? 3000 : false; // Poll every 3 seconds if any file is indexing
    }
  });
  const materials = materialsResp?.data || [];

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

      const { storageUrl, publicId, mimeType, size } = uploadResp.data;

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
    </div>
  );
};

export default MaterialsPage;
