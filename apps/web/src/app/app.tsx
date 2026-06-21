import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '../lib/react-query';
import { injectAuthTokenLoader } from '../lib/api-client';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ExamLayout } from '../layouts/ExamLayout';

// Pages
import { SignInPage } from '../pages/auth/SignInPage';
import { SignUpPage } from '../pages/auth/SignUpPage';
import { DashboardPlaceholder } from '../pages/DashboardPlaceholder';
import { ExamPlaceholder } from '../pages/ExamPlaceholder';
import { ProfilePage } from '../pages/auth/ProfilePage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { CourseDirectory } from '../pages/academic/CourseDirectory';
import { CourseDetailPage } from '../pages/academic/CourseDetailPage';
import { ClassroomDirectory } from '../pages/academic/ClassroomDirectory';
import { ClassroomDetailPage } from '../pages/academic/ClassroomDetailPage';
import { LessonDetailPage } from '../pages/academic/LessonDetailPage';

// Components
import { RoleGuard } from '../components/shared/RoleGuard';

// Clerk Publishable Key (from environment or dummy placeholder for development)
const CLERK_PUBLISHABLE_KEY = 
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  'pk_test_ZWQtdGVjaC05NC5jbGVyay5hY2NvdW50cy5kZXYk'; // standard format placeholder

// Auth Token Injector Component to link Clerk Auth with Axios Client
const AuthTokenInjector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    injectAuthTokenLoader(() => getToken());
  }, [getToken]);

  return children as React.ReactElement;
};

// Route protector using Clerk authentication status
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthTokenInjector>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
              </Route>

              {/* Protected Dashboard Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Redirect root to courses portal */}
                <Route index element={<Navigate to="/courses" replace />} />
                
                {/* General Authenticated Routes */}
                <Route path="courses" element={<CourseDirectory />} />
                <Route path="courses/:courseId" element={<CourseDetailPage />} />
                <Route path="classes" element={<ClassroomDirectory />} />
                <Route path="classes/:classroomId" element={<ClassroomDetailPage />} />
                <Route path="lessons/:lessonId" element={<LessonDetailPage />} />
                <Route path="academic" element={<Navigate to="/courses" replace />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="unauthorized" element={<UnauthorizedPage />} />
                
                {/* Student Only Routes */}
                <Route element={<RoleGuard allowedRoles={['student', 'admin']} />}>
                  <Route path="learning/roadmap" element={<DashboardPlaceholder />} />
                  <Route path="learning/mastery" element={<DashboardPlaceholder />} />
                  <Route path="chat" element={<DashboardPlaceholder />} />
                  <Route path="assessments" element={<DashboardPlaceholder />} />
                </Route>

                {/* Teacher Only Routes */}
                <Route element={<RoleGuard allowedRoles={['teacher', 'admin']} />}>
                  <Route path="learning/materials" element={<DashboardPlaceholder />} />
                  <Route path="learning/performance" element={<DashboardPlaceholder />} />
                  <Route path="assessments/manage" element={<DashboardPlaceholder />} />
                </Route>
              </Route>

              {/* Protected Exam Focus Route */}
              <Route
                path="/assessments/exam/:id"
                element={
                  <ProtectedRoute>
                    <RoleGuard allowedRoles={['student', 'admin']}>
                      <ExamLayout />
                    </RoleGuard>
                  </ProtectedRoute>
                }
              >
                <Route index element={<ExamPlaceholder />} />
              </Route>

              {/* Fallback to root redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          
          {/* Global Toast Notification Toaster */}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            theme="dark" // Dark matching style
          />
        </QueryClientProvider>
      </AuthTokenInjector>
    </ClerkProvider>
  );
};

export default App;
