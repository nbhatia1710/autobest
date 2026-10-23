import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 5000 });
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();
window.scrollTo = vi.fn();
