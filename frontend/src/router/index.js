import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import StatsView from '../views/StatsView.vue';
import SettingsView from '../views/SettingsView.vue';
import FriendsView from '../views/FriendsView.vue';
import LoginView from '../views/LoginView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/friends', name: 'friends', component: FriendsView },
    { path: '/login', name: 'login', component: LoginView }
  ]
});

export default router;
