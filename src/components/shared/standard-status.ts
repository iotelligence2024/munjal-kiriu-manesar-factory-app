export const standardStatusBadgeBaseClassName =
	"inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.12em] whitespace-normal";

export const standardSuccessStatusBadgeClassName =
	`${standardStatusBadgeBaseClassName} border-[rgba(22,163,74,0.34)] bg-[linear-gradient(135deg,#16a34a,#22c55e)] text-white shadow-[0_8px_16px_rgba(21,128,61,0.18)]`;

export const standardWarningStatusBadgeClassName =
	`${standardStatusBadgeBaseClassName} border-[rgba(234,179,8,0.34)] bg-[linear-gradient(135deg,#eab308,#f59e0b)] text-[#422006] shadow-[0_8px_16px_rgba(217,119,6,0.18)]`;

export const standardDangerStatusBadgeClassName =
	`${standardStatusBadgeBaseClassName} border-[rgba(220,38,38,0.34)] bg-[linear-gradient(135deg,#dc2626,#ef4444)] text-white shadow-[0_8px_16px_rgba(185,28,28,0.18)]`;

export const standardInfoStatusBadgeClassName =
	`${standardStatusBadgeBaseClassName} border-[rgba(59,130,246,0.26)] bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(191,219,254,0.92))] text-[#1d4ed8] shadow-[0_8px_16px_rgba(30,64,175,0.1)]`;

export type StandardWorkflowStatus =
	| "approval_pending"
	| "approved"
	| "attended"
	| "closed"
	| "completed"
	| "inprogress"
	| "open"
	| "overdue"
	| "pending"
	| "query"
	| "query_raised"
	| "spare_pending";

export const standardWorkflowStatusBadgeClassNameMap: Record<
	StandardWorkflowStatus,
	string
> = {
	approval_pending: standardDangerStatusBadgeClassName,
	approved: standardSuccessStatusBadgeClassName,
	attended: standardWarningStatusBadgeClassName,
	closed: standardSuccessStatusBadgeClassName,
	completed: standardSuccessStatusBadgeClassName,
	inprogress: standardWarningStatusBadgeClassName,
	open: standardDangerStatusBadgeClassName,
	overdue: standardDangerStatusBadgeClassName,
	pending: standardDangerStatusBadgeClassName,
	query: standardDangerStatusBadgeClassName,
	query_raised: standardDangerStatusBadgeClassName,
	spare_pending: standardDangerStatusBadgeClassName,
};

export function getStandardWorkflowStatusBadgeClassName(status: string) {
	const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");

	switch (normalized) {
		case "approval_pending":
		case "approved":
		case "attended":
		case "closed":
		case "completed":
		case "inprogress":
		case "open":
		case "overdue":
		case "pending":
		case "query":
		case "query_raised":
		case "spare_pending":
			return standardWorkflowStatusBadgeClassNameMap[normalized];
		default:
			return standardInfoStatusBadgeClassName;
	}
}
