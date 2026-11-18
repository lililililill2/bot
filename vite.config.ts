import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const { DISCORD_APPLICATION_ID } = loadEnv(mode, process.cwd(), 'DISCORD_APPLICATION_ID');
  const applicationId = DISCORD_APPLICATION_ID?.trim() ?? '';
  if (applicationId && !/^\d{17,20}$/.test(applicationId)) {
    throw new Error('.env의 DISCORD_APPLICATION_ID에 Discord 앱의 숫자 ID를 입력하세요.');
  }
  return {
    envPrefix: [],
    define: { __DISCORD_APPLICATION_ID__: JSON.stringify(applicationId) },
  };
});
