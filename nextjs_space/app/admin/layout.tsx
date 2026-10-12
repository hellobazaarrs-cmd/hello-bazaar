import { AdminPermissionTrigger } from "@/components/admin-permission-trigger";

// Pass-through layout. Each admin page handles its own auth/layout wrapping.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminPermissionTrigger />
      {children}
    </>
  );
}

