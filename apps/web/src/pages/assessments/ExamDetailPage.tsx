import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArchiveX,
  BarChart2,
  FileQuestion,
  CheckCircle2,
  XCircle,
  GripVertical,
  X,
  Save,
  Clock,
  Users,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  getExamDetail,
  fetchExamQuestions,
  createQuestion,
  generateQuestions,
  updateQuestion,
  deleteQuestion,
  publishExam,
  closeExam,
  deleteExam,
  updateExam,
  getExamAnalytics,
  getQuestionAnalytics,
  Question,
  QuestionType,
  QuestionDifficulty,
  ExamStatus,
} from '../../services/assessments';
import { fetchClassrooms } from '../../services/academic';
import { MaterialPicker } from '../../components/assessments/MaterialPicker';

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Question Type Badge ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận',
};

const QuestionTypeBadge: React.FC<{ type: QuestionType }> = ({ type }) => {
  const clsMap: Record<QuestionType, string> = {
    mcq: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    true_false: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    short_answer: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    essay: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-wide ${clsMap[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
};

// ─── Add Question Modal ───────────────────────────────────────────────────────

interface AddQuestionModalProps {
  examId: string;
  nextOrder: number;
  onClose: () => void;
  onSuccess: () => void;
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Trắc nghiệm' },
  { value: 'true_false', label: 'Đúng/Sai' },
  { value: 'short_answer', label: 'Trả lời ngắn' },
  { value: 'essay', label: 'Tự luận' },
];

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ examId, nextOrder, onClose, onSuccess }) => {
  const [type, setType] = useState<QuestionType>('mcq');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answerMcq, setAnswerMcq] = useState<number>(0);
  const [answerTF, setAnswerTF] = useState<boolean>(true);
  const [answerText, setAnswerText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(1);

  const mutation = useMutation({
    mutationFn: () => {
      let answerKey: string | number | boolean | null = null;
      if (type === 'mcq') answerKey = answerMcq;
      else if (type === 'true_false') answerKey = answerTF;
      else answerKey = answerText;

      return createQuestion(examId, {
        type,
        prompt,
        options: type === 'mcq' ? options.filter((o) => o.trim()) : undefined,
        answerKey,
        explanation: explanation || undefined,
        points: Number(points),
        orderNo: nextOrder,
      });
    },
    onSuccess: () => {
      toast.success('Thêm câu hỏi thành công!');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Thêm câu hỏi thất bại.'),
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
          <h3 className="font-bold text-base font-outfit">Thêm câu hỏi</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Loại câu hỏi</label>
            <div className="flex gap-2 flex-wrap">
              {QUESTION_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`px-3 py-1 text-xs rounded-lg border font-semibold transition-all ${
                    type === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nội dung câu hỏi *</label>
            <textarea
              rows={3}
              placeholder="Nhập câu hỏi tại đây..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {type === 'mcq' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Các đáp án (chọn đáp án đúng)</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAnswerMcq(i)}
                      className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                        answerMcq === i ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {answerMcq === i && <div className="h-2 w-2 rounded-full bg-white" />}
                    </button>
                    <span className="text-xs font-bold text-muted-foreground w-4">{String.fromCharCode(65 + i)}.</span>
                    <input
                      type="text"
                      placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        setOptions(next);
                      }}
                      className="flex-1 px-2 py-1.5 text-sm bg-muted border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {type === 'true_false' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Đáp án đúng</label>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setAnswerTF(v)}
                    className={`flex-1 py-2 text-sm rounded-xl border font-semibold transition-all ${
                      answerTF === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {v ? 'Đúng' : 'Sai'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(type === 'short_answer' || type === 'essay') && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Đáp án mẫu / Tiêu chí chấm</label>
              <textarea
                rows={3}
                placeholder="Đáp án tham khảo hoặc rubric chấm điểm..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Điểm</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Giải thích (tuỳ chọn)</label>
              <input
                type="text"
                placeholder="Lý do đáp án..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Hủy</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!prompt || mutation.isPending}
            className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Thêm câu hỏi
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── AI Questions Modal ───────────────────────────────────────────────────────

interface AIQuestionsModalProps {
  examId: string;
  courseId: string | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

const DIFFICULTY_OPTIONS: { value: QuestionDifficulty; label: string }[] = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];

const AIQuestionsModal: React.FC<AIQuestionsModalProps> = ({ examId, courseId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    topic: '',
    difficulty: 'medium' as QuestionDifficulty,
    numberOfQuestions: 5,
    questionTypes: ['mcq'] as QuestionType[],
    materialId: '',
  });

  const toggleType = (t: QuestionType) =>
    setForm((f) => ({
      ...f,
      questionTypes: f.questionTypes.includes(t) ? f.questionTypes.filter((x) => x !== t) : [...f.questionTypes, t],
    }));

  const mutation = useMutation({
    mutationFn: () =>
      generateQuestions(examId, {
        ...form,
        numberOfQuestions: Number(form.numberOfQuestions),
        materialId: form.materialId || undefined,
      }),
    onSuccess: () => {
      toast.success('AI đang tạo câu hỏi... Danh sách sẽ cập nhật tự động!');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Tạo câu hỏi AI thất bại.'),
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
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={14} className="text-primary animate-pulse" />
            </div>
            <h3 className="font-bold text-base font-outfit">Thêm câu hỏi bằng AI</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chủ đề *</label>
            <input
              type="text"
              placeholder="VD: Cách mạng tháng Tám 1945"
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
                {DIFFICULTY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Số câu</label>
              <input
                type="number"
                min={1}
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
              {QUESTION_TYPE_OPTIONS.map((qt) => (
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
              courseId={courseId}
              value={form.materialId}
              onChange={(materialId) => setForm((f) => ({ ...f, materialId }))}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors">Hủy</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.topic || form.questionTypes.length === 0 || mutation.isPending}
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

// ─── Question Item ────────────────────────────────────────────────────────────

interface QuestionItemProps {
  question: Question;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (q: Question) => void;
  isPending: boolean;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, index, onDelete, onUpdate, isPending }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(question.prompt);
  const [editPoints, setEditPoints] = useState(question.points);

  const mutation = useMutation({
    mutationFn: () => updateQuestion(question.id, { prompt: editPrompt, points: Number(editPoints) }),
    onSuccess: (resp) => {
      const updated = (resp as { data?: Question }).data;
      if (updated) onUpdate(updated);
      toast.success('Cập nhật câu hỏi thành công!');
      setEditing(false);
    },
    onError: () => toast.error('Cập nhật thất bại.'),
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-card border border-border rounded-xl p-4 group"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className="text-muted-foreground opacity-40 cursor-grab group-hover:opacity-70 transition-opacity">
            <GripVertical size={16} />
          </span>
          <span className="h-6 w-6 rounded-md bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <QuestionTypeBadge type={question.type} />
            <span className="text-xs font-semibold text-primary">{question.points} điểm</span>
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={editPoints}
                onChange={(e) => setEditPoints(Number(e.target.value))}
                className="w-24 px-2 py-1 text-sm bg-muted border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            <p className="text-sm leading-relaxed line-clamp-3">{question.prompt}</p>
          )}

          {expanded && !editing && (
            <div className="mt-3 space-y-2">
              {question.options && question.options.length > 0 && (
                <div className="space-y-1">
                  {question.options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                      question.answerKey === i ? 'bg-emerald-500/10 text-emerald-600 font-semibold' : 'text-muted-foreground'
                    }`}>
                      {question.answerKey === i
                        ? <CheckCircle2 size={12} className="shrink-0" />
                        : <XCircle size={12} className="shrink-0 opacity-30" />
                      }
                      <span>{String.fromCharCode(65 + i)}. {opt}</span>
                    </div>
                  ))}
                </div>
              )}
              {question.type === 'true_false' && (
                <div className="text-xs text-muted-foreground">
                  Đáp án: <span className="font-semibold text-emerald-500">{question.answerKey ? 'Đúng' : 'Sai'}</span>
                </div>
              )}
              {(question.type === 'short_answer' || question.type === 'essay') && question.answerKey && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                  <span className="font-semibold">Đáp án mẫu:</span> {String(question.answerKey)}
                </div>
              )}
              {question.explanation && (
                <div className="text-xs text-muted-foreground italic">💡 {question.explanation}</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {editing ? (
            <>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              </button>
              <button
                onClick={() => { setEditing(false); setEditPrompt(question.prompt); setEditPoints(question.points); }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setExpanded((e) => !e)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                title="Xem đáp án"
              >
                {expanded ? <X size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                title="Chỉnh sửa"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(question.id)}
                disabled={isPending}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-all disabled:opacity-40"
                title="Xóa câu hỏi"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────

const AnalyticsTab: React.FC<{ examId: string }> = ({ examId }) => {
  const { data: analyticsResp, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['examAnalytics', examId],
    queryFn: () => getExamAnalytics(examId),
  });
  const { data: questionAnalyticsResp, isLoading: isQALoading } = useQuery({
    queryKey: ['questionAnalytics', examId],
    queryFn: () => getQuestionAnalytics(examId),
  });

  const analytics = (analyticsResp as { data?: ReturnType<typeof getExamAnalytics> extends Promise<infer T> ? T extends { data?: infer D } ? D : never : never })?.data;
  const questionAnalytics = (questionAnalyticsResp as { data?: unknown[] })?.data || [];

  if (isAnalyticsLoading || isQALoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Chưa có dữ liệu phân tích. Học sinh cần nộp bài để xem thống kê.</p>
      </div>
    );
  }

  const a = analytics as {
    totalSubmissions?: number;
    averageScore?: number;
    maxScore?: number;
    minScore?: number;
    passRate?: number;
  };

  const statCards = [
    { label: 'Lượt nộp bài', value: a.totalSubmissions ?? 0, icon: <Users size={18} className="text-indigo-500" /> },
    { label: 'Điểm trung bình', value: `${((a.averageScore ?? 0)).toFixed(1)}`, icon: <Target size={18} className="text-primary" /> },
    { label: 'Điểm cao nhất', value: `${((a.maxScore ?? 0)).toFixed(1)}`, icon: <TrendingUp size={18} className="text-emerald-500" /> },
    { label: 'Tỷ lệ vượt qua', value: `${((a.passRate ?? 0) * 100).toFixed(0)}%`, icon: <CheckCircle2 size={18} className="text-teal-500" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {card.icon}
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-2xl font-bold font-outfit">{card.value}</div>
          </div>
        ))}
      </div>

      {questionAnalytics.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3">Phân tích từng câu hỏi</h4>
          <div className="space-y-3">
            {questionAnalytics.map((qa: unknown, idx: number) => {
              const q = qa as { questionId?: string; prompt?: string; correctRate?: number; correctCount?: number; incorrectCount?: number };
              const correctRate = (q.correctRate ?? 0) * 100;
              return (
                <div key={q.questionId ?? idx} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm line-clamp-2 flex-1">{q.prompt ?? `Câu ${idx + 1}`}</p>
                    <span className={`text-sm font-bold shrink-0 ${correctRate >= 60 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {correctRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${correctRate >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${correctRate}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="text-emerald-500">✓ {q.correctCount ?? 0} đúng</span>
                    <span className="text-rose-500">✗ {q.incorrectCount ?? 0} sai</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const EMPTY_QUESTIONS: Question[] = [];

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ExamDetailPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'questions' | 'analytics'>('questions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(EMPTY_QUESTIONS);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const { data: examResp, isLoading: isExamLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => getExamDetail(examId!),
    enabled: !!examId,
  });
  const exam = (examResp as { data?: ReturnType<typeof getExamDetail> extends Promise<infer T> ? T extends { data?: infer D } ? D : never : never })?.data;

  const { data: classroomsResp } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => fetchClassrooms(),
  });
  const classrooms = classroomsResp?.data || [];
  const courseId = classrooms.find((c) => c.id === exam?.classId)?.courseId;

  const { data: questionsData, isLoading: isQLoading } = useQuery({
    queryKey: ['examQuestions', examId],
    queryFn: () => fetchExamQuestions(examId!),
    enabled: !!examId,
    refetchInterval: 5000, // poll for AI-generated questions
    select: (envelope) => {
      return envelope?.data || EMPTY_QUESTIONS;
    },
  });

  // Synchronize local questions state with query data when it loads/updates
  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);
    }
  }, [questionsData]);

  const invalidateQuestions = () => queryClient.invalidateQueries({ queryKey: ['examQuestions', examId] });
  const invalidateExam = () => queryClient.invalidateQueries({ queryKey: ['exam', examId] });

  const publishMutation = useMutation({
    mutationFn: () => publishExam(examId!),
    onSuccess: () => { toast.success('Đề thi đã được xuất bản!'); invalidateExam(); },
    onError: () => toast.error('Xuất bản thất bại.'),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeExam(examId!),
    onSuccess: () => { toast.success('Đề thi đã được đóng.'); invalidateExam(); },
    onError: () => toast.error('Đóng đề thi thất bại.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(examId!),
    onSuccess: () => { toast.success('Đã xóa đề thi.'); navigate('/assessments/manage'); },
    onError: () => toast.error('Xóa đề thi thất bại.'),
  });

  const updateTitleMutation = useMutation({
    mutationFn: () => updateExam(examId!, { title: editTitle }),
    onSuccess: () => { toast.success('Đã cập nhật tên đề thi.'); invalidateExam(); setIsEditingTitle(false); },
    onError: () => toast.error('Cập nhật thất bại.'),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => { toast.success('Đã xóa câu hỏi.'); invalidateQuestions(); },
    onError: () => toast.error('Xóa câu hỏi thất bại.'),
  });

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Bạn chắc chắn muốn xóa câu hỏi này?')) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const handleDeleteExam = () => {
    if (window.confirm('Bạn chắc chắn muốn xóa đề thi này? Toàn bộ câu hỏi và bài nộp sẽ bị xóa.')) {
      deleteMutation.mutate();
    }
  };

  if (isExamLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <FileQuestion size={40} className="mx-auto mb-3 opacity-30" />
        <p>Không tìm thấy đề thi hoặc bạn không có quyền truy cập.</p>
        <Link to="/assessments/manage" className="mt-4 inline-block text-primary text-sm font-semibold">← Quay lại danh sách</Link>
      </div>
    );
  }

  const examData = exam as {
    id: string;
    title: string;
    description?: string;
    duration: number;
    status: ExamStatus;
    questionsCount?: number;
    classroom?: { name: string };
  };

  const isPending = publishMutation.isPending || closeMutation.isPending || deleteMutation.isPending;
  const displayedQuestions = questions.length > 0 ? questions : (questionsData as Question[] || []);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        to="/assessments/manage"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
      >
        <ArrowLeft size={14} />
        Quay lại Quản lý Đề thi
      </Link>

      {/* Exam Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={examData.status} />
              {examData.classroom && (
                <span className="text-xs text-muted-foreground">{examData.classroom.name}</span>
              )}
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold px-3 py-1.5 bg-muted border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                  autoFocus
                />
                <button
                  onClick={() => updateTitleMutation.mutate()}
                  disabled={updateTitleMutation.isPending}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  {updateTitleMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold font-outfit tracking-tight line-clamp-2">
                  {examData.title}
                </h1>
                {examData.status === 'draft' && (
                  <button
                    onClick={() => { setEditTitle(examData.title); setIsEditingTitle(true); }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
                    title="Đổi tên"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}

            {examData.description && (
              <p className="text-sm text-muted-foreground">{examData.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1"><Clock size={12} /> {examData.duration} phút</div>
              <div className="flex items-center gap-1"><FileQuestion size={12} /> {displayedQuestions.length} câu hỏi</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {examData.status === 'draft' && (
              <button
                id="publish-exam-btn"
                onClick={() => publishMutation.mutate()}
                disabled={isPending || displayedQuestions.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {publishMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                Xuất bản
              </button>
            )}
            {examData.status === 'published' && (
              <button
                id="close-exam-btn"
                onClick={() => closeMutation.mutate()}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {closeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                Đóng đề thi
              </button>
            )}
            {examData.status === 'archived' && (
              <div className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground border border-border rounded-xl">
                <ArchiveX size={14} />
                Đã đóng
              </div>
            )}
            <button
              id="delete-exam-btn"
              onClick={handleDeleteExam}
              disabled={isPending}
              className="p-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40"
              title="Xóa đề thi"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border gap-6">
        {(['questions', 'analytics'] as const).map((tab) => {
          const icons = { questions: <FileQuestion size={15} />, analytics: <BarChart2 size={15} /> };
          const labels = { questions: 'Câu hỏi', analytics: 'Analytics' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 pb-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {icons[tab]}
              {labels[tab]}
              {tab === 'questions' && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {displayedQuestions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Add Question Actions */}
          {examData.status === 'draft' && (
            <div className="flex items-center gap-3">
              <button
                id="add-question-btn"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-all"
              >
                <PlusCircle size={14} />
                Thêm câu hỏi
              </button>
              <button
                id="ai-question-btn"
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gradient-to-r from-primary to-violet-600 text-white rounded-xl hover:opacity-90 transition-all"
              >
                <Sparkles size={14} className="animate-pulse" />
                Thêm bằng AI
              </button>
            </div>
          )}

          {/* Questions List */}
          {isQLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>
          ) : displayedQuestions.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
              <FileQuestion size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <h3 className="font-bold text-sm mb-1">Chưa có câu hỏi nào</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Thêm câu hỏi thủ công hoặc dùng AI để tự động sinh câu hỏi từ tài liệu học.
              </p>
              {examData.status === 'draft' && (
                <button
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all mx-auto"
                >
                  <Sparkles size={14} />
                  Tạo câu hỏi bằng AI
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayedQuestions.map((q, idx) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    index={idx}
                    onDelete={handleDeleteQuestion}
                    onUpdate={(updated) => setQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                    isPending={deleteQuestionMutation.isPending}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && <AnalyticsTab examId={examId!} />}

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddQuestionModal
            examId={examId!}
            nextOrder={displayedQuestions.length + 1}
            onClose={() => setShowAddModal(false)}
            onSuccess={invalidateQuestions}
          />
        )}
        {showAIModal && (
          <AIQuestionsModal
            examId={examId!}
            courseId={courseId}
            onClose={() => setShowAIModal(false)}
            onSuccess={invalidateQuestions}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamDetailPage;
