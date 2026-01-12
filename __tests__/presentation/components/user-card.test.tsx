/**
 * UserCard 컴포넌트 테스트
 * - 렌더링 테스트
 * - 사용자 정보 표시 테스트
 * - Canvas 아바타 렌더링 테스트
 * - 조건부 렌더링 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserCard from '@/presentation/components/UserCard';
import { GitHubUser } from '@/domain/entities/user';

// MUI 테마 Provider Mock
jest.mock('@/lib/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// MUI useTheme, useMediaQuery Mock
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useTheme: jest.fn(() => ({
      palette: {
        background: {
          paper: '#ffffff',
        },
        text: {
          primary: '#000000',
          secondary: '#666666',
        },
      },
      breakpoints: {
        down: jest.fn(() => false), // 기본적으로 데스크톱
      },
    })),
    useMediaQuery: jest.fn(() => false), // 기본적으로 데스크톱 (isMobile = false)
  };
});

describe('UserCard 컴포넌트', () => {
  // 기본 사용자 데이터
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    name: 'Test User',
    type: 'User',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    htmlUrl: 'https://github.com/testuser',
    bio: 'A passionate developer',
    location: 'Seoul, Korea',
    company: 'Test Company',
    email: 'test@example.com',
    blog: 'https://testuser.dev',
    publicRepos: 50,
    publicGists: 25,
    followers: 1500,
    following: 100,
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
    isSponsored: true,
  };

  beforeEach(() => {
    // Canvas Mock
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
      })),
      putImageData: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      globalCompositeOperation: 'source-over',
    })) as any;

    // Image Mock
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      crossOrigin = '';

      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as any;
  });

  describe('기본 렌더링', () => {
    it('사용자 정보가 올바르게 렌더링됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('A passionate developer')).toBeInTheDocument();
    });

    it('사용자 타입 칩이 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('조직 타입도 올바르게 표시됨', () => {
      // Given
      const orgUser: GitHubUser = {
        ...mockUser,
        type: 'Organization',
      };

      // When
      render(<UserCard user={orgUser} />);

      // Then
      expect(screen.getByText('Organization')).toBeInTheDocument();
    });

    it('Canvas 엘리먼트가 렌더링됨', () => {
      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '80');
      expect(canvas).toHaveAttribute('height', '80');
    });

    it('프로필 보기 링크가 올바른 URL을 가짐', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      const link = screen.getByRole('link', { name: /프로필 보기/i });
      expect(link).toHaveAttribute('href', 'https://github.com/testuser');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('통계 정보 표시', () => {
    it('리포지토리 수가 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('리포지토리')).toBeInTheDocument();
    });

    it('팔로워 수가 1k 이상일 때 k 단위로 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('1.5k')).toBeInTheDocument();
      expect(screen.getByText('팔로워')).toBeInTheDocument();
    });

    it('팔로잉 수가 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('팔로잉')).toBeInTheDocument();
    });

    it('팔로워가 1000 미만일 때 그대로 표시됨', () => {
      // Given
      const userWithLowFollowers: GitHubUser = {
        ...mockUser,
        followers: 999,
      };

      // When
      render(<UserCard user={userWithLowFollowers} />);

      // Then
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('통계가 undefined일 때 "-"로 표시됨', () => {
      // Given
      const userWithoutStats: GitHubUser = {
        ...mockUser,
        publicRepos: undefined as unknown as number,
        followers: undefined as unknown as number,
        following: undefined as unknown as number,
      };

      // When
      render(<UserCard user={userWithoutStats} />);

      // Then
      const dashes = screen.getAllByText('-');
      expect(dashes).toHaveLength(3);
    });
  });

  describe('선택적 정보 표시', () => {
    it('위치 정보가 있을 때 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('Seoul, Korea')).toBeInTheDocument();
    });

    it('회사 정보가 있을 때 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('이메일이 있을 때 mailto 링크로 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      const emailLink = screen.getByText('test@example.com');
      expect(emailLink).toHaveAttribute('href', 'mailto:test@example.com');
    });

    it('블로그 URL이 http로 시작하면 그대로 사용', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      const blogLink = screen.getByText('https://testuser.dev');
      expect(blogLink).toHaveAttribute('href', 'https://testuser.dev');
    });

    it('블로그 URL이 http로 시작하지 않으면 https:// 추가', () => {
      // Given
      const userWithoutProtocol: GitHubUser = {
        ...mockUser,
        blog: 'testuser.dev',
      };

      // When
      render(<UserCard user={userWithoutProtocol} />);

      // Then
      const blogLink = screen.getByText('testuser.dev');
      expect(blogLink).toHaveAttribute('href', 'https://testuser.dev');
    });

    it('Bio가 없을 때 렌더링되지 않음', () => {
      // Given
      const userWithoutBio: GitHubUser = {
        ...mockUser,
        bio: null,
      };

      // When
      const { container } = render(<UserCard user={userWithoutBio} />);

      // Then
      expect(container.textContent).not.toContain('A passionate developer');
    });

    it('위치가 없을 때 LocationOnIcon이 표시되지 않음', () => {
      // Given
      const userWithoutLocation: GitHubUser = {
        ...mockUser,
        location: null,
      };

      // When
      const { container } = render(<UserCard user={userWithoutLocation} />);

      // Then
      expect(container.textContent).not.toContain('Seoul, Korea');
    });
  });

  describe('후원 가능 여부', () => {
    it('후원 가능한 사용자는 별 아이콘이 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      // Sponsorable 툴팁이 있는지 확인
      expect(screen.getByLabelText('Sponsorable')).toBeInTheDocument();
    });

    it('후원 불가능한 사용자는 별 아이콘이 없음', () => {
      // Given
      const nonSponsoredUser: GitHubUser = {
        ...mockUser,
        isSponsored: false,
      };

      // When
      render(<UserCard user={nonSponsoredUser} />);

      // Then
      expect(screen.queryByTitle('Sponsorable')).not.toBeInTheDocument();
    });
  });

  describe('가입일 표시', () => {
    it('가입일이 한국어 형식으로 표시됨', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      // 가입일: 2020. 1. 15. 형식
      expect(screen.getByText(/가입일:/)).toBeInTheDocument();
      expect(screen.getByText(/2020/)).toBeInTheDocument();
    });

    it('가입일이 없을 때 렌더링되지 않음', () => {
      // Given
      const userWithoutCreatedAt: GitHubUser = {
        ...mockUser,
        createdAt: undefined as unknown as string,
      };

      // When
      const { container } = render(<UserCard user={userWithoutCreatedAt} />);

      // Then
      expect(container.textContent).not.toContain('가입일:');
    });
  });

  describe('Canvas 아바타 렌더링', () => {
    it('Canvas에 이미지가 로드됨', async () => {
      // Given
      const mockGetContext = jest.fn(() => ({
        clearRect: jest.fn(),
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(80 * 80 * 4),
        })),
        putImageData: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        globalCompositeOperation: 'source-over',
      }));

      HTMLCanvasElement.prototype.getContext = mockGetContext as any;

      // When
      render(<UserCard user={mockUser} />);

      // Then
      await waitFor(() => {
        expect(mockGetContext).toHaveBeenCalledWith('2d');
      });
    });

    it('이미지 로드 실패 시 콘솔 에러 출력', async () => {
      // Given
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';
        crossOrigin = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      } as any;

      // When
      render(<UserCard user={mockUser} />);

      // Then
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load avatar:',
          mockUser.avatarUrl
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('crossOrigin 속성이 설정됨', async () => {
      // Given
      let capturedImage: any;

      global.Image = class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';
        crossOrigin = '';

        constructor() {
          capturedImage = this;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      // When
      render(<UserCard user={mockUser} />);

      // Then
      await waitFor(() => {
        expect(capturedImage.crossOrigin).toBe('anonymous');
      });
    });
  });

  describe('사용자 이름 폴백', () => {
    it('name이 없으면 login을 표시', () => {
      // Given
      const userWithoutName: GitHubUser = {
        ...mockUser,
        name: null,
      };

      // When
      render(<UserCard user={userWithoutName} />);

      // Then
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('name이 있으면 name을 우선 표시', () => {
      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('스타일 및 레이아웃', () => {
    it('카드가 호버 시 transition 클래스를 가짐', () => {
      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const card = container.querySelector('.group');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-300');
    });

    it('통계 그리드가 3개 열을 가짐', () => {
      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const statsGrid = container.querySelector('.grid-cols-3');
      expect(statsGrid).toBeInTheDocument();
    });

    it('아바타 Canvas가 원형 border를 가짐', () => {
      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveClass('rounded-full');
    });
  });

  describe('반응형 동작', () => {
    beforeEach(() => {
      // Mock 초기화
      jest.clearAllMocks();
    });

    it('데스크톱에서는 버튼이 hover 시에만 표시됨', () => {
      // Given - 데스크톱 (isMobile = false)
      const { useMediaQuery } = require('@mui/material');
      (useMediaQuery as jest.Mock).mockReturnValue(false);

      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const cardActions = container.querySelector('[class*="CardActions"]');
      // 데스크톱: opacity-0 클래스가 있고, hover 시 opacity-100
      expect(cardActions?.className).toContain('opacity-0');
      expect(cardActions?.className).toContain('group-hover:opacity-100');
    });

    it('모바일에서는 버튼이 항상 표시됨', () => {
      // Given - 모바일 (isMobile = true)
      const { useMediaQuery } = require('@mui/material');
      (useMediaQuery as jest.Mock).mockReturnValue(true);

      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const cardActions = container.querySelector('[class*="CardActions"]');
      // 모바일: opacity-0 클래스가 없음
      expect(cardActions?.className).not.toContain('opacity-0');
    });

    it('데스크톱에서는 그라디언트 오버레이가 표시됨', () => {
      // Given - 데스크톱
      const { useMediaQuery } = require('@mui/material');
      (useMediaQuery as jest.Mock).mockReturnValue(false);

      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const cardActions = container.querySelector('[class*="CardActions"]');
      const gradientBox = cardActions?.querySelector('div.MuiBox-root:empty');
      expect(gradientBox).toBeInTheDocument();
    });

    it('모바일에서는 그라디언트 오버레이가 숨겨짐', () => {
      // Given - 모바일
      const { useMediaQuery } = require('@mui/material');
      (useMediaQuery as jest.Mock).mockReturnValue(true);

      // When
      const { container } = render(<UserCard user={mockUser} />);

      // Then
      const cardActionsMobile = container.querySelector(
        '[class*="CardActions"]'
      );
      const gradientBoxMobile = cardActionsMobile?.querySelector(
        'div.MuiBox-root:empty'
      );
      expect(gradientBoxMobile).not.toBeInTheDocument();
    });

    it('useMediaQuery가 lg breakpoint를 체크함', () => {
      // Given
      const { useTheme } = require('@mui/material');
      const mockBreakpoints = {
        down: jest.fn(() => 'mock-query'),
      };
      (useTheme as jest.Mock).mockReturnValue({
        palette: {
          background: { paper: '#ffffff' },
          text: { primary: '#000000', secondary: '#666666' },
        },
        breakpoints: mockBreakpoints,
      });

      // When
      render(<UserCard user={mockUser} />);

      // Then
      expect(mockBreakpoints.down).toHaveBeenCalledWith('lg');
    });
  });
});
