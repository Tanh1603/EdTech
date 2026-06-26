import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Clock,
  BookOpen,
  FileQuestion,
  Search,
  Filter,
  Loader2,
  Play,
  CheckCircle2,
  Hourglass,
  Award,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { fetchExams, startExam, Exam, Submission } from '../../services/assessments';
import { fetchClassrooms, Classroom } from '../../services/academic';

// ─── Status Badge Component ──────────────────────────────────────────────────
interface StatusBadgeProps {
  submission?: Submission;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ submission }) => {
  if (!submission) {
    return (
      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border bg-muted text-muted-foreground border-border uppercase tracking-wider">
        Chưa làm
      </span>
    );
  }

  const map: Record<string, { label: string; cls: string }> = {
    in_progress: {
      label: 'Đang làm',
      cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 animate-pulse',
    },
    submitted: {
      label: 'Chờ chấm điểm',
      cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    graded: {
      label: 'Đã hoàn thành',
      cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
  };

  const status = submission.result ? 'graded' : submission.status;
  const statusInfo = map[status] || {
    label: status,
    cls: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${statusInfo.cls}`}>
      {statusInfo.label}
    </span>
  );
};

// ─── Stats Card Component ─────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorCls: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, colorCls }) => (
  <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-xl ${colorCls} shrink-0`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold font-outfit tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground font-semibold">{label}</div>
    </div>
  </div>
);

// ─── Main StudentAssessmentsPage Component ─────────────────────────────────────
export const StudentAssessmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // 1. Fetch classroom list
  const { data: classroomsResp } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClassrooms(),
  });
  const classrooms = classroomsResp?.data || [];

  // 2. Fetch exams list (filtered by student classroom membership implicitly on backend)
  const { data: examsResp, isLoading } = useQuery({
    queryKey: ['student-exams', filterClassId, search],
    queryFn: () =>
      fetchExams({
        classId: filterClassId || undefined,
        search: search || undefined,
        limit: 50,
      }),
  });
  const rawExams = examsResp?.data || [];

  // Client side filtering for submission status (since API doesn't support submissionStatus filter directly)
  const exams = rawExams.filter((exam) => {
    if (!filterStatus) return true;
    const submission = exam.submissions?.[0];
    if (filterStatus === 'not_started') return !submission;
    if (filterStatus === 'in_progress') return submission?.status === 'in_progress';
    if (filterStatus === 'submitted') return submission?.status === 'submitted';
    if (filterStatus === 'graded') return submission?.status === 'graded';
    return true;
  });

  // 3. Mutation to start an exam
  const startExamMutation = useMutation({
    mutationFn: (examId: string) => startExam(examId),
    onSuccess: (data, examId) => {
      toast.success('Bắt đầu làm bài thi!');
      queryClient.invalidateQueries({ queryKey: ['student-exams'] });
      navigate(`/assessments/exam/${examId}`);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'Không thể bắt đầu bài thi. Vui lòng thử lại.';
      toast.error(errMsg);
    },
  });

  const handleStartExam = (exam: Exam) => {
    const submission = exam.submissions?.[0];
    if (submission) {
      // If already started or submitted, navigate directly
      navigate(`/assessments/exam/${exam.id}`);
      return;
    }

    if (window.confirm(`Bạn có chắc muốn bắt đầu làm bài thi "${exam.title}"? Thời gian làm bài là ${exam.duration} phút và đồng hồ sẽ tính giờ ngay lập tức.`)) {
      startExamMutation.mutate(exam.id);
    }
  };

  // Compute stats
  const totalExams = rawExams.length;
  const notStartedCount = rawExams.filter((e) => !e.submissions?.[0]).length;
  const inProgressCount = rawExams.filter((e) => e.submissions?.[0]?.status === 'in_progress').length;
  const completedCount = rawExams.filter((e) => e.submissions?.[0]?.status === 'graded' || e.submissions?.[0]?.status === 'submitted').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-foreground">
            Bài thi & Kiểm tra
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem danh sách các đề thi được giao và kết quả đánh giá năng lực của bạn.
          </p>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ClipboardList size={20} className="text-primary" />}
          value={totalExams}
          label="Tổng số bài thi"
          colorCls="bg-primary/10 text-primary"
        />
        <StatCard
          icon={<Play size={20} className="text-sky-500 dark:text-sky-400" />}
          value={notStartedCount}
          label="Chưa bắt đầu"
          colorCls="bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={<Hourglass size={20} className="text-indigo-500 dark:text-indigo-400" />}
          value={inProgressCount}
          label="Đang làm dở"
          colorCls="bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-500 dark:text-emerald-400" />}
          value={completedCount}
          label="Đã hoàn thành"
          colorCls="bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={15} className="text-muted-foreground shrink-0" />
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">Tất cả lớp học</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="not_started">Chưa làm</option>
            <option value="in_progress">Đang làm dở</option>
            <option value="submitted">Chờ chấm điểm</option>
            <option value="graded">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-card border border-dashed border-border rounded-2xl">
          <FileQuestion size={48} className="text-muted-foreground mb-4 opacity-40 animate-pulse" />
          <h3 className="font-bold text-foreground mb-1">Không tìm thấy bài thi nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Hiện tại không có đề thi nào phù hợp với bộ lọc tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {exams.map((exam) => {
              const submission = exam.submissions?.[0];
              const isGraded = submission?.status === 'graded' || !!submission?.result;
              const isSubmitted = (submission?.status === 'submitted') && !submission?.result;
              const isInProgress = submission?.status === 'in_progress';
              const hasScore = isGraded && submission?.result?.score !== undefined;

              return (
                <motion.div
                  key={exam.id}
                  variants={itemVariants}
                  layout
                  className="bg-card border border-border hover:border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between group transition-all duration-200"
                >
                  <div>
                    {/* Top tags */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <StatusBadge submission={submission} />
                      {exam.classroom && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-bold uppercase tracking-wider truncate max-w-[150px]">
                          {exam.classroom.name}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock size={13} className="text-muted-foreground" />
                        <span>{exam.duration} phút</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileQuestion size={13} className="text-muted-foreground" />
                        <span>{exam.questionsCount ?? 0} câu hỏi</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isGraded ? (
                        <>
                          {/* Score display for graded exams */}
                          <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
                            <div className="flex items-center gap-1">
                              <Award size={14} />
                              <span>Điểm số</span>
                            </div>
                            <span className="text-sm font-extrabold">{submission.result?.score.toFixed(1)}/10</span>
                          </div>

                          <button
                            onClick={() => navigate(`/assessments/result/${submission.id}`)}
                            className="flex items-center justify-center p-2 border border-border hover:border-primary/20 rounded-xl text-foreground hover:bg-muted transition-all text-xs font-semibold gap-1 shrink-0"
                          >
                            <span>Xem kết quả</span>
                            <ChevronRight size={14} />
                          </button>
                        </>
                      ) : isSubmitted ? (
                        <button
                          onClick={() => navigate(`/assessments/exam/${exam.id}`)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl transition-all"
                        >
                          <Loader2 size={13} className="animate-spin text-amber-400" />
                          Xem trạng thái chấm AI
                        </button>
                      ) : isInProgress ? (
                        <button
                          onClick={() => handleStartExam(exam)}
                          disabled={startExamMutation.isPending}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-950/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          <Play size={13} fill="white" />
                          Làm tiếp bài thi
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam)}
                          disabled={startExamMutation.isPending}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-primary hover:opacity-90 text-primary-foreground rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          <Play size={13} fill="currentColor" />
                          Bắt đầu làm bài
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default StudentAssessmentsPage;
