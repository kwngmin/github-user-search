import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import searchReducer from './slices/search-slice';

/**
 * Redux Store 설정
 * - Redux Toolkit의 configureStore 사용
 * - 개발 환경에서 Redux DevTools 자동 활성화
 */
export const store = configureStore({
  reducer: {
    search: searchReducer, // ← 검색 슬라이스 추가
  },
  // 개발 환경에서만 직렬화 체크 활성화
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // 특정 액션 타입은 직렬화 체크에서 제외 (필요시)
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * RootState 타입
 * - store.getState()의 반환 타입
 * - useAppSelector에서 사용
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch 타입
 * - store.dispatch의 타입
 * - useAppDispatch에서 사용
 * - Thunk를 사용할 때 타입 안전성 보장
 */
export type AppDispatch = typeof store.dispatch;

/**
 * 타입이 지정된 useDispatch 훅
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * 타입이 지정된 useSelector 훅
 * @example
 * const users = useAppSelector(state => state.search.users);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
