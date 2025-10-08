import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'signin',
        name: 'signin',
        component: () => import('pages/IndexPage.vue') },
      {
        path: 'register',
        name: 'register',
        component: () => import('pages/RegisterPage.vue')},
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue')
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
