import type { RouteRecordRaw } from 'vue-router';
import authGuard from 'src/router/guards/authGuard';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
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
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        component: () => import('pages/SigninPage.vue'),
        name: 'sign.in',
        path: 'in',
      },
      {
        component: () => import('pages/RegisterPage.vue'),
        name: 'sign.up',
        path: 'up',
      },
    ],
    path: '/sign',
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
