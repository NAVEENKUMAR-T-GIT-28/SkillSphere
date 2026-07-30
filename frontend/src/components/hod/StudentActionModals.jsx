import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { EnrollmentAPI } from '../../services/api';

export function EditIdentityModal({ isOpen, onClose, student, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: student?.full_name || '',
    personal_email: student?.personal_email || '',
    phone: student?.phone || ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await EnrollmentAPI.updateStudent(student._id, formData);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="font-bold">Edit Identity</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Full Name</label>
            <input className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Personal Email</label>
            <input type="email" className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={formData.personal_email} onChange={e => setFormData({...formData, personal_email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Phone</label>
            <input type="tel" className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ChangeClassModal({ isOpen, onClose, student, classes, onSuccess }) {
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await EnrollmentAPI.changeClass(student._id, { new_class_id: classId });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="font-bold">Change Class</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-text-secondary">Transfer <strong>{student.full_name}</strong> to a new class.</p>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Target Class</label>
            <select className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={classId} onChange={e => setClassId(e.target.value)} required>
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id} disabled={c._id === student.class_id}>
                  {c.batch_year} - {c.department} - Sem {c.semester} - Sec {c.section} {c._id === student.class_id ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
            <button type="submit" disabled={loading || !classId} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">{loading ? 'Transferring...' : 'Confirm Transfer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ChangeStatusModal({ isOpen, onClose, student, onSuccess }) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await EnrollmentAPI.changeStatus(student._id, { account_status: status });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Change Status</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-text-secondary">Change account access for <strong>{student.full_name}</strong>.</p>
          <div>
            <select className="w-full px-3 py-2 bg-background border border-border rounded-lg" value={status} onChange={e => setStatus(e.target.value)} required>
              <option value="">Select Status</option>
              <option value="ACTIVE">ACTIVE (Normal Access)</option>
              <option value="SUSPENDED">SUSPENDED (Temporary block)</option>
              <option value="DISABLED">DISABLED (Dropped out)</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
            <button type="submit" disabled={loading || !status || status === student.user_id?.account_status} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">{loading ? 'Updating...' : 'Update Status'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordModal({ isOpen, onClose, student, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  if (!isOpen || !student) return null;

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await EnrollmentAPI.resetPassword(student._id);
      setTempPassword(res.data.data.temporary_password);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="font-bold">Reset Password</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <div className="p-4 space-y-4 text-center">
          {!tempPassword ? (
            <>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm text-text-secondary">This will immediately invalidate the current password for <strong>{student.full_name}</strong> and generate a new temporary one.</p>
              <div className="pt-4 flex justify-end gap-2 w-full">
                <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary flex-1 border border-border rounded-lg">Cancel</button>
                <button onClick={handleReset} disabled={loading} className="px-4 py-2 bg-amber-500 text-white flex-1 rounded-lg text-sm hover:bg-amber-600">{loading ? 'Resetting...' : 'Confirm Reset'}</button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-green-600">Password Reset!</h3>
              <p className="text-sm text-text-secondary">Provide this to the student immediately:</p>
              <div className="p-4 bg-background border border-border rounded-lg my-4">
                <p className="font-mono text-xl">{tempPassword}</p>
              </div>
              <button onClick={() => { onSuccess(); onClose(); }} className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm">Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
