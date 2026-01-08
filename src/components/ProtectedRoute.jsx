// File: src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'

const ProtectedRoute = ({ children }) => {
  const { user } = useUserStore()

  // Jika user tidak ada (belum login), tendang ke halaman Login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Jika user ada, izinkan masuk ke halaman tujuan (children)
  return children
}

export default ProtectedRoute