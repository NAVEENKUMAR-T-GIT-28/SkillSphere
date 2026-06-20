import React from 'react';

export default function HODAuditLog() {
  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Verification audit trail</h1>
        <p className="text-[13px] text-text-secondary">Immutable log of all verification actions</p>
      </div>

      <div className="bg-gray-50 rounded-md p-3.5 mb-5 border border-border">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search by student or type..." 
              className="text-[13px] px-2.5 py-1.5 border border-border rounded bg-surface w-full"
            />
          </div>
          <select className="text-[13px] px-2.5 py-1.5 border border-border rounded bg-surface">
            <option>All types</option>
            <option>skill</option>
            <option>certification</option>
            <option>project</option>
          </select>
          <select className="text-[13px] px-2.5 py-1.5 border border-border rounded bg-surface">
            <option>All actions</option>
            <option>submitted</option>
            <option>approved</option>
            <option>rejected</option>
          </select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Time</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Type</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Item</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Student</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Actor</th>
                <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock data to match reference UI since there is no audit log API yet */}
              <tr className="border-b border-border hover:bg-gray-50">
                <td className="py-2.5 px-3 text-[12px] text-text-secondary">12 Jun 14:30</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">cert</span></td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">AWS Architect</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Anjali Singh</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Dr. Smith</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">approved</span></td>
              </tr>
              <tr className="border-b border-border hover:bg-gray-50">
                <td className="py-2.5 px-3 text-[12px] text-text-secondary">12 Jun 12:10</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">skill</span></td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Docker</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Karthik V</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Dr. Smith</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">rejected</span></td>
              </tr>
              <tr className="border-b border-border hover:bg-gray-50">
                <td className="py-2.5 px-3 text-[12px] text-text-secondary">11 Jun 09:00</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-700">project</span></td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">E-commerce App</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Priya Mehta</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Prof. Verma</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">approved</span></td>
              </tr>
              <tr className="border-b border-border hover:bg-gray-50">
                <td className="py-2.5 px-3 text-[12px] text-text-secondary">10 Jun 16:45</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">cert</span></td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">React Dev Cert</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Rahul Kumar</td>
                <td className="py-2.5 px-3 text-[13px] text-text-primary">Dr. Smith</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">submitted</span></td>
              </tr>
            </tbody>
          </table>
          <div className="py-4 text-center text-[12px] text-text-secondary border-t border-border">
            Note: This list is currently mocked for layout preview.
          </div>
        </div>
      </div>
    </div>
  );
}
