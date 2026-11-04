// pm2 配置：常驻 Next.js 生产服务
// 用法：pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: 'shiguang',
      cwd: __dirname + '/..',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      time: true,
    },
  ],
}
