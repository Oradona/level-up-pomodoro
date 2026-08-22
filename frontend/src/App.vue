<template>
  <div class="app-shell">
    <header class="topbar panel">
      <div>
        <p class="eyebrow">Focus RPG</p>
        <h1>Level Up Pomodoro</h1>
      </div>
      <div class="topbar-actions">
        <div class="profile-pill">
          <span class="status-dot" :class="{ online: userStore.isAuthenticated }"></span>
          <span>{{ userStore.profile.username }}</span>
          <strong>Lv. {{ userStore.profile.level }}</strong>
        </div>
        <router-link class="button ghost" :to="userStore.isAuthenticated ? '/' : '/login'">
          {{ userStore.isAuthenticated ? 'Dashboard' : 'Login' }}
        </router-link>
        <button v-if="userStore.isAuthenticated" class="button ghost" @click="logout">Logout</button>
      </div>
    </header>

    <nav class="nav panel">
      <router-link to="/">Timer</router-link>
      <router-link to="/stats">Stats</router-link>
      <router-link to="/settings">Settings</router-link>
      <router-link to="/friends">Friends</router-link>
      <router-link to="/login">Account</router-link>
    </nav>

    <main class="page-wrap">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from './stores/user';
import { useStatsStore } from './stores/stats';
import { useFriendsStore } from './stores/friends';

const router = useRouter();
const userStore = useUserStore();
const statsStore = useStatsStore();
const friendsStore = useFriendsStore();

const logout = () => {
  userStore.logout();
  statsStore.refreshStats();
  friendsStore.initialize();
  router.push('/');
};
</script>
