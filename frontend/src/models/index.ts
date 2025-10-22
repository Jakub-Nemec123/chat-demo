type ID = string; // could be of any structure

export interface Meta {
  totalCount: number;
}

export interface Command {
  name: string;
  arguments: string[];
}

export interface Channel {
  id: number;
  name: string;
  type: ChannelPrivacy
}

export enum ChannelPrivacy {
  public = 'public',
  private = 'private',
}

export interface User {
  id: ID;
  email: string;
  name: string;
  username: string;
}
