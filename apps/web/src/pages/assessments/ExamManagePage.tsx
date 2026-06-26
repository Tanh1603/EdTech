import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  PlusCircle,
  Sparkles,
  Search,
  Loader2,
  FileQuestion,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArchiveX,
  ChevronRight,
  Clock,
  BookOpen,
  BarChart2,
  X,
  Filter,
} from 'lucide-react';
import {
  fetchExams,
  createExam,
  generateExam,
  deleteExam,
  publishExam,
  closeExam,
  Exam,
  ExamStatus,
  QuestionType,
  QuestionDifficulty,
} from '../../services/assessments';
import { fetchClassrooms, Classroom } from '../../services/academic';
import { MaterialPicker } from '../../components/assessments/MaterialPicker';

// ─── Status Badge ────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ExamStatus }> = ({ status }) => {
  const map: Record<ExamStatus, { label: string; cls: string }> = {
    draft: { label: 'Nháp', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    published: { label: 'Đã xuất bản', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    archived: { label: 'Đã đóng', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  };
  const { label, cls } = map[status] ?? map.draft;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
};

// ─── Create Exam Modal ────────────────────────────────────────────────────────

interface CreateExamModalProps {
  classrooms: Classroom[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateExamModal: React.FC<CreateExamModalProps> = ({ classrooms, onClose, onSuccess }) => {
  const [form, setForm] = useState({ classId: '', title: '', description: '', duration: 30 });

  const mutation = useMutation({
    mutationFn: () => createExam({ ...form, duration: Number(form.duration) }),
    onSuccess: () => {
      toast.success('Tạo đề thi thành công!');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Tạo đề thi thất bại.'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg font-outfit">Tạo đề thi mới</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lớp học *</label>
            <select
              value={form.classId}
              onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Chọn lớp học --</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tên đề thi *</label>
            <input
              type="text"
              placeholder="VD: Kiểm tra giữa kỳ Lịch sử lớp 10"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mô tả</label>
            <textarea
              rows={2}
              placeholder="Mô tả nội dung đề thi..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Thời gian làm bài (phút) *</label>
            <input
              type="number"
              min={5}
              max={180}
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.classId || !form.title || mutation.isPending}
            className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Tạo đề thi
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── AI Generate Exam Modal ───────────────────────────────────────────────────

interface AIExamModalProps {
  classrooms: Classroom[];
  onClose: () => void;
  onSuccess: () => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Trắc nghiệm' },
  { value: 'true_false', label: 'Đúng/Sai' },
  { value: 'short_answer', label: 'Trả lời ngắn' },
  { value: 'essay', label: 'Tự luận' },
];

const DIFFICULTY_OPTIONS: { value: QuestionDifficulty; label: string }[] = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];

const AIExamModal: React.FC<AIExamModalProps> = ({ classrooms, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    classId: '',
    title: '',
    description: '',
    duration: 30,
    topic: '',
    difficulty: 'medium' as QuestionDifficulty,
    numberOfQuestions: 10,
    questionTypes: ['mcq'] as QuestionType[],
    materialId: '',
  });

  const toggleType = (type: QuestionType) => {
    setForm((f) => ({
      ...f,
      questionTypes: f.questionTypes.includes(type)
        ? f.questionTypes.filter((t) => t !== type)
        : [...f.questionTypes, type],
    }));
  };

  const mutation = useMutation({
    mutationFn: () =>
      generateExam({
        ...form,
        duration: Number(form.duration),
        numberOfQuestions: Number(form.numberOfQuestions),
        materialId: form.materialId || undefined,
      }),
    onSuccess: () => {
      toast.success('AI đang tạo đề thi! Câu hỏi sẽ xuất hiện sau vài giây...');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Tạo đề thi AI thất bại.'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary animate-pulse" />
            </div>
            <h3 className="font-bold text-lg font-outfit">Tạo đề thi bằng AI</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lớp học *</label>
              <select
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, materialId: '' }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn lớp --</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Thời gian (phút) *</label>
              <input
                type="number"
                min={5}
                max={180}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tên đề thi *</label>
            <input
              type="text"
              placeholder="VD: Kiểm tra chương 1 - Lịch sử"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chủ đề / Nội dung AI tập trung *</label>
            <input
              type="text"
              placeholder="VD: Các cuộc kháng chiến chống Pháp của Việt Nam"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Độ khó</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as QuestionDifficulty }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Số câu hỏi</label>
              <input
                type="number"
                min={3}
                max={20}
                value={form.numberOfQuestions}
                onChange={(e) => setForm((f) => ({ ...f, numberOfQuestions: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Loại câu hỏi</label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((qt) => (
                <button
                  key={qt.value}
                  type="button"
                  onClick={() => toggleType(qt.value)}
                  className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-all ${
                    form.questionTypes.includes(qt.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Tài liệu tham chiếu (tuỳ chọn — AI dùng RAG để tạo câu hỏi sát nội dung)
            </label>
            <MaterialPicker
              courseId={classrooms.find((c) => c.id === form.classId)?.courseId}
              value={form.materialId}
              onChange={(materialId) => setForm((f) => ({ ...f, materialId }))}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.classId || !form.title || !form.topic || form.questionTypes.length === 0 || mutation.isPending}
            className="flex-1 py-2 text-sm bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Tạo bằng AI
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Exam Card ────────────────────────────────────────────────────────────────

interface ExamCardProps {
  exam: Exam;
  onPublish: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onPublish, onClose, onDelete, isPending }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97 }}
    className="bg-card border border-border hover:border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <StatusBadge status={exam.status} />
          {exam.classroom && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold uppercase tracking-wider truncate max-w-[160px]">
              {exam.classroom.name}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {exam.title}
        </h3>
        {exam.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>
        )}
      </div>
    </div>

    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
      <div className="flex items-center gap-1">
        <Clock size={12} />
        <span>{exam.duration} phút</span>
      </div>
      <div className="flex items-center gap-1">
        <FileQuestion size={12} />
        <span>{exam.questionsCount ?? 0} câu</span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Link
        to={`/assessments/manage/${exam.id}`}
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted hover:border-primary/30 transition-all"
      >
        <Pencil size={12} />
        Quản lý
      </Link>

      {exam.status === 'draft' && (
        <button
          onClick={() => onPublish(exam.id)}
          disabled={isPending}
          title="Xuất bản"
          className="p-1.5 rounded-xl border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-40"
        >
          <Eye size={14} />
        </button>
      )}
      {exam.status === 'published' && (
        <button
          onClick={() => onClose(exam.id)}
          disabled={isPending}
          title="Đóng đề thi"
          className="p-1.5 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-40"
        >
          <EyeOff size={14} />
        </button>
      )}
      {exam.status === 'archived' && (
        <span title="Đã đóng" className="p-1.5 rounded-xl border border-border text-muted-foreground">
          <ArchiveX size={14} />
        </span>
      )}
      <button
        onClick={() => onDelete(exam.id)}
        disabled={isPending}
        title="Xóa đề thi"
        className="p-1.5 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </motion.div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ExamManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ExamStatus | ''>('');
  const [filterClassId, setFilterClassId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const { data: examsResp, isLoading } = useQuery({
    queryKey: ['exams', filterClassId, filterStatus, search],
    queryFn: () =>
      fetchExams({
        classId: filterClassId || undefined,
        status: filterStatus || undefined,
        search: search || undefined,
        limit: 50,
      }),
    refetchInterval: 5000, // poll every 5s so AI-created exams appear
  });

  const { data: classroomsResp } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClassrooms(),
  });
  const classrooms = classroomsResp?.data || [];
  const exams = examsResp?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exams'] });

  const publishMutation = useMutation({
    mutationFn: publishExam,
    onSuccess: () => { toast.success('Đề thi đã được xuất bản!'); invalidate(); },
    onError: () => toast.error('Xuất bản thất bại.'),
  });

  const closeMutation = useMutation({
    mutationFn: closeExam,
    onSuccess: () => { toast.success('Đề thi đã được đóng.'); invalidate(); },
    onError: () => toast.error('Đóng đề thi thất bại.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => { toast.success('Đã xóa đề thi.'); invalidate(); },
    onError: () => toast.error('Xóa đề thi thất bại.'),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn chắc chắn muốn xóa đề thi này? Hành động này không thể hoàn tác.')) {
      deleteMutation.mutate(id);
    }
  };

  const isPending = publishMutation.isPending || closeMutation.isPending || deleteMutation.isPending;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-outfit tracking-tight">Quản lý Đề thi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo, chỉnh sửa và xuất bản bài kiểm tra cho lớp học của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="create-ai-exam-btn"
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-all"
          >
            <Sparkles size={15} className="animate-pulse" />
            Tạo bằng AI
          </button>
          <button
            id="create-exam-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-card border border-border rounded-xl hover:bg-muted transition-all"
          >
            <PlusCircle size={15} />
            Tạo thủ công
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-muted-foreground shrink-0" />
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Tất cả lớp</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ExamStatus | '')}
            className="px-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="published">Đã xuất bản</option>
            <option value="archived">Đã đóng</option>
          </select>
        </div>
      </div>

      {/* Stats Strip */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {(['draft', 'published', 'archived'] as ExamStatus[]).map((s) => {
            const count = exams.filter((e) => e.status === s).length;
            const labels: Record<ExamStatus, string> = { draft: 'Nháp', published: 'Đã xuất bản', archived: 'Đã đóng' };
            const icons: Record<ExamStatus, React.ReactNode> = {
              draft: <FileQuestion size={16} className="text-slate-400" />,
              published: <Eye size={16} className="text-emerald-500" />,
              archived: <ArchiveX size={16} className="text-amber-500" />,
            };
            return (
              <div key={s} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                {icons[s]}
                <div>
                  <div className="text-xl font-bold font-outfit">{count}</div>
                  <div className="text-xs text-muted-foreground">{labels[s]}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-card border border-dashed border-border rounded-2xl">
          <FileQuestion size={48} className="text-muted-foreground mb-4 opacity-40" />
          <h3 className="font-bold mb-1">Chưa có đề thi nào</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tạo đề thi thủ công hoặc để AI tự động sinh câu hỏi từ tài liệu.
          </p>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
          >
            <Sparkles size={14} />
            Tạo đề thi đầu tiên bằng AI
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onPublish={(id) => publishMutation.mutate(id)}
                onClose={(id) => closeMutation.mutate(id)}
                onDelete={handleDelete}
                isPending={isPending}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateExamModal
            classrooms={classrooms}
            onClose={() => setShowCreateModal(false)}
            onSuccess={invalidate}
          />
        )}
        {showAIModal && (
          <AIExamModal
            classrooms={classrooms}
            onClose={() => setShowAIModal(false)}
            onSuccess={invalidate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamManagePage;
