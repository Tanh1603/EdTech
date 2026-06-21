import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamRunnerStore } from '../state/useExamRunnerStore';
import { ChevronLeft, ChevronRight, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';

const QUESTIONS = [
  {
    id: 'q1',
    question: 'Trong các thuật toán tìm kiếm sau, thuật toán nào có độ phức tạp thời gian trung bình tốt nhất trong trường hợp tổng quát?',
    options: ['Linear Search', 'Binary Search', 'Bubble Sort', 'Linear Interpolation'],
    answer: 'Binary Search'
  },
  {
    id: 'q2',
    question: 'Giao thức truyền tải siêu văn bản bảo mật (HTTPS) mặc định chạy trên cổng (Port) nào?',
    options: ['80', '8080', '443', '22'],
    answer: '443'
  },
  {
    id: 'q3',
    question: 'Trong React, Hook nào được sử dụng để tối ưu hiệu năng bằng cách cache giá trị tính toán giữa các lần re-render?',
    options: ['useEffect', 'useMemo', 'useCallback', 'useRef'],
    answer: 'useMemo'
  },
  {
    id: 'q4',
    question: 'Trong cơ sở dữ liệu quan hệ, ràng buộc Foreign Key dùng để làm gì?',
    options: ['Đảm bảo tính duy nhất của hàng', 'Liên kết dữ liệu giữa hai bảng', 'Tăng tốc độ truy vấn', 'Tự động tăng giá trị'],
    answer: 'Liên kết dữ liệu giữa hai bảng'
  },
  {
    id: 'q5',
    question: 'Để xây dựng mô hình AI sinh văn bản, kiến trúc học sâu nào đang là nền tảng phổ biến nhất hiện nay?',
    options: ['Convolutional Neural Network (CNN)', 'Recurrent Neural Network (RNN)', 'Transformer', 'Generative Adversarial Network (GAN)'],
    answer: 'Transformer'
  }
];

export const ExamPlaceholder: React.FC = () => {
  useParams(); // Call hook to trigger react-router state if needed, without unused warning
  const navigate = useNavigate();
  const { currentAnswers, activeQuestionIdx, setAnswer, setActiveQuestionIdx, clearAnswers } = useExamRunnerStore();

  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  const submitExam = useCallback((isAuto: boolean) => {
    // Grade exam locally
    let score = 0;
    QUESTIONS.forEach((q) => {
      if (currentAnswers[q.id] === q.answer) {
        score += 1;
      }
    });

    toast.success(`Nộp bài thành công! Điểm số: ${score}/${QUESTIONS.length}`);
    clearAnswers();
    // Navigate back to assessments
    navigate('/assessments');
  }, [currentAnswers, clearAnswers, navigate]);

  const handleAutoSubmit = useCallback(() => {
    toast.error('Hết giờ làm bài! Bài thi của bạn đã được tự động nộp.');
    submitExam(true);
  }, [submitExam]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = QUESTIONS[activeQuestionIdx];
  const selectedOption = currentAnswers[currentQuestion.id] || '';

  const handleSelectOption = (option: string) => {
    setAnswer(currentQuestion.id, option);
  };

  const handleNext = () => {
    if (activeQuestionIdx < QUESTIONS.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    }
  };

  const handlePrev = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    }
  };

  const handleSubmitClick = () => {
    const unansweredCount = QUESTIONS.length - Object.keys(currentAnswers).length;
    let message = 'Bạn chắc chắn muốn nộp bài thi?';
    if (unansweredCount > 0) {
      message += ` (Còn ${unansweredCount} câu hỏi chưa trả lời)`;
    }
    const confirmSubmit = window.confirm(message);
    if (confirmSubmit) {
      submitExam(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
      {/* Question Card */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl w-full flex flex-col justify-between min-h-[400px]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <span className="text-sm font-semibold text-primary">
              Câu hỏi {activeQuestionIdx + 1} trên {QUESTIONS.length}
            </span>
            <div className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-xl text-sm">
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Question Text */}
          <h3 className="text-lg font-semibold text-slate-100 mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedOption === option;

              return (
                <button
                  key={option}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-primary-foreground font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <span className={`h-7 w-7 flex items-center justify-center rounded-lg border text-xs font-bold ${
                    isSelected
                      ? 'bg-primary border-primary text-white'
                      : 'border-slate-800 text-slate-500 bg-slate-950'
                  }`}>
                    {optionLabel}
                  </span>
                  <span className={isSelected ? 'text-slate-100' : ''}>{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Footer Nav */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
          <button
            onClick={handlePrev}
            disabled={activeQuestionIdx === 0}
            className="flex items-center gap-1 px-4 py-2 border border-slate-800 disabled:opacity-30 hover:border-slate-700 rounded-xl text-sm transition-all"
          >
            <ChevronLeft size={16} />
            <span>Quay lại</span>
          </button>

          <button
            onClick={handleNext}
            disabled={activeQuestionIdx === QUESTIONS.length - 1}
            className="flex items-center gap-1 px-4 py-2 border border-slate-800 disabled:opacity-30 hover:border-slate-700 rounded-xl text-sm transition-all"
          >
            <span>Tiếp theo</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Navigation and Submission sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Navigation Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h4 className="text-sm font-bold text-slate-300 mb-4">
            Bản đồ câu hỏi
          </h4>
          <div className="grid grid-cols-5 gap-2.5">
            {QUESTIONS.map((q, idx) => {
              const isAnswered = !!currentAnswers[q.id];
              const isActive = activeQuestionIdx === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`h-10 rounded-xl text-sm font-bold border transition-all duration-200 ${
                    isActive
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                      : isAnswered
                      ? 'bg-slate-800 border-slate-700 text-primary-foreground'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 text-xs text-slate-400 border-t border-slate-800/60 pt-4">
            <div className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded bg-primary" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded bg-slate-800 border border-slate-700" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded bg-slate-950 border border-slate-800" />
              <span>Trống</span>
            </div>
          </div>
        </div>

        {/* Submit Card */}
        <button
          onClick={handleSubmitClick}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-950/20 transition-all active:scale-[0.98]"
        >
          <Send size={18} />
          <span>Nộp bài thi</span>
        </button>
      </div>
    </div>
  );
};
export default ExamPlaceholder;
