import React, { useState } from 'react';
import { ExternalLink, Users, BookMarked, UserPlus, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const GitHubIcon = ({ size = 18, className = "" }) => (
  <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export default function GitHubCard({ platform, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!platform?.linked) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center h-full text-center hover:shadow-md transition-shadow">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
          <GitHubIcon size={24} />
        </div>
        <h3 className="font-bold text-slate-800 mb-2">GitHub Not Connected</h3>
        <p className="text-sm text-slate-500 mb-4">
          Connect your GitHub profile from Profile &rarr; Social Links
        </p>
        <Link to="/profile?tab=social" className="btn-primary w-full max-w-[200px]">
          Go to Profile
        </Link>
      </div>
    );
  }

  const { data: profile, last_refresh_error } = platform;

  if (last_refresh_error && !profile) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center h-full text-center hover:shadow-md transition-shadow relative">
        <button 
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 disabled:opacity-50"
          title="Try again"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="font-bold text-slate-800 mb-2">Unable to load GitHub profile.</h3>
        <p className="text-sm text-slate-500">{last_refresh_error}</p>
      </div>
    );
  }

  // Connected but never synced
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center h-full text-center hover:shadow-md transition-shadow relative">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
          <Info size={24} />
        </div>
        <h3 className="font-bold text-slate-800 mb-2">Sync Required</h3>
        <p className="text-sm text-slate-500 mb-6">
          Your GitHub URL is connected. Click refresh to sync your data.
        </p>
        <button 
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isRefreshing ? 'Syncing...' : 'Sync Now'} <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-slate-400">
        <button 
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="hover:text-slate-700 disabled:opacity-50"
          title="Sync from GitHub"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
        <GitHubIcon size={20} className="text-slate-800" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name || profile.username} className="w-14 h-14 rounded-full border border-slate-100 object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <GitHubIcon size={24} />
          </div>
        )}
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-bold text-slate-800 truncate">{profile.name || profile.username}</h3>
          <p className="text-sm text-slate-500 truncate">@{profile.name}</p>
        </div>
      </div>

      {profile.bio ? (
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
            {profile.bio}
        </p>
      ) : (
        <div className="mt-2 text-xs text-slate-400">
            No bio available
        </div>
      )}

      <div className="flex items-center justify-between mt-auto mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center text-slate-400 mb-1">
            <Users size={16} />
          </div>
          <p className="font-bold text-slate-800">{profile.followers}</p>
          <p className="text-xs text-slate-500">Followers</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-slate-400 mb-1">
            <UserPlus size={16} />
          </div>
          <p className="font-bold text-slate-800">{profile.following}</p>
          <p className="text-xs text-slate-500">Following</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center text-slate-400 mb-1">
            <BookMarked size={16} />
          </div>
          <p className="font-bold text-slate-800">{profile.public_repos}</p>
          <p className="text-xs text-slate-500">Repositories</p>
        </div>
      </div>

      <a 
        href={platform.profile_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        View GitHub Profile <ExternalLink size={14} />
      </a>
    </div>
  );
}
