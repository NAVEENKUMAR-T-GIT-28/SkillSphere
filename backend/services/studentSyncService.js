const eventBus = require('./events/eventBus');
const studentSearchRepo = require('../repositories/studentSearchRepo');
const studentRepo = require('../repositories/studentRepo');
const classRepo = require('../repositories/classRepo');

class StudentSyncService {
  initialize() {
    console.warn('[DEPRECATED] studentSyncService is disabled. Use studentSearchSync instead.');
  }

  _wrapSubscriber(handler) {
    return async (event) => {
      const startTime = Date.now();
      try {
        await handler(event);
        console.log(`[StudentSyncService] SUCCESS | Event: ${event.id} | Type: ${event.type} | Duration: ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error(`[StudentSyncService] ERROR | Event: ${event.id} | Type: ${event.type} | Duration: ${Date.now() - startTime}ms`, error);
      }
    };
  }

  async _upsertStudentSearch(studentId) {
    const student = await studentRepo.findById(studentId);
    if (!student) return;

    const classDoc = await classRepo.findById(student.class_id);
    
    // Project identity into flattened read model
    const searchDoc = {
      student_id: student._id,
      name: student.full_name,
      roll_number: student.roll_number,
      account_status: student.user_id ? student.user_id.account_status : 'ACTIVE',
      academic_status: student.academic_status,
      is_visible: student.user_id ? (student.user_id.account_status !== 'DISABLED' && student.user_id.account_status !== 'SUSPENDED') : true,
      cgpa: student.latest_cgpa || student.cgpa || 0,
      department: classDoc ? classDoc.department : '',
      semester: classDoc ? classDoc.semester : null,
      batch_year: classDoc ? classDoc.batch_year : null,
      graduation_year: classDoc ? (classDoc.batch_year + 4) : null,
      section: classDoc ? classDoc.section : '',
      current_backlogs: student.active_backlogs || student.current_backlogs || 0,
      synced_at: new Date()
    };

    await studentSearchRepo.updateOne(
      { student_id: student._id },
      { $set: searchDoc },
      { upsert: true }
    );
  }

  async handleStudentCreated(event) {
    await this._upsertStudentSearch(event.payload.studentId);
  }

  async handleStudentUpdated(event) {
    // Also captures generic updates to identity fields
    await this._upsertStudentSearch(event.payload.studentId);
  }

  async handleClassChanged(event) {
    await this._upsertStudentSearch(event.payload.studentId);
  }

  async handleStudentStatusChanged(event) {
    await this._upsertStudentSearch(event.payload.studentId);
  }
}

module.exports = new StudentSyncService();
