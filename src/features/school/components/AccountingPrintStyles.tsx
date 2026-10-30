"use client";
import { useGetSchoolMeQuery } from "@/features/auth/api/authApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export function AccountingPrintStyles() {
  const ready = useAppSelector(selectAuthReady);
  const { data: school } = useGetSchoolMeQuery(undefined, { skip: !ready });
  return <>
    <style>{`@page{size:A4 portrait;margin:14mm}html,body{background:#fff}@media print{html,body{background:#fff!important;margin:0!important;padding:0!important}body *{visibility:hidden!important}.print-document,.print-document *{visibility:visible!important}.print-document{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:#fff!important;box-shadow:none!important;border:0!important;color:#171717!important;font-size:11pt}.print-document .print-hidden,.print-document button,.print-document a{display:none!important}.print-document table{width:100%;border-collapse:collapse}.print-document th{background:#f4f4f4!important;color:#171717!important;border-bottom:1px solid #999!important}.print-document th,.print-document td{padding:7px 8px!important}.print-document tr{break-inside:avoid;page-break-inside:avoid}.print-document thead{display:table-header-group}.print-section{break-inside:avoid;page-break-inside:avoid}.print-amount{color:#b45309!important;font-size:16pt;font-weight:700}}`}</style>
    <header className="mb-6 flex items-start justify-between border-b border-stone-300 pb-4" dir="auto">
      <div>{school?.logo ? <img src={school.logo} alt="" className="mr-4 inline-block max-h-16 max-w-32 object-contain" /> : null}<span className="text-xl font-semibold">{school?.name ?? ""}</span><div className="text-sm text-muted">{[school?.address, school?.phone, school?.email].filter(Boolean).join(" · ")}</div></div>
    </header>
  </>;
}
