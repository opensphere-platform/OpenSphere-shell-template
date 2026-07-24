export interface HostRoutingContext {
  readonly basePath: string;
  currentPath(): string;
  navigate(path: string, options?: { replace?: boolean }): void;
  subscribe(listener: (path: string) => void): () => void;
}

export interface HostApiContext {
  readonly baseUrl: string;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface ShellHostContext {
  readonly pluginId: string;
  readonly grants: readonly string[];
  readonly routing?: HostRoutingContext;
  readonly api?: HostApiContext;
  readonly identity?: {
    username: string;
    groups: readonly string[];
    roles: readonly string[];
    foundation: 'console' | 'workspace';
  };
  readonly host?: {
    mountChild(manifestUrl: string): Promise<void>;
    children(): readonly string[];
  };
}

declare global {
  interface Window {
    __OPENSPHERE_HOST_CONTEXTS__?: Record<string, ShellHostContext>;
  }
}

export const SHELL_ID = 'shell-template';

/** Host가 activate() 시 주입한 최소권한 bridge. standalone 개발에서는 undefined다. */
export function shellHostContext(): ShellHostContext | undefined {
  return window.__OPENSPHERE_HOST_CONTEXTS__?.[SHELL_ID];
}

/** 도메인 API는 직접 fetch하지 않고 Host의 same-origin capability gate를 통과한다. */
export function shellApiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const api = shellHostContext()?.api;
  if (!api) return Promise.reject(new Error('OpenSphere Host API context is unavailable'));
  return api.fetch(input, init);
}
