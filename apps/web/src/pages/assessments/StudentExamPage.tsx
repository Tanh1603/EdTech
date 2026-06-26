import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useExamRunnerStore } from '../../state/useExamRunnerStore';
import {
  startExam,
  getSubmissionDetail,
  autosaveAnswers,
  submitSubmission,
  Question,
  Submission
} from '../../services/assessments';

export const StudentExamPage: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    currentAnswers,
    activeQuestionIdx,
    setAnswer,
    setActiveQuestionIdx,
    clearAnswers
  } = useExamRunnerStore();

  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastSavedRef = useRef<Record<string, string>>({});

  // 1. Initialize Exam attempt on mount
  useEffect(() => {
    if (!examId) return;

    startExam(examId)
      .then((res) => {
        setSubmissionId(res.data.submissionId);
      })
      .catch((err) => {
        const errMsg = err?.response?.data?.message || 'Không thể vào phòng thi.';
        toast.error(errMsg);
        navigate('/assessments');
      });

    return () => {
      clearAnswers();
    };
  }, [examId, navigate, clearAnswers]);

  const [shouldPoll, setShouldPoll] = useState(false);

  // 2. Fetch submission details (polls every 3s if status is 'submitted' waiting for AI)
  const { data: submissionResp, isLoading, refetch } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmissionDetail(submissionId!),
    enabled: !!submissionId,
    refetchInterval: shouldPoll ? 3000 : false,
  });

  const submission = submissionResp?.data;

  useEffect(() => {
    if (submission?.status === 'submitted') {
      setShouldPoll(true);
    } else {
      setShouldPoll(false);
    }
  }, [submission?.status]);

  const exam = submission?.exam;
  const questions: Question[] = exam?.questions || [];

  // Initialize Zustand store answers from backend on load
  useEffect(() => {
    if (submission && Object.keys(currentAnswers).length === 0) {
      const backendAnswers = (submission.answers || []) as Array<{ questionId: string; answer: string }>;
      const answersMap: Record<string, string> = {};
      if (Array.isArray(backendAnswers)) {
        backendAnswers.forEach((item) => {
          if (item && item.questionId) {
            answersMap[item.questionId] = item.answer;
          }
        });
      }
      Object.entries(answersMap).forEach(([qId, val]) => {
        setAnswer(qId, val);
      });
      lastSavedRef.current = { ...answersMap };
    }
  }, [submission, setAnswer, currentAnswers]);

  // 3. Timer engine
  useEffect(() => {
    if (!submission || submission.status !== 'in_progress') return;

    if (!submission.exam) return;
    const startTime = new Date(submission.startAt).getTime();
    const durationMs = submission.exam.duration * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);
        handleAutoSubmit();
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [submission]);

  // 4. Autosave loop
  useEffect(() => {
    if (!submissionId || submission?.status !== 'in_progress') return;

    const interval = setInterval(() => {
      const hasChanges = JSON.stringify(currentAnswers) !== JSON.stringify(lastSavedRef.current);
      if (hasChanges) {
        const formattedAnswers = Object.entries(currentAnswers).map(([qId, val]) => ({
          questionId: qId,
          answer: val,
        }));
        autosaveAnswers(submissionId, { answers: formattedAnswers })
          .then(() => {
            lastSavedRef.current = { ...currentAnswers };
          })
          .catch((err) => console.error('Autosave failed:', err));
      }
    }, 12000); // Save every 12 seconds if changes occur

    return () => clearInterval(interval);
  }, [submissionId, currentAnswers, submission?.status]);

  // 5. Submit handlers
  const handleFinalSubmit = useCallback(async (isAuto = false) => {
    if (!submissionId) return;
    setIsSubmitting(true);

    try {
      // Perform a final save before submitting
      const formattedAnswers = Object.entries(currentAnswers).map(([qId, val]) => ({
        questionId: qId,
        answer: val,
      }));
      await autosaveAnswers(submissionId, { answers: formattedAnswers });
      await submitSubmission(submissionId);

      queryClient.invalidateQueries({ queryKey: ['student-exams'] });
      refetch(); // Trigger re-evaluation of status
      toast.success(isAuto ? 'Bài thi hết giờ và đã nộp tự động!' : 'Nộp bài thi thành công!');
    } catch (err: any) {
      toast.error('Gặp lỗi khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [submissionId, currentAnswers, queryClient, refetch]);

  const handleAutoSubmit = useCallback(() => {
    handleFinalSubmit(true);
  }, [handleFinalSubmit]);

  const handleSubmitClick = () => {
    const answeredCount = Object.keys(currentAnswers).length;
    const unansweredCount = questions.length - answeredCount;

    let confirmMsg = 'Bạn có chắc chắn muốn nộp bài thi không?';
    if (unansweredCount > 0) {
      confirmMsg += ` (Lưu ý: bạn còn ${unansweredCount} câu hỏi chưa hoàn thành)`;
    }

    if (window.confirm(confirmMsg)) {
      handleFinalSubmit(false);
    }
  };

  // Navigations
  const handleNext = () => {
    if (activeQuestionIdx < questions.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    }
  };

  const handlePrev = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Loading state
  if (isLoading || !submission || timeLeft === null && submission.status === 'in_progress') {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-semibold">Đang chuẩn bị đề thi của bạn...</p>
      </div>
    );
  }

  // MÀN HÌNH CHỜ AI CHẤM ĐIỂM (AI Grading Transition)
  if (submission.status === 'submitted' && !submission.result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xl">
            <Sparkles size={36} className="text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-extrabold font-outfit text-foreground mb-2">
          AI đang chấm điểm bài làm của bạn
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Hệ thống AI đang chấm điểm tự động các câu trắc nghiệm và đánh giá chất lượng câu trả lời tự luận của bạn. Quá trình này thường mất khoảng 5-15 giây.
        </p>

        <div className="w-full bg-muted border border-border rounded-2xl p-5 space-y-3.5 mb-8 text-left text-xs font-semibold">
          <div className="flex items-center gap-3 text-emerald-500">
            <CheckCircle size={16} />
            <span>Nộp bài thi thành công</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-500">
            <CheckCircle size={16} />
            <span>Đồng bộ dữ liệu đáp án</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span>AI đang phân tích câu hỏi & chấm điểm...</span>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="px-6 py-2.5 bg-card hover:bg-muted border border-border rounded-xl font-bold text-sm text-foreground transition-all flex items-center gap-2"
        >
          <Loader2 size={14} className="animate-spin" />
          Kiểm tra trạng thái chấm điểm
        </button>
      </div>
    );
  }

  // MÀN HÌNH ĐÃ CHẤM XONG (Graded - Show result button)
  if (submission.status === 'graded' || submission.result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-xl font-extrabold font-outfit text-foreground mb-2">
          Đã có kết quả thi!
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Bài kiểm tra của bạn đã được chấm điểm hoàn tất bởi AI. Bạn có thể xem kết quả chi tiết kèm nhận xét từng câu ngay bây giờ.
        </p>

        <button
          onClick={() => navigate(`/assessments/result/${submissionId}`)}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-950/20 transition-all"
        >
          Xem kết quả chi tiết
        </button>
      </div>
    );
  }

  // MÀN HÌNH LÀM BÀI (Active Exam Runner)
  const currentQuestion: Question = questions[activeQuestionIdx];
  const selectedAnswer = currentAnswers[currentQuestion?.id] || '';

  const handleSelectOption = (option: string) => {
    setAnswer(currentQuestion.id, option);
  };

  const answeredCount = Object.keys(currentAnswers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isTimeCritical = timeLeft !== null && timeLeft <= 300;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Main Question Interface */}
      <div className="flex-1 bg-card border border-border rounded-2xl p-6 shadow-sm w-full flex flex-col justify-between min-h-[460px]">
        {currentQuestion ? (
          <div>
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">
                  Câu hỏi {activeQuestionIdx + 1} / {questions.length}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-bold uppercase">
                  {currentQuestion.points} Điểm
                </span>
              </div>
              <div className={`flex items-center gap-1.5 font-extrabold px-3.5 py-1.5 rounded-xl text-sm transition-all duration-300 ${
                isTimeCritical
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'
                  : 'bg-amber-500/10 text-amber-550 border border-amber-500/20'
              }`}>
                <Clock size={15} />
                <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
              </div>
            </div>

            {/* Question Prompt */}
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-6 leading-relaxed whitespace-pre-wrap font-outfit">
              {currentQuestion.prompt}
            </h3>

            {/* Question Answers Input depending on type */}
            <div className="mt-4">
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3">
                  {(currentQuestion.options as string[]).map((option, idx) => {
                    const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected = selectedAnswer === option;

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(option)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary/5 border-primary text-primary font-semibold'
                            : 'bg-card border-border text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <span className={`h-7 w-7 flex items-center justify-center rounded-lg border text-xs font-bold shrink-0 ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border text-muted-foreground bg-muted/50'
                        }`}>
                          {optionLabel}
                        </span>
                        <span className={isSelected ? 'text-primary font-semibold' : 'text-foreground'}>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['Đúng', 'Sai'].map((option) => {
                    const normalizedVal = option === 'Đúng' ? 'true' : 'false';
                    const isSelected = selectedAnswer === normalizedVal;

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelectOption(normalizedVal)}
                        className={`p-5 rounded-xl border text-center transition-all duration-200 font-bold ${
                          isSelected
                            ? 'bg-primary/5 border-primary text-primary'
                            : 'bg-card border-border text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'short_answer' && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-semibold block">Nhập câu trả lời ngắn của bạn:</label>
                  <input
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) => handleSelectOption(e.target.value)}
                    placeholder="Nhập đáp án..."
                    className="w-full px-4 py-3 bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
                  />
                </div>
              )}

              {currentQuestion.type === 'essay' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted-foreground font-semibold block">Nội dung bài viết tự luận:</label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selectedAnswer.length} ký tự
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={selectedAnswer}
                    onChange={(e) => handleSelectOption(e.target.value)}
                    placeholder="Trình bày bài viết giải thích hoặc lập luận của bạn tại đây..."
                    className="w-full p-4 bg-card border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm leading-relaxed resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
            <HelpCircle size={40} className="mb-2 opacity-50" />
            <p className="text-sm font-semibold">Đề thi chưa có câu hỏi nào.</p>
          </div>
        )}

        {/* Footer Question Nav */}
        <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
          <button
            onClick={handlePrev}
            disabled={activeQuestionIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-border disabled:opacity-30 disabled:hover:bg-transparent hover:bg-muted rounded-xl text-sm transition-all font-semibold text-foreground"
          >
            <ChevronLeft size={16} />
            <span>Quay lại</span>
          </button>

          <button
            onClick={handleNext}
            disabled={activeQuestionIdx === questions.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 border border-border disabled:opacity-30 disabled:hover:bg-transparent hover:bg-muted rounded-xl text-sm transition-all font-semibold text-foreground"
          >
            <span>Tiếp theo</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Control Navigation & Submission Sidebar */}
      <div className="w-full lg:w-80 space-y-6 shrink-0">
        {/* Navigation Grid */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-foreground">
              Bản đồ câu hỏi
            </h4>
            <span className="text-[10px] text-primary font-bold">
              Đã làm {answeredCount}/{questions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const isAnswered = !!currentAnswers[q.id];
              const isActive = activeQuestionIdx === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    isActive
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                      : isAnswered
                      ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                      : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Guidelines */}
          <div className="flex flex-col gap-2 mt-6 text-[10px] text-muted-foreground border-t border-border pt-4 font-semibold">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-primary" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-primary/10 border border-primary/20" />
              <span>Đã chọn đáp án</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-muted border border-border" />
              <span>Chưa làm</span>
            </div>
          </div>
        </div>

        {/* Submit action */}
        <button
          onClick={handleSubmitClick}
          disabled={isSubmitting || questions.length === 0}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-950/20 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              <span>Đang nộp bài...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Nộp bài thi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StudentExamPage;
