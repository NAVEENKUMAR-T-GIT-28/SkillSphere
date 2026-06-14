/**
 * routeTracker.js — Captures route metadata at registration time.
 *
 * Wraps each HTTP verb on a router instance so that every
 * .get / .post / .put / .patch / .delete call records:
 *   { method, path, action }
 *
 * "action" is the .name of the LAST handler in the chain
 * (the controller function), giving us the human-readable
 * function name for the startup table.
 */

const endpoints = [];

function trackRouter(router, basePath = '') {
  const methods = ['get', 'post', 'put', 'patch', 'delete'];

  methods.forEach(method => {
    const original = router[method];

    router[method] = function (path, ...handlers) {
      // The last handler in the chain is the controller action
      const lastHandler = handlers[handlers.length - 1];
      const action = (typeof lastHandler === 'function' && lastHandler.name)
        ? lastHandler.name
        : 'anonymous';

      endpoints.push({
        method: method.toUpperCase(),
        path: basePath + (path === '/' ? '' : path),
        action,
      });

      return original.call(this, path, ...handlers);
    };
  });

  return router;
}

module.exports = { trackRouter, endpoints };
