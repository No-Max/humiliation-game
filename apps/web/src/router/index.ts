import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import RulesView from '../views/RulesView.vue';
import SeriesView from '../views/SeriesView.vue';
import LobbyView from '../views/LobbyView.vue';
import JoinView from '../views/JoinView.vue';
import DisplayView from '../views/DisplayView.vue';
import PlayView from '../views/PlayView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/rules', component: RulesView },
    { path: '/series', component: SeriesView },
    { path: '/lobby/:seriesId', component: LobbyView },
    { path: '/join/:code', component: JoinView },
    { path: '/display/:code', component: DisplayView },
    { path: '/team/:code/:teamId', component: PlayView },
    { path: '/play/:code', component: PlayView },
  ],
});
