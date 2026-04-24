// ============================================================================
// Admin Layout
// ============================================================================
//
// Sidebar navigation for the entire admin section. Protected by middleware —
// only users with `admin` role reach this layout.
//
// Sidebar collapses to a hamburger menu on mobile via sheet/drawer pattern.

import AdminSidebarLayout from "./_components/sidebar-layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
