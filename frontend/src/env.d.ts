/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

import 'vue-router'

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}
