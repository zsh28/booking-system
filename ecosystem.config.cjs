module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/index.js',
      env: {
        API_PORT: process.env.API_PORT || 3000
      }
    },
    {
      name: 'web',
      script: 'apps/web/dist/server/server.js',
      env: {
        PORT: process.env.PORT || 3001
      }
    }
  ]
}
