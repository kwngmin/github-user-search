import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // 테스트 기본 URL
    baseUrl: 'http://localhost:3000',

    // 테스트 파일 위치
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // 지원 파일 위치
    supportFile: 'cypress/support/e2e.ts',

    // 스크린샷 및 비디오 설정
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: true,

    // 뷰포트 설정
    viewportWidth: 1280,
    viewportHeight: 720,

    // 타임아웃 설정
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,

    // 재시도 설정
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // 환경 변수
    env: {
      // GitHub API 토큰 (선택사항)
      // GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    },

    setupNodeEvents(on, config) {
      // 플러그인 설정
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});
