import { redirect } from "next/navigation";

// Root and child accounts are created from the Chart of Accounts tree so the
// selected node always determines the hierarchy parent.
export default function AddAccountPage() {
  redirect("/accounting/accounts");
}
