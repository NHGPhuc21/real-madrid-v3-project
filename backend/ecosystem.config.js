module.exports = {
  apps: [
    {
      name: "real-madrid-api",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      ignore_watch: ["node_modules"],

      // --------------------------
      // ENV KHI CHẠY LOCAL (pm2 start ...)
      // --------------------------
      env: {
        NODE_ENV: "development",
      },

      // --------------------------
      // ENV KHI CHẠY PRODUCTION
      // (pm2 start ecosystem.config.js --env production)
      // --------------------------
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
