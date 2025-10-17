import { useAuth } from "src/composables/useAuth";
import type {
  NavigationGuardReturn,
  RouteLocationNormalized
} from "vue-router";

export default function authGuard(
  to: RouteLocationNormalized
): NavigationGuardReturn {
  const auth = useAuth();

  // todo: probably do that in the `useAuth` function
  if (!auth.state.token && !auth.state.currentUser) {
    auth.bootstrapFromStorage();
  }

  if (auth.isAuthenticated.value) {
    return true
  }

  return {
    name: 'signin',
    query: {
      redirect: to.fullPath
    }
  }
}
