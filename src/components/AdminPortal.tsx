import AdminLayout from './admin/AdminLayout';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AdminPortal({ user }: { user: any }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return <AdminLayout user={user} onLogout={handleLogout} />;
}
