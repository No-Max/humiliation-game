import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import RulesView from '../views/RulesView.vue';
import AboutView from '../views/AboutView.vue';
import SeriesView from '../views/SeriesView.vue';
import LobbyView from '../views/LobbyView.vue';
import JoinView from '../views/JoinView.vue';
import DisplayView from '../views/DisplayView.vue';
import PlayView from '../views/PlayView.vue';
import GamesView from '../views/GamesView.vue';
import ProfileView from '../views/ProfileView.vue';
import SeriesDetailView from '../views/SeriesDetailView.vue';
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  type RouteSeoMeta,
  applyRouteSeo,
} from '../lib/seo';

declare module 'vue-router' {
  interface RouteMeta {
    seo?: RouteSeoMeta;
    /** Page sets title/description after loading data (see applyRouteSeo in view). */
    seoDynamic?: boolean;
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeView,
      meta: {
        seo: {
          title: SITE_NAME,
          description:
            'Квиз для друзей — позоримся вместе! Выберите выпуск, создайте команду и играйте на телефонах с общим экраном.',
          index: true,
        },
      },
    },
    {
      path: '/games',
      component: GamesView,
      meta: {
        seo: {
          title: 'Игры',
          description: 'Продолжите незавершённые игры.',
          index: false,
        },
      },
    },
    {
      path: '/profile',
      component: ProfileView,
      meta: {
        seo: {
          title: 'Профиль',
          description: 'Настройки команды и сохранённые результаты.',
          index: false,
        },
      },
    },
    {
      path: '/rules',
      component: RulesView,
      meta: {
        seo: {
          title: 'Правила игры',
          description:
            'Как играть: команды, очередь ответов, перехваты, баллы за туры и советы для ведущих.',
          index: true,
        },
      },
    },
    {
      path: '/about',
      component: AboutView,
      meta: {
        seo: {
          title: 'О нас',
          description:
            '«Игра на унижение» создана в 2026 году призёрами SuperQuiz в Минске: от вечерней презентации до интерактивного квиза для всех.',
          index: true,
        },
      },
    },
    {
      path: '/series',
      component: SeriesView,
      meta: {
        seo: {
          title: 'Выпуски',
          description: 'Список опубликованных выпусков — выберите квиз и начните игру с друзьями.',
          index: true,
        },
      },
    },
    {
      path: '/series/:seriesId',
      component: SeriesDetailView,
      meta: { seoDynamic: true },
    },
    {
      path: '/lobby/:seriesId',
      component: LobbyView,
      meta: {
        seo: {
          title: 'Создание игры',
          description: DEFAULT_DESCRIPTION,
          index: false,
        },
      },
    },
    {
      path: '/join/:code',
      component: JoinView,
      meta: {
        seo: {
          title: 'Подключение к игре',
          description: DEFAULT_DESCRIPTION,
          index: false,
        },
      },
    },
    {
      path: '/display/:code',
      component: DisplayView,
      meta: {
        seo: {
          title: 'Экран игры',
          description: DEFAULT_DESCRIPTION,
          index: false,
        },
      },
    },
    {
      path: '/team/:code/:teamId',
      component: PlayView,
      meta: {
        seo: {
          title: 'Игра',
          description: DEFAULT_DESCRIPTION,
          index: false,
        },
      },
    },
    {
      path: '/play/:code',
      component: PlayView,
      meta: {
        seo: {
          title: 'Игра',
          description: DEFAULT_DESCRIPTION,
          index: false,
        },
      },
    },
  ],
});

router.afterEach((to) => {
  if (to.meta.seoDynamic) return;
  const seo = to.meta.seo;
  if (seo) {
    applyRouteSeo(seo, to.path);
  }
});
