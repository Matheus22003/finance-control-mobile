import { request } from './request';

export type Friend = { friendshipId: string; userId: string; displayName: string; email: string; friendsSince: string };
export type Group = { id: string; name: string; description: string | null; members: { userId: string; displayName: string; email: string; role: string }[] };

export const getFriends = (token: string) => request<Friend[]>('/api/v1/friends', {}, token);
export const getGroups = (token: string) => request<Group[]>('/api/v1/groups', {}, token);
export const sendFriendRequest = (token: string, email: string) => request<Friend>('/api/v1/friends/requests', { method: 'POST', body: JSON.stringify({ email }) }, token);
export const createGroup = (token: string, input: { name: string; description: string | null; memberUserIds: string[] }) => request<Group>('/api/v1/groups', { method: 'POST', body: JSON.stringify(input) }, token);
