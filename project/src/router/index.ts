import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import HistoricalView from '../views/HistoricalView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/historical/:type',
      name: 'historical',
      component: HistoricalView,
      props: true
    }
  ]
});

export default router;