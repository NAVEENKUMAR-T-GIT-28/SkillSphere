const userRepo = require('../repositories/userRepo');
const studentRepo = require('../repositories/studentRepo');
const classRepo = require('../repositories/classRepo');
const enrollmentLogRepo = require('../repositories/enrollmentLogRepo');
const PasswordService = require('./passwordService');
const EventPublisher = require('./events/eventPublisher');
const { runInTransaction } = require('../utils/transactionHelper');

const toEnrollmentDTO = (student, must_change_password, account_status) => {
  return {
    student_id: student._id,
    full_name: student.full_name,
    roll_number: student.roll_number,
    register_number: student.register_number,
    class: student.class_id && typeof student.class_id === 'object' ? {
      id: student.class_id._id,
      display_name: student.class_id.display_name || `${student.class_id.department} • Year ${student.class_id.current_year} • Section ${student.class_id.section}`,
      current_year: student.class_id.current_year,
      current_semester: student.class_id.current_semester,
      status: student.class_id.status
    } : student.class_id, // Fallback if not populated
    account_status: account_status || 'ACTIVE',
    academic_status: student.academic_status || 'ENROLLED',
    must_change_password: must_change_password || false
  };
};

class EnrollmentService {
  /**
   * Creates a new Student and associated User record atomically.
   */
  static async createStudent({ payload, actorId }) {
    const { login_identifier, full_name, roll_number, register_number, classDoc, personal_email, phone, alternate_phone } = payload;
    
    // Normalize sparse-indexed optional fields
    const normRegister = register_number === '' ? undefined : register_number;
    const normPhone = phone === '' ? undefined : phone;
    const normAltPhone = alternate_phone === '' ? undefined : alternate_phone;
    const normEmail = personal_email === '' ? undefined : personal_email;

    const result = await runInTransaction(async (session) => {
      const tempPassword = PasswordService.generateTemporaryPassword();
      const hashedPassword = await PasswordService.hashPassword(tempPassword);

      const user = await userRepo.createWithSession({
        email: `${roll_number}@institution.edu`, // Fallback generation for email if required
        login_identifier,
        password: hashedPassword,
        base_role: 'student',
        must_change_password: true,
        created_by: actorId
      }, session);

      let student;
      try {
        student = await studentRepo.createWithSession({
          user_id: user._id,
          class_id: classDoc._id,
          full_name,
          roll_number,
          register_number: normRegister,
          personal_email: normEmail,
          phone: normPhone,
          alternate_phone: normAltPhone,
          academic_status: 'ENROLLED'
        }, session);
      } catch (error) {
        if (!session) await userRepo.deleteById(user._id);
        throw error;
      }

      try {
        await enrollmentLogRepo.create({
          student_id: student._id,
          actor_id: actorId,
          action: 'STUDENT_CREATED',
          metadata: { class_id: classDoc._id }
        }, { session });
      } catch (error) {
        if (!session) {
          await studentRepo.deleteById(student._id);
          await userRepo.deleteById(user._id);
        }
        throw error;
      }

      return {
        dto: toEnrollmentDTO(student, user.must_change_password, user.account_status),
        tempPassword,
        eventPayload: { studentId: student._id, userId: user._id, classId: classDoc._id, actorId }
      };
    });

    EventPublisher.publishStudentCreated(result.eventPayload);

    return {
      ...result.dto,
      temporary_password: result.tempPassword
    };
  }

  static async updateStudent(studentId, payload, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.updateByIdWithSession(studentId, payload, session);
      if (!student) throw new Error('Student not found');

      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'STUDENT_UPDATED',
        metadata: payload
      }, { session });

      return {
        dto: toEnrollmentDTO(student, false, 'ACTIVE'), // Simplification for MVP response
        eventPayload: { studentId: student._id, classId: student.class_id, userId: student.user_id, actorId, updates: payload }
      };
    });

    EventPublisher.publishStudentUpdated(result.eventPayload);
    return result.dto;
  }

  static async changeClass(studentId, newClassId, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.findByIdWithSession(studentId, session);
      if (!student) throw new Error('Student not found');
      
      const oldClassId = student.class_id;
      student.class_id = newClassId;
      await student.save({ session }); 

      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'CLASS_CHANGED',
        metadata: { old_class_id: oldClassId, new_class_id: newClassId }
      }, { session });

      return {
        dto: toEnrollmentDTO(student, false, 'ACTIVE'),
        eventPayload: { studentId: student._id, userId: student.user_id, classId: newClassId, oldClassId, newClassId, actorId }
      };
    });

    EventPublisher.publishClassChanged(result.eventPayload);
    return result.dto;
  }

  static async resetPassword(studentId, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.findByIdWithSession(studentId, session);
      if (!student) throw new Error('Student not found');

      const tempPassword = PasswordService.generateTemporaryPassword();
      const hashedPassword = await PasswordService.hashPassword(tempPassword);

      const user = await userRepo.updateByIdWithSession(student.user_id._id, {
        password: hashedPassword,
        must_change_password: true
      }, session);

      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'PASSWORD_RESET',
        metadata: { reason: 'Requested by HOD' }
      }, { session });

      return {
        dto: toEnrollmentDTO(student, user.must_change_password, user.account_status),
        tempPassword,
        eventPayload: { studentId: student._id, userId: student.user_id, classId: student.class_id, actorId, reason: 'Requested by HOD' }
      };
    });

    EventPublisher.publishPasswordReset(result.eventPayload);
    return {
      ...result.dto,
      temporary_password: result.tempPassword
    };
  }

  static async suspendStudent(studentId, reason, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.findByIdWithSession(studentId, session);
      if (!student) throw new Error('Student not found');

      const user = await userRepo.updateByIdWithSession(student.user_id._id, { account_status: 'SUSPENDED' }, session);
      
      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'STUDENT_SUSPENDED',
        metadata: { reason }
      }, { session });

      return {
        dto: toEnrollmentDTO(student, user.must_change_password, user.account_status),
        eventPayload: { studentId: student._id, userId: student.user_id, classId: student.class_id, actorId, reason }
      };
    });

    EventPublisher.publishStudentSuspended(result.eventPayload);
    return result.dto;
  }

  static async activateStudent(studentId, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.findByIdWithSession(studentId, session);
      if (!student) throw new Error('Student not found');

      const user = await userRepo.updateByIdWithSession(student.user_id._id, { account_status: 'ACTIVE' }, session);
      
      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'STUDENT_ACTIVATED',
        metadata: {}
      }, { session });

      return {
        dto: toEnrollmentDTO(student, user.must_change_password, user.account_status),
        eventPayload: { studentId: student._id, userId: student.user_id, classId: student.class_id, actorId }
      };
    });

    EventPublisher.publishStudentActivated(result.eventPayload);
    return result.dto;
  }

  static async graduateStudent(studentId, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.updateByIdWithSession(studentId, { academic_status: 'GRADUATED' }, session);
      if (!student) throw new Error('Student not found');

      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'STUDENT_GRADUATED',
        metadata: {}
      }, { session });

      return {
        dto: toEnrollmentDTO(student, false, 'ACTIVE'),
        eventPayload: { studentId: student._id, userId: student.user_id, classId: student.class_id, actorId }
      };
    });

    EventPublisher.publishStudentUpdated(result.eventPayload);
    return result.dto;
  }

  static async softDeleteStudent(studentId, actorId) {
    const result = await runInTransaction(async (session) => {
      const student = await studentRepo.findByIdWithSession(studentId, session);
      if (!student) throw new Error('Student not found');

      const user = await userRepo.updateByIdWithSession(student.user_id._id, { account_status: 'DISABLED' }, session);
      student.academic_status = 'DROPPED';
      await student.save({ session });
      
      await enrollmentLogRepo.create({
        student_id: student._id,
        actor_id: actorId,
        action: 'SOFT_DELETED',
        metadata: { reason: 'Soft deleted by HOD' }
      }, { session });

      return {
        dto: toEnrollmentDTO(student, user.must_change_password, user.account_status),
        eventPayload: { studentId: student._id, userId: student.user_id, classId: student.class_id, actorId }
      };
    });

    EventPublisher.publishStudentSoftDeleted(result.eventPayload);
    return result.dto;
  }

  static async bulkValidationHelpers() {
    return {};
  }
}

module.exports = EnrollmentService;
