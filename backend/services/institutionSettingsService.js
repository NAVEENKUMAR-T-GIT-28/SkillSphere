const institutionSettingsRepo = require('../repositories/institutionSettingsRepo');

class InstitutionSettingsService {
  static _cache = null;
  static _lastFetched = 0;
  static CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

  static async getSettings() {
    const now = Date.now();
    if (this._cache && (now - this._lastFetched < this.CACHE_TTL_MS)) {
      return this._cache;
    }
    return this.refreshCache();
  }

  static async refreshCache() {
    let settings = await institutionSettingsRepo.getSettings();
    if (!settings) {
      // Create defaults in-memory if missing, but rely on DB seed normally
      settings = {
        login_strategy: 'ROLL_NUMBER',
        mentor_capacity: 20,
        grading_scale: 10,
        password_policy: { min_length: 12, require_special: true }
      };
    }
    this._cache = settings;
    this._lastFetched = Date.now();
    return this._cache;
  }

  static clearCache() {
    this._cache = null;
    this._lastFetched = 0;
  }
}

module.exports = InstitutionSettingsService;
