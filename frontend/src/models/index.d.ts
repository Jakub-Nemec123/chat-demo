type ID = string; // could be of any structure

export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type User = {
  id: ID;
  email: string;
  name: string;
  username: string;
}

export type Channel = {
  id: number;
  name: string;
  type: 'public' | 'private'
}
