'use client';

// Force redirect to a specific path
export const forceBrowserRedirect = (path: string) => {
  // Use window.location for a hard redirect
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
};
