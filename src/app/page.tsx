export const dynamic = 'force-dynamic';

import SearchPage from '@/presentation/pages/SearchPage';
import { GitHubApiClient } from '@/lib/github-api-client';
import ReduxProvider from '@/presentation/store/providers/redux-provider';
import { RootState } from '@/presentation/store/index';

/**
 * 홈 페이지 (서버 컴포넌트)
 * - 첫 페이지 데이터를 서버 사이드에서 페칭 (SSR)
 */
export default async function Home() {
  let initialState: Partial<RootState> | undefined = undefined;

  try {
    // 1. 서버 사이드에서 초기 데이터 페칭 (예: "github" 검색 결과)
    const client = new GitHubApiClient();
    const initialQuery = 'github';
    const { data: result } = await client.searchUsers({
      query: initialQuery,
      page: 1,
      perPage: 30,
    });

    // 2. Redux 초기 상태 구성
    initialState = {
      search: {
        searchQuery: initialQuery,
        filters: {
          query: initialQuery,
          page: 1,
          perPage: 30,
          sort: 'best-match',
          sortOrder: 'desc',
        },
        users: result.users,
        metadata: result.metadata,
        loading: false,
        error: null,
        rateLimit: null,
        hasMore: result.metadata.hasNextPage,
        isSearched: true,
      },
    };
  } catch (error) {
    console.error('Failed to fetch initial data on server:', error);
    // 에러 발생 시 초기 상태 없이 렌더링 (클라이언트에서 처리)
  }

  return (
    <ReduxProvider initialState={initialState}>
      <SearchPage />
    </ReduxProvider>
  );
}
