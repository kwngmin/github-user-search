'use client';

import { Provider } from 'react-redux';
import { useRef } from 'react';
import { makeStore, RootStore, RootState } from '@/presentation/store/index';

/**
 * ReduxProvider 컴포넌트
 * - 서버 사이드에서 생성된 초기 상태를 클라이언트 Store에 주입(Hydration)
 */
export default function ReduxProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: Partial<RootState>;
}) {
  const storeRef = useRef<RootStore>(null);

  // Store가 한 번만 생성되도록 함
  if (!storeRef.current) {
    storeRef.current = makeStore(initialState);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
