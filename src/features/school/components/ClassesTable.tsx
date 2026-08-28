"use client";

import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAppSelector } from "@/store/hooks";

export function ClassesTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { data: classes = [], error, isLoading } = useGetClassesQuery(
    undefined,
    { skip: !canFetch },
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                ID
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Class
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Stage
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Level
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                Students
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-muted"
                >
                  Loading classes…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-red-600"
                  role="alert"
                >
                  {getApiErrorMessage(error, "Could not load classes")}
                </td>
              </tr>
            ) : classes.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-muted"
                >
                  No classes are set up for this school.
                </td>
              </tr>
            ) : (
              classes.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-stone-100 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                    {item.id}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                    {item.className}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground">
                    {item.stageTitle}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground">
                    {item.classLevel}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-foreground">
                    {item.studentCount ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
