/**
 * tests/utils/routeTracker.test.js
 *
 * Unit tests for the routeTracker utility.
 * Because `endpoints` is a module-level singleton array, we isolate each
 * test suite by jest.resetModules() so every require() starts fresh.
 */

describe('routeTracker utility', () => {
  let trackRouter, endpoints;

  // Re-require a clean module before every test to avoid endpoint leakage
  beforeEach(() => {
    jest.resetModules();
    ({ trackRouter, endpoints } = require('../../utils/routeTracker'));
  });

  // ─── trackRouter ────────────────────────────────────────────────────────────

  describe('trackRouter()', () => {
    test('returns the same router instance', () => {
      const express = require('express');
      const router = express.Router();
      const result = trackRouter(router, '/api/test');
      expect(result).toBe(router);
    });

    test('wraps all five HTTP verb methods on the router', () => {
      const express = require('express');
      const router = express.Router();
      const methods = ['get', 'post', 'put', 'patch', 'delete'];

      trackRouter(router, '/api/test');

      methods.forEach((m) => {
        expect(typeof router[m]).toBe('function');
      });
    });

    test('records a GET endpoint with a named handler', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/demo');

      function myHandler(req, res) {}
      router.get('/items', myHandler);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0]).toMatchObject({
        method: 'GET',
        path: '/api/demo/items',
        action: 'myHandler',
      });
    });

    test('records a POST endpoint with an anonymous handler', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/demo');

      router.post('/items', (req, res) => {});

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0]).toMatchObject({
        method: 'POST',
        path: '/api/demo/items',
        action: 'anonymous',
      });
    });

    test('records a PUT endpoint', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/demo');

      function updateItem(req, res) {}
      router.put('/items/:id', updateItem);

      expect(endpoints[0].method).toBe('PUT');
      expect(endpoints[0].action).toBe('updateItem');
    });

    test('records a PATCH endpoint', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/demo');

      function patchItem(req, res) {}
      router.patch('/items/:id', patchItem);

      expect(endpoints[0].method).toBe('PATCH');
    });

    test('records a DELETE endpoint', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/demo');

      function deleteItem(req, res) {}
      router.delete('/items/:id', deleteItem);

      expect(endpoints[0].method).toBe('DELETE');
    });

    test('uses the last handler in a middleware chain as action', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api');

      function authMiddleware(req, res, next) { next(); }
      function getUser(req, res) {}

      router.get('/users/:id', authMiddleware, getUser);

      expect(endpoints[0].action).toBe('getUser');
    });

    test('defaults to "anonymous" when last handler has no name', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api');

      // Arrow functions have no .name that is a user-defined identifier
      router.get('/anon', (req, res) => {});

      expect(endpoints[0].action).toBe('anonymous');
    });

    test('collapses root path "/" to empty string (no trailing slash)', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/notifications');

      function getNotifications(req, res) {}
      router.get('/', getNotifications);

      expect(endpoints[0].path).toBe('/api/notifications');
    });

    test('concatenates basePath and sub-path correctly', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/students');

      function getProfile(req, res) {}
      router.get('/:studentId/profile', getProfile);

      expect(endpoints[0].path).toBe('/api/students/:studentId/profile');
    });

    test('defaults basePath to empty string when not provided', () => {
      const express = require('express');
      const router = trackRouter(express.Router());

      function ping(req, res) {}
      router.get('/ping', ping);

      expect(endpoints[0].path).toBe('/ping');
    });

    test('accumulates multiple endpoints across calls', () => {
      const express = require('express');
      const router = trackRouter(express.Router(), '/api/auth');

      function login(req, res) {}
      function register(req, res) {}

      router.post('/login', login);
      router.post('/register', register);

      expect(endpoints).toHaveLength(2);
      expect(endpoints.map((e) => e.action)).toEqual(['login', 'register']);
    });

    test('still calls the original router method (route actually works)', async () => {
      const express = require('express');
      const request = require('supertest');

      const app = express();
      const router = trackRouter(express.Router(), '/api');

      router.get('/hello', (req, res) => res.json({ ok: true }));
      app.use('/api', router);

      const res = await request(app).get('/api/hello');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  // ─── endpoints array ─────────────────────────────────────────────────────────

  describe('endpoints array', () => {
    test('is exported as an array', () => {
      expect(Array.isArray(endpoints)).toBe(true);
    });

    test('starts empty after a fresh module load', () => {
      expect(endpoints).toHaveLength(0);
    });
  });
});
