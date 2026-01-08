// Cypress 커맨드 import
import './commands';

// 전역 설정
Cypress.on('uncaught:exception', (err, runnable) => {
  // 특정 에러는 무시 (필요시)
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  // 에러를 Cypress가 처리하도록 허용
  return true;
});
