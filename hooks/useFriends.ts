'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadFriends, saveFriends } from '@/lib/storage';
import { Friend, FriendStatus } from '@/lib/types';

export interface MyFriendStats {
  username: string;
  level: number;
  weeklyPomodoros: number;
  totalXP: number;
  bestStreak: number;
}

export interface UseFriends {
  friends: Friend[];
  accepted: Friend[];
  pending: Friend[];
  received: Friend[];
  hydrated: boolean;
  addFriend: (query: string) => { ok: boolean; message: string };
  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  removeFriend: (id: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pseudoRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates a plausible mock profile for a newly added friend. */
function createFriend(query: string): Friend {
  const rand = pseudoRandom(query.toLowerCase());
  const isEmail = EMAIL_RE.test(query);
  const username = isEmail ? query.split('@')[0] : query;
  const email = isEmail ? query : `${query.toLowerCase().replace(/\s+/g, '')}@example.com`;
  const level = 1 + Math.floor(rand() * 20);
  return {
    id: `f-${Date.now().toString(36)}-${Math.floor(rand() * 1e6).toString(36)}`,
    username,
    email,
    level,
    weeklyPomodoros: Math.floor(rand() * 30),
    totalXP: level * 100 + Math.floor(rand() * 100),
    bestStreak: Math.floor(rand() * 25),
    status: 'pending',
  };
}

export function useFriends(): UseFriends {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const friendsRef = useRef<Friend[]>([]);

  useEffect(() => {
    const loaded = loadFriends();
    friendsRef.current = loaded;
    setFriends(loaded);
    setHydrated(true);
  }, []);

  const commit = useCallback((next: Friend[]) => {
    friendsRef.current = next;
    setFriends(next);
    saveFriends(next);
  }, []);

  const addFriend = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return { ok: false, message: '이메일 또는 사용자명을 입력해주세요.' };
      }
      const exists = friendsRef.current.some(
        (f) =>
          f.email.toLowerCase() === trimmed.toLowerCase() ||
          f.username.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) {
        return { ok: false, message: '이미 목록에 있는 친구입니다.' };
      }
      commit([...friendsRef.current, createFriend(trimmed)]);
      return { ok: true, message: `${trimmed} 님에게 친구 요청을 보냈습니다.` };
    },
    [commit]
  );

  const setStatus = useCallback(
    (id: string, status: FriendStatus) => {
      commit(friendsRef.current.map((f) => (f.id === id ? { ...f, status } : f)));
    },
    [commit]
  );

  const acceptRequest = useCallback((id: string) => setStatus(id, 'accepted'), [setStatus]);

  const rejectRequest = useCallback(
    (id: string) => {
      commit(friendsRef.current.filter((f) => f.id !== id));
    },
    [commit]
  );

  const removeFriend = useCallback(
    (id: string) => {
      commit(friendsRef.current.filter((f) => f.id !== id));
    },
    [commit]
  );

  const grouped = useMemo(
    () => ({
      accepted: friends.filter((f) => f.status === 'accepted'),
      pending: friends.filter((f) => f.status === 'pending'),
      received: friends.filter((f) => f.status === 'received'),
    }),
    [friends]
  );

  return {
    friends,
    ...grouped,
    hydrated,
    addFriend,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
}
