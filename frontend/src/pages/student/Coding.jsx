import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { CodingAPI } from '../../services/api';
import CodingPlatformCard from '../../components/CodingPlatformCard';
import CodingDNA from '../../components/coding/CodingDNA';
import CodingAchievements from '../../components/coding/CodingAchievements';
import DashboardHero from '../../components/coding/DashboardHero';
import DeveloperScore from '../../components/coding/DeveloperScore';
import DeveloperInsights from '../../components/coding/DeveloperInsights';
import CertificatesList from '../../components/coding/CertificatesList';
import PlatformDetailsDrawer from '../../components/coding/PlatformDetailsDrawer';
import CodingDNADrawer from '../../components/coding/CodingDNADrawer';
import GitHubCard from './coding/components/GitHubCard';

export default function StudentCoding() {
  const { user } = useAuth();
  const toast = useToast();
  const [platforms, setPlatforms] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [selectedPlatformKey, setSelectedPlatformKey] = useState(null);
  const [dnaDrawerOpen, setDnaDrawerOpen] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await CodingAPI.getCodingProfile(user.profileId);
      setPlatforms(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user?.profileId) return;
    loadProfile().finally(() => setFetching(false));
  }, [user]);

  const handleLink = async (platformKey, values) => {
    try {
      await CodingAPI.linkPlatform(user.profileId, platformKey, values);
      toast.success(`${platformKey} linked successfully`);
      await loadProfile();
    } catch (err) {
      toast.error(err.message || `Failed to link ${platformKey}`);
    }
  };

  const handleRefresh = async (platformKey) => {
    try {
      await CodingAPI.refreshPlatform(user.profileId, platformKey);
      toast.success(`${platformKey} refreshed`);
      await loadProfile();
    } catch (err) {
      toast.error(err.message || `Failed to refresh ${platformKey}`);
      await loadProfile(); // reload anyway to show last_refresh_error
    }
  };

  const handleUnlink = async (platformKey) => {
    try {
      await CodingAPI.unlinkPlatform(user.profileId, platformKey);
      toast.success(`${platformKey} unlinked`);
      await loadProfile();
    } catch (err) {
      toast.error(err.message || `Failed to unlink ${platformKey}`);
    }
  };

  if (fetching) return <div className="p-8 text-center text-text-secondary">Loading coding profiles...</div>;

  return (
    <div className="space-y-6 pb-12">
      <DashboardHero user={user} platforms={platforms} />
    
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Coding Platforms
          </h2>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {platforms && Object.entries(platforms).filter(([key]) => key !== 'github').map(([key, platform]) => (
          <CodingPlatformCard
            key={key}
            platformKey={key}
            platform={platform}
            onLink={handleLink}
            onRefresh={handleRefresh}
            onUnlink={handleUnlink}
            onViewDetails={setSelectedPlatformKey}
          />
        ))}
        {platforms?.github && (
          <GitHubCard 
            platform={platforms.github}
            onRefresh={() => {
              if (!platforms.github.data) {
                return handleLink('github', { githubUrl: platforms.github.profile_url });
              }
              return handleRefresh('github');
            }}
          />
        )}
      </div>

      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Developer Analytics
          </h2>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  
        <div className="lg:col-span-2">
          <DeveloperInsights platforms={platforms} />
        </div>
        <div>
          <DeveloperScore platforms={platforms} />
        </div>
      </div>

      <section className="space-y-4">

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Skills & Achievements
          </h2>
        </div>
      </section>
          
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CodingDNA platforms={platforms} onViewFullDNA={() => setDnaDrawerOpen(true)} />
        </div>
        <div className="lg:col-span-1">
          <CodingAchievements platforms={platforms} />
        </div>
        <div className="lg:col-span-1">
          <CertificatesList platforms={platforms} />
        </div>
      </div>

      <PlatformDetailsDrawer 
        isOpen={!!selectedPlatformKey}
        onClose={() => setSelectedPlatformKey(null)}
        platformKey={selectedPlatformKey}
        platform={platforms?.[selectedPlatformKey]}
      />

      <CodingDNADrawer 
        isOpen={dnaDrawerOpen}
        onClose={() => setDnaDrawerOpen(false)}
        platforms={platforms}
      />
    </div>
  );
}
