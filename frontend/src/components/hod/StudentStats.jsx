import React from 'react';
import { Users, UserCheck, UserMinus, UserX } from 'lucide-react';

export default function StudentStats({ stats, loading }) {
  const defaultStats = { total: 0, active: 0, suspended: 0, dropped: 0, ...stats };

  const getPercentage = (val) => {
    if (!defaultStats.total || defaultStats.total === 0) return '0%';
    return `${((val / defaultStats.total) * 100).toFixed(1)}% of total`;
  };

  const cards = [
    { label: 'Total Students', value: defaultStats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', link: 'View all Students →' },
    { label: 'Active', value: defaultStats.active, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50', subtext: getPercentage(defaultStats.active) },
    { label: 'Suspended', value: defaultStats.suspended, icon: UserMinus, color: 'text-amber-500', bg: 'bg-amber-50', subtext: getPercentage(defaultStats.suspended) },
    { label: 'Dropped', value: defaultStats.dropped, icon: UserX, color: 'text-red-500', bg: 'bg-red-50', subtext: getPercentage(defaultStats.dropped) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-surface p-4 rounded-xl shadow-sm border border-border/50 flex flex-col justify-between h-[100px]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{card.label}</p>
                {loading ? (
                  <div className="h-6 w-12 bg-border/50 animate-pulse rounded mt-1"></div>
                ) : (
                  <h3 className="text-2xl font-bold text-text-primary leading-none mt-1">{card.value}</h3>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs">
            {card.link ? (
              <button className="font-semibold text-primary hover:text-primary-hover transition-colors">{card.link}</button>
            ) : (
              <span className="text-text-muted">{card.subtext}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
