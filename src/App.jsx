import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import CourseDetailPage from "./pages/CourseDetailPage.jsx";
import TopicPage from "./pages/TopicPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import StatisticsPage from "./pages/StatisticsPage.jsx";
import LearningPlanPage from "./pages/LearningPlanPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { ProgressProvider } from "./context/ProgressContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AcademyProvider } from "./context/AcademyContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import ItemDetailsPage from "./pages/ItemDetailsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AnimatedPage from "./components/AnimatedPage.jsx";
import Flashcard from "./components/Flashcard.jsx";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ProgressProvider>
          <AcademyProvider>
            <Routes>
              <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
              <Route path="/login" element={<AnimatedPage><AuthPage /></AnimatedPage>} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/courses/:courseId/topics/:topicId" element={<TopicPage />} />
                <Route path="/flashcards" element={<Flashcard />} />
                <Route path="/item/:itemId" element={<ItemDetailsPage />} />
                <Route path="/booking/:courseId" element={<BookingPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/plan" element={<LearningPlanPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AcademyProvider>
        </ProgressProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
