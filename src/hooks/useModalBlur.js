import { useCallback } from 'react';

/**
 * Returns a wrapper that blurs the currently focused element before
 * opening a dialog/modal. This prevents the React Flow node focus
 * conflicting with MUI's aria-hidden on #root.
 */
export const useModalBlur = () => {
  return useCallback((openFn) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    openFn();
  }, []);
};