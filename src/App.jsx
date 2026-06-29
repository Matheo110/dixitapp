import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Customize from './pages/Customize'
import CustomizeCollect from './pages/CustomizeCollect'
import Collect from './pages/Collect'
import Wall from './pages/Wall'
import ResetPassword from './pages/ResetPassword'
import Pricing from './pages/Pricing'
import CGV from './pages/CGV'
import Mentions from './pages/Mentions'
import Privacy from './pages/Privacy'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/customize" element={<PrivateRoute><Customize /></PrivateRoute>} />
        <Route path="/customize-collect" element={<PrivateRoute><CustomizeCollect /></PrivateRoute>} />
        <Route path="/collect/:slug" element={<Collect />} />
        <Route path="/wall/:slug" element={<Wall />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/cgv" element={<CGV />} />
        <Route path="/mentions" element={<Mentions />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  )
}
