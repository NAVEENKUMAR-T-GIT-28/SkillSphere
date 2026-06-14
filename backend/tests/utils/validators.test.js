// We test validator chains by running them against a mock express-validator context.
// Simpler approach: test via actual route integration. Here we test the logic directly.

const { driveLink, httpsUrl } = require('../../utils/validators');

// Helper: simulate express-validator chain result
const runValidation = async (chain, fieldValue) => {
  const { validationResult } = require('express-validator');
  const express = require('express');
  const request = require('supertest');

  const app = express();
  app.use(express.json());
  app.post('/test', [chain], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.json({ ok: true });
  });

  return request(app).post('/test').send({ [chain.builder?.fields?.[0] || 'field']: fieldValue });
};

describe('validators utility', () => {
  describe('driveLink()', () => {
    test('accepts a valid Google Drive link', async () => {
      const chain = driveLink('drive_link');
      const { validationResult } = require('express-validator');
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.use(express.json());
      app.post('/test', [chain], (req, res) => {
        const errors = validationResult(req);
        res.json({ errors: errors.array() });
      });

      const res = await request(app).post('/test').send({
        drive_link: 'https://drive.google.com/file/d/abc123'
      });
      expect(res.body.errors).toHaveLength(0);
    });

    test('rejects a non-Google URL', async () => {
      const chain = driveLink('drive_link');
      const { validationResult } = require('express-validator');
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.use(express.json());
      app.post('/test', [chain], (req, res) => {
        const errors = validationResult(req);
        res.json({ errors: errors.array() });
      });

      const res = await request(app).post('/test').send({
        drive_link: 'https://dropbox.com/file/abc123'
      });
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('rejects http (non-https) links', async () => {
      const chain = driveLink('drive_link');
      const { validationResult } = require('express-validator');
      const express = require('express');
      const request = require('supertest');

      const app = express();
      app.use(express.json());
      app.post('/test', [chain], (req, res) => {
        const errors = validationResult(req);
        res.json({ errors: errors.array() });
      });

      const res = await request(app).post('/test').send({
        drive_link: 'http://drive.google.com/file/d/abc123'
      });
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  // ─── optionalDriveLink ─────────────────────────────────────────────────────

  describe('optionalDriveLink()', () => {
    const { optionalDriveLink } = require('../../utils/validators');

    const makeApp = (chain) => {
      const { validationResult } = require('express-validator');
      const express = require('express');
      const app = express();
      app.use(express.json());
      app.post('/test', [chain], (req, res) => {
        const errors = validationResult(req);
        res.json({ errors: errors.array() });
      });
      return app;
    };

    test('accepts a missing field (field is optional)', async () => {
      const request = require('supertest');
      const app = makeApp(optionalDriveLink('drive_link'));
      const res = await request(app).post('/test').send({});
      expect(res.body.errors).toHaveLength(0);
    });

    test('accepts null as value (nullable: true)', async () => {
      const request = require('supertest');
      const app = makeApp(optionalDriveLink('drive_link'));
      const res = await request(app).post('/test').send({ drive_link: null });
      expect(res.body.errors).toHaveLength(0);
    });

    test('accepts empty string (checkFalsy: true treats it as absent)', async () => {
      const request = require('supertest');
      const app = makeApp(optionalDriveLink('drive_link'));
      const res = await request(app).post('/test').send({ drive_link: '' });
      expect(res.body.errors).toHaveLength(0);
    });

    test('accepts a valid Google Drive link when provided', async () => {
      const request = require('supertest');
      const app = makeApp(optionalDriveLink('drive_link'));
      const res = await request(app)
        .post('/test')
        .send({ drive_link: 'https://drive.google.com/file/d/xyz' });
      expect(res.body.errors).toHaveLength(0);
    });

    test('rejects a non-Google link when provided', async () => {
      const request = require('supertest');
      const app = makeApp(optionalDriveLink('drive_link'));
      const res = await request(app)
        .post('/test')
        .send({ drive_link: 'https://dropbox.com/file/abc' });
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  // ─── httpsUrl ──────────────────────────────────────────────────────────────

  describe('httpsUrl()', () => {
    const { httpsUrl } = require('../../utils/validators');

    const makeApp = (chain) => {
      const { validationResult } = require('express-validator');
      const express = require('express');
      const app = express();
      app.use(express.json());
      app.post('/test', [chain], (req, res) => {
        const errors = validationResult(req);
        res.json({ errors: errors.array() });
      });
      return app;
    };

    test('accepts a valid HTTPS URL', async () => {
      const request = require('supertest');
      const app = makeApp(httpsUrl('profile_url'));
      const res = await request(app)
        .post('/test')
        .send({ profile_url: 'https://github.com/user' });
      expect(res.body.errors).toHaveLength(0);
    });

    test('rejects an HTTP URL', async () => {
      const request = require('supertest');
      const app = makeApp(httpsUrl('profile_url'));
      const res = await request(app)
        .post('/test')
        .send({ profile_url: 'http://github.com/user' });
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('rejects a plain string (not a URL)', async () => {
      const request = require('supertest');
      const app = makeApp(httpsUrl('profile_url'));
      const res = await request(app)
        .post('/test')
        .send({ profile_url: 'not-a-url' });
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('accepts missing field when required=false (optional)', async () => {
      const request = require('supertest');
      const app = makeApp(httpsUrl('profile_url', false));
      const res = await request(app).post('/test').send({});
      expect(res.body.errors).toHaveLength(0);
    });

    test('rejects missing field when required=true (default)', async () => {
      const request = require('supertest');
      const app = makeApp(httpsUrl('profile_url', true));
      const res = await request(app).post('/test').send({});
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });
});
