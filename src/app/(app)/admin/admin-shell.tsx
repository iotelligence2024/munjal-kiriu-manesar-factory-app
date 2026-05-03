import { Link } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import { getUserModuleAccess } from "../../../utils/access-control";

type AdminRouteCard = {
	title: string;
	href: string;
};

type AdminShellProps = {
	activeHref?: string;
	children?: React.ReactNode;
};

const adminCards: AdminRouteCard[] = [
	{
		title: "DEPARTMENT MASTER",
		href: "/admin/department-master",
	},
	{
		title: "CHECKSHEET MASTER",
		href: "/admin/checksheet-master",
	},
	{
		title: "ROLE MASTER",
		href: "/admin/role-master",
	},
	{
		title: "USER MASTER",
		href: "/admin/user-master",
	},
	{
		title: "ACTIVITY MAPPING",
		href: "/admin/activity-mapping",
	},
];

export function AdminShell({ activeHref, children }: AdminShellProps) {
	const { session } = useSession();
	const moduleAccess = getUserModuleAccess(session);
	const visibleAdminCards = adminCards.filter((card) => {
		if (card.href === "/admin/department-master") return moduleAccess.department_master;
		if (card.href === "/admin/checksheet-master") return moduleAccess.checksheet_master;
		if (card.href === "/admin/role-master") return moduleAccess.role_master;
		if (card.href === "/admin/user-master") return moduleAccess.user_master;
		if (card.href === "/admin/activity-mapping") return moduleAccess.activity_mapping;
		return true;
	});

	return (
		<div className="dashboard-glass flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
			<div className="rounded-[1.4rem] border border-[rgba(191,219,254,0.45)] bg-[linear-gradient(165deg,rgba(224,231,255,0.85),rgba(219,234,254,0.82))] p-3 md:p-4">
				<div className="min-w-0 overflow-x-hidden">
					<div className="grid min-w-0 gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
						{visibleAdminCards.map((item) => {
							const isActive = activeHref === item.href;

							return (
								<Link
									key={item.href}
									to={item.href}
									className={[
										"inline-flex min-h-11 items-center justify-center rounded-[1.25rem] border px-3 py-2 text-center font-headline text-[0.78rem] font-semibold tracking-[0.11em] transition-all md:text-[0.82rem]",
										isActive
											? "border-[rgba(30,64,175,0.45)] bg-[linear-gradient(90deg,#2f5ec7,#36a9c3)] text-[#f8fafc] shadow-[0_10px_22px_rgba(37,99,235,0.26)]"
											: "border-[rgba(148,163,184,0.38)] bg-[#f8fafc] text-[#475569] hover:border-[rgba(30,64,175,0.45)] hover:bg-[linear-gradient(90deg,#2f5ec7,#36a9c3)] hover:text-[#f8fafc] hover:shadow-[0_10px_22px_rgba(37,99,235,0.26)]",
									].join(" ")}
								>
									{item.title}
								</Link>
							);
						})}
					</div>
					{visibleAdminCards.length === 0 ? (
						<div className="mt-3 rounded-xl border border-[rgba(245,158,11,0.28)] bg-[rgba(254,243,199,0.55)] px-4 py-3 text-sm text-amber-700">
							No admin sub-modules are mapped for your department and role.
						</div>
					) : null}
				</div>
			</div>

			{children ? <div className="mt-4 min-h-0 flex-1">{children}</div> : null}
		</div>
	);
}
