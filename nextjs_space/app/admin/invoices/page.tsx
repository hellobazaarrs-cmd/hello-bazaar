import { AdminGuard } from "@/lib/admin-guard";
import CustomInvoicesClient from "./custom-invoices-client";

export const dynamic = "force-dynamic";

export default function AdminInvoicesPage() {
  return (
    <AdminGuard>
      <CustomInvoicesClient />
    </AdminGuard>
  );
}
