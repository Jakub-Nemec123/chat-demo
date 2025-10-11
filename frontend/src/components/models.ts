export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type User = {
  id: string; // string for UUID
  email: string;
  name: string;
  username: string;
}

export type Channel = {
  id: number;
  name: string;
  type: 'public' | 'private'
}
