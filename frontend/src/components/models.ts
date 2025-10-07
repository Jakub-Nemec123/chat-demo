export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type User = {
  id: number;
  name: string;
  nickname: string;
  email: string;
}

export type Channel = {
  id: number;
  name: string;
  type: 'public' | 'private'
}