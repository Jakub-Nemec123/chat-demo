type ID = string; // could be of any structure

export interface Command {
  arguments?: CommandArgument[];
  callable: string;
}

export interface CommandArgument {
  name: string;
  required?: boolean;
}

export interface Channel {
  id: number;
  // Maybe UID? To store channels with same name under different IDS. We can also show The UIDs next to a channel for user to see
  name: string;
  type: ChannelPrivacy
}

export enum ChannelPrivacy {
  public = 'public',
  private = 'private',
}

export interface Message {
  id: ID;
  author: User;
  message: string;
}

export interface User {
  id: ID;
  email: string;
  name: string;
  username: string;
  currentState: UserStates;
}

export enum UserStates {
  online = 'online',
  DND = 'DND',
  offline = 'offline',
}
