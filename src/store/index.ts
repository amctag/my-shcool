import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import parentsReducer from "@/features/school/parentsSlice";
import { baseApi } from "@/store/api/baseApi";

import "@/features/auth/api/authApi";
import "@/features/parent/api/profileApi";
import "@/features/parent/api/academicsApi";
import "@/features/parent/api/communicationApi";
import "@/features/parent/api/dailyApi";
import "@/features/school/api/schoolApi";
import "@/features/school/api/parentsApi";
import "@/features/school/api/childrenApi";
import "@/features/school/api/studentsApi";
import "@/features/school/api/lookupsApi";
import "@/features/school/api/teachersApi";
import "@/features/school/api/classesApi";
import "@/features/school/api/coursesApi";
import "@/features/school/api/sectionsApi";
import "@/features/school/api/teachesApi";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      parents: parentsReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
