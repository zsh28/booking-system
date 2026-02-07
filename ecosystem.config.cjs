module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/index.js',
      env: {
        PORT: process.env.PORT || '3000'
      }
    }
  ]
}
