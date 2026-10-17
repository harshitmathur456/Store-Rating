import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs text-zinc-500 max-w-md mt-2 leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
