import type { RouteRecordRaw } from 'vue-router';
import authGuard from 'src/router/guards/authGuard';

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: [authGuard],
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue')
      },
    ],
  },
  {
    path: '',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: 'signin',
        name: 'signin',
        component: () => import('pages/SigninPage.vue')
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('pages/RegisterPage.vue')
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
