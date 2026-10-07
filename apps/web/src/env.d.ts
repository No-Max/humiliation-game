/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}
