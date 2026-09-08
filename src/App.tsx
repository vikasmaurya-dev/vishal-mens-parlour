import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { BookingPage } from './pages/booking/BookingPage'
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage'
import { AdminCalendarPage } from './pages/admin/AdminCalendarPage'
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminServicesPage } from './pages/admin/AdminServicesPage'
import { AdminWebsiteContentPage } from './pages/admin/AdminWebsiteContentPage'
import { AboutPage } from './pages/public/AboutPage'
import { ContactPage } from './pages/public/ContactPage'
import { GalleryPage } from './pages/public/GalleryPage'
import { HomePage } from './pages/public/HomePage'
import { ServicesPage } from './pages/public/ServicesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>
      <Route path="book" element={<BookingPage />} />
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="calendar" element={<AdminCalendarPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="content" element={<AdminWebsiteContentPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
