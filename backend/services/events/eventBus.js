const EventEmitter = require('events');

class EventBus extends EventEmitter {}

// Export as singleton
const eventBus = new EventBus();

module.exports = eventBus;
