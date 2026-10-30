"use client";
import { Printer } from "lucide-react";
export function PrintButton() { return <button type="button" onClick={() => window.print()} className="print:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-stone-50"><Printer className="h-4 w-4" />Print</button>; }
