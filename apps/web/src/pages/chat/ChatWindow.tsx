import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchChatMessages, 
  explainTopic, 
  summarizeMaterial, 
  generateQuiz,
  ChatSession 
} from '../../services/chat';
import { fetchClassrooms, fetchLessonsByCourse, Lesson } from '../../services/academic';
import { fetchMaterials, Material } from '../../services/learning';
import { useChatStream } from '../../hooks/useChatStream';
import { MessageContent } from '../../components/chat/MessageContent';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  Sparkles, 
  StopCircle, 
  ArrowDown, 
  BookOpen, 
  HelpCircle,
  FileText,
  AlertTriangle,
  Lightbulb,
  X
} from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const queryClient = useQueryClient();

  const [messageInput, setMessageInput] = useState('');
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Quick Toolkit states
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<'explain' | 'summarize' | 'quiz' | null>(null);
  const [explainText, setExplainText] = useState('');
  
  // RAG selection helper states
  const [tempCourseId, setTempCourseId] = useState('');
  const [tempLessonId, setTempLessonId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizCount, setQuizCount] = useState(5);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Session Info from local query cache (created in Dashboard)
  const sessionsCache = queryClient.getQueryData<{ data?: ChatSession[] }>(['chatSessions']);
  const sessions = sessionsCache?.data || [];
  const currentSession = sessions.find((s) => s.id === sessionId);
  const classId = currentSession?.classId;

  // 2. Fetch Chat Messages history
  const { data: messagesResp, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: () => fetchChatMessages(sessionId),
    enabled: !!sessionId,
  });
  const messages = messagesResp?.data || [];

  // 3. Fetch courses list (for AI Document RAG tools)
  const { data: classroomsResp } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClassrooms(),
    enabled: isToolModalOpen && (activeTool === 'summarize' || activeTool === 'quiz'),
  });
  const classrooms = classroomsResp?.data || [];

  // Fetch Lessons of selected course
  const selectedClassroom = classrooms.find(c => c.id === tempCourseId);
  const courseId = selectedClassroom?.courseId;

  const { data: lessonsResp } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => fetchLessonsByCourse(courseId || ''),
    enabled: !!courseId,
  });
  const lessons = lessonsResp?.data || [];

  // Fetch Materials of selected lesson
  const { data: materialsResp } = useQuery({
    queryKey: ['materials', tempLessonId],
    queryFn: () => fetchMaterials({ lessonId: tempLessonId }),
    enabled: !!tempLessonId,
  });
  const materials = (materialsResp?.data || []).filter(m => m.status === 'ready');

  // 4. SSE Stream Hook
  const { sendMessageStream, stopStreaming, streamingContent, isStreaming } = useChatStream(sessionId);

  // Scroll logic
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If scrolled up from bottom by more than 120px
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowJumpToBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages list size changes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Scroll to bottom during active token stream updates (if user is locked to bottom)
  useEffect(() => {
    if (!showJumpToBottom) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingContent]);

  // AI explain Topic Mutation
  const explainMutation = useMutation({
    mutationFn: explainTopic,
    onSuccess: (resp) => {
      setIsToolModalOpen(false);
      setExplainText('');
      setActiveTool(null);
      // Trigger a clean stream request passing the topic as prompt so it records in session history
      sendMessageStream(`Hãy giải thích chi tiết chủ đề: "${explainText}". Trả lời dựa trên giải thích tóm tắt: ${resp.data?.explanation}`, () => {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi giải thích: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // AI Summarize Mutation
  const summarizeMutation = useMutation({
    mutationFn: summarizeMaterial,
    onSuccess: (resp) => {
      setIsToolModalOpen(false);
      setSelectedMaterialId('');
      setTempLessonId('');
      setTempCourseId('');
      setActiveTool(null);
      // Trigger stream passing summary content
      sendMessageStream(`Tóm tắt nội dung tài liệu học tập có sẵn: ${resp.data?.summary}`, () => {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tóm tắt tài liệu: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // AI Quiz Mutation
  const quizMutation = useMutation({
    mutationFn: generateQuiz,
    onSuccess: () => {
      setIsToolModalOpen(false);
      setSelectedMaterialId('');
      setTempLessonId('');
      setTempCourseId('');
      setActiveTool(null);
      // Post prompt to load quiz
      sendMessageStream(`Tạo cho tôi bài tập trắc nghiệm thử thách từ tài liệu đã chọn với độ khó ${quizDifficulty} gồm ${quizCount} câu.`, () => {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo bài tập: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isStreaming) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Optimistically push the User message to the query client cache instantly
    queryClient.setQueryData(['chatMessages', sessionId], (old: { data: unknown[] } | undefined) => {
      const prevList = old?.data || [];
      return {
        ...old,
        data: [
          ...prevList,
          {
            id: 'temp-user-msg',
            sessionId,
            sender: 'user',
            content,
            createdAt: new Date().toISOString()
          }
        ]
      };
    });

    // Fire SSE Streaming call
    await sendMessageStream(content, () => {
      // Re-sync official database list when done
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-card/10 relative">
      
      {/* 1. Header Details */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-center shrink-0 h-16">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-xs font-outfit uppercase tracking-wider text-muted-foreground truncate max-w-[200px] md:max-w-sm">
            {currentSession?.title || 'Phiên hội thoại active'}
          </span>
          {classId && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold uppercase tracking-wider">
              RAG Active
            </span>
          )}
        </div>

        {/* Quick Tools Button */}
        <button
          onClick={() => setIsToolModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-xl text-xs font-semibold transition-all"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>Hỏi nhanh AI</span>
        </button>
      </div>

      {/* 2. Chat Messages Panel */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isMessagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="p-16 text-center max-w-md mx-auto space-y-4">
            <Lightbulb size={36} className="text-amber-500 mx-auto animate-pulse" />
            <h3 className="font-bold text-sm">Bắt đầu hội thoại học tập</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhập câu hỏi học thuật ở khung chat bên dưới hoặc bấm nút "Hỏi nhanh AI" ở góc trên để tạo câu hỏi trắc nghiệm thử thách.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isUser = message.sender === 'user';
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm flex flex-col gap-1 ${
                    isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border border-border text-foreground'
                  }`}>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">
                      {isUser ? 'Bạn' : 'AI Tutor'}
                    </span>
                    <MessageContent content={message.content} />
                  </div>
                </div>
              );
            })}

            {/* SSE Realtime Token streaming bubble */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-4 bg-card border border-border text-foreground shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">AI Tutor</span>
                  {streamingContent ? (
                    <div className="relative">
                      <MessageContent content={streamingContent} />
                      <span className="inline-block h-3 w-1.5 bg-primary ml-1 animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-1 animate-pulse">
                      <Loader2 className="animate-spin text-primary" size={14} />
                      <span>AI đang suy nghĩ...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Jump to Bottom Notifier */}
      {showJumpToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2.5 bg-slate-900 border border-slate-800 text-white hover:text-primary rounded-full shadow-lg z-10 animate-bounce transition-colors"
          title="Cuộn xuống tin mới"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* 3. Message Input Form */}
      <div className="p-4 border-t border-border bg-card shrink-0 space-y-3">
        {isStreaming && (
          <div className="flex justify-center">
            <button
              onClick={stopStreaming}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <StopCircle size={14} />
              <span>Dừng tạo câu trả lời</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              required
              disabled={isStreaming}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'Chờ AI trả lời...' : 'Hỏi trợ lý ảo... (nhấn Enter để gửi)'}
              maxLength={1500}
              className="w-full pl-4 pr-16 py-3 bg-muted/40 border border-input focus:outline-none focus:ring-1 focus:ring-primary rounded-xl text-xs md:text-sm resize-none leading-relaxed transition-all max-h-32 min-h-[46px] disabled:opacity-50"
            />
            <span className="absolute right-3 bottom-3.5 text-[10px] text-muted-foreground/60 font-semibold select-none">
              {messageInput.length}/1500
            </span>
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim() || isStreaming}
            className="p-3 bg-primary hover:bg-primary/95 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground rounded-xl shadow transition-all shrink-0 h-[46px] w-[46px] flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* AI TOOLKIT MODAL */}
      <AnimatePresence>
        {isToolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black opacity-60" onClick={() => {
              if (!explainMutation.isPending && !summarizeMutation.isPending && !quizMutation.isPending) {
                setIsToolModalOpen(false);
                setActiveTool(null);
              }
            }} />
            
            <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl z-10 flex flex-col space-y-4">
              
              {/* Overlay Loader */}
              {(explainMutation.isPending || summarizeMutation.isPending || quizMutation.isPending) && (
                <div className="absolute inset-0 bg-card/85 rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Loader2 className="animate-spin text-primary" size={36} />
                  <h4 className="font-bold text-sm font-outfit">AI đang xử lý yêu cầu...</h4>
                  <p className="text-xs text-muted-foreground">Trợ lý ảo đang phân tích tri thức RAG để chuẩn bị câu trả lời.</p>
                </div>
              )}

              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="font-bold text-sm uppercase font-outfit tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                  <span>Trợ lý học tập AI nâng cao</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsToolModalOpen(false);
                    setActiveTool(null);
                  }} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tool selector buttons if no active tool */}
              {!activeTool ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
                  <button
                    onClick={() => setActiveTool('explain')}
                    className="p-4 bg-muted/40 hover:bg-primary/5 border border-border hover:border-primary/20 rounded-xl text-center space-y-2 group transition-all"
                  >
                    <BookOpen size={24} className="mx-auto text-primary group-hover:scale-105 transition-transform" />
                    <div className="font-semibold text-xs text-foreground">Giải thích chủ đề</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">AI giải thích sâu khái niệm khó</div>
                  </button>

                  <button
                    onClick={() => setActiveTool('summarize')}
                    className="p-4 bg-muted/40 hover:bg-primary/5 border border-border hover:border-primary/20 rounded-xl text-center space-y-2 group transition-all"
                  >
                    <FileText size={24} className="mx-auto text-primary group-hover:scale-105 transition-transform" />
                    <div className="font-semibold text-xs text-foreground">Tóm tắt tài liệu</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">Tóm lược giáo trình bài giảng</div>
                  </button>

                  <button
                    onClick={() => setActiveTool('quiz')}
                    className="p-4 bg-muted/40 hover:bg-primary/5 border border-border hover:border-primary/20 rounded-xl text-center space-y-2 group transition-all"
                  >
                    <HelpCircle size={24} className="mx-auto text-primary group-hover:scale-105 transition-transform" />
                    <div className="font-semibold text-xs text-foreground">Tạo bài tập thử thách</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">Tự dựng trắc nghiệm ôn tập</div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Tool Back Navigation */}
                  <button 
                    onClick={() => {
                      setActiveTool(null);
                      setExplainText('');
                      setSelectedMaterialId('');
                      setTempLessonId('');
                      setTempCourseId('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                  >
                    <span>&larr; Chọn công cụ khác</span>
                  </button>

                  {/* 1. EXPLAIN TOPIC FORM */}
                  {activeTool === 'explain' && (
                    <form onSubmit={(e) => { e.preventDefault(); explainMutation.mutate({ topic: explainText }); }} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Chủ đề/Khái niệm cần giải nghĩa</label>
                        <input
                          type="text"
                          required
                          value={explainText}
                          onChange={(e) => setExplainText(e.target.value)}
                          placeholder="Ví dụ: Định luật Boyle-Mariotte, Tích phân từng phần..."
                          className="px-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow"
                      >
                        Yêu cầu AI giải thích
                      </button>
                    </form>
                  )}

                  {/* 2. SUMMARIZE DOCUMENT FORM */}
                  {activeTool === 'summarize' && (
                    <form onSubmit={(e) => { e.preventDefault(); summarizeMutation.mutate({ materialId: selectedMaterialId }); }} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Lớp học</label>
                          <select 
                            required 
                            value={tempCourseId} 
                            onChange={(e) => { setTempCourseId(e.target.value); setTempLessonId(''); setSelectedMaterialId(''); }}
                            className="px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs"
                          >
                            <option value="">Chọn lớp học</option>
                            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Bài học</label>
                          <select 
                            required 
                            disabled={!tempCourseId}
                            value={tempLessonId} 
                            onChange={(e) => { setTempLessonId(e.target.value); setSelectedMaterialId(''); }}
                            className="px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs disabled:opacity-50"
                          >
                            <option value="">Chọn bài học</option>
                            {lessons.map((l: Lesson) => <option key={l.id} value={l.id}>Bài {l.orderNo}: {l.title}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Chọn tài liệu học tập RAG</label>
                        <select 
                          required 
                          disabled={!tempLessonId}
                          value={selectedMaterialId} 
                          onChange={(e) => setSelectedMaterialId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-muted/40 border border-input rounded-xl text-xs disabled:opacity-50"
                        >
                          <option value="">Chọn tài liệu</option>
                          {materials.map((m: Material) => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                      </div>

                      {tempLessonId && materials.length === 0 && (
                        <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-1.5">
                          <AlertTriangle size={12} />
                          <span>Bài học này chưa có tài liệu chỉ mục RAG hoàn thành!</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!selectedMaterialId}
                        className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow disabled:opacity-50"
                      >
                        Tạo tóm tắt tài liệu
                      </button>
                    </form>
                  )}

                  {/* 3. GENERATE PRACTICE QUIZ FORM */}
                  {activeTool === 'quiz' && (
                    <form onSubmit={(e) => { e.preventDefault(); quizMutation.mutate({ materialId: selectedMaterialId, difficulty: quizDifficulty, count: quizCount }); }} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Lớp học</label>
                          <select 
                            required 
                            value={tempCourseId} 
                            onChange={(e) => { setTempCourseId(e.target.value); setTempLessonId(''); setSelectedMaterialId(''); }}
                            className="px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs"
                          >
                            <option value="">Chọn lớp học</option>
                            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Bài học</label>
                          <select 
                            required 
                            disabled={!tempCourseId}
                            value={tempLessonId} 
                            onChange={(e) => { setTempLessonId(e.target.value); setSelectedMaterialId(''); }}
                            className="px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs disabled:opacity-50"
                          >
                            <option value="">Chọn bài học</option>
                            {lessons.map((l: Lesson) => <option key={l.id} value={l.id}>Bài {l.orderNo}: {l.title}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Chọn tài liệu nguồn RAG</label>
                        <select 
                          required 
                          disabled={!tempLessonId}
                          value={selectedMaterialId} 
                          onChange={(e) => setSelectedMaterialId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-muted/40 border border-input rounded-xl text-xs disabled:opacity-50"
                        >
                          <option value="">Chọn tài liệu</option>
                          {materials.map((m: Material) => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Độ khó</label>
                          <select 
                            value={quizDifficulty} 
                            onChange={(e) => setQuizDifficulty(e.target.value)}
                            className="px-3 py-2 bg-muted/40 border border-input rounded-xl text-xs"
                          >
                            <option value="easy">Dễ (Easy)</option>
                            <option value="medium">Vừa (Medium)</option>
                            <option value="hard">Khó (Hard)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Số câu hỏi</label>
                          <input 
                            type="number" 
                            min={1} 
                            max={10} 
                            value={quizCount} 
                            onChange={(e) => setQuizCount(Number(e.target.value) || 5)}
                            className="px-3 py-1.5 bg-muted/40 border border-input rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!selectedMaterialId}
                        className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow disabled:opacity-50"
                      >
                        Tạo câu hỏi trắc nghiệm
                      </button>
                    </form>
                  )}

                </div>
              )}

            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
