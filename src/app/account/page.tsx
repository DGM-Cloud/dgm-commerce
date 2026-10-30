"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import AccountDashboard from "@/components/account/AccountDashboard";
import AccountLoading from "@/components/account/AccountLoading";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AccountDashboardData } from "@/lib/account-data";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dashboard, setDashboard] = useState<AccountDashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    setFetching(true);
    fetch("/api/account/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setDashboard(payload as AccountDashboardData))
      .catch(() => setDashboard({ orders: [], wishlist: [], stats: { totalOrders: 0, activeOrders: 0, wishlistCount: 0, totalSpent: 0 } }))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return <AccountLoading />;
  if (!user) return <AccountLoading />;

  return (
    <AccountShell hideHeading>
      <AccountDashboard user={user} data={dashboard} loading={fetching} />
    </AccountShell>
  );
}
