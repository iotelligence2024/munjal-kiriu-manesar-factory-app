import { Link } from "react-router-dom";

const hrCards = [
	{
		title: "TRAVEL REQUISITION FORM",
		href: "/hr/travel-requisition-form",
	},
	{
		title: "TRAVEL EXPENSE STATEMENT",
		href: "/hr/travel-expense-statement",
	},
];

const MODULE_STRIP_COLUMNS = 6;

export default function DashboardPage() {
	return (
		<div className="dashboard-glass flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
			<div className="rounded-[1.4rem] border border-[rgba(191,219,254,0.45)] bg-[linear-gradient(165deg,rgba(224,231,255,0.85),rgba(219,234,254,0.82))] p-3 md:p-4">
				<div className="overflow-x-auto">
					<div
						className="grid min-w-[1200px] gap-3"
						style={{ gridTemplateColumns: `repeat(${MODULE_STRIP_COLUMNS}, minmax(0, 1fr))` }}
					>
					{hrCards.map((item) => (
						<Link
							key={item.href}
							to={item.href}
							className="inline-flex min-h-11 items-center justify-center rounded-[1.25rem] border border-[rgba(148,163,184,0.38)] bg-[#f8fafc] px-3 py-2 text-center font-headline text-[0.78rem] font-semibold tracking-[0.11em] text-[#475569] transition-all hover:border-[rgba(30,64,175,0.45)] hover:bg-[linear-gradient(90deg,#2f5ec7,#36a9c3)] hover:text-[#f8fafc] hover:shadow-[0_10px_22px_rgba(37,99,235,0.26)] md:text-[0.82rem]"
						>
							{item.title}
						</Link>
					))}
					</div>
				</div>
			</div>
		</div>
	);
}
