import { RefreshCw, Plus, ExternalLink, AlertCircle, Unlink, Eye } from 'lucide-react';
import { useState } from 'react';
import ProgressBar from './coding/ProgressBar';

const PLATFORM_COLORS = {
  leetcode: 'from-amber-50 to-yellow-50 border-yellow-200/80',
  hackerrank: 'from-emerald-50 to-green-50 border-green-200/80',
  skillrack: 'from-violet-50 to-purple-50 border-purple-200/80'
};

const PLATFORM_ACCENT = {
  leetcode: 'text-yellow-700 bg-yellow-100',
  hackerrank: 'text-green-700 bg-green-100',
  skillrack: 'text-purple-700 bg-purple-100'
};

const PLATFORM_ICONS = {
  leetcode: '🟡',
  hackerrank: '🟢',
  skillrack: '🟣'
};

function PlatformStats({ platformKey, data }) {
  if (!data) return null;

  if (platformKey === 'leetcode') {
    return (
      <div className="mt-2 mb-3">
        <div className="mb-4 text-center p-3 bg-white/60 rounded-lg border border-yellow-100/50 shadow-sm">
          <div className="text-3xl font-extrabold text-yellow-900">{data.totalSolved || 0}</div>
          <div className="text-xs text-yellow-700 font-medium uppercase tracking-wide mt-1">Problems Solved</div>
        </div>
        <div className="space-y-3">
          <ProgressBar label="Easy" value={data.easySolved} max={data.totalSolved} color="bg-green-500" />
          <ProgressBar label="Medium" value={data.mediumSolved} max={data.totalSolved} color="bg-yellow-500" />
          <ProgressBar label="Hard" value={data.hardSolved} max={data.totalSolved} color="bg-red-500" />
        </div>
      </div>
    );
  }

  if (platformKey === 'hackerrank') {
    const badges = data.badges || [];
    const sortedBadges = [...badges].sort((a, b) => (b.stars || 0) - (a.stars || 0));
    const topBadge = sortedBadges[0];
    const miniBadges = sortedBadges.slice(1, 4);

    return (
      <div className="mt-2 mb-3">
        <div className="flex justify-between text-xs mb-3 text-text-secondary font-medium">
          <span>Badges: <strong className="text-green-800 ml-1">{badges.length}</strong></span>
          <span>Certificates: <strong className="text-green-800 ml-1">{data.certificates?.length || 0}</strong></span>
        </div>
        
        {topBadge ? (
          <div className="space-y-2">
            <div className="bg-white/70 rounded-xl border border-green-200 p-4 text-center shadow-sm">
              <div
                className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-inner"
                style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
              >
                {topBadge.badgeName.substring(0, 2).toUpperCase()}
              </div>
              <div className="font-bold text-green-900">{topBadge.badgeName}</div>
              <div className="text-yellow-500 text-sm mt-1 tracking-widest">
                {"★".repeat(topBadge.stars || 0)}
              </div>
            </div>

            {miniBadges.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {miniBadges.map((badge, idx) => (
                  <div key={idx} className="bg-white/60 border border-green-100 rounded-lg p-2 text-center transition-transform hover:scale-[1.02]">
                    <div
                      className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-green-400 to-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-inner"
                      style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
                    >
                      {badge.badgeName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-[10px] font-medium text-green-900 truncate" title={badge.badgeName}>
                      {badge.badgeName}
                    </div>
                    <div className="text-yellow-500 text-[10px] tracking-widest">
                      {"★".repeat(badge.stars || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-4 bg-white/50 rounded-lg text-green-800 text-sm border border-green-100">
            No badges earned yet
          </div>
        )}
      </div>
    );
  }

  if (platformKey === 'skillrack') {
    return (
      <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
        <div className="bg-white/60 rounded-lg p-2 border border-purple-100/50">
          <div className="font-bold text-lg text-purple-900">{data.solved?.toLocaleString() || 0}</div>
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wide">Solved</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2 border border-purple-100/50">
          <div className="font-bold text-lg text-purple-900">{data.points?.toLocaleString() || 0}</div>
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wide">Points</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2 border border-purple-100/50">
          <div className="font-bold text-lg text-purple-900">{data.rank ? `#${data.rank}` : '—'}</div>
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wide">Rank</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2 border border-purple-100/50">
          <div className="font-bold text-lg text-purple-900">{data.certificates || 0}</div>
          <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wide">Certificates</div>
        </div>
      </div>
    );
  }
  return null;
}

export default function CodingPlatformCard({ platformKey, platform, onLink, onRefresh, onUnlink, onViewDetails }) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkValues, setLinkValues] = useState({ username: '', skillrack_url: '' });

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh(platformKey);
    setRefreshing(false);
  };

  const handleLink = async () => {
    setLinking(true);
    try {
      let payload = { ...linkValues };
      
      if (platformKey === 'skillrack') {
        try {
          const urlObj = new URL(linkValues.skillrack_url);
          const id = urlObj.searchParams.get('id');
          const key = urlObj.searchParams.get('key');
          if (!id || !key) throw new Error('Missing id or key');
          payload.skillrack_id = id;
          payload.skillrack_key = key;
        } catch (e) {
          alert('Invalid SkillRack URL. Please paste the full resume link containing id and key.');
          setLinking(false);
          return;
        }
      }

      await onLink(platformKey, payload);
      setShowLinkForm(false);
      setLinkValues({ username: '', skillrack_url: '' });
    } finally {
      setLinking(false);
    }
  };

  const timeAgo = (iso) => {
    if (!iso) return null;
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className={`card border bg-gradient-to-br ${PLATFORM_COLORS[platformKey]} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{PLATFORM_ICONS[platformKey]}</span>
          <h3 className="font-semibold text-text-primary">{platform.label}</h3>
        </div>
        {platform.linked && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-white/60 rounded-md transition-colors disabled:opacity-50"
            title="Refresh stats"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!platform.linked ? (
        showLinkForm ? (
          <div className="space-y-2">
            {platformKey === 'skillrack' ? (
              <input className="input-field text-sm" placeholder="SkillRack Resume URL (e.g. https://www.skillrack.com/...)"
                value={linkValues.skillrack_url}
                onChange={(e) => setLinkValues({ ...linkValues, skillrack_url: e.target.value })} />
            ) : (
              <input className="input-field text-sm" placeholder="Username"
                value={linkValues.username}
                onChange={(e) => setLinkValues({ ...linkValues, username: e.target.value })} />
            )}
            <div className="flex gap-2">
              <button onClick={handleLink} disabled={linking} className="btn-primary text-xs flex-1 disabled:opacity-50">
                {linking ? 'Linking...' : 'Link & Fetch'}
              </button>
              <button onClick={() => setShowLinkForm(false)} disabled={linking} className="btn-secondary text-xs flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowLinkForm(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-text-secondary hover:bg-white/60 transition-colors">
            <Plus size={14} /> Link Account
          </button>
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-secondary">
              {platform.last_refresh_status === 'failed' ? (
                <span className="text-red-600 flex items-center gap-1"><AlertCircle size={12} /> Refresh failed</span>
              ) : (
                `Synced ${timeAgo(platform.fetched_at)}`
              )}
            </p>
            {platform.profile_url && (
              <a href={platform.profile_url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary">
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {platform.last_refresh_status === 'failed' && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">{platform.last_refresh_error}</p>
          )}

          <PlatformStats platformKey={platformKey} data={platform.data} />

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/40">
            <button onClick={() => onUnlink(platformKey)} className="flex items-center gap-1 text-xs text-text-muted hover:text-red-600 transition-colors">
              <Unlink size={12} /> Unlink
            </button>
            <button onClick={() => onViewDetails(platformKey)} className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-black transition-colors bg-white/50 px-3 py-1.5 rounded-md hover:bg-white/80">
              <Eye size={14} /> View Details <span className="opacity-70">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
