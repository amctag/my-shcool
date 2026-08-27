import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession } from "@/features/auth/types";

export type AuthState = {
  ready: boolean;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  name: string | null;
  schoolId: number | null;
  schoolName: string | null;
};

const emptyState: AuthState = {
  ready: false,
  accessToken: null,
  accessTokenExpiresAt: null,
  name: null,
  schoolId: null,
  schoolName: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: emptyState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthSession>) {
      state.accessToken = action.payload.accessToken;
      state.accessTokenExpiresAt = action.payload.accessTokenExpiresAt;
      state.name = action.payload.name;
      state.schoolId = action.payload.schoolId;
      state.schoolName = action.payload.schoolName;
    },
    setAuthReady(state) {
      state.ready = true;
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.accessTokenExpiresAt = null;
      state.name = null;
      state.schoolId = null;
      state.schoolName = null;
      state.ready = true;
    },
  },
});

export const { setCredentials, setAuthReady, clearCredentials } =
  authSlice.actions;

export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.accessToken);
export const selectAuthReady = (state: { auth: AuthState }) => state.auth.ready;
export const selectAuthName = (state: { auth: AuthState }) => state.auth.name;
export const selectSchoolName = (state: { auth: AuthState }) =>
  state.auth.schoolName;

export default authSlice.reducer;
