export interface AuthData {
  email: string;
  password: string;
}

export interface TokenData {
  type: 'bearer';
  token: string;
  expiresAt: string; // TODO: datetime
}
