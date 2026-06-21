import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserProfile as ClerkUserProfile } from '@clerk/clerk-react';
import { fetchProfile, fetchChatAnalytics, fetchStudentAnalytics } from '../../services/profile';
import { 
  Database, 
  MessageSquare, 
  FileSpreadsheet, 
  Calendar, 
  ShieldCheck, 
  User,
  AlertCircle,
  Activity
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  // Query 1: Sync User Profile from our database
  const { 
    data: dbProfileResp, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: fetchProfile,
    staleTime: 15 * 60 * 1000 // 15 mins stale time
  });

  const dbProfile = dbProfileResp?.data;
  const dbUserId = dbProfile?.id;

  // Query 2: Chat Analytics
  const { 
    data: chatAnalyticsResp, 
    isLoading: isChatLoading 
  } = useQuery({
    queryKey: ['chatAnalytics'],
    queryFn: fetchChatAnalytics,
    enabled: !!dbUserId,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Query 3: Student Exam/Assessment Analytics
  const { 
    data: assessmentAnalyticsResp, 
    isLoading: isAssessmentLoading 
  } = useQuery({
    queryKey: ['studentAnalytics', dbUserId],
    queryFn: () => fetchStudentAnalytics(dbUserId || ''),
    enabled: !!dbUserId,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const chatStats = chatAnalyticsResp?.data;
  const assessmentStats = assessmentAnalyticsResp?.data;

  // Format date utility
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit tracking-tight">
          Hồ sơ cá nhân
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quản lý tài khoản bảo mật và theo dõi số liệu tích lũy hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Clerk User Profile Management (Tabbed widget) */}
        <div className="col-span-1 xl:col-span-2 bg-card border border-border rounded-2xl p-2 md:p-4 shadow-sm overflow-hidden">
          <ClerkUserProfile 
            routing="hash"
            appearance={{
              elements: {
                card: 'bg-transparent shadow-none w-full border-none p-0',
                navbar: 'border-r border-border bg-transparent',
                navbarButton: 'text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors',
                navbarButtonActive: 'bg-primary/10 text-primary hover:bg-primary/15 font-semibold',
                headerTitle: 'text-foreground font-outfit text-xl font-bold',
                headerSubtitle: 'text-muted-foreground text-sm',
                profileSectionTitle: 'border-b border-border pb-2 text-foreground font-semibold',
                formButtonPrimary: 'bg-primary hover:bg-primary/95 text-white shadow-md rounded-xl text-xs font-semibold px-4 py-2',
                formFieldLabel: 'text-muted-foreground text-xs font-semibold',
                formFieldInput: 'bg-muted/50 border border-input rounded-xl text-sm focus:ring-1 focus:ring-primary focus:bg-card text-foreground',
                userPreviewSecondaryIdentifier: 'text-muted-foreground text-xs',
                breadcrumbsItem: 'text-muted-foreground hover:text-foreground text-xs',
                breadcrumbsItemActive: 'text-primary font-semibold text-xs',
                accordionTriggerButton: 'text-muted-foreground hover:text-foreground',
              }
            }}
          />
        </div>

        {/* Right Column: Custom Dashboard Stats & DB Sync Panel */}
        <div className="space-y-6">
          
          {/* Card 1: Sync Status info */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold font-outfit mb-4 flex items-center gap-2">
              <Database size={18} className="text-primary" />
              <span>Đồng bộ hệ thống</span>
            </h3>

            {isProfileLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            ) : profileError ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs flex gap-2 items-start">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Lỗi kết nối cơ sở dữ liệu</span>
                  Không thể tải hồ sơ đồng bộ. Dữ liệu hiển thị dựa trên thông tin phiên làm việc cục bộ của Clerk.
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                
                {/* ID & Status */}
                <div className="flex justify-between items-center border-b border-border pb-2.5">
                  <span className="text-muted-foreground text-xs">Trạng thái DB:</span>
                  <span className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full capitalize">
                    <Activity size={10} className="animate-pulse" />
                    {dbProfile?.status || 'Active'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-border pb-2.5">
                  <span className="text-muted-foreground text-xs">Vai trò gốc:</span>
                  <span className="font-semibold text-xs flex items-center gap-1 text-primary capitalize">
                    <ShieldCheck size={14} />
                    {dbProfile?.role || 'student'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-border pb-2.5">
                  <span className="text-muted-foreground text-xs">Ngày tham gia:</span>
                  <span className="font-semibold text-xs flex items-center gap-1 text-foreground">
                    <Calendar size={14} className="text-muted-foreground" />
                    {formatDate(dbProfile?.createdAt)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[10px]">Database UUID:</span>
                  <code className="text-[10px] bg-muted/60 p-2 rounded-lg font-mono text-muted-foreground break-all select-all">
                    {dbProfile?.id || 'Không tìm thấy'}
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Custom Learning Stats Panel */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold font-outfit mb-4 flex items-center gap-2">
              <User size={18} className="text-primary" />
              <span>Chỉ số tích lũy học tập</span>
            </h3>

            <div className="space-y-4">
              
              {/* Chat Session Stat Card */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">AI Tutor Session</span>
                    <span className="text-[10px] text-muted-foreground">Tổng phiên chat</span>
                  </div>
                </div>
                {isChatLoading ? (
                  <div className="h-6 w-8 bg-muted rounded animate-pulse" />
                ) : (
                  <span className="text-lg font-bold font-outfit text-indigo-500">
                    {chatStats?.totalSessions ?? 0}
                  </span>
                )}
              </div>

              {/* Assessment Stats Card */}
              <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Điểm số trung bình</span>
                    <span className="text-[10px] text-muted-foreground">GPA / {assessmentStats?.completedExams ?? 0} Bài thi</span>
                  </div>
                </div>
                {isAssessmentLoading ? (
                  <div className="h-6 w-8 bg-muted rounded animate-pulse" />
                ) : (
                  <span className="text-lg font-bold font-outfit text-emerald-500">
                    {assessmentStats?.averageScore ? `${assessmentStats.averageScore.toFixed(1)}/10` : 'N/A'}
                  </span>
                )}
              </div>

            </div>
            
            <p className="text-[10px] text-muted-foreground mt-4 text-center">
              * Dữ liệu được tính toán thời gian thực từ các hoạt động của bạn.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
