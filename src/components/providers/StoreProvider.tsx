"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/index";
import { AuthSessionLoader } from "@/components/auth/AuthSessionLoader";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthSessionLoader>{children}</AuthSessionLoader>
    </Provider>
  );
}
