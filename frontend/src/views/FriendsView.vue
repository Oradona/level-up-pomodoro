<template>
  <section class="stack-lg">
    <div class="panel stack-md">
      <div class="section-header">
        <div>
          <p class="eyebrow">Social focus</p>
          <h2>Friends & comparison</h2>
        </div>
        <span class="badge">{{ userStore.isAuthenticated ? 'Live data' : 'Guest preview' }}</span>
      </div>

      <div class="search-row">
        <input v-model="searchQuery" type="text" placeholder="Search by email or username" @input="friendsStore.searchUsers(searchQuery)" />
        <button class="button" @click="friendsStore.sendFriendRequest(searchQuery)">Send request</button>
      </div>

      <p class="muted" v-if="!userStore.isAuthenticated">
        Guest mode shows sample rivals and locally simulated requests. Sign in for real friend syncing.
      </p>

      <div v-if="friendsStore.searchResults.length" class="search-results">
        <button v-for="result in friendsStore.searchResults" :key="result.id" class="result-card" @click="friendsStore.sendFriendRequest(result.email || result.username)">
          <div>
            <strong>{{ result.username || result.nickname }}</strong>
            <p>{{ result.email }}</p>
          </div>
          <span>Lv. {{ result.level }}</span>
        </button>
      </div>
    </div>

    <div class="grid two-col">
      <div class="panel stack-md">
        <div class="section-header">
          <h3>Friends</h3>
          <span class="badge">{{ friendsStore.friends.length }}</span>
        </div>
        <div class="stack-md">
          <FriendCard v-for="friend in friendsStore.friends" :key="friend.id" :friend="friend" />
          <p v-if="!friendsStore.friends.length" class="muted">No friends yet. Send the first request.</p>
        </div>
      </div>

      <div class="stack-lg">
        <div class="panel stack-md">
          <div class="section-header">
            <h3>Incoming requests</h3>
            <span class="badge">{{ friendsStore.pendingReceived.length }}</span>
          </div>
          <div v-if="friendsStore.pendingReceived.length" class="stack-sm">
            <div v-for="request in friendsStore.pendingReceived" :key="request.id" class="request-card">
              <div>
                <strong>{{ request.nickname }}</strong>
                <p>{{ request.email }}</p>
              </div>
              <div class="button-row">
                <button class="button small" @click="friendsStore.respondToRequest(request.id, 'accept')">Accept</button>
                <button class="button ghost small" @click="friendsStore.respondToRequest(request.id, 'reject')">Reject</button>
              </div>
            </div>
          </div>
          <p v-else class="muted">No incoming requests.</p>
        </div>

        <div class="panel stack-md">
          <div class="section-header">
            <h3>Sent requests</h3>
            <span class="badge">{{ friendsStore.pendingSent.length }}</span>
          </div>
          <div v-if="friendsStore.pendingSent.length" class="stack-sm">
            <div v-for="request in friendsStore.pendingSent" :key="request.id" class="request-card">
              <div>
                <strong>{{ request.nickname }}</strong>
                <p>{{ request.email }}</p>
              </div>
              <span class="badge subtle">Pending</span>
            </div>
          </div>
          <p v-else class="muted">No pending outbound requests.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import FriendCard from '../components/FriendCard.vue';
import { useFriendsStore } from '../stores/friends';
import { useUserStore } from '../stores/user';

const friendsStore = useFriendsStore();
const userStore = useUserStore();
const searchQuery = ref('');

onMounted(() => {
  friendsStore.initialize();
});
</script>
