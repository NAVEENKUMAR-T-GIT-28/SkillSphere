/**
 * Event Bootstrap
 * Registers all domain event listeners (synchronization backbone)
 * at application startup.
 */

const studentSearchSync = require('../studentSearchSync');
const dashboardSyncService = require('../dashboardSyncService');
const mentorSyncService = require('../mentorSyncService');
const placementSyncService = require('../placementSyncService');
const notificationSyncService = require('../notificationSyncService');

const bootstrapEvents = () => {
  console.log('[Bootstrap] Initializing Event Synchronization Backbone...');
  
  studentSearchSync.initialize();
  dashboardSyncService.initialize();
  mentorSyncService.initialize();
  placementSyncService.initialize();
  notificationSyncService.initialize();

  console.log('[Bootstrap] All synchronization listeners registered.');
};

module.exports = bootstrapEvents;
