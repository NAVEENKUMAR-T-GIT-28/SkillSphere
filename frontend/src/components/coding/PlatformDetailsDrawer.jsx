import { X } from "lucide-react";
import LeetCodeDetails from "./LeetCodeDetails";
import HackerRankDetails from "./HackerRankDetails";
import SkillRackDetails from "./SkillRackDetails";

export default function PlatformDetailsDrawer({ isOpen, onClose, platformKey, platform }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`relative w-full max-w-[550px] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {platformKey === 'leetcode' ? '🟡' : platformKey === 'hackerrank' ? '🟢' : '🟣'}
            </span>
            <h2 className="text-xl font-bold text-gray-800">{platform?.label || 'Platform Details'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {platform?.last_refresh_status === 'failed' ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold mb-1">Failed to fetch data</h3>
              <p className="text-sm">{platform.last_refresh_error}</p>
            </div>
          ) : !platform?.data ? (
            <div className="text-center text-gray-500 py-10">No data available</div>
          ) : (
            <>
              {platformKey === 'leetcode' && <LeetCodeDetails data={platform.data} />}
              {platformKey === 'hackerrank' && <HackerRankDetails data={platform.data} />}
              {platformKey === 'skillrack' && <SkillRackDetails data={platform.data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
