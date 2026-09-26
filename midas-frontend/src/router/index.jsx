import { createBrowserRouter, Navigate } from 'react-router'
import RootLayout from '../layouts/RootLayout'
import RequireAuth from '../components/RequireAuth'
import BookingOnly from '../components/BookingOnly'
import HomePage from '../pages/HomePage'
import BookingPage from '../pages/BookingPage'
import BookingConfirmedPage from '../pages/BookingConfirmedPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import MyAppointmentsPage from '../pages/MyAppointmentsPage'
import GuestCancelPage from '../pages/GuestCancelPage'
import AgendaPage from '../pages/AgendaPage'
import SchedulePage from '../pages/SchedulePage'
import ServiceHistoryPage from '../pages/ServiceHistoryPage'
import FinancePage from '../pages/FinancePage'
import AdminLayout from '../pages/admin/AdminLayout'
import ServicesAdminPage from '../pages/admin/ServicesAdminPage'
import TeamAdminPage from '../pages/admin/TeamAdminPage'
import GalleryAdminPage from '../pages/admin/GalleryAdminPage'
import ReviewsAdminPage from '../pages/admin/ReviewsAdminPage'
import ShopAdminPage from '../pages/admin/ShopAdminPage'
import ShopPage from '../pages/ShopPage'
import NotFoundPage from '../pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <BookingOnly />,
        children: [
          { path: 'reservar', element: <BookingPage /> },
          { path: 'reservar/confirmada', element: <BookingConfirmedPage /> },
        ],
      },
      { path: 'tienda', element: <ShopPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
      { path: 'cancelar/:id', element: <GuestCancelPage /> },
      {
        element: <RequireAuth roles={['CLIENT']} />,
        children: [{ path: 'mis-citas', element: <MyAppointmentsPage /> }],
      },
      {
        element: <RequireAuth roles={['BARBER', 'ADMIN']} />,
        children: [
          { path: 'agenda', element: <AgendaPage /> },
          { path: 'agenda/finanzas', element: <FinancePage /> },
        ],
      },
      {
        element: <RequireAuth roles={['BARBER']} />,
        children: [
          { path: 'agenda/horario', element: <SchedulePage /> },
          { path: 'agenda/historial', element: <ServiceHistoryPage /> },
        ],
      },
      {
        element: <RequireAuth roles={['ADMIN']} />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="servicios" replace /> },
              { path: 'servicios', element: <ServicesAdminPage /> },
              { path: 'equipo', element: <TeamAdminPage /> },
              { path: 'galeria', element: <GalleryAdminPage /> },
              { path: 'resenas', element: <ReviewsAdminPage /> },
              { path: 'tienda', element: <ShopAdminPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
