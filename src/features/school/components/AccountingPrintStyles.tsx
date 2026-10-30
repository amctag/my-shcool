"use client";
import { useGetSchoolMeQuery } from "@/features/auth/api/authApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export function AccountingPrintStyles() {
  const ready = useAppSelector(selectAuthReady);
  const { data: school } = useGetSchoolMeQuery(undefined, { skip: !ready });
  return <>
    <style>{`@page{size:A4 portrait;margin:14mm}@media print{body{background:#fff!important}.print\\:hidden{display:none!important}.print-document{box-shadow:none!important;border:0!important;max-width:none!important}.print-document tr{break-inside:avoid}.print-document thead{display:table-header-group}.dashboard-shell,.dashboard-sidebar,.dashboard-header{display:none!important}}`}</style>
    <header className="mb-6 flex items-start justify-between border-b border-stone-300 pb-4" dir="auto">
      <div>{school?.logo ? <img src={school.logo} alt="" className="mr-4 inline-block max-h-16 max-w-32 object-contain" /> : null}<span className="text-xl font-semibold">{school?.name ?? ""}</span><div className="text-sm text-muted">{[school?.address, school?.phone, school?.email].filter(Boolean).join(" · ")}</div></div>
    </header>
  </>;
}
