/**
 * tests/utils/startupLogger.test.js
 *
 * Unit tests for printStartupSummary.
 * We spy on console.log to verify output without actual I/O,
 * and we reset the routeTracker endpoint singleton between suites.
 */

// Silence console.log for all tests in this file
let logSpy;

beforeEach(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  // Reset the shared endpoints array before each test
  jest.resetModules();
});

afterEach(() => {
  logSpy.mockRestore();
});

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeConfig = (overrides = {}) => ({
  NODE_ENV: 'development',
  PORT: 5000,
  ORIGIN: 'http://localhost:5173',
  ...overrides,
});

const makeMongoose = (name = 'skillsphere') => ({
  connection: { name },
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe('printStartupSummary()', () => {
  test('calls console.log at least once (smoke test)', () => {
    const { printStartupSummary } = require('../../utils/startupLogger');
    printStartupSummary(null, makeConfig(), makeMongoose());
    expect(logSpy).toHaveBeenCalled();
  });

  // ── development mode ───────────────────────────────────────────────────────

  describe('development mode', () => {
    test('prints the SkillSphere startup banner', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('SkillSphere REST API Startup Summary');
    });

    test('prints environment, port, app URL, and allowed origins', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig({ PORT: 4321 }), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('4321');
      expect(allOutput).toContain('development');
      expect(allOutput).toContain('http://localhost:5173');
    });

    test('prints DB name when mongooseInstance is provided', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose('testdb'));

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('testdb');
    });

    test('falls back to "skillsphere" when connection.name is falsy', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), { connection: { name: '' } });

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('skillsphere');
    });

    test('does NOT print DB info when mongooseInstance is null', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), null);

      // No "DB Name:" line should appear
      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).not.toContain('DB Name:');
    });

    test('prints the health check URL in the footer', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig({ PORT: 5000 }), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('/api/health');
    });

    test('prints "Registered Routes" section header', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Registered Routes');
    });
  });

  // ── production mode ────────────────────────────────────────────────────────

  describe('production mode', () => {
    test('prints plain startup banner (no chalk colour codes in text)', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig({ NODE_ENV: 'production' }), null);

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('SkillSphere REST API Startup Summary');
    });

    test('prints plain "Registered Endpoints" footer', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig({ NODE_ENV: 'production' }), null);

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Registered Endpoints:');
    });

    test('does NOT print DB name in production', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig({ NODE_ENV: 'production' }), makeMongoose('prod-db'));

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).not.toContain('DB Name:');
    });

    test('uses fallback "*" when ORIGIN is not provided', () => {
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig({ ORIGIN: undefined }), null);

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('*');
    });
  });

  // ── route table rendering ─────────────────────────────────────────────────

  describe('route table with endpoints', () => {
    // We seed endpoints via trackRouter before requiring startupLogger
    function seedEndpoint(method, path, action = 'handler') {
      const { endpoints } = require('../../utils/routeTracker');
      endpoints.push({ method, path, action });
    }

    test('prints table borders (top, header separator, bottom)', () => {
      seedEndpoint('GET', '/api/auth/login');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('┌'); // top-left corner
      expect(allOutput).toContain('┘'); // bottom-right corner
      expect(allOutput).toContain('├'); // header separator
    });

    test('renders an Auth controller row', () => {
      seedEndpoint('POST', '/api/auth/register');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Auth');
      expect(allOutput).toContain('/api/auth/register');
    });

    test('renders a HOD controller row', () => {
      seedEndpoint('GET', '/api/hod/dashboard');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('HOD');
    });

    test('renders an Admin controller row', () => {
      seedEndpoint('POST', '/api/admin/create-hod');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Admin');
    });

    test('renders a Faculty controller row for /api/verification paths', () => {
      seedEndpoint('GET', '/api/verification/queue');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Faculty');
    });

    test('renders a Search controller row', () => {
      seedEndpoint('GET', '/api/search/students');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Search');
    });

    test('renders a Notification controller row', () => {
      seedEndpoint('GET', '/api/notifications');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Notification');
    });

    test('renders a MyAccess controller row', () => {
      seedEndpoint('GET', '/api/my/mentees');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('MyAccess');
    });

    test('renders a Placement controller row for placement-drives', () => {
      seedEndpoint('GET', '/api/placement-drives');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Placement');
    });

    test('renders a Placement controller row for /api/applications paths', () => {
      seedEndpoint('PATCH', '/api/applications/:id/status');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Placement');
    });

    test('classifies /api/students/:id/certifications as Certification', () => {
      seedEndpoint('GET', '/api/students/:studentId/certifications');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Certification');
    });

    test('classifies /api/students/:id/projects as Project', () => {
      seedEndpoint('GET', '/api/students/:studentId/projects');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Project');
    });

    test('classifies /api/projects/:id/rate as Project', () => {
      seedEndpoint('POST', '/api/projects/:id/rate');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Project');
    });

    test('classifies /api/students/:id/resumes as Resume', () => {
      seedEndpoint('GET', '/api/students/:studentId/resumes');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Resume');
    });

    test('classifies /api/students/:id/coding-profiles as CodingProfile', () => {
      seedEndpoint('GET', '/api/students/:studentId/coding-profiles');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('CodingProfile');
    });

    test('classifies /api/students/:id/skills as Skill', () => {
      seedEndpoint('GET', '/api/students/:studentId/skills');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Skill');
    });

    test('classifies /api/skill-taxonomy as Skill', () => {
      seedEndpoint('GET', '/api/skill-taxonomy');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Skill');
    });

    test('classifies /api/students/:id/dashboard as Student', () => {
      seedEndpoint('GET', '/api/students/dashboard');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Student');
    });

    test('classifies unknown paths as "App"', () => {
      seedEndpoint('GET', '/api/unknown/route');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('App');
    });

    test('skips OPTIONS endpoints', () => {
      seedEndpoint('OPTIONS', '/api/auth/login');
      seedEndpoint('GET', '/api/auth/login');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      // Total count should be 1 (OPTIONS skipped)
      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Total: 1 endpoint');
    });

    test('prints a separator between controller groups', () => {
      seedEndpoint('POST', '/api/auth/login');
      seedEndpoint('GET', '/api/hod/dashboard');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      // The horizontal separator ├────...┤ should appear more than once
      const separatorCalls = logSpy.mock.calls.filter((args) =>
        String(args[0]).includes('├')
      );
      expect(separatorCalls.length).toBeGreaterThanOrEqual(2);
    });

    test('truncates very long paths with "..."', () => {
      const longPath = '/api/students/:id/' + 'x'.repeat(60);
      seedEndpoint('GET', longPath);
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('...');
    });

    test('displays the correct total endpoint count', () => {
      seedEndpoint('GET', '/api/auth/login');
      seedEndpoint('POST', '/api/auth/register');
      seedEndpoint('GET', '/api/hod/dashboard');
      const { printStartupSummary } = require('../../utils/startupLogger');
      printStartupSummary(null, makeConfig(), makeMongoose());

      const allOutput = logSpy.mock.calls.flat().join('\n');
      expect(allOutput).toContain('Total: 3 endpoints');
    });
  });
});
