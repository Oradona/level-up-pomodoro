import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from './user';

const GUEST_FRIENDS_KEY = 'levelup-guest-friends';
const GUEST_REQUESTS_KEY = 'levelup-guest-friend-requests';

function buildGuestFriends(user) {
  return [
    {
      id: 'mina',
      friendshipId: 'mina',
      nickname: 'Mina',
      level: Math.max(2, user.level + 1),
      weeklyPomodoros: Math.max(8, user.totalPomodoros + 3),
      totalXp: Math.max(220, (user.level - 1) * 100 + user.xp + 60),
      bestStreak: Math.max(4, user.totalPomodoros > 0 ? 5 : 3),
      totalFocusTime: Math.max(180, user.totalFocusTime + 45),
      comparison: { weeklyGap: 3, xpGap: 60, levelGap: 1 }
    },
    {
      id: 'jules',
      friendshipId: 'jules',
      nickname: 'Jules',
      level: Math.max(1, user.level),
      weeklyPomodoros: Math.max(6, user.totalPomodoros + 1),
      totalXp: Math.max(140, (user.level - 1) * 100 + user.xp + 10),
      bestStreak: 2,
      totalFocusTime: Math.max(120, user.totalFocusTime + 20),
      comparison: { weeklyGap: 1, xpGap: 10, levelGap: 0 }
    }
  ];
}

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [],
    pendingReceived: [],
    pendingSent: [],
    searchResults: []
  }),
  actions: {
    initialize() {
      const userStore = useUserStore();
      if (userStore.isAuthenticated) {
        this.loadFriends();
      } else {
        this.loadGuestFriends();
      }
    },
    loadGuestFriends() {
      const userStore = useUserStore();
      try {
        this.friends = JSON.parse(localStorage.getItem(GUEST_FRIENDS_KEY) || 'null') || buildGuestFriends(userStore.profile);
        this.pendingSent = JSON.parse(localStorage.getItem(GUEST_REQUESTS_KEY) || '[]');
        this.pendingReceived = [];
      } catch (error) {
        this.friends = buildGuestFriends(userStore.profile);
        this.pendingSent = [];
        this.pendingReceived = [];
      }
      localStorage.setItem(GUEST_FRIENDS_KEY, JSON.stringify(this.friends));
      localStorage.setItem(GUEST_REQUESTS_KEY, JSON.stringify(this.pendingSent));
    },
    async loadFriends() {
      const userStore = useUserStore();
      if (!userStore.isAuthenticated) {
        this.loadGuestFriends();
        return;
      }
      const { data } = await axios.get('/api/friends');
      this.friends = data.friends || [];
      this.pendingReceived = data.pendingReceived || [];
      this.pendingSent = data.pendingSent || [];
    },
    async searchUsers(query) {
      const userStore = useUserStore();
      if (!query.trim()) {
        this.searchResults = [];
        return;
      }

      if (!userStore.isAuthenticated) {
        this.searchResults = [
          { id: 'aria', username: 'Aria', email: 'aria@guest.example', level: 3, totalXp: 255, totalPomodoros: 12, totalFocusTime: 300 },
          { id: 'noah', username: 'Noah', email: 'noah@guest.example', level: 2, totalXp: 145, totalPomodoros: 9, totalFocusTime: 210 }
        ].filter((entry) => entry.username.toLowerCase().includes(query.toLowerCase()) || entry.email.includes(query.toLowerCase()));
        return;
      }

      const { data } = await axios.get('/api/friends', { params: { search: query } });
      this.searchResults = data.results || [];
    },
    async sendFriendRequest(identifier) {
      const userStore = useUserStore();
      if (!identifier.trim()) return;

      if (!userStore.isAuthenticated) {
        this.pendingSent.unshift({ id: String(Date.now()), nickname: identifier, email: `${identifier}@guest.local`, createdAt: new Date().toISOString() });
        localStorage.setItem(GUEST_REQUESTS_KEY, JSON.stringify(this.pendingSent));
        return;
      }

      const { data } = await axios.post('/api/friends/request', { identifier });
      this.friends = data.friends || [];
      this.pendingReceived = data.pendingReceived || [];
      this.pendingSent = data.pendingSent || [];
    },
    async respondToRequest(id, action) {
      const userStore = useUserStore();
      if (!userStore.isAuthenticated) return;
      const { data } = await axios.put(`/api/friends/${id}/respond`, { action });
      this.friends = data.friends || [];
      this.pendingReceived = data.pendingReceived || [];
      this.pendingSent = data.pendingSent || [];
    }
  }
});
