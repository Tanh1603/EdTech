import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchChatSessions, 
  createChatSession, 
  updateChatSession, 
  deleteChatSession, 
  ChatSession 
} from '../../services/chat';
import { fetchClassrooms, Classroom } from '../../services/academic';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export const ChatDashboard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState('');
  const [renameTitle, setRenameTitle] = useState('');

  // 1. Fetch Chat Sessions
  const { data: sessionsResp, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => fetchChatSessions(),
  });
  const sessions = sessionsResp?.data || [];

  // 2. Fetch Classrooms (to optionally link new chats to a class context)
  const { data: classesResp } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchClassrooms(),
  });
  const classrooms = classesResp?.data || [];

  // Create Chat Mutation
  const createChatMutation = useMutation({
    mutationFn: createChatSession,
    onSuccess: (resp) => {
      toast.success('Đã tạo phiên chat mới!');
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setIsCreateModalOpen(false);
      setNewChatTitle('');
      setSelectedClassId('');
      if (resp.data?.id) {
        navigate(`/chat/${resp.data.id}`);
      }
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi tạo chat: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // Rename Mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateChatSession(id, { title }),
    onSuccess: () => {
      toast.success('Đã đổi tên phiên hội thoại!');
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      setIsRenameModalOpen(false);
      setRenameTargetId('');
      setRenameTitle('');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi đổi tên: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteChatSession,
    onSuccess: (_, deletedId) => {
      toast.success('Đã xóa phiên hội thoại.');
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      // If deleted active session, redirect to index
      if (sessionId === deletedId) {
        navigate('/chat');
      }
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(`Lỗi xóa phiên chat: ${error.message || 'Có lỗi xảy ra'}`);
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề hội thoại');
      return;
    }
    createChatMutation.mutate({
      title: newChatTitle.trim(),
      classId: selectedClassId || undefined
    });
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitle.trim()) {
      toast.error('Tên mới không được để trống');
      return;
    }
    renameMutation.mutate({ id: renameTargetId, title: renameTitle.trim() });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên trò chuyện này không?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleRenameClick = (session: ChatSession, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenameTargetId(session.id);
    setRenameTitle(session.title);
    setIsRenameModalOpen(true);
  };

  // Welcome panel shown when no session is selected
  const renderWelcomePanel = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/10 select-none max-w-4xl mx-auto space-y-6">
      <div className="relative">
        <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-primary to-violet-500 text-white font-bold flex items-center justify-center shadow-lg shadow-primary/10">
          <Sparkles size={32} />
        </div>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold font-outfit tracking-tight">Chào mừng đến với AI Tutor Assistant</h2>
        <p className="text-xs md:text-sm text-muted-foreground max-w-md leading-relaxed mx-auto">
          Tôi là trợ lý ảo hỗ trợ học tập cá nhân hóa. Tôi có thể giúp bạn giải đáp bài tập, tóm tắt tài liệu chương học, và tạo câu hỏi luyện tập thông minh.
        </p>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        {/* Suggestion prompt cards */}
        <div 
          onClick={() => {
            setIsCreateModalOpen(true);
            setNewChatTitle('Giải thích khái niệm Đạo hàm');
          }}
          className="p-4 bg-card border border-border hover:border-primary/20 rounded-2xl text-left cursor-pointer hover:shadow transition-all group"
        >
          <span className="text-xs font-bold text-primary group-hover:underline">
            <span role="img" aria-label="lightbulb">💡</span> Giải thích chi tiết
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">"Giải thích trực quan về khái niệm Đạo hàm trong Giải tích lớp 12"</p>
        </div>

        <div 
          onClick={() => {
            setIsCreateModalOpen(true);
            setNewChatTitle('Tóm tắt tài liệu học tập');
          }}
          className="p-4 bg-card border border-border hover:border-primary/20 rounded-2xl text-left cursor-pointer hover:shadow transition-all group"
        >
          <span className="text-xs font-bold text-primary group-hover:underline">
            <span role="img" aria-label="memo">📝</span> Tóm tắt bài học
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">"Tóm tắt các ý cốt lõi và các công thức toán học quan trọng của tài liệu"</p>
        </div>
      </div>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl shadow-md shadow-primary/10 transition-all hover:-translate-y-0.5"
      >
        Bắt đầu trò chuyện mới
      </button>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 md:-m-6 overflow-hidden bg-background">
      
      {/* 1. Left Sidebar: Chat Sessions History */}
      <aside 
        className={`w-full lg:w-80 border-r border-border flex flex-col bg-card shrink-0 h-full ${
          sessionId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 h-16">
          <span className="font-bold text-sm font-outfit uppercase tracking-wider text-muted-foreground">Hội thoại trợ lý</span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-xl transition-all"
            title="Cuộc trò chuyện mới"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isSessionsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-6 text-xs text-muted-foreground">Chưa có lịch sử trò chuyện.</div>
          ) : (
            sessions.map((session: ChatSession) => {
              const isActive = sessionId === session.id;
              return (
                <Link
                  key={session.id}
                  to={`/chat/${session.id}`}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all group relative ${
                    isActive 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-8">
                    <MessageSquare size={16} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'} />
                    <span className="text-xs truncate">{session.title}</span>
                  </div>

                  {/* Actions buttons visible on hover / active */}
                  <div className={`absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${
                    isActive ? 'opacity-100' : ''
                  }`}>
                    <button
                      onClick={(e) => handleRenameClick(session, e)}
                      className={`p-1 rounded hover:bg-black/10 transition-colors ${
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Sửa tên"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(session.id, e)}
                      className={`p-1 rounded hover:bg-black/10 transition-colors ${
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-red-500'
                      }`}
                      title="Xóa"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Right Section: Active chat window or Welcome Screen */}
      <main className={`flex-1 flex flex-col h-full bg-background/50 relative overflow-hidden ${
        !sessionId ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Back button visible only on mobile inside active chat to return to list */}
        {sessionId && (
          <div className="lg:hidden p-3 border-b border-border bg-card flex items-center gap-3 shrink-0 h-16">
            <Link 
              to="/chat" 
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="font-bold text-xs font-outfit uppercase tracking-wider text-muted-foreground">Lịch sử</span>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {sessionId ? (
            <ChatWindow key={sessionId} />
          ) : (
            renderWelcomePanel()
          )}
        </div>
      </main>

      {/* CREATE SESSION MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase font-outfit tracking-wider text-muted-foreground">Khởi tạo trò chuyện</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tiêu đề cuộc hội thoại</label>
                  <input
                    type="text"
                    required
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value)}
                    placeholder="Ví dụ: Ôn tập Đại số tuyến tính"
                    className="px-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <LinkIcon size={12} />
                    <span>Liên kết lớp học (Tùy chọn)</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="">Không liên kết lớp</option>
                    {classrooms.map((c: Classroom) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 hover:bg-muted text-muted-foreground text-xs font-semibold rounded-xl border border-border transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createChatMutation.isPending}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                  >
                    {createChatMutation.isPending ? 'Đang tạo...' : 'Tạo chat'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENAME MODAL */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRenameModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase font-outfit tracking-wider text-muted-foreground">Đổi tên hội thoại</h3>
                <button onClick={() => setIsRenameModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tên mới</label>
                  <input
                    type="text"
                    required
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    placeholder="Nhập tên mới..."
                    className="px-4 py-2.5 bg-muted/40 border border-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRenameModalOpen(false);
                      setRenameTargetId('');
                      setRenameTitle('');
                    }}
                    className="px-4 py-2 hover:bg-muted text-muted-foreground text-xs font-semibold rounded-xl border border-border transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={renameMutation.isPending}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                  >
                    {renameMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ChatDashboard;
