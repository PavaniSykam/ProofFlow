import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
        <p className="text-sm text-slate-500">
          The requested page or workflow resource could not be found. It may have been moved or you may have entered an invalid URL.
        </p>
        <div className="pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
