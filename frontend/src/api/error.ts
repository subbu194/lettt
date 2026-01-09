import axios from 'axios';

type BackendErrorShape = {
  error?: string;
  message?: string;
  details?: unknown;
};

export function getApiErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const data = err.response.data as BackendErrorShape | string | undefined;
      const msg =
        typeof data === 'string'
          ? data
          : (data as BackendErrorShape | undefined)?.error || (data as BackendErrorShape | undefined)?.message;
      if (msg) return msg;
      if (typeof err.response.statusText === 'string' && err.response.statusText) return err.response.statusText;
      return `Request failed (${err.response.status})`;
    }

    if (err.request) return 'Network error. Please check your connection.';

    if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.';

    return err.message || 'Request failed.';
  }

  return err instanceof Error ? err.message : 'Something went wrong.';
}
