/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: unknown): R;
      toEqual(expected: unknown): R;
      toContain(expected: unknown): R;
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveClass(className: string): R;
    }
  }
}

export {};
