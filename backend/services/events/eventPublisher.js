const crypto = require('crypto');
const eventBus = require('./eventBus');

/**
 * EventPublisher
 * Abstraction for domain events. MVP implementation runs synchronously or via setImmediate.
 */
class EventPublisher {
  static createBasePayload(type, payload) {
    return {
      type,
      payload: {
        event_id: `evt_${crypto.randomUUID()}`,
        occurredAt: new Date().toISOString(),
        studentId: payload.studentId,
        classId: payload.classId,
        actorId: payload.actorId,
        userId: payload.userId,
        projectionVersion: 1, // Phase B2 Projection schema version
        ...payload
      }
    };
  }

  static publishStudentCreated(payload) {
    const event = this.createBasePayload('StudentCreated', payload);
    eventBus.emit(event.type, event);
  }

  static publishStudentUpdated(payload) {
    const event = this.createBasePayload('StudentUpdated', payload);
    eventBus.emit(event.type, event);
  }

  static publishClassChanged(payload) {
    const event = this.createBasePayload('ClassChanged', payload);
    eventBus.emit(event.type, event);
  }

  static publishPasswordReset(payload) {
    const event = this.createBasePayload('PasswordReset', payload);
    eventBus.emit(event.type, event);
  }

  static publishStudentSuspended(payload) {
    const event = this.createBasePayload('StudentSuspended', payload);
    eventBus.emit(event.type, event);
  }

  static publishStudentActivated(payload) {
    const event = this.createBasePayload('StudentActivated', payload);
    eventBus.emit(event.type, event);
  }

  static publishStudentSoftDeleted(payload) {
    const event = this.createBasePayload('StudentSoftDeleted', payload);
    eventBus.emit(event.type, event);
  }
}

module.exports = EventPublisher;
