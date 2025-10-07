import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'login', 
        component: () => import('pages/IndexPage.vue') },
      {
        path :'register', 
        name: 'register',
        component: () => import('pages/RegisterPage.vue')},
      {
        path :'dashboard', 
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue')}
    
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name:'not found',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
