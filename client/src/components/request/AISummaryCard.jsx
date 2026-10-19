import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { generateSummary, getSummary } from '../../api/ai';

export default function AISummaryCard({ requestId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await getSummary(requestId);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [requestId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateSummary(requestId);
      setSummary(res.data.summary);
    } catch (err) {
      if (err.response?.status === 503) {
        setError('AI assistance is currently disabled in system settings.');
      } else {
        setError(err.response?.data?.error?.message || 'Could not generate summary.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white p-5 rounded-xl border border-indigo-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              AI-Generated Summary
            </h4>
            <span className="text-[11px] text-slate-500">
              Assistive only — always verify against original submitted data
            </span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-xs font-semibold text-indigo-700 hover:text-indigo-900 border border-indigo-200 rounded-lg shadow-xs hover:bg-indigo-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{summary ? 'Regenerate' : 'Generate Summary'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 mt-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summary ? (
        <div className="mt-3 p-3.5 bg-white/90 rounded-lg border border-indigo-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
          {summary}
        </div>
      ) : !error && (
        <p className="text-xs text-slate-500 italic mt-1">
          Click generate to produce a concise summary of this request and its approval history.
        </p>
      )}
    </div>
  );
}
