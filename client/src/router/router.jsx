import React from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import Dashboard from '../components/Dashboard.jsx';
import Login from '../components/Auth/Login.jsx';
import Register from '../components/Auth/Register.jsx';
import ReservationList from '../components/ReservationList.jsx';
import ReservationDetail from '../components/ReservationDetail.jsx';
import AddReservation from '../components/AddReservation.jsx';
import EditReservation from '../components/EditReservation.jsx';
import Home from '../components/Home.jsx';
import Settings from '../components/Settings/Settings.jsx';
import HomeOverview from '../components/Dashboard/HomeOverview.jsx';
import Summary from '../components/Dashboard/Summary.jsx';

import ProtectedRoute from './ProtectedRoute.jsx';
import { loadReservation } from '../api/reservations.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <HomeOverview view="reservations" />,
          },
          {
            path: 'calendar',
            element: <HomeOverview view="calendar" />,
          },
          {
            path: 'summary',
            element: <Summary />,
          },
          {
            path: 'detail/:id',
            element: <ReservationDetail />,
            loader: async ({ params, request }) => {
              try {
                return await loadReservation({ id: params.id, signal: request.signal });
              } catch (error) {
                if (error.status === 401) {
                  throw redirect('/login');
                }
                throw error;
              }
            },
          },
          {
            path: 'add',
            element: <AddReservation />,
          },
          {
            path: 'edit/:id',
            element: <EditReservation />,
            loader: async ({ params, request }) => {
              try {
                return await loadReservation({ id: params.id, signal: request.signal });
              } catch (error) {
                if (error.status === 401) {
                  throw redirect('/login');
                }
                throw error;
              }
            },
          },
          {
            path: 'settings',
            element: <Settings />,
          },
        ],
      },
    ],
  },
]);

export default router;
