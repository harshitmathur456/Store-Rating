import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../app/AuthContext';

export default function ForbiddenPage() {
  const { user } = useAuth();

  const homePath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'OWNER' ? '/owner' : '/stores';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">403 - Access Denied</h1>
      <p className="text-xs text-zinc-500 max-w-md mt-2 leading-relaxed">
        You do not have permission to access this page. Each portal (System Administrator, Normal User, Store Owner) is strictly scoped to authorized roles.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to={homePath}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
