import { useEffect, useState, useCallback } from 'react';
import { Shield, RefreshCw, UploadCloud, CheckCircle2, AlertCircle, Lock, Sparkles, Clock } from 'lucide-react';
import ReadinessRing from '../ReadinessRing';
import ScoreBar from '../ScoreBar';
import EmptyState from '../EmptyState';
import { ResumesAPI } from '../../services/api';

// Mirrors backend/ats/ats.config.js DEFAULT_WEIGHTS — used only as display
// labels/max values for the breakdown bars. The actual scoring always
// comes from the backend; this is not re-derived client-side.
const BREAKDOWN_LABELS = {
  contact: { label: 'Contact', max: 9 },
  education: { label: 'Education', max: 9 },
  skills: { label: 'Skills', max: 19 },
  projects: { label: 'Projects', max: 14 },
  internships: { label: 'Internships', max: 14 },
  certifications: { label: 'Certifications', max: 9 },
  keywords: { label: 'Keywords', max: 9 },
  formatting: { label: 'Formatting', max: 4 },
  links: { label: 'Links', max: 4 },
  completeness: { label: 'Completeness', max: 9 }
};

export default function AtsPanel({ profileId }) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const loadAts = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError('');
    try {
      const { data, meta } = await ResumesAPI.getAts(profileId);
      setHasResume(!!meta?.has_resume);
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'Failed to load ATS analysis');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadAts();
  }, [loadAts]);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setAnalyzing(true);
    setError('');
    try {
      const { data } = await ResumesAPI.analyzeResume(profileId, file);
      setAnalysis(data);
      setHasResume(true);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const { data } = await ResumesAPI.reanalyzeResume(profileId);
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'Failed to re-analyze resume');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800">ATS Score</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Beta</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors text-sm font-medium cursor-pointer">
            <UploadCloud size={16} />
            {analyzing ? 'Analyzing...' : analysis ? 'Re-upload & Analyze' : 'Upload & Analyze'}
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileSelected}
              disabled={analyzing}
            />
          </label>
          {analysis && (
            <button
              onClick={handleReanalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
              title="Re-score the already-analyzed text without re-uploading"
            >
              <RefreshCw size={16} className={analyzing ? 'animate-spin' : ''} />
              Reanalyze
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!analysis ? (
        <EmptyState
          icon={Shield}
          message={hasResume ? 'Upload a file to run your first ATS analysis' : 'Add a resume to see your ATS score'}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ReadinessRing score={Math.round(analysis.ats_score)} size={140} />
            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-2xl font-bold text-slate-800">Grade {analysis.grade}</span>
              </div>
              <p className="text-sm text-slate-500">{analysis.summary}</p>
              {analysis.last_analyzed && (
                <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1">
                  <Clock size={12} />
                  Last analyzed {new Date(analysis.last_analyzed).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(analysis.breakdown || {}).map(([key, value]) => {
              const meta = BREAKDOWN_LABELS[key] || { label: key, max: value };
              return <ScoreBar key={key} label={meta.label} value={value} max={meta.max} />;
            })}
          </div>

          {analysis.missing_sections?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-amber-800 mb-1">Missing sections</p>
              <p className="text-sm text-amber-700">{analysis.missing_sections.join(', ')}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> Strengths
              </p>
              <ul className="space-y-1.5">
                {(analysis.strengths || []).map((s, i) => (
                  <li key={i} className="text-sm text-slate-600">&bull; {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" /> Improvements
              </p>
              <ul className="space-y-1.5">
                {(analysis.improvements || []).map((s, i) => (
                  <li key={i} className="text-sm text-slate-600">&bull; {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Future AI Resume Review — disabled per Phase 1 non-goals */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl opacity-70">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-500">AI Resume Review</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-1 rounded-md">
          <Lock size={10} /> Coming Soon
        </span>
      </div>
    </div>
  );
}
