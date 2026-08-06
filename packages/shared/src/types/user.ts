export type AdminRole = 'ADMIN' | 'EDITOR';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
}

export interface TeamAccount {
  id: string;
  name: string;
  email: string;
  logoUrl?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterTeamRequest {
  name: string;
  email: string;
  password: string;
  logoUrl?: string;
}
