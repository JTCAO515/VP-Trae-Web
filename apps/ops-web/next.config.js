/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许通过预览代理/不同 host 访问 Next dev 资源（HMR 等）
  // 额外 host 可通过环境变量追加：ALLOWED_DEV_ORIGINS=host1,host2
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '10.2.94.54',
    'run-agent-6a322d3a4875abf54748e2fa-mqhm9ktf.remote-agent.svc.cluster.local',
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []),
  ],
};

module.exports = nextConfig;

