declare global {
  interface Window {
    Intercom?: (...args: unknown[]) => void;
  }
}

export {};
