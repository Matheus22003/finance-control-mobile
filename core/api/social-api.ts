import { request } from './request';

export type Friend = { friendshipId: string; userId: string; displayName: string; email: string; friendsSince: string };
export type GroupMember = { userId: string; displayName: string; email: string; role: string };
export type Group = {
  id: string;
  name: string;
  description: string | null;
  createdByUserId: string;
  members: GroupMember[];
};

export const getFriends = (token: string) => request<Friend[]>('/api/v1/friends', {}, token);
export const getGroups = (token: string) => request<Group[]>('/api/v1/groups', {}, token);
export const getGroup = (token: string, groupId: string) => request<Group>(`/api/v1/groups/${groupId}`, {}, token);
export const sendFriendRequest = (token: string, email: string) =>
  request<Friend>('/api/v1/friends/requests', { method: 'POST', body: JSON.stringify({ email }) }, token);
export const createGroup = (token: string, input: { name: string; description: string | null; memberUserIds: string[] }) =>
  request<Group>('/api/v1/groups', { method: 'POST', body: JSON.stringify(input) }, token);

// The debt service only accepts member changes from the group owner, and the new
// member must already be an accepted friend.
export const addGroupMember = (token: string, groupId: string, userId: string) =>
  request<Group>(`/api/v1/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }, token);
export const removeGroupMember = (token: string, groupId: string, memberUserId: string) =>
  request<void>(`/api/v1/groups/${groupId}/members/${memberUserId}`, { method: 'DELETE' }, token);
