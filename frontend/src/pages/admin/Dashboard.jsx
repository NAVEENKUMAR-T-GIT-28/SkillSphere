import { useState } from 'react';
import { Shield, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

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
      await api.post('/admin/create-hod', formData);
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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Admin Console</h1>
          <p className="text-text-secondary mt-1">Manage institutional departments and administrators.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-primary rounded-full text-xs font-semibold self-start md:self-auto">
          <Shield size={14} />
          System Administrator
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Info / Context */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 p-6">
            <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <UserPlus size={18} />
              HOD Configuration
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Head of Department (HOD) accounts have administrative control over their respective departments. 
              They can assign student roles (Mentors, CCs, Reps), create placement drives, and access overall departmental analytics.
            </p>
            <div className="border-t border-blue-200/50 pt-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>One HOD is typically created per academic department.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>The credentials provided here will be active immediately.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Creation Form */}
        <div className="lg:col-span-2">
          <div className="card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Create HOD Account</h2>
              <p className="text-sm text-text-secondary mt-1">Register a new Head of Department user and profile.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
                <AlertCircle className="shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-fade-in">
                <CheckCircle className="shrink-0" size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hod-fullname" className="block text-sm font-medium text-text-primary mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="hod-fullname"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="hod-empid" className="block text-sm font-medium text-text-primary mb-1.5">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    id="hod-empid"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="e.g. EMP10045"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hod-email" className="block text-sm font-medium text-text-primary mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="hod-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. sarah.j@college.edu"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="hod-password" className="block text-sm font-medium text-text-primary mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="hod-password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 8 characters"
                      className="input-field pr-10"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hod-dept" className="block text-sm font-medium text-text-primary mb-1.5">
                    Department
                  </label>
                  <select
                    id="hod-dept"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="ME">Mechanical Engineering (ME)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="hod-phone" className="block text-sm font-medium text-text-primary mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="hod-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 555-0199"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hod-designation" className="block text-sm font-medium text-text-primary mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  id="hod-designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Professor & Head"
                  className="input-field"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  id="btn-create-hod"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-6"
                >
                  {loading ? 'Creating Account...' : 'Create HOD Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
