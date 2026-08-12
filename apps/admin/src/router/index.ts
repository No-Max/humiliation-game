import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import SeriesListView from '../views/SeriesListView.vue';
import SeriesEditView from '../views/SeriesEditView.vue';
import ToursListView from '../views/ToursListView.vue';
import TourSettingsView from '../views/TourSettingsView.vue';
import TourEditView from '../views/TourEditView.vue';
import QuestionEditView from '../views/QuestionEditView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/series' },
    { path: '/login', component: LoginView },
    {
      path: '/series',
      component: SeriesListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/series/:id',
      component: SeriesEditView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tours',
      component: ToursListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tours/new',
      component: TourSettingsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tours/:tourId/edit',
      component: TourSettingsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tours/:tourId/questions',
      component: TourEditView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tours/:tourId/questions/new',
      component: QuestionEditView,
      meta: { requiresAuth: true },
    },
    {
      path: '/tours/:tourId/questions/:questionId',
      component: QuestionEditView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem('adminToken');
  if (to.meta.requiresAuth && !token) {
    return '/login';
  }
  return true;
});
