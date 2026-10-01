import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { NewDocumentPage } from './pages/NewDocumentPage'
import { VerifyPage } from './pages/VerifyPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <DocumentsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/new"
              element={
                <RequireAuth>
                  <NewDocumentPage />
                </RequireAuth>
              }
            />
            <Route path="/verify/:id" element={<VerifyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
