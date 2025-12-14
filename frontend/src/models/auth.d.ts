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

export interface PassData {
  password: string;
  passwordRepeat: string;
}

export interface TokenData {
  token: string;
  expiresAt: string;
  user: UserData;
}

export interface UserData {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}
