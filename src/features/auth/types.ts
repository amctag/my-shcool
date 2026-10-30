export type SchoolAccessToken = {
  accessToken: string;
  accessTokenExpiresAt: string;
  name: string;
  schoolId: number;
  schoolName: string;
};

export type SchoolLoginRequest = {
  email: string;
  password: string;
};

export type SchoolLogoutResponse = {
  message: string;
};

export type SchoolMe = {
  schoolId: number;
  name: string;
  email: string;
  role: "school";
  logo: string | null;
  phone: string | null;
  address: string | null;
};

export type MessageResponse = {
  message: string;
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  name: string | null;
  schoolId: number | null;
  schoolName: string | null;
};
