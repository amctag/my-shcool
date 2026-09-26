"use client";

import { use } from "react";
import { BackLink } from "@/components/dashboard/BackLink";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { AccountForm } from "@/features/school/components/AccountForm";
import { useGetDashboardAccountQuery } from "@/features/school/api/accountingApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export default function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const parsed = Number(id);
  const accountId =
    Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const { data, error, isLoading } = useGetDashboardAccountQuery(
    accountId ?? 0,
    { skip: !canFetch || accountId === null },
  );

  return (
    <div className="space-y-4">
      <BackLink href="/accounting/accounts">Back to accounts</BackLink>
      {accountId === null ? (
        <p className="text-sm text-red-600">Invalid account id.</p>
      ) : isLoading || !canFetch ? (
        <LoadingDots label="Loading account" />
      ) : error || !data ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error, "Could not load account")}
        </p>
      ) : (
        <AccountForm key={data.id} account={data} />
      )}
    </div>
  );
}
