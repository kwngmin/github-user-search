/**
 * Redux Toolkit Store 설정
 * - 전역 상태 관리
 */

import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './search-slice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Date 객체 등을 허용
        ignoredActions: ['search/searchUsers/fulfilled'],
        ignoredPaths: ['search.metadata.timestamp'],
      },
    }),
});

// TypeScript 타입 추론
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 타입이 지정된 hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
