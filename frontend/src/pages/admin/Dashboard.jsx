import { useState } from 'react';
import { Shield, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { UsersAPI } from '../../services/api';

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    department: '',
    employee_id: '',
    phone: '',
    designation: 'Head of Department'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await UsersAPI.createHod(formData);
      setSuccess(`Successfully created HOD account for ${formData.full_name} (${formData.department})`);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        department: '',
        employee_id: '',
        phone: '',
        designation: 'Head of Department'
      });
    } catch (err) {
      setError(err.message || 'Failed to create HOD account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-medium text-text-primary mb-1">Admin console</h1>
        <p className="text-[13px] text-text-secondary">Create and manage HOD accounts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-4 bg-surface">
          <h2 className="text-[15px] font-medium mb-4 border-b border-border pb-3">Create HOD account</h2>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px] mb-4">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-[13px] mb-4">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Full name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Dr. Sarah Jenkins"
                  className="input-field text-[13px] py-1.5 px-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Employee ID</label>
                <input
                  type="text"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  placeholder="EMP10045"
                  className="input-field text-[13px] py-1.5 px-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah@college.edu"
                  className="input-field text-[13px] py-1.5 px-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="input-field text-[13px] py-1.5 px-2.5 pr-8"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field text-[13px] py-1.5 px-2.5"
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EE">EE</option>
                  <option value="ME">ME</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 ..."
                  className="input-field text-[13px] py-1.5 px-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Head of Department"
                className="input-field text-[13px] py-1.5 px-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white text-[13px] font-medium py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create HOD account'}
            </button>
          </form>
        </div>

        <div className="border border-border rounded-lg p-4 bg-surface">
          <h2 className="text-[15px] font-medium mb-4 border-b border-border pb-3">Existing HOD accounts</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Name</th>
                  <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Dept</th>
                  <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Employee ID</th>
                  <th className="text-left text-[12px] font-medium text-text-secondary py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Mock data for the layout demo */}
                <tr className="border-b border-border hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-[13px] font-medium text-text-primary">Dr. Robert Brown</td>
                  <td className="py-2.5 px-3 text-[13px] text-text-secondary">CSE</td>
                  <td className="py-2.5 px-3 text-[13px] text-text-secondary">FAC2002</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">Active</span></td>
                </tr>
                <tr className="border-b border-border hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-[13px] font-medium text-text-primary">Prof. A. Menon</td>
                  <td className="py-2.5 px-3 text-[13px] text-text-secondary">IT</td>
                  <td className="py-2.5 px-3 text-[13px] text-text-secondary">FAC2008</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">Active</span></td>
                </tr>
                <tr className="border-b border-border hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-[13px] font-medium text-text-primary">Dr. P. Nair</td>
                  <td className="py-2.5 px-3 text-[13px] text-text-secondary">ECE</td>
                  <td className="py-2.5 px-3 text-[13px] text-text-secondary">FAC2015</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">Inactive</span></td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 text-center text-[12px] text-text-secondary">
              Note: This list is currently mocked for layout preview.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
