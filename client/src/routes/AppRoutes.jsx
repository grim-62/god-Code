import { lazy, Suspense, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import AdminRoute from '../components/AdminRoute.jsx'
import Navbar from '../components/Navbar.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'

const AdminPage = lazy(() => import('../pages/AdminPage.jsx'))
const AdminExamFormPage = lazy(() => import('../pages/AdminExamFormPage.jsx'))
const AdminExamResultsPage = lazy(() => import('../pages/AdminExamResultsPage.jsx'))
const AdminExamsPage = lazy(() => import('../pages/AdminExamsPage.jsx'))
const AdminProblemFormPage = lazy(() => import('../pages/AdminProblemFormPage.jsx'))
const ExamPage = lazy(() => import('../pages/ExamPage.jsx'))
const ExamLeaderboardPage = lazy(() => import('../pages/ExamLeaderboardPage.jsx'))
const ExamsPage = lazy(() => import('../pages/ExamsPage.jsx'))
const HomePage = lazy(() => import('../pages/HomePage.jsx'))
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))
const ProblemPage = lazy(() => import('../pages/ProblemPage.jsx'))
const ProfilePage = lazy(() => import('../pages/ProfilePage.jsx'))
const ProblemsPage = lazy(() => import('../pages/ProblemsPage.jsx'))
const RegisterPage = lazy(() => import('../pages/RegisterPage.jsx'))

gsap.registerPlugin(useGSAP)

function RouteLoading({ label }) {
  return (
    <main className="route-loading" role="status">
      <span className="route-loader-mark" aria-hidden="true">&lt;/&gt;</span>
      <span>{label}</span>
      <span className="route-loader-track" aria-hidden="true"><span /></span>
    </main>
  )
}

export default function AppRoutes() {
  const location = useLocation()
  const routeRef = useRef(null)

  useGSAP(() => {
    const page = routeRef.current?.querySelector(':scope > main')
    if (!page) return

    gsap.fromTo(page,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.48, ease: 'power3.out', clearProps: 'opacity,transform,visibility' },
    )
  }, { scope: routeRef, dependencies: [location.pathname], revertOnUpdate: true })

  return (
    <>
      <Navbar />
      <div className="route-stage pt-14" ref={routeRef}>
        <Suspense fallback={<RouteLoading label="Loading page" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/problems/:slug" element={<Suspense fallback={<RouteLoading label="Loading problem workspace" />}><ProblemPage /></Suspense>} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/exams/:id/leaderboard" element={<ExamLeaderboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/account" element={<Navigate to="/profile" replace />} />
              <Route path="/exams/:id" element={<Suspense fallback={<RouteLoading label="Preparing exam workspace" />}><ExamPage /></Suspense>} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Navigate to="/admin/problems" replace />} />
              <Route path="/admin/problems" element={<AdminPage />} />
              <Route path="/admin/problems/new" element={<Suspense fallback={<RouteLoading label="Loading problem editor" />}><AdminProblemFormPage /></Suspense>} />
              <Route path="/admin/problems/:id/edit" element={<Suspense fallback={<RouteLoading label="Loading problem editor" />}><AdminProblemFormPage /></Suspense>} />
              <Route path="/admin/exams" element={<AdminExamsPage />} />
              <Route path="/admin/exams/new" element={<AdminExamFormPage />} />
              <Route path="/admin/exams/:id/edit" element={<AdminExamFormPage />} />
              <Route path="/admin/exams/:id/results" element={<AdminExamResultsPage />} />
            </Route>
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}