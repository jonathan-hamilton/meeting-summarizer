import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppModeProvider } from './contexts/AppModeContext'

// Wrapper component to provide AppModeContext within router
const AppWithContext: React.FC = () => (
  <AppModeProvider>
    <App />
  </AppModeProvider>
);

// Router configuration with v7 future flags
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  // {
  //   path: "/demo",
  //   element: <AppWithContext />,
  // },
  {
    path: "/app", 
    element: <AppWithContext />,
  },
  {
    path: "/history",
    element: <AppWithContext />,
  },
  {
    path: "/transcript/:id",
    element: <AppWithContext />,
  },
  {
    path: "/verify-email/:token",
    element: <AppWithContext />,
  },
  {
    path: "/verify-email/unverified",
    element: <AppWithContext />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider 
      router={router} 
      future={{ 
        v7_startTransition: true 
      }}
    />
  </StrictMode>,
)
