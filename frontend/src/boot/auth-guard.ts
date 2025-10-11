import { defineBoot } from '@quasar/app-vite/wrappers'
import { useAuth } from 'src/composables/useAuth'

const PUBLIC_ROUTES = new Set<string>(['/signin'])

export default defineBoot(({ router }) => {
  const auth = useAuth()

  router.beforeEach((to) => {
    if (!auth.state.token && !auth.state.currentUser) {
      auth.bootstrapFromStorage()
    }

    const isPublic = PUBLIC_ROUTES.has(to.path)
    if (isPublic) return true

    if (!auth.isAuthenticated.value) {
      return { path: '/signin', query: { redirect: to.fullPath } }
    }
    return true
  })
})
