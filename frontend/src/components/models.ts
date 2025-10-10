export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type User = {
  id: number; // todo: change type
  email: string;
  name: string;
  username: string;
}

export type Channel = {
  id: number;
  name: string;
  type: 'public' | 'private'
}
