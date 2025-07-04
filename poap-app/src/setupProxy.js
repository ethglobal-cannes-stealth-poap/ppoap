const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for POAP API (minting)
  app.use(
    '/api/poap',
    createProxyMiddleware({
      target: 'https://api.poap.tech',
      changeOrigin: true,
      pathRewrite: {
        '^/api/poap': '', // remove /api/poap prefix
      },
    })
  );

  // Proxy for Collectors API (validation)
  app.use(
    '/api/collectors',
    createProxyMiddleware({
      target: 'https://collectors.poap.xyz',
      changeOrigin: true,
      pathRewrite: {
        '^/api/collectors': '', // remove /api/collectors prefix
      },
    })
  );

  // Proxy for Profiles API (ENS resolution)
  app.use(
    '/api/profiles',
    createProxyMiddleware({
      target: 'https://profiles.poap.tech',
      changeOrigin: true,
      pathRewrite: {
        '^/api/profiles': '', // remove /api/profiles prefix
      },
    })
  );
};