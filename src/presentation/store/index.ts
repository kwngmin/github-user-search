/**
 * Redux Toolkit Store 설정
 * - 전역 상태 관리
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import searchReducer from './search-slice';

const rootReducer = combineReducers({
  search: searchReducer,
});

/**
 * Store 생성 함수
 * - 서버와 클라이언트 모두에서 사용
 * - 매 요청마다 독립적인 Store 생성을 위해 필요
 */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          // Date 객체 등을 허용
          ignoredActions: [
            'search/searchUsers/fulfilled',
            'search/loadMoreUsers/fulfilled',
          ],
          ignoredPaths: ['search.metadata.timestamp'],
        },
      }),
  });
};

// 기본 store 인스턴스 (클라이언트 사이드 범용)
export const store = makeStore();

// TypeScript 타입 추론
export type RootStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = RootStore['dispatch'];

// 타입이 지정된 hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors와 커스텀 훅 re-export
export * from './search-selectors';
export { useSearch } from './use-search';
