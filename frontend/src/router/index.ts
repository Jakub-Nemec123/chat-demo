import { defineRouter } from '#q-app/wrappers';
import { handleHotUpdate, routes } from 'vue-router/auto-routes';
import type { Router, RouterHistory } from 'vue-router';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useAuth } from 'src/composables/useAuth';

const historyFunction: (base?: string) => RouterHistory = (() => {
  if (process.env.SERVER) {
    return createMemoryHistory;
  }

  if (process.env.VUE_ROUTER_MODE === 'history') {
    return createWebHistory;
  }

  return createWebHashHistory;
})();

export default defineRouter((): Router => {
  const router: Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: historyFunction(process.env.VUE_ROUTER_BASE),
  });

  router.beforeEach((to) => {
    const auth = useAuth();

    if (!auth.state.token && !auth.state.currentUser) {
      auth.bootstrapFromStorage();
    }

    // todo: add types
    if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
      return {
        name: 'sign.in',
        query: {
          // todo: security
          redirect: to.fullPath,
        },
      };
    }
  });

  if (import.meta.hot) {
    handleHotUpdate(router);
  }

  return router;
});
