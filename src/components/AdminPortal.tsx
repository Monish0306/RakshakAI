import AdminLayout from './admin/AdminLayout';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminPortal({ user, theme, toggleTheme }: { user: any; theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return <AdminLayout user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
}
