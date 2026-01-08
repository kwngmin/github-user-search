// Jest DOM matchers 추가
import '@testing-library/jest-dom';

// 환경변수 설정 (테스트용)
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';

// 글로벌 테스트 설정
global.console = {
  ...console,
  // 테스트 중 특정 로그 숨기기 (선택사항)
  // error: jest.fn(),
  // warn: jest.fn(),
};
