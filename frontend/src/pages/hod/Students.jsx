import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { EnrollmentAPI } from '../../services/api';
import { Plus, Upload, GraduationCap, ChevronRight } from 'lucide-react';

// Components
import StudentStats from '../../components/hod/StudentStats';
import StudentToolbar from '../../components/hod/StudentToolbar';
import StudentTable from '../../components/hod/StudentTable';
import StudentWizardModal from '../../components/hod/StudentWizardModal';
import StudentDetailsDrawer from '../../components/hod/StudentDetailsDrawer';
import { 
  EditIdentityModal, ChangeClassModal, ChangeStatusModal, ResetPasswordModal 
} from '../../components/hod/StudentActionModals';

export default function HODStudentManagement() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Workspace Data State
  const [workspace, setWorkspace] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, dropped: 0 });
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingClass, setLoadingClass] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modals, setModals] = useState({
    edit: false,
    changeClass: false,
    changeStatus: false,
    resetPassword: false
  });

  // Redirect if no classId
  useEffect(() => {
    if (!classId) {
      navigate('/hod/classes');
    }
  }, [classId, navigate]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Workspace (Students, Class, Stats)
  const fetchStudents = useCallback(async (page = 1) => {
    if (!classId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('class_id', classId);
      params.append('page', page);
      params.append('limit', 10);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await EnrollmentAPI.getStudents(params.toString());
      const data = res.data; // This is now Workspace DTO
      
      setWorkspace(data);
      setClassData(data.class);
      setStudents(data.students || []);
      setMeta(data.pagination || null);
      setStats(data.stats || { total_students: 0, active_students: 0 });
      setLoadingClass(false);
      
    } catch (err) {
      toast.error('Failed to load student workspace');
      setLoadingClass(false);
    } finally {
      setLoading(false);
    }
  }, [classId, debouncedSearch, toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handlers
  const handleActionComplete = () => {
    setModals({ edit: false, changeClass: false, changeStatus: false, resetPassword: false });
    toast.success('Action completed successfully');
    fetchStudents(meta?.page || 1);
    if (drawerOpen && selectedStudent) {
      EnrollmentAPI.getStudentById(selectedStudent.student_id || selectedStudent._id).then(res => setSelectedStudent(res.data)).catch(console.error);
    }
  };

  const openModal = (modalName, student) => {
    setSelectedStudent(student);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  if (loadingClass || !classData) {
    return <div className="p-8 text-center text-text-secondary">Loading workspace...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
        <button onClick={() => navigate('/hod/classes')} className="hover:text-primary transition-colors">
          Classes
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="font-medium text-text-primary">
          {classData.display_name || `${classData.department} • Year ${classData.current_year} • Section ${classData.section}`}
        </span>
      </div>

      {/* Class Summary Dashboard */}
      <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {classData.display_name || `${classData.department} • Year ${classData.current_year} • Section ${classData.section}`}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span><strong>Department:</strong> {classData.department}</span>
              <span><strong>Advisor:</strong> {classData.advisor || 'Unassigned'}</span>
              <span><strong>Status:</strong> {classData.status || 'ACTIVE'}</span>
              <span><strong>Total Students:</strong> {stats.total_students} / {classData.capacity || '-'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toast.info('Import workflow coming in Phase 3')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-surface-hover transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Import Students
          </button>
          <button 
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover shadow-sm shadow-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Student
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <StudentToolbar 
          search={searchQuery}
          onSearch={setSearchQuery}
        />
        
        <StudentTable 
          students={students}
          loading={loading}
          meta={meta}
          onPageChange={fetchStudents}
          onViewDetails={(s) => { setSelectedStudent(s); setDrawerOpen(true); }}
          onEdit={(s) => openModal('edit', s)}
          onChangeClass={(s) => openModal('changeClass', s)}
          onResetPassword={(s) => openModal('resetPassword', s)}
          onChangeStatus={(s) => openModal('changeStatus', s)}
        />
      </div>

      {/* Overlays */}
      <StudentWizardModal 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        onSuccess={() => fetchStudents(1)}
        classContext={classData}
      />
      
      <StudentDetailsDrawer 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        student={selectedStudent}
        onEdit={(s) => openModal('edit', s)}
        onChangeClass={(s) => openModal('changeClass', s)}
        onResetPassword={(s) => openModal('resetPassword', s)}
        onChangeStatus={(s) => openModal('changeStatus', s)}
      />

      {/* Admin Modals */}
      <EditIdentityModal isOpen={modals.edit} onClose={() => setModals(prev => ({...prev, edit: false}))} student={selectedStudent} onSuccess={handleActionComplete} />
      <ChangeClassModal isOpen={modals.changeClass} onClose={() => setModals(prev => ({...prev, changeClass: false}))} student={selectedStudent} classes={[classData]} onSuccess={handleActionComplete} />
      <ChangeStatusModal isOpen={modals.changeStatus} onClose={() => setModals(prev => ({...prev, changeStatus: false}))} student={selectedStudent} onSuccess={handleActionComplete} />
      <ResetPasswordModal isOpen={modals.resetPassword} onClose={() => setModals(prev => ({...prev, resetPassword: false}))} student={selectedStudent} onSuccess={handleActionComplete} />
    </div>
  );
}
