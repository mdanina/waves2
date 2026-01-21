import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { SpecialistAuthProvider } from "@/contexts/SpecialistAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SpecialistProtectedRoute } from "@/components/specialist/SpecialistProtectedRoute";
import { SpecialistLayout } from "@/components/specialist/SpecialistLayout";
import { ClientLayout } from "@/components/client/ClientLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteTracker } from "@/components/RouteTracker";
import { PWAInstallController } from "@/hooks/usePWAInstall";
import { Loader2 } from "lucide-react";
// Легкие страницы загружаем сразу
import Landing from "./pages/Landing";
import ServiceIntro from "./pages/ServiceIntro";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Welcome from "./pages/Welcome";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PrivacyNotice from "./pages/PrivacyNotice";
import Sitemap from "./pages/Sitemap";
import SpecialistApplication from "./pages/SpecialistApplication";

// Тяжелые страницы - lazy loading для оптимизации bundle size
const RegionSelect = lazy(() => import("./pages/RegionSelect"));
const Success = lazy(() => import("./pages/Success"));
const Profile = lazy(() => import("./pages/Profile"));
const FamilySetup = lazy(() => import("./pages/FamilySetup"));
const FamilyMembers = lazy(() => import("./pages/FamilyMembers"));
const AddFamilyMember = lazy(() => import("./pages/AddFamilyMember"));
const EditFamilyMember = lazy(() => import("./pages/EditFamilyMember"));
const Worries = lazy(() => import("./pages/Worries"));
const CheckupIntro = lazy(() => import("./pages/CheckupIntro"));
const Checkup = lazy(() => import("./pages/Checkup"));
const CheckupQuestions = lazy(() => import("./pages/CheckupQuestions"));
const CheckupInterlude = lazy(() => import("./pages/CheckupInterlude"));
const ParentIntro = lazy(() => import("./pages/ParentIntro"));
const ParentQuestions = lazy(() => import("./pages/ParentQuestions"));
const FamilyIntro = lazy(() => import("./pages/FamilyIntro"));
const FamilyQuestions = lazy(() => import("./pages/FamilyQuestions"));
const CheckupResults = lazy(() => import("./pages/CheckupResults"));
const ResultsReport = lazy(() => import("./pages/ResultsReport"));
const ResultsReportNew = lazy(() => import("./pages/ResultsReportNew"));
const CheckupHistory = lazy(() => import("./pages/CheckupHistory"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const AppointmentBooking = lazy(() => import("./pages/AppointmentBooking"));
const Packages = lazy(() => import("./pages/Packages"));
const Payment = lazy(() => import("./pages/Payment"));
const AppointmentConfirmation = lazy(() => 
  import("./pages/AppointmentConfirmation").catch((error) => {
    console.error("Error loading AppointmentConfirmation:", error);
    // Возвращаем fallback компонент с правильной структурой
    return {
      default: () => (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Ошибка загрузки страницы</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      )
    };
  })
);

// Админ-страницы
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const AssessmentsManagement = lazy(() => import("./pages/admin/AssessmentsManagement"));
const AppointmentsManagement = lazy(() => import("./pages/admin/AppointmentsManagement"));
const PaymentsManagement = lazy(() => import("./pages/admin/PaymentsManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const SupportTools = lazy(() => import("./pages/admin/SupportTools"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogManagement = lazy(() => import("./pages/admin/BlogManagement"));
const ClientAssignments = lazy(() => import("./pages/admin/ClientAssignments"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const PushNotificationsManagement = lazy(() => import("./pages/admin/PushNotificationsManagement"));
const SpecialistApplicationsManagement = lazy(() => import("./pages/admin/SpecialistApplicationsManagement"));

// Страницы специалиста
const SpecialistLogin = lazy(() => import("./pages/specialist/SpecialistLogin"));
const SpecialistDashboard = lazy(() => import("./pages/specialist/SpecialistDashboard"));
const SpecialistClients = lazy(() => import("./pages/specialist/SpecialistClients"));
const SpecialistCalendar = lazy(() => import("./pages/specialist/SpecialistCalendar"));
const SpecialistSessions = lazy(() => import("./pages/specialist/SpecialistSessions"));
const SpecialistSessionAnalysis = lazy(() => import("./pages/specialist/SpecialistSessionAnalysis"));
const SpecialistClientDetail = lazy(() => import("./pages/specialist/SpecialistClientDetail"));
const SpecialistProfile = lazy(() => import("./pages/specialist/SpecialistProfile"));
const SpecialistSettings = lazy(() => import("./pages/specialist/SpecialistSettings"));
const SpecialistMessages = lazy(() => import("./pages/specialist/SpecialistMessages"));
const ClientMessages = lazy(() => import("./pages/ClientMessages"));
const Settings = lazy(() => import("./pages/Settings"));

// Компонент загрузки
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">Загрузка...</p>
    </div>
  </div>
);

// Настройка React Query с оптимизированными настройками кеширования
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут по умолчанию
      gcTime: 10 * 60 * 1000, // 10 минут кеш (gcTime заменил cacheTime в v5)
      retry: 2,
      refetchOnWindowFocus: false, // Не обновлять при фокусе
      refetchOnMount: false, // Использовать кеш при монтировании
    },
  },
});

const App = () => (
  <HelmetProvider>
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <AdminAuthProvider>
          <SpecialistAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <RouteTracker />
                <PWAInstallController />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Публичные маршруты */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/service" element={<ServiceIntro />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="/coming-soon" element={<ComingSoon />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/category/:categorySlug" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/privacy-notice" element={<PrivacyNotice />} />
                    <Route path="/sitemap" element={<Sitemap />} />
                    <Route path="/specialist-application" element={<SpecialistApplication />} />

                    {/* Админ-маршруты */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/admin/*"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout />
                        </AdminProtectedRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UsersManagement />} />
                      <Route path="assessments" element={<AssessmentsManagement />} />
                      <Route path="appointments" element={<AppointmentsManagement />} />
                      <Route path="payments" element={<PaymentsManagement />} />
                      <Route path="content" element={<ContentManagement />} />
                      <Route path="support" element={<SupportTools />} />
                      <Route path="blog" element={<BlogManagement />} />
                      <Route path="assignments" element={<ClientAssignments />} />
                      <Route path="messages" element={<AdminMessages />} />
                      <Route path="push" element={<PushNotificationsManagement />} />
                      <Route path="specialist-applications" element={<SpecialistApplicationsManagement />} />
                    </Route>
                    
                    {/* Защищенные маршруты с Layout (требуют авторизации) */}
                    <Route
                      path="/cabinet/*"
                      element={
                        <ProtectedRoute>
                          <ClientLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Dashboard />} />
                      <Route path="messages" element={<ClientMessages />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route
                      path="/appointments/*"
                      element={
                        <ProtectedRoute>
                          <ClientLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Appointments />} />
                      <Route path="booking" element={<AppointmentBooking />} />
                      <Route path="confirmation" element={<AppointmentConfirmation />} />
                    </Route>
                    <Route
                      path="/checkup-history"
                      element={
                        <ProtectedRoute>
                          <ClientLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<CheckupHistory />} />
                    </Route>
                    <Route
                      path="/packages"
                      element={
                        <ProtectedRoute>
                          <ClientLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Packages />} />
                    </Route>
                    <Route
                      path="/payment"
                      element={
                        <ProtectedRoute>
                          <ClientLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Payment />} />
                    </Route>
                    <Route
                      path="/worries/:profileId?"
                      element={
                        <ProtectedRoute>
                          <ClientLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Worries />} />
                    </Route>

                    {/* Защищенные маршруты без Layout (для страниц без сайдбара) */}
                    <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/region" element={<ProtectedRoute><RegionSelect /></ProtectedRoute>} />
                    <Route path="/family-setup" element={<ProtectedRoute><FamilySetup /></ProtectedRoute>} />
                    <Route path="/family-members" element={<ProtectedRoute><FamilyMembers /></ProtectedRoute>} />
                    <Route path="/add-family-member" element={<ProtectedRoute><AddFamilyMember /></ProtectedRoute>} />
                    <Route path="/edit-family-member/:id" element={<ProtectedRoute><EditFamilyMember /></ProtectedRoute>} />
                    <Route path="/checkup-intro/:profileId?" element={<ProtectedRoute><CheckupIntro /></ProtectedRoute>} />
                    <Route path="/checkup" element={<ProtectedRoute><Checkup /></ProtectedRoute>} />
                    <Route path="/checkup-questions/:profileId?" element={<ProtectedRoute><CheckupQuestions /></ProtectedRoute>} />
                    <Route path="/checkup-interlude/:profileId?" element={<ProtectedRoute><CheckupInterlude /></ProtectedRoute>} />
                    <Route path="/parent-intro" element={<ProtectedRoute><ParentIntro /></ProtectedRoute>} />
                    <Route path="/parent-questions/:profileId?" element={<ProtectedRoute><ParentQuestions /></ProtectedRoute>} />
                    <Route path="/family-intro" element={<ProtectedRoute><FamilyIntro /></ProtectedRoute>} />
                    <Route path="/family-questions/:profileId?" element={<ProtectedRoute><FamilyQuestions /></ProtectedRoute>} />
                    <Route path="/checkup-results" element={<ProtectedRoute><CheckupResults /></ProtectedRoute>} />
                    <Route path="/results-report/:profileId?" element={<ProtectedRoute><ResultsReportNew /></ProtectedRoute>} />

                    {/* Маршруты специалиста */}
                    <Route path="/specialist/login" element={<SpecialistLogin />} />
                    <Route
                      path="/specialist/*"
                      element={
                        <SpecialistProtectedRoute>
                          <SpecialistLayout />
                        </SpecialistProtectedRoute>
                      }
                    >
                      <Route index element={<SpecialistDashboard />} />
                      <Route path="clients" element={<SpecialistClients />} />
                      <Route path="clients/:clientId" element={<SpecialistClientDetail />} />
                      <Route path="calendar" element={<SpecialistCalendar />} />
                      <Route path="sessions" element={<SpecialistSessions />} />
                      <Route path="sessions/:appointmentId" element={<SpecialistSessionAnalysis />} />
                      <Route path="profile" element={<SpecialistProfile />} />
                      <Route path="settings" element={<SpecialistSettings />} />
                      <Route path="messages" element={<SpecialistMessages />} />
                    </Route>

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </SpecialistAuthProvider>
          </AdminAuthProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  </HelmetProvider>
);

export default App;
