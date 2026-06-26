import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  ChevronLeft,
  Award,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  HelpCircle,
  Info,
  Calendar,
  FileText
} from 'lucide-react';
import { getSubmissionDetail, Question } from '../../services/assessments';

export const StudentResultPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();

  // Fetch complete submission details (contains result and exam questions)
  const { data: submissionResp, isLoading, error } = useQuery({
    queryKey: ['submission-result', submissionId],
    queryFn: () => getSubmissionDetail(submissionId!),
    enabled: !!submissionId,
  });

  const submission = submissionResp?.data;
  const exam = submission?.exam;
  const questions: Question[] = exam?.questions || [];
  const result = submission?.result;

  const handleBack = () => {
    navigate('/assessments');
  };

  // Helper: calculate time spent in minutes
  const formatTimeSpent = () => {
    if (!submission?.startAt || !submission?.submittedAt) return 'Không rõ';
    const start = new Date(submission.startAt).getTime();
    const end = new Date(submission.submittedAt).getTime();
    const diffMs = end - start;
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins} phút ${secs} giây`;
  };

  // Helper: format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-semibold">Đang tải kết quả thi của bạn...</p>
      </div>
    );
  }

  if (error || !submission || !result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <XCircle size={48} className="text-red-500 mb-4 opacity-80" />
        <h3 className="font-bold text-foreground mb-1">Không tìm thấy kết quả</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Đã có lỗi xảy ra hoặc bài làm thi này chưa có kết quả chấm điểm.
        </p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 bg-card border border-border hover:bg-muted text-foreground font-bold text-sm rounded-xl transition-all"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Parse feedback JSON
  const feedback = result.feedback as {
    comment?: string;
    perQuestionFeedback?: Record<string, { score: number; maxScore: number; comment: string }>;
  } | undefined;

  const totalPoints = questions.reduce((sum: number, q: Question) => sum + q.points, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} />
        <span>Quay lại Bài thi & Kiểm tra</span>
      </button>

      {/* Main Grid: Overview & Questions breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Overview Panel */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-center flex flex-col items-center">
            <h2 className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-wider">
              Kết quả đánh giá
            </h2>

            {/* Score circle */}
            <div className="relative h-36 w-36 flex items-center justify-center mb-6">
              {/* Decorative radial gradients */}
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl" />
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-muted fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={`${(result.score / 10) * 263.8} 263.8`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold font-outfit text-foreground leading-none">
                  {result.score.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Thang điểm 10</span>
              </div>
            </div>

            {/* Quick Metadata */}
            <div className="w-full border-t border-border pt-5 space-y-3.5 text-xs text-left font-semibold text-muted-foreground">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-muted-foreground" /> Ngày nộp:</span>
                <span className="text-foreground">{formatDate(submission.submittedAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground" /> Thời gian làm:</span>
                <span className="text-foreground">{formatTimeSpent()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Award size={14} className="text-muted-foreground" /> Tổng điểm thực:</span>
                <span className="text-foreground">
                  {questions.reduce((sum: number, q: Question) => {
                    const qFeedback = feedback?.perQuestionFeedback?.[q.id];
                    return sum + (qFeedback?.score || 0);
                  }, 0).toFixed(1)} / {totalPoints.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* AI General Feedback */}
          {feedback?.comment && (
            <div className="relative overflow-hidden bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
              <div className="absolute right-0 top-0 w-1/4 h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]" />
              <div className="flex items-center gap-2 mb-3.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles size={14} className="text-primary animate-pulse" />
                </div>
                <h3 className="font-extrabold text-sm text-primary font-outfit">Nhận xét chung của AI</h3>
              </div>
              <p className="text-xs text-primary leading-relaxed font-medium">
                {feedback.comment}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Questions breakdown */}
        <div className="space-y-5 lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-5 flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Chi tiết câu trả lời
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const backendAnswers = (submission.answers || []) as Array<{ questionId: string; answer: string }>;
                const studentAnswer = Array.isArray(backendAnswers)
                  ? backendAnswers.find((item) => item?.questionId === q.id)?.answer || ''
                  : '';
                const qFeedback = feedback?.perQuestionFeedback?.[q.id];
                const achievedScore = qFeedback?.score ?? 0;
                const maxScore = q.points;

                // Color schemes based on score accuracy
                let cardBorderCls = 'border-border hover:border-primary/20';
                let scoreCls = 'bg-muted text-muted-foreground border-border';

                if (achievedScore === maxScore) {
                  cardBorderCls = 'border-emerald-500/30 hover:border-emerald-500/40';
                  scoreCls = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                } else if (achievedScore === 0) {
                  cardBorderCls = 'border-red-500/30 hover:border-red-500/40';
                  scoreCls = 'bg-red-500/10 text-red-500 border-red-500/20';
                } else {
                  cardBorderCls = 'border-amber-500/30 hover:border-amber-500/40';
                  scoreCls = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                }

                return (
                  <div
                    key={q.id}
                    className={`bg-card border rounded-2xl p-5 transition-all duration-200 ${cardBorderCls}`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-muted-foreground">
                          Câu hỏi {idx + 1}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-bold uppercase">
                          {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}
                        </span>
                        {achievedScore === maxScore ? (
                          <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                            <CheckCircle size={10} />
                            Chính xác
                          </span>
                        ) : achievedScore === 0 ? (
                          <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold uppercase">
                            <XCircle size={10} />
                            Chưa chính xác
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold uppercase">
                            <Info size={10} />
                            Đúng một phần
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] px-2.5 py-0.5 rounded-lg border font-bold ${scoreCls}`}>
                        Đạt {achievedScore.toFixed(1)} / {maxScore.toFixed(1)} điểm
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <p className="text-sm font-semibold text-foreground mb-4 whitespace-pre-wrap">
                      {q.prompt}
                    </p>

                    {/* Display options if MCQ */}
                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-2 mb-4">
                        {(q.options as string[]).map((option, oIdx) => {
                          const optionLabel = String.fromCharCode(65 + oIdx);
                          
                          // Check if answerKey matches option text, index, or label
                          const isCorrect = 
                            q.answerKey === option ||
                            String(q.answerKey) === String(oIdx) ||
                            String(q.answerKey) === optionLabel;

                          // Check if studentAnswer matches option text, index, or label
                          const isSelected = 
                            studentAnswer === option ||
                            String(studentAnswer) === String(oIdx) ||
                            String(studentAnswer) === optionLabel;

                          let itemCls = 'bg-muted/30 border-border text-foreground';
                          let labelCls = 'border-border text-muted-foreground bg-muted';

                          if (isCorrect) {
                            itemCls = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold';
                            labelCls = 'bg-emerald-500 border-emerald-500 text-white';
                          } else if (isSelected) {
                            itemCls = 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 font-semibold';
                            labelCls = 'bg-red-500 border-red-500 text-white';
                          }

                          return (
                            <div
                              key={option}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs gap-4 ${itemCls}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`h-6.5 w-6.5 flex items-center justify-center rounded-lg border text-[10px] font-bold ${labelCls}`}>
                                  {optionLabel}
                                </span>
                                <span>{option}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider">
                                {isCorrect && isSelected && (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    Đáp án của bạn (Đúng)
                                  </span>
                                )}
                                {isCorrect && !isSelected && (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    Đáp án đúng
                                  </span>
                                )}
                                {!isCorrect && isSelected && (
                                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <XCircle size={12} />
                                    Đáp án của bạn (Sai)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Display True/False response */}
                    {q.type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {['Đúng', 'Sai'].map((option) => {
                          const normalizedVal = option === 'Đúng' ? 'true' : 'false';
                          
                          // Check if answerKey matches boolean string or Vietnamese text
                          const isCorrect = 
                            String(q.answerKey).toLowerCase() === normalizedVal ||
                            String(q.answerKey).toLowerCase() === option.toLowerCase();

                          // Check if studentAnswer matches boolean string or Vietnamese text
                          const isSelected = 
                            String(studentAnswer).toLowerCase() === normalizedVal ||
                            String(studentAnswer).toLowerCase() === option.toLowerCase();

                          let itemCls = 'bg-muted/30 border-border text-muted-foreground';
                          if (isCorrect) {
                            itemCls = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold';
                          } else if (isSelected) {
                            itemCls = 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 font-bold';
                          }

                          return (
                            <div
                              key={option}
                              className={`p-3 rounded-xl border text-center text-xs flex flex-col items-center justify-center gap-1.5 ${itemCls}`}
                            >
                              <span className="font-semibold">{option}</span>
                              <div className="text-[9px] font-bold uppercase tracking-wider">
                                {isCorrect && isSelected && (
                                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-center">
                                    <CheckCircle size={10} /> Bạn chọn (Đúng)
                                  </span>
                                )}
                                {isCorrect && !isSelected && (
                                  <span className="text-emerald-600 dark:text-emerald-400">Đáp án đúng</span>
                                )}
                                {!isCorrect && isSelected && (
                                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1 justify-center">
                                    <XCircle size={10} /> Bạn chọn (Sai)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer / Essay text response display */}
                    {(q.type === 'short_answer' || q.type === 'essay') && (
                      <div className="mb-4 space-y-2">
                        <div className="p-4 bg-muted/30 border border-border rounded-xl text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                          <span className="text-[10px] text-muted-foreground font-bold block mb-1 uppercase tracking-wider">Bài làm của bạn:</span>
                          {studentAnswer || <span className="text-muted-foreground italic">Không có câu trả lời</span>}
                        </div>
                        {q.answerKey && (
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs leading-relaxed text-emerald-600">
                            <span className="text-[10px] text-emerald-500/70 font-bold block mb-1 uppercase tracking-wider">Đáp án chuẩn:</span>
                            {String(q.answerKey)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI explanation and per-question comments */}
                    <div className="space-y-2.5 mt-3 pt-3 border-t border-border text-xs leading-relaxed font-semibold">
                      {qFeedback?.comment && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-primary flex items-start gap-2">
                          <Sparkles size={14} className="text-primary shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="text-[10px] text-primary font-bold block uppercase tracking-wider">Phản hồi của AI:</span>
                            <span className="font-medium text-[11px]">{qFeedback.comment}</span>
                          </div>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="p-3 bg-muted/50 border border-border rounded-xl text-muted-foreground flex items-start gap-2">
                          <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">Giải thích chi tiết:</span>
                            <span className="font-medium text-[11px] text-muted-foreground">{q.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResultPage;
