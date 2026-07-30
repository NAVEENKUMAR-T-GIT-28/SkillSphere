const { buildProjection } = require('./studentSync/projection.builder');
const studentRepo = require('../repositories/studentRepo'); // needed for bulk operations

/**
 * Rebuilds a single student projection.
 * Event subscriptions map to this function.
 */
async function syncStudentSearch(studentId, eventName = 'ManualSync') {
  try {
    await buildProjection(studentId, eventName);
    console.log(`[StudentSyncService] Successfully rebuilt projection for student: ${studentId} (Event: ${eventName})`);
  } catch (error) {
    console.error(`[StudentSyncService] Failed to sync student search for ${studentId}:`, error);
  }
}

/**
 * Rebuilds all students in a given class.
 * Used for cohort-wide events like ClassPromoted.
 */
async function syncClassSearch(classId, eventName = 'ClassUpdated') {
  try {
    // Stream students in the class
    const cursor = await studentRepo.findMany({ class_id: classId, academic_status: { $ne: 'DROPPED' } }).cursor();
    
    let batch = [];
    for await (const student of cursor) {
      batch.push(student._id);
      if (batch.length >= 100) {
        await Promise.all(batch.map(id => syncStudentSearch(id, eventName)));
        batch = [];
      }
    }
    
    if (batch.length > 0) {
      await Promise.all(batch.map(id => syncStudentSearch(id, eventName)));
    }
    console.log(`[StudentSyncService] Successfully rebuilt projection for class: ${classId} (Event: ${eventName})`);
  } catch (error) {
    console.error(`[StudentSyncService] Failed to sync class search for class ${classId}:`, error);
  }
}

const eventBus = require('./events/eventBus');

class StudentSearchSyncService {
  initialize() {
    eventBus.on('StudentCreated', this._wrapStudentSubscriber());
    eventBus.on('StudentUpdated', this._wrapStudentSubscriber());
    eventBus.on('ClassChanged', this._wrapStudentSubscriber());
    eventBus.on('StudentSuspended', this._wrapStudentSubscriber());
    eventBus.on('StudentActivated', this._wrapStudentSubscriber());
    eventBus.on('StudentSoftDeleted', this._wrapStudentSubscriber());
    eventBus.on('ClassPromoted', this._wrapClassSubscriber());
    eventBus.on('ResumeUpdated', this._wrapStudentSubscriber());
    eventBus.on('CodingUpdated', this._wrapStudentSubscriber());
    eventBus.on('AcademicUpdated', this._wrapStudentSubscriber());
    eventBus.on('PlacementUpdated', this._wrapStudentSubscriber());
    eventBus.on('VerificationUpdated', this._wrapStudentSubscriber());
  }

  _wrapStudentSubscriber() {
    return async (event) => {
      if (!event.payload || !event.payload.studentId) return;
      await syncStudentSearch(event.payload.studentId, event.type);
    };
  }

  _wrapClassSubscriber() {
    return async (event) => {
      if (!event.payload || !event.payload.classId) return;
      await syncClassSearch(event.payload.classId, event.type);
    };
  }
}

module.exports = { 
  syncStudentSearch, 
  syncClassSearch,
  initialize: () => new StudentSearchSyncService().initialize()
};
