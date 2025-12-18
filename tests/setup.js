import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Crypto API for password hashing
if (!global.crypto) {
  global.crypto = {};
}

if (!global.crypto.subtle) {
  Object.defineProperty(global.crypto, 'subtle', {
    value: {
      digest: async (algorithm, data) => {
        // Simple mock implementation for testing
        const text = new TextDecoder().decode(data);
        const hash = text.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        
        // Convert to hex string (64 characters for SHA-256)
        const hexHash = Math.abs(hash).toString(16).padStart(64, '0');
        const encoder = new TextEncoder();
        return encoder.encode(hexHash).buffer;
      }
    },
    writable: true,
    configurable: true
  });
}

// Mock window.matchMedia for PWA checks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      update: vi.fn(),
      unregister: vi.fn(),
    }),
    getRegistrations: vi.fn().mockResolvedValue([]),
    ready: Promise.resolve({
      showNotification: vi.fn(),
    }),
  },
});

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted'),
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
