import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import { useSettingsStore } from './stores/settings';
import { useUserStore } from './stores/user';
import { useStatsStore } from './stores/stats';
import { useFriendsStore } from './stores/friends';
import { useTimerStore } from './stores/timer';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('levelup-token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

const settingsStore = useSettingsStore(pinia);
settingsStore.loadSettings();

const userStore = useUserStore(pinia);
userStore.bootstrap();

const statsStore = useStatsStore(pinia);
statsStore.initialize();

const friendsStore = useFriendsStore(pinia);
friendsStore.initialize();

const timerStore = useTimerStore(pinia);
timerStore.initialize();

app.mount('#app');
