<template>
  <section class="auth-wrap">
    <div class="panel auth-card stack-lg">
      <div>
        <p class="eyebrow">Account access</p>
        <h2>{{ isRegistering ? 'Create your account' : 'Welcome back' }}</h2>
        <p class="muted">Sign in to sync progress, friends, and long-term statistics across sessions.</p>
      </div>

      <div class="tab-row">
        <button class="tab-button" :class="{ active: !isRegistering }" @click="isRegistering = false">Login</button>
        <button class="tab-button" :class="{ active: isRegistering }" @click="isRegistering = true">Register</button>
      </div>

      <form class="stack-md" @submit.prevent="submitForm">
        <label v-if="isRegistering" class="field-group">
          <span>Username</span>
          <input v-model="form.username" type="text" required placeholder="focusmage" />
        </label>

        <label class="field-group">
          <span>{{ isRegistering ? 'Email' : 'Email or username' }}</span>
          <input v-model="form.identifier" type="text" required :placeholder="isRegistering ? 'you@example.com' : 'you@example.com or focusmage'" />
        </label>

        <label class="field-group">
          <span>Password</span>
          <input v-model="form.password" type="password" required minlength="6" placeholder="••••••••" />
        </label>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <button class="button" type="submit">{{ isRegistering ? 'Register' : 'Login' }}</button>
      </form>

      <button class="button ghost" @click="router.push('/')">Continue in guest mode</button>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useStatsStore } from '../stores/stats';
import { useFriendsStore } from '../stores/friends';

const router = useRouter();
const userStore = useUserStore();
const statsStore = useStatsStore();
const friendsStore = useFriendsStore();
const isRegistering = ref(false);
const errorMessage = ref('');
const form = reactive({
  username: '',
  identifier: '',
  password: ''
});

const submitForm = async () => {
  errorMessage.value = '';
  try {
    if (isRegistering.value) {
      await userStore.register({
        username: form.username,
        email: form.identifier,
        password: form.password
      });
    } else {
      await userStore.login({
        identifier: form.identifier,
        password: form.password
      });
    }
    await statsStore.refreshStats();
    await friendsStore.loadFriends();
    router.push('/');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Unable to complete the request.';
  }
};
</script>
