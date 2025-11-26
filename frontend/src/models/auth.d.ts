export interface AuthData {
  email: string;
  password: string;
}

export interface NewUserData {
  email: string;
  name: {
    first: string;
    last: string;
  };
  username: string;
  password: string;
  passwordRepeat: string;
}

export interface TokenData {
  type: 'bearer';
  token: string;
  expiresAt: string; // TODO: datetime
}
