import React from 'react';
import { Upload, Download, KeyRound, FileText } from 'lucide-react';

export default function QuickActions({ onImport, onExport, onSendCredentials }) {
  const actions = [
    { label: 'Import Students', icon: Upload, onClick: onImport },
    { label: 'Export This Class', icon: Download, onClick: onExport },
    { label: 'Send Credentials (All)', icon: KeyRound, onClick: onSendCredentials },
    { label: 'Class Activity Log', icon: FileText, onClick: () => {} },
  ];

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-text-primary mb-3 px-1">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="w-full flex items-center gap-3 p-3 text-left bg-surface border border-border/50 hover:border-border hover:bg-surface-hover rounded-xl shadow-sm transition-colors group"
          >
            <action.icon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
