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
