import React, { useState } from 'react';
import { X, CheckCircle2, Copy, Download, Printer } from 'lucide-react';
import { EnrollmentAPI } from '../../services/api';

export default function StudentWizardModal({ isOpen, onClose, onSuccess, classContext }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [studentResponse, setStudentResponse] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    register_number: '',
    personal_email: '',
    phone: '',
    class_id: classContext?._id || classContext?.id || ''
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = { ...formData, class_id: classContext?._id || classContext?.id };
      const res = await EnrollmentAPI.createStudent(payload);
      
      setCredentials({
        login_identifier: res.data.user?.login_identifier || payload.roll_number,
        temporary_password: res.data.temporary_password
      });
      setStudentResponse(res.data.student || res.data);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCredentials(null);
    setStudentResponse(null);
    setFormData({
      full_name: '', roll_number: '', register_number: '', personal_email: '', phone: '', class_id: classContext?._id || classContext?.id || ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/50">
          <h2 className="text-lg font-bold text-text-primary">Create Student</h2>
          {step !== 3 && (
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 pb-2 border-b border-border/50">Step 1: Identity</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Full Name *</label>
                  <input type="text" placeholder="e.g. John Doe" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Roll Number *</label>
                    <input type="text" placeholder="e.g. CS2024001" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={formData.roll_number} onChange={e => setFormData({...formData, roll_number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Register Number</label>
                    <input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={formData.register_number} onChange={e => setFormData({...formData, register_number: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Personal Email</label>
                  <input type="email" placeholder="john.doe@gmail.com" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={formData.personal_email} onChange={e => setFormData({...formData, personal_email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                  <input type="tel" placeholder="+91 9876543210" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 pb-2 border-b border-border/50">Step 2: Confirmation</h3>
              
              <div className="p-4 bg-background border border-border rounded-lg space-y-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Enrolling into (Read-Only)</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <p className="text-xs text-text-muted">Department</p>
                    <p className="text-sm font-medium text-text-primary">{classContext?.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Section</p>
                    <p className="text-sm font-medium text-text-primary">{classContext?.section}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Year & Semester</p>
                    <p className="text-sm font-medium text-text-primary">Year {classContext?.current_year}, Sem {classContext?.current_semester}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-background border border-border rounded-lg space-y-3 mt-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Student Identity</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <p className="text-xs text-text-muted">Name</p>
                    <p className="text-sm font-medium text-text-primary">{formData.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Roll Number</p>
                    <p className="text-sm font-medium text-text-primary">{formData.roll_number}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {step === 3 && credentials && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">Student Created Successfully</h3>
              
              <div className="bg-background border border-border rounded-lg p-5 text-left max-w-sm mx-auto space-y-4 relative group shadow-sm">
                <div className="border-b border-border/50 pb-3">
                  <p className="text-sm font-bold text-text-primary">{formData.full_name}</p>
                  <p className="text-xs text-text-secondary">Roll No: {formData.roll_number} • {classContext?.display_name || classContext?.department}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Login ID</p>
                    <p className="font-mono text-sm font-semibold text-text-primary bg-surface py-1 px-2 rounded border border-border inline-block">{credentials.login_identifier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Temporary Password</p>
                    <p className="font-mono text-lg font-bold text-text-primary tracking-widest">{credentials.temporary_password}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(`Login ID: ${credentials.login_identifier}\nPassword: ${credentials.temporary_password}`)}
                  className="absolute bottom-4 right-4 p-2 bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors shadow-sm"
                  title="Copy Credentials"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                  <Printer className="w-4 h-4" /> Print Credentials
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-background/50 flex justify-end gap-3">
          {step === 1 && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
              <button onClick={handleNext} disabled={!formData.full_name || !formData.roll_number} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors">Next</button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary mr-auto transition-colors">Back</button>
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || !(classContext?._id || classContext?.id)} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm shadow-primary/20">
                {loading ? 'Creating...' : 'Confirm Enrollment'}
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Create Another</button>
              <button onClick={onClose} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20">Finish</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
