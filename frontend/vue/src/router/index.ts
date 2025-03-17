/*
 * @file: index.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Routes logic for the application
 * @date: December 2024
 */

import { createRouter, createWebHistory } from 'vue-router';
import Menu from '../views/Menu.vue';
import Game from '../views/Game.vue';
import Leaderboard from '../views/Leaderboard.vue';
import Tutorial from '../views/Tutorial.vue';

const routes = [
  { path: '/', name: 'Menu', component: Menu, meta: { bodyClass: 'menu-background' } },
  { path: '/game', name: 'Game', component: Game, meta: { bodyClass: 'game-background' } },
  { path: '/leaderboard', name: 'Leaderboard', component: Leaderboard, meta: { bodyClass: 'leaderboard-background' } },
  { path: '/tutorial', name: 'Tutorial', component: Tutorial, meta: { bodyClass: 'tutorial-background' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {

  document.body.className = '';

  if (to.meta.bodyClass) {
    document.body.classList.add(to.meta.bodyClass as string);
  }
  next();
});

export default router;
