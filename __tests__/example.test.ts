/**
 * 예제 테스트 파일
 * 실제 테스트는 기능 구현 후 작성
 */

describe('Example Test Suite', () => {
  it('기본 테스트가 동작한다', () => {
    expect(1 + 1).toBe(2);
  });

  it('문자열 테스트가 동작한다', () => {
    const message = 'GitHub User Search';
    expect(message).toContain('GitHub');
  });

  it('배열 테스트가 동작한다', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toContain(3);
    expect(arr).toHaveLength(5);
  });

  it('객체 테스트가 동작한다', () => {
    const user = {
      name: 'octocat',
      type: 'User',
    };
    expect(user).toEqual({ name: 'octocat', type: 'User' });
  });
});
