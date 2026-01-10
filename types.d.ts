declare global {
  const gtag: undefined | ((...args: unknown[]) => void);
  const fbq: undefined | ((...args: unknown[]) => void);

  interface Window {
    __actionLog?: unknown[];
  }
}

export {};

