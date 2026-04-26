import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-preact";
import type { JSX } from "preact";
import { useSession } from "../../../context/SessionContext";
import { Button } from "../../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";

type ItineraryRow = {
	depart: string;
	arrive: string;
	date: string;
	timings: string;
	remarks: string;
};

type ApprovalStage = {
	approved: boolean;
	queried: boolean;
	action: string;
	approvedByUsername: string;
	approvedByName: string;
	approvedAt: string;
	remarks: string;
};

type FinanceApprovalStage = ApprovalStage & {
	selectedAuthorityUsername: string;
	selectedAuthorityName: string;
};

type ApprovalFlow = {
	hrHod: ApprovalStage;
	financeHod: FinanceApprovalStage;
	approvingAuthority: ApprovalStage;
};

type ApprovalHistoryEntry = {
	cycle: number;
	stage: string;
	action: string;
	actorUsername: string;
	actorName: string;
	actedAt: string;
	remarks: string;
	selectedAuthorityUsername: string;
	selectedAuthorityName: string;
	statusAfterAction: string;
};

type ApprovedUserOption = {
	id: string;
	username: string;
	employee_name: string;
	employee_code: string;
	department: string;
	role: string;
};

type SubmissionSummary = {
	id: string;
	date: string;
	employeeName: string;
	employeeCode: string;
	department: string;
	type: string;
	budget: string;
	availed: string;
	status: string;
	approvalCycle: number;
	createdAt: string;
	approvalFlow: ApprovalFlow;
	approvalHistory: ApprovalHistoryEntry[];
	itineraryRows: ItineraryRow[];
	details: Record<string, string | string[]>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

const pad = (value: number) => String(value).padStart(2, "0");

const formatDisplayDate = (value: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const formatDisplayDateTime = (value: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${formatDisplayDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getApprovalBadgeLabel = (stage: ApprovalStage) => {
	if (stage.approved) return "APPROVED";
	if (stage.queried || stage.action === "query") return "QUERY";
	return "PENDING";
};

const getApprovalBadgeClassName = (stage: ApprovalStage) => {
	if (stage.approved) {
		return "inline-flex rounded-full border border-[rgba(34,197,94,0.28)] bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(187,247,208,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#15803d]";
	}
	if (stage.queried || stage.action === "query") {
		return "inline-flex rounded-full border border-[rgba(234,88,12,0.24)] bg-[linear-gradient(135deg,rgba(255,237,213,0.96),rgba(254,215,170,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c2410c]";
	}
	return "inline-flex rounded-full border border-[rgba(59,130,246,0.24)] bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(191,219,254,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]";
};

const getSummaryStatusLabel = (status: string) => {
	if (status === "APPROVED") return "APPROVED";
	if (status === "QUERY_RAISED" || status.endsWith("_QUERY")) return "QUERY RAISED";
	if (status.endsWith("_APPROVED")) return "APPROVAL IN PROGRESS";
	return status.replaceAll("_", " ");
};

const getSummaryStatusClassName = (status: string) => {
	if (status === "APPROVED") {
		return "inline-flex rounded-full border border-[rgba(34,197,94,0.28)] bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(187,247,208,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#15803d]";
	}
	if (status === "QUERY_RAISED" || status.endsWith("_QUERY")) {
		return "inline-flex rounded-full border border-[rgba(234,88,12,0.24)] bg-[linear-gradient(135deg,rgba(255,237,213,0.96),rgba(254,215,170,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c2410c]";
	}
	return "inline-flex rounded-full border border-[rgba(59,130,246,0.24)] bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(191,219,254,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]";
};

const getApprovalStageLabel = (stage: string) => {
	if (stage === "hrHod") return "HR HOD / Admin HOD";
	if (stage === "financeHod") return "Finance HOD";
	if (stage === "approvingAuthority") return "Approving Authority";
	if (stage === "requestor") return "Requestor";
	return stage;
};

const getApprovalActionLabel = (action: string) => {
	if (action === "approve") return "APPROVED";
	if (action === "query") return "QUERY RAISED";
	if (action === "resubmitted") return "RESUBMITTED";
	return action.replaceAll("_", " ").toUpperCase();
};

const getHistoryBadgeClassName = (action: string) => {
	if (action === "approve") return getApprovalBadgeClassName({ approved: true, queried: false, action, approvedByUsername: "", approvedByName: "", approvedAt: "", remarks: "" });
	if (action === "query") return getApprovalBadgeClassName({ approved: false, queried: true, action, approvedByUsername: "", approvedByName: "", approvedAt: "", remarks: "" });
	return "inline-flex rounded-full border border-[rgba(59,130,246,0.24)] bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(191,219,254,0.92))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d4ed8]";
};

const createEmptyRow = (): ItineraryRow => ({
	depart: "",
	arrive: "",
	date: "",
	timings: "",
	remarks: "",
});

const sectionClass =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";

const sectionTitleClass =
	"mb-4 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700";
const fieldShellClass =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";
const fieldSurfaceClass =
	"h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none";
const readOnlyFieldSurfaceClass =
	`${fieldSurfaceClass} disabled:cursor-default disabled:text-slate-700 disabled:opacity-100`;
const approvalRemarksTextareaClass =
	"min-h-[7rem] resize-none overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-white px-4 py-3 text-sm text-[#17181d] placeholder:text-[#8c98a8] shadow-none outline-none ring-0 focus:border-[rgba(59,130,246,0.22)] focus:outline-none focus:ring-0";

type FieldProps = {
	label: string;
	children: JSX.Element;
};

const Field = ({ label, children }: FieldProps) => (
	<div>
		<label className="mb-2 block text-sm font-medium text-[#4d5560]">
			{label}
		</label>
		<div className={fieldShellClass}>
			{children}
		</div>
	</div>
);

const AutoGrowTextarea = (
	props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>
) => {
	const { onInput, className, ...restProps } = props;

	const handleInput: JSX.GenericEventHandler<HTMLTextAreaElement> = (event) => {
		const target = event.currentTarget;
		target.style.height = "auto";
		target.style.height = `${target.scrollHeight}px`;
		onInput?.(event as never);
	};

	return (
		<Textarea
			rows={5}
			{...restProps}
			onInput={handleInput}
			className={`min-h-[7rem] resize-none overflow-hidden ${fieldSurfaceClass} !h-auto py-3 ${className ?? ""}`}
		/>
	);
};

export default function TravelRequisitionFormPage() {
	const { session } = useSession();
	const [open, setOpen] = useState(false);
	const [formKey, setFormKey] = useState(0);
	const [submissionList, setSubmissionList] = useState<SubmissionSummary[]>([]);
	const [summaryLoading, setSummaryLoading] = useState(true);
	const [summaryError, setSummaryError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitLoading, setSubmitLoading] = useState(false);
	const [selectedSubmission, setSelectedSubmission] = useState<SubmissionSummary | null>(null);
	const [isEditMode, setIsEditMode] = useState(false);
	const [approvedUsers, setApprovedUsers] = useState<ApprovedUserOption[]>([]);
	const [approvedUsersLoading, setApprovedUsersLoading] = useState(false);
	const [approvalLoading, setApprovalLoading] = useState(false);
	const [approvalError, setApprovalError] = useState<string | null>(null);
	const [hrRemarks, setHrRemarks] = useState("");
	const [financeRemarks, setFinanceRemarks] = useState("");
	const [authorityRemarks, setAuthorityRemarks] = useState("");

	const [employeeName, setEmployeeName] = useState(session?.employee_name ?? "");
	const [employeeCode, setEmployeeCode] = useState(session?.employee_code ?? "");
	const [department, setDepartment] = useState(session?.department ?? "");
	const [travelType, setTravelType] = useState("");
	const [travelDate, setTravelDate] = useState("");
	const [budget, setBudget] = useState("");
	const [availed, setAvailed] = useState("");
	const [travelTypeCategory, setTravelTypeCategory] = useState("");
	const [travelModes, setTravelModes] = useState<string[]>([]);
	const [hotelRequisition, setHotelRequisition] = useState("");
	const [hotelBudget, setHotelBudget] = useState("");
	const [visaRequired, setVisaRequired] = useState("");
	const [visaBudget, setVisaBudget] = useState("");
	const [domesticEntitlement, setDomesticEntitlement] = useState("");
	const [domesticNoOfDays, setDomesticNoOfDays] = useState("");
	const [domesticTotal, setDomesticTotal] = useState("");
	const [domesticSpecialApproval, setDomesticSpecialApproval] = useState("");
	const [domesticAmount, setDomesticAmount] = useState("");
	const [foreignEntitlement, setForeignEntitlement] = useState("");
	const [foreignNoOfDays, setForeignNoOfDays] = useState("");
	const [foreignTotal, setForeignTotal] = useState("");
	const [foreignSpecialApproval, setForeignSpecialApproval] = useState("");
	const [foreignAmount, setForeignAmount] = useState("");
	const [forexDenomination, setForexDenomination] = useState("");
	const [totalForexRequired, setTotalForexRequired] = useState("");
	const [reasonOfTravel, setReasonOfTravel] = useState("");
	const [outputExpected, setOutputExpected] = useState("");
	const [flightChanges, setFlightChanges] = useState("");
	const [selectedAuthorityUsername, setSelectedAuthorityUsername] = useState("");

	const [itineraryRows, setItineraryRows] = useState<ItineraryRow[]>(
		Array.from({ length: 5 }, () => createEmptyRow())
	);

	const resetForm = () => {
		setEmployeeName(session?.employee_name ?? "");
		setEmployeeCode(session?.employee_code ?? "");
		setDepartment(session?.department ?? "");
		setTravelType("");
		setTravelDate("");
		setBudget("");
		setAvailed("");
		setTravelTypeCategory("");
		setTravelModes([]);
		setHotelRequisition("");
		setHotelBudget("");
		setVisaRequired("");
		setVisaBudget("");
		setDomesticEntitlement("");
		setDomesticNoOfDays("");
		setDomesticTotal("");
		setDomesticSpecialApproval("");
		setDomesticAmount("");
		setForeignEntitlement("");
		setForeignNoOfDays("");
		setForeignTotal("");
		setForeignSpecialApproval("");
		setForeignAmount("");
		setForexDenomination("");
		setTotalForexRequired("");
		setReasonOfTravel("");
		setOutputExpected("");
		setFlightChanges("");
		setSelectedAuthorityUsername("");
		setHrRemarks("");
		setFinanceRemarks("");
		setAuthorityRemarks("");
		setItineraryRows(Array.from({ length: 5 }, () => createEmptyRow()));
		setSubmitError(null);
		setApprovalError(null);
		setSelectedSubmission(null);
		setIsEditMode(false);
		setFormKey((prev) => prev + 1);
	};

	useEffect(() => {
		setEmployeeName(session?.employee_name ?? "");
		setEmployeeCode(session?.employee_code ?? "");
		setDepartment(session?.department ?? "");
	}, [session]);

	const hydrateFormFromSubmission = (item: SubmissionSummary) => {
		setEmployeeName(item.employeeName === "-" ? "" : item.employeeName);
		setEmployeeCode(item.employeeCode === "-" ? "" : item.employeeCode);
		setDepartment(item.department === "-" ? "" : item.department);
		setTravelType(item.type === "-" ? "" : item.type);
		setTravelDate(item.date === "-" ? "" : item.date);
		setBudget(item.budget === "-" ? "" : item.budget);
		setAvailed(item.availed === "-" ? "" : item.availed);
		setItineraryRows(
			item.itineraryRows?.length ? item.itineraryRows : Array.from({ length: 5 }, () => createEmptyRow())
		);
		setTravelTypeCategory(String(item.details?.travelTypeCategory ?? ""));
		setTravelModes(Array.isArray(item.details?.travelModes) ? item.details.travelModes : []);
		setHotelRequisition(String(item.details?.hotelRequisition ?? ""));
		setHotelBudget(String(item.details?.hotelBudget ?? ""));
		setVisaRequired(String(item.details?.visaRequired ?? ""));
		setVisaBudget(String(item.details?.visaBudget ?? ""));
		setDomesticEntitlement(String(item.details?.domesticEntitlement ?? ""));
		setDomesticNoOfDays(String(item.details?.domesticNoOfDays ?? ""));
		setDomesticTotal(String(item.details?.domesticTotal ?? ""));
		setDomesticSpecialApproval(String(item.details?.domesticSpecialApproval ?? ""));
		setDomesticAmount(String(item.details?.domesticAmount ?? ""));
		setForeignEntitlement(String(item.details?.foreignEntitlement ?? ""));
		setForeignNoOfDays(String(item.details?.foreignNoOfDays ?? ""));
		setForeignTotal(String(item.details?.foreignTotal ?? ""));
		setForeignSpecialApproval(String(item.details?.foreignSpecialApproval ?? ""));
		setForeignAmount(String(item.details?.foreignAmount ?? ""));
		setForexDenomination(String(item.details?.forexDenomination ?? ""));
		setTotalForexRequired(String(item.details?.totalForexRequired ?? ""));
		setReasonOfTravel(String(item.details?.reasonOfTravel ?? ""));
		setOutputExpected(String(item.details?.outputExpected ?? ""));
		setFlightChanges(String(item.details?.flightChanges ?? ""));
		setSelectedAuthorityUsername(item.approvalFlow?.financeHod?.selectedAuthorityUsername ?? "");
		setHrRemarks(item.approvalFlow?.hrHod?.remarks ?? "");
		setFinanceRemarks(item.approvalFlow?.financeHod?.remarks ?? "");
		setAuthorityRemarks(item.approvalFlow?.approvingAuthority?.remarks ?? "");
		setFormKey((prev) => prev + 1);
	};

	const openViewMode = (item: SubmissionSummary) => {
		setSelectedSubmission(item);
		setIsEditMode(false);
		setSubmitError(null);
		hydrateFormFromSubmission(item);
		setOpen(true);
	};

	const openEditMode = (item: SubmissionSummary) => {
		setSelectedSubmission(item);
		setIsEditMode(true);
		setSubmitError(null);
		hydrateFormFromSubmission(item);
		setOpen(true);
	};

	const handleDelete = async (id: string) => {
		const confirmed = window.confirm("Delete this travel requisition?");
		if (!confirmed) return;

		try {
			setSummaryError(null);
			const response = await fetch(`${API_BASE_URL}/api/travel-requisitions/${id}`, {
				method: "DELETE",
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to delete travel requisition.");
			}
			setSubmissionList((prev) => prev.filter((item) => item.id !== id));
		} catch (error) {
			setSummaryError(
				error instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: error instanceof Error
						? error.message
						: "Unable to delete travel requisition."
			);
		}
	};

	const loadSubmissionList = async () => {
		try {
			setSummaryLoading(true);
			setSummaryError(null);

			const response = await fetch(`${API_BASE_URL}/api/travel-requisitions`);
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to load travel requisitions.");
			}

			const items = Array.isArray(payload?.items) ? payload.items as SubmissionSummary[] : [];
			const normalizedDepartment = session?.department?.trim().toLowerCase() ?? "";
			const normalizedRole = session?.role?.trim().toLowerCase() ?? "";
			const normalizedUsername = session?.username?.trim().toLowerCase() ?? "";
			const normalizedEmployeeCode = session?.employee_code?.trim().toLowerCase() ?? "";
			const isHodRole = normalizedRole.includes("hod");
			const isAdminRole = normalizedRole.includes("admin");
			const isHrOrAdminApprover =
				(normalizedDepartment.includes("hr") && isHodRole) ||
				(normalizedDepartment.includes("admin") && (isHodRole || isAdminRole));
			const isFinanceApprover = normalizedDepartment.includes("finance") && isHodRole;
			const isAssignedApprovingAuthority = items.some(
				(item) =>
					item.approvalFlow?.financeHod?.selectedAuthorityUsername?.trim().toLowerCase() === normalizedUsername
			);
			const canViewAllSummaries = isHrOrAdminApprover || isFinanceApprover || isAssignedApprovingAuthority;

			setSubmissionList(
				canViewAllSummaries
					? items
					: items.filter((item) => item.employeeCode?.trim().toLowerCase() === normalizedEmployeeCode)
			);
		} catch (error) {
			setSummaryError(
				error instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: error instanceof Error
						? error.message
						: "Unable to load travel requisitions."
			);
		} finally {
			setSummaryLoading(false);
		}
	};

	const loadApprovedUsers = async () => {
		try {
			setApprovedUsersLoading(true);
			const response = await fetch(`${API_BASE_URL}/api/user-master/approved-users`);
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to load approving authority options.");
			}

			setApprovedUsers(Array.isArray(payload?.items) ? payload.items : []);
		} catch {
			setApprovedUsers([]);
		} finally {
			setApprovedUsersLoading(false);
		}
	};

	useEffect(() => {
		void loadSubmissionList();
		void loadApprovedUsers();
	}, []);

	const normalizedDepartment = session?.department?.trim().toLowerCase() ?? "";
	const normalizedRole = session?.role?.trim().toLowerCase() ?? "";
	const normalizedUsername = session?.username?.trim().toLowerCase() ?? "";
	const normalizedEmployeeCode = session?.employee_code?.trim().toLowerCase() ?? "";
	const isHodRole = normalizedRole.includes("hod");
	const isAdminRole = normalizedRole.includes("admin");
	const canHrApprove =
		(normalizedDepartment.includes("hr") && isHodRole) ||
		(normalizedDepartment.includes("admin") && (isHodRole || isAdminRole));
	const canFinanceApprove =
		normalizedDepartment.includes("finance") && isHodRole;
	const canApprovingAuthorityApprove =
		selectedSubmission?.approvalFlow?.financeHod?.selectedAuthorityUsername?.trim().toLowerCase() ===
		normalizedUsername;
	const isQueryRaised = (item: SubmissionSummary | null) =>
		Boolean(item && (item.status === "QUERY_RAISED" || item.status.endsWith("_QUERY")));
	const hasApprovalStarted = (item: SubmissionSummary) =>
		Boolean(
			!isQueryRaised(item) &&
			(
				item.approvalFlow?.hrHod?.approved ||
				(item.approvalFlow?.hrHod?.action && item.approvalFlow?.hrHod?.action !== "query") ||
				item.approvalFlow?.financeHod?.approved ||
				(item.approvalFlow?.financeHod?.action && item.approvalFlow?.financeHod?.action !== "query") ||
				item.approvalFlow?.approvingAuthority?.approved ||
				(item.approvalFlow?.approvingAuthority?.action && item.approvalFlow?.approvingAuthority?.action !== "query")
			)
		);
	const isInitiator = (item: SubmissionSummary | null) =>
		Boolean(item && item.employeeCode?.trim().toLowerCase() === normalizedEmployeeCode);
	const isSelectedSubmissionQueryRaised = isQueryRaised(selectedSubmission);
	const canCurrentUserEditForApproval =
		Boolean(selectedSubmission) &&
		!isSelectedSubmissionQueryRaised &&
		(
			(canHrApprove && !selectedSubmission?.approvalFlow?.hrHod?.approved) ||
			(canFinanceApprove && selectedSubmission?.approvalFlow?.hrHod?.approved && !selectedSubmission?.approvalFlow?.financeHod?.approved) ||
			(canApprovingAuthorityApprove && selectedSubmission?.approvalFlow?.financeHod?.approved && !selectedSubmission?.approvalFlow?.approvingAuthority?.approved)
		);

	const handleApproval = async (
		stage: "hrHod" | "financeHod" | "approvingAuthority",
		action: "approve" | "query"
	) => {
		if (!selectedSubmission || !session) return;
		const remarksValue =
			stage === "hrHod"
				? hrRemarks
				: stage === "financeHod"
					? financeRemarks
					: authorityRemarks;

		if (!remarksValue.trim()) {
			setApprovalError("Remarks are mandatory for both approval and raise query.");
			return;
		}

		const chosenAuthority = approvedUsers.find(
			(item) => item.username === selectedAuthorityUsername
		);

		try {
			setApprovalLoading(true);
			setApprovalError(null);

			const response = await fetch(
				`${API_BASE_URL}/api/travel-requisitions/${selectedSubmission.id}/approve`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						stage,
						action,
						actorUsername: session.username,
						actorName: session.employee_name,
						selectedAuthorityUsername:
							stage === "financeHod" && action === "approve" ? chosenAuthority?.username ?? "" : undefined,
						selectedAuthorityName:
							stage === "financeHod" && action === "approve" ? chosenAuthority?.employee_name ?? "" : undefined,
						remarks: remarksValue,
					}),
				}
			);

			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to record approval.");
			}

			if (payload?.item) {
				setSubmissionList((prev) =>
					prev.map((item) => (item.id === payload.item.id ? payload.item : item))
				);
				setSelectedSubmission(payload.item);
				hydrateFormFromSubmission(payload.item);
				setIsEditMode(false);
			}
		} catch (error) {
			setApprovalError(
				error instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: error instanceof Error
						? error.message
						: "Unable to record approval."
			);
		} finally {
			setApprovalLoading(false);
		}
	};

	const handleRowChange = (
		index: number,
		field: keyof ItineraryRow,
		value: string
	) => {
		setItineraryRows((prev) =>
			prev.map((row, rowIndex) =>
				rowIndex === index ? { ...row, [field]: value } : row
			)
		);
	};

	const handleAddRow = (index: number) => {
		setItineraryRows((prev) => {
			const next = [...prev];
			next.splice(index + 1, 0, createEmptyRow());
			return next;
		});
	};

	const handleDeleteRow = (index: number) => {
		setItineraryRows((prev) => {
			if (prev.length > 5) {
				return prev.filter((_, rowIndex) => rowIndex !== index);
			}
			return prev.map((row, rowIndex) =>
				rowIndex === index ? createEmptyRow() : row
			);
		});
	};

	const collectFormDetails = () => {
		return {
			travelTypeCategory,
			travelModes,
			hotelRequisition,
			hotelBudget,
			visaRequired,
			visaBudget,
			domesticEntitlement,
			domesticNoOfDays,
			domesticTotal,
			domesticSpecialApproval,
			domesticAmount,
			foreignEntitlement,
			foreignNoOfDays,
			foreignTotal,
			foreignSpecialApproval,
			foreignAmount,
			forexDenomination,
			totalForexRequired,
			reasonOfTravel,
			outputExpected,
			flightChanges,
		};
	};

	const handleSubmit: JSX.GenericEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();
		const isResubmittingQuery = Boolean(selectedSubmission && isEditMode && isQueryRaised(selectedSubmission));

		try {
			setSubmitLoading(true);
			setSubmitError(null);

			const payload = {
				employeeName,
				employeeCode,
				department,
				travelType,
				travelDate,
				budget,
				availed,
				itineraryRows,
				status: selectedSubmission?.status ?? "SUBMITTED",
				details: collectFormDetails(),
			};

			const isEditing = Boolean(selectedSubmission && isEditMode);
			const response = await fetch(
				isEditing
					? `${API_BASE_URL}/api/travel-requisitions/${selectedSubmission?.id}`
					: `${API_BASE_URL}/api/travel-requisitions`,
				{
				method: isEditing ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				}
			);

			const responsePayload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(responsePayload?.message ?? "Unable to submit travel requisition.");
			}

			if (responsePayload?.item) {
				setSubmissionList((prev) =>
					isEditing
						? prev.map((item) => (item.id === responsePayload.item.id ? responsePayload.item : item))
						: [responsePayload.item, ...prev]
				);
			}

			setOpen(false);
			resetForm();
		} catch (error) {
			setSubmitError(
				error instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: error instanceof Error
						? error.message
						: isResubmittingQuery
							? "Unable to resubmit travel requisition."
							: "Unable to submit travel requisition."
			);
		} finally {
			setSubmitLoading(false);
		}
	};

	return (
		<div className="dashboard-glass flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
			<Dialog
				open={open}
				onOpenChange={(nextOpen) => {
					setOpen(nextOpen);
					if (!nextOpen) {
						resetForm();
					}
				}}
			>
				<DialogContent
					className="!flex !h-[90vh] !max-h-[90vh] !max-w-[1200px] !flex-col !gap-0 overflow-hidden border-[rgba(30,64,175,0.16)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(235,243,251,0.98))] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.2)]"
					overlayClassName="bg-slate-900/55 backdrop-blur-[2px]"
				>
					<div className="flex h-full flex-col">
						<DialogHeader className="border-b border-[rgba(30,64,175,0.1)] bg-[linear-gradient(180deg,rgba(248,250,255,0.96),rgba(226,236,249,0.84))] px-6 py-6">
							<DialogTitle className="pt-3 text-2xl tracking-[-0.03em] text-[#17181d]">
								{selectedSubmission ? (isEditMode ? "Edit Travel Requisition" : "Travel Requisition Details") : "Travel Requisition Form"}
							</DialogTitle>
						</DialogHeader>

						<div className="min-h-0 flex-1 overflow-y-scroll p-4 md:p-6">
							<form key={formKey} className="space-y-5" onSubmit={handleSubmit}>
								<div className={sectionClass}>
									<p className={sectionTitleClass}>Employee Details</p>
									<div className="space-y-3">
										<Field label="Employee Name">
											<Input
												value={employeeName}
												className={readOnlyFieldSurfaceClass}
												disabled
											/>
										</Field>

										<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
											<Field label="Employee Code">
												<Input
													value={employeeCode}
													className={readOnlyFieldSurfaceClass}
													disabled
												/>
											</Field>
											<Field label="Department">
												<Input
													value={department}
													className={readOnlyFieldSurfaceClass}
													disabled
												/>
											</Field>
										</div>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Travel Summary</p>
									<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
										<Field label="Type">
											<Select value={travelType} onValueChange={setTravelType} name="travelType">
												<SelectTrigger className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
													<SelectValue placeholder="Select travel type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="personal">Personal</SelectItem>
													<SelectItem value="official">Official</SelectItem>
												</SelectContent>
											</Select>
										</Field>
										<Field label="Date">
											<Input
												type="date"
												value={travelDate}
												onInput={(e) => setTravelDate(e.currentTarget.value)}
												className={fieldSurfaceClass}
												disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
											/>
										</Field>
										<Field label="Budget">
											<Input
												value={budget}
												onInput={(e) => setBudget(e.currentTarget.value)}
												className={fieldSurfaceClass}
												disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
											/>
										</Field>
										<Field label="Availed">
											<Input
												value={availed}
												onInput={(e) => setAvailed(e.currentTarget.value)}
												className={fieldSurfaceClass}
												disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
											/>
										</Field>
									</div>
								</div>

									<div className={sectionClass}>
										<p className={sectionTitleClass}>Itinerary</p>
										<div className="overflow-x-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
											<table className="w-full min-w-[980px] border-collapse text-sm text-slate-800">
												<thead>
													<tr className="bg-slate-100 text-left text-slate-700">
														<th className="border border-slate-300 px-3 py-2.5 font-semibold">Date</th>
														<th className="border border-slate-300 px-3 py-2.5 font-semibold">Timings</th>
														<th className="border border-slate-300 px-3 py-2.5 font-semibold">Depart</th>
													<th className="border border-slate-300 px-3 py-2.5 font-semibold">Arrive</th>
													<th className="border border-slate-300 px-3 py-2.5 font-semibold">Remarks</th>
													<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold">Action</th>
												</tr>
												</thead>
												<tbody>
													{itineraryRows.map((row, rowIndex) => (
														<tr key={rowIndex} className="odd:bg-slate-50/40 even:bg-white/90 text-slate-800">
														<td className="border border-slate-200 p-1.5">
															<Input
																type="date"
																value={row.date}
																onInput={(e) =>
																	handleRowChange(rowIndex, "date", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.timings}
																onInput={(e) =>
																	handleRowChange(rowIndex, "timings", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.depart}
																onInput={(e) =>
																	handleRowChange(rowIndex, "depart", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.arrive}
																onInput={(e) =>
																	handleRowChange(rowIndex, "arrive", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.remarks}
																onInput={(e) =>
																	handleRowChange(rowIndex, "remarks", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<div className="flex items-center justify-center gap-1.5">
																<Button
																	type="button"
																	variant="outline"
																	size="icon"
																onClick={() => handleAddRow(rowIndex)}
																className="h-8 w-8 border-slate-300 bg-white"
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															>
																	<Plus className="h-4 w-4 text-slate-700" />
																</Button>
																{itineraryRows.length > 5 ? (
																	<Button
																		type="button"
																		variant="outline"
																		size="icon"
																		onClick={() => handleDeleteRow(rowIndex)}
																		className="h-8 w-8 border-slate-300 bg-white"
																		disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
																	>
																		<Trash2 className="h-4 w-4 text-rose-600" />
																	</Button>
																) : null}
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
									<div className={sectionClass}>
										<p className={sectionTitleClass}>Travel Type and Logistics</p>
										<div className="space-y-3">
											<div className="grid grid-cols-2 gap-3">
												<label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
													<input
														type="radio"
														name="travelTypeCategory"
														value="Domestic"
														checked={travelTypeCategory === "Domestic"}
														onChange={(e) => setTravelTypeCategory(e.currentTarget.value)}
														disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
													/>
													Domestic
												</label>
												<label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
													<input
														type="radio"
														name="travelTypeCategory"
														value="International"
														checked={travelTypeCategory === "International"}
														onChange={(e) => setTravelTypeCategory(e.currentTarget.value)}
														disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
													/>
													International
												</label>
											</div>

											<div className="grid grid-cols-3 gap-3">
												{["Air", "Train", "Road"].map((mode) => (
													<label
														key={mode}
														className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
													>
														<input
															type="checkbox"
															name="travelModes"
															value={mode}
															checked={travelModes.includes(mode)}
															onChange={(e) =>
																setTravelModes((prev) =>
																	e.currentTarget.checked
																		? [...prev, mode]
																		: prev.filter((item) => item !== mode)
																)
															}
															disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
														/>
														{mode}
													</label>
												))}
											</div>

											<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
												<Field label="Hotel Requisition (Y/N)">
													<Select value={hotelRequisition} onValueChange={setHotelRequisition} name="hotelRequisition">
														<SelectTrigger className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
															<SelectValue placeholder="Select" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="yes">Yes</SelectItem>
															<SelectItem value="no">No</SelectItem>
														</SelectContent>
													</Select>
												</Field>
												<Field label="Hotel Budget">
													<Input name="hotelBudget" value={hotelBudget} onInput={(e) => setHotelBudget(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
												</Field>
											</div>

											<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
												<Field label="Visa (Y/N)">
													<Select value={visaRequired} onValueChange={setVisaRequired} name="visaRequired">
														<SelectTrigger className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
															<SelectValue placeholder="Select" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="yes">Yes</SelectItem>
															<SelectItem value="no">No</SelectItem>
														</SelectContent>
													</Select>
												</Field>
												<Field label="Visa Budget">
													<Input name="visaBudget" value={visaBudget} onInput={(e) => setVisaBudget(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
												</Field>
											</div>
										</div>
									</div>

									<div className="space-y-5">
										<div className={sectionClass}>
											<p className={sectionTitleClass}>Imprest for Domestic Travel</p>
											<div className="grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-6">
													<Field label="Entitlement">
														<Input name="domesticEntitlement" value={domesticEntitlement} onInput={(e) => setDomesticEntitlement(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="No. of Days">
														<Input name="domesticNoOfDays" value={domesticNoOfDays} onInput={(e) => setDomesticNoOfDays(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="Total">
														<Input name="domesticTotal" value={domesticTotal} onInput={(e) => setDomesticTotal(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
											</div>
											<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-8">
													<Field label="Special Approval (if any)">
														<Input name="domesticSpecialApproval" value={domesticSpecialApproval} onInput={(e) => setDomesticSpecialApproval(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
												<div className="md:col-span-4">
													<Field label="Amount">
														<Input name="domesticAmount" value={domesticAmount} onInput={(e) => setDomesticAmount(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
											</div>
										</div>

										<div className={sectionClass}>
											<p className={sectionTitleClass}>Imprest for Foreign Travel</p>
											<div className="grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-6">
													<Field label="Entitlement">
														<Input name="foreignEntitlement" value={foreignEntitlement} onInput={(e) => setForeignEntitlement(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="No. of Days">
														<Input name="foreignNoOfDays" value={foreignNoOfDays} onInput={(e) => setForeignNoOfDays(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="Total">
														<Input name="foreignTotal" value={foreignTotal} onInput={(e) => setForeignTotal(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
											</div>

											<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-8">
													<Field label="Special Approval (if any)">
														<Input name="foreignSpecialApproval" value={foreignSpecialApproval} onInput={(e) => setForeignSpecialApproval(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
												<div className="md:col-span-4">
													<Field label="Amount">
														<Input name="foreignAmount" value={foreignAmount} onInput={(e) => setForeignAmount(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
											</div>

											<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-8">
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
														Denomination
													</label>
													<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
														{["Euro", "Dollar", "GBP", "OTHS"].map((currency) => (
															<label
															key={currency}
															className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
														>
															<input
																type="radio"
																name="forexDenomination"
																value={currency}
																checked={forexDenomination === currency}
																onChange={(e) => setForexDenomination(e.currentTarget.value)}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															/>
																{currency}
															</label>
														))}
													</div>
												</div>
												<div className="md:col-span-4">
													<Field label="Total Forex Required">
														<Input name="totalForexRequired" value={totalForexRequired} onInput={(e) => setTotalForexRequired(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
													</Field>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Travel Justification</p>
									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										<Field label="Reason of Travel">
											<AutoGrowTextarea name="reasonOfTravel" value={reasonOfTravel} onInput={(e) => setReasonOfTravel(e.currentTarget.value)} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Output Expected from the Travel">
											<AutoGrowTextarea name="outputExpected" value={outputExpected} onInput={(e) => setOutputExpected(e.currentTarget.value)} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
									</div>
									<div className="mt-4">
										<Field label="Flight Changes if Required, Please Mention">
											<AutoGrowTextarea name="flightChanges" value={flightChanges} onInput={(e) => setFlightChanges(e.currentTarget.value)} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
									</div>
								</div>

								{selectedSubmission && (
									<div className={sectionClass}>
										{selectedSubmission.approvalHistory.length > 0 ? (
											<div className="mb-5 rounded-xl border border-slate-200 bg-[rgba(248,250,252,0.95)] p-4">
												<p className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
													Approval History
												</p>
												<div className="space-y-3">
													{selectedSubmission.approvalHistory
														.slice()
														.map((entry, index) => (
															<div
																key={`${entry.cycle}-${entry.stage}-${entry.action}-${entry.actedAt}-${index}`}
																className="rounded-xl border border-slate-200 bg-white p-3"
															>
																<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
																	<div>
																		<p className="text-sm font-semibold text-slate-800">
																			{index + 1}. {getApprovalStageLabel(entry.stage)}
																		</p>
																		<p className="text-xs text-slate-500">
																			{entry.actorName || entry.actorUsername || "System"} on {formatDisplayDateTime(entry.actedAt)}
																		</p>
																		{entry.selectedAuthorityName ? (
																			<p className="text-xs text-slate-500">
																				Approving Authority: {entry.selectedAuthorityName}
																			</p>
																		) : null}
																		{entry.remarks ? (
																			<p className="mt-1 text-xs text-slate-500">
																				Remarks: {entry.remarks}
																			</p>
																		) : null}
																	</div>
																	<div className="flex items-center gap-3">
																		<span className={getHistoryBadgeClassName(entry.action)}>
																			{getApprovalActionLabel(entry.action)}
																		</span>
																	</div>
																</div>
															</div>
														))}
												</div>
											</div>
										) : null}
										<p className={sectionTitleClass}>Approval Sequence</p>
										<div className="space-y-4">
											<div className="rounded-xl border border-slate-200 bg-white p-4">
												<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
													<div>
														<p className="text-sm font-semibold text-slate-800">1. HR HOD / Admin HOD</p>
														<p className="text-xs text-slate-500">
															{selectedSubmission.approvalFlow.hrHod.action
																? `${selectedSubmission.approvalFlow.hrHod.action.toUpperCase()} by ${selectedSubmission.approvalFlow.hrHod.approvedByName || selectedSubmission.approvalFlow.hrHod.approvedByUsername} on ${formatDisplayDateTime(selectedSubmission.approvalFlow.hrHod.approvedAt)}`
																: "Pending approval"}
														</p>
														{selectedSubmission.approvalFlow.hrHod.remarks ? (
															<p className="mt-1 text-xs text-slate-500">
																Remarks: {selectedSubmission.approvalFlow.hrHod.remarks}
															</p>
														) : null}
													</div>
													<div className="flex items-center gap-3">
														<span className={getApprovalBadgeClassName(selectedSubmission.approvalFlow.hrHod)}>
															{getApprovalBadgeLabel(selectedSubmission.approvalFlow.hrHod)}
														</span>
													</div>
												</div>
												{!isSelectedSubmissionQueryRaised && !selectedSubmission.approvalFlow.hrHod.approved && canHrApprove ? (
													<div className="mt-4 space-y-3">
														<Textarea
															value={hrRemarks}
															onInput={(e) => setHrRemarks(e.currentTarget.value)}
															placeholder="Enter remarks for approval or query"
															className={approvalRemarksTextareaClass}
														/>
														<div className="flex gap-3">
															<Button
																type="button"
																onClick={() => {
																	setIsEditMode(true);
																	void handleApproval("hrHod", "approve");
																}}
																disabled={approvalLoading}
																className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
															>
																Approve
															</Button>
															<Button
																type="button"
																variant="outline"
																onClick={() => {
																	setIsEditMode(true);
																	void handleApproval("hrHod", "query");
																}}
																disabled={approvalLoading}
																className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]"
															>
																Raise Query
															</Button>
														</div>
													</div>
												) : null}
											</div>

											<div className="rounded-xl border border-slate-200 bg-white p-4">
												<div className="flex flex-col gap-3">
													<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
														<div>
															<p className="text-sm font-semibold text-slate-800">2. Finance HOD</p>
															<p className="text-xs text-slate-500">
																{selectedSubmission.approvalFlow.financeHod.action
																	? `${selectedSubmission.approvalFlow.financeHod.action.toUpperCase()} by ${selectedSubmission.approvalFlow.financeHod.approvedByName || selectedSubmission.approvalFlow.financeHod.approvedByUsername} on ${formatDisplayDateTime(selectedSubmission.approvalFlow.financeHod.approvedAt)}`
																	: "Pending approval"}
															</p>
															{selectedSubmission.approvalFlow.financeHod.remarks ? (
																<p className="mt-1 text-xs text-slate-500">
																	Remarks: {selectedSubmission.approvalFlow.financeHod.remarks}
																</p>
															) : null}
														</div>
														<span className={`${getApprovalBadgeClassName(selectedSubmission.approvalFlow.financeHod)} w-fit`}>
															{getApprovalBadgeLabel(selectedSubmission.approvalFlow.financeHod)}
														</span>
													</div>

													<div>
														<label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
															Approving Authority
														</label>
														<Select
															value={selectedAuthorityUsername}
															onValueChange={setSelectedAuthorityUsername}
															disabled={
																selectedSubmission.approvalFlow.financeHod.approved ||
																!canFinanceApprove
															}
														>
															<SelectTrigger className={fieldSurfaceClass}>
																<SelectValue
																	placeholder={
																		approvedUsersLoading
																			? "Loading users..."
																			: "Select approving authority"
																	}
																/>
															</SelectTrigger>
															<SelectContent>
																{approvedUsers.map((user) => (
																	<SelectItem key={user.id} value={user.username}>
																		{user.employee_name} ({user.department})
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													{!isSelectedSubmissionQueryRaised &&
													!selectedSubmission.approvalFlow.financeHod.approved &&
													canFinanceApprove &&
													selectedSubmission.approvalFlow.hrHod.approved ? (
														<div className="space-y-3">
															<Textarea
																value={financeRemarks}
																onInput={(e) => setFinanceRemarks(e.currentTarget.value)}
																placeholder="Enter remarks for approval or query"
																className={approvalRemarksTextareaClass}
															/>
															<div className="flex gap-3">
																<Button
																	type="button"
																	onClick={() => {
																		setIsEditMode(true);
																		void handleApproval("financeHod", "approve");
																	}}
																	disabled={approvalLoading || !selectedAuthorityUsername}
																	className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
																>
																	Approve
																</Button>
																<Button
																	type="button"
																	variant="outline"
																	onClick={() => {
																		setIsEditMode(true);
																		void handleApproval("financeHod", "query");
																	}}
																	disabled={approvalLoading}
																	className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]"
																>
																	Raise Query
																</Button>
															</div>
														</div>
													) : null}
												</div>
											</div>

											<div className="rounded-xl border border-slate-200 bg-white p-4">
												<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
													<div>
														<p className="text-sm font-semibold text-slate-800">3. Approving Authority</p>
														<p className="text-xs text-slate-500">
															{selectedSubmission.approvalFlow.financeHod.selectedAuthorityName
																? `Assigned to ${selectedSubmission.approvalFlow.financeHod.selectedAuthorityName}`
																: "Finance HOD will assign the approving authority"}
														</p>
														<p className="text-xs text-slate-500">
															{selectedSubmission.approvalFlow.approvingAuthority.action
																? `${selectedSubmission.approvalFlow.approvingAuthority.action.toUpperCase()} on ${formatDisplayDateTime(selectedSubmission.approvalFlow.approvingAuthority.approvedAt)}`
																: "Pending approval"}
														</p>
														{selectedSubmission.approvalFlow.approvingAuthority.remarks ? (
															<p className="mt-1 text-xs text-slate-500">
																Remarks: {selectedSubmission.approvalFlow.approvingAuthority.remarks}
															</p>
														) : null}
													</div>
													<div className="flex items-center gap-3">
														<span className={getApprovalBadgeClassName(selectedSubmission.approvalFlow.approvingAuthority)}>
															{getApprovalBadgeLabel(selectedSubmission.approvalFlow.approvingAuthority)}
														</span>
													</div>
												</div>
												{!isSelectedSubmissionQueryRaised &&
												!selectedSubmission.approvalFlow.approvingAuthority.action &&
												canApprovingAuthorityApprove &&
												selectedSubmission.approvalFlow.financeHod.approved ? (
													<div className="mt-3 space-y-3">
														<Textarea
															value={authorityRemarks}
															onInput={(e) => setAuthorityRemarks(e.currentTarget.value)}
															placeholder="Enter remarks for approval or query"
															className={approvalRemarksTextareaClass}
														/>
														<div className="flex gap-3">
															<Button
																type="button"
																onClick={() => {
																	setIsEditMode(true);
																	void handleApproval("approvingAuthority", "approve");
																}}
																disabled={approvalLoading}
																className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
															>
																Approve
															</Button>
															<Button
																type="button"
																variant="outline"
																onClick={() => {
																	setIsEditMode(true);
																	void handleApproval("approvingAuthority", "query");
																}}
																disabled={approvalLoading}
																className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]"
															>
																Raise Query
															</Button>
														</div>
													</div>
												) : null}
											</div>
										</div>
									</div>
								)}

								{approvalError && (
									<div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">
										{approvalError}
									</div>
								)}

								{submitError && (
									<div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">
										{submitError}
									</div>
								)}

								<div className="flex justify-end gap-3 border-t border-slate-300 pt-4">
									{(!selectedSubmission || isEditMode) ? (
										<Button
											type="submit"
											disabled={submitLoading}
											className="min-w-40 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white shadow-[0_10px_22px_rgba(29,78,216,0.28)] hover:opacity-95"
										>
											{submitLoading ? "Submitting..." : selectedSubmission ? (isQueryRaised(selectedSubmission) ? "Resubmit" : "Update") : "Submit"}
										</Button>
									) : null}
								</div>
							</form>
						</div>
					</div>
				</DialogContent>

				<div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5">
					<div className="mb-3 flex items-center justify-between">
						<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
							Travel Requisition Summary
						</p>
						<DialogTrigger asChild>
							<Button className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">
								New Travel Requisition
							</Button>
						</DialogTrigger>
					</div>
				{summaryError && (
					<div className="mb-3 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">
						{summaryError}
					</div>
				)}
				<div className="h-full overflow-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
					<table className="w-full min-w-[860px] border-collapse text-sm text-slate-800">
						<thead>
							<tr className="bg-slate-100 text-center text-slate-700">
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Travel Date</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Employee Name</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Emp Code</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Type</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Budget</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Availed</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Status</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Submitted At</th>
								<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{summaryLoading ? (
								<tr>
									<td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-500">
										Loading travel requisitions...
									</td>
								</tr>
							) : submissionList.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-500">
										No submissions yet. Click "New Travel Requisition" to add one.
									</td>
								</tr>
							) : (
								submissionList.map((item) => {
									const isActionLocked = hasApprovalStarted(item);
									const canInitiatorManageItem = isInitiator(item);

									return (
									<tr
										key={item.id}
										className="cursor-pointer odd:bg-slate-50/40 even:bg-white/90 text-slate-800 hover:bg-sky-50/70"
										onClick={() => openViewMode(item)}
									>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{formatDisplayDate(item.date)}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{item.employeeName}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{item.employeeCode}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{item.type}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{item.budget}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{item.availed}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">
											<span className={`${getSummaryStatusClassName(item.status)} justify-center`}>
												{getSummaryStatusLabel(item.status)}
											</span>
										</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center">{formatDisplayDateTime(item.createdAt)}</td>
										<td className="border border-slate-200 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
											<div className="flex items-center justify-center gap-2">
												<Button
													type="button"
													variant="outline"
													onClick={() => openEditMode(item)}
													disabled={isActionLocked || !canInitiatorManageItem}
													className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs text-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
												>
													Edit
												</Button>
												<Button
													type="button"
													variant="outline"
													onClick={() => void handleDelete(item.id)}
													disabled={isActionLocked || !canInitiatorManageItem}
													className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-3 text-xs text-[#b91c1c] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
												>
													Delete
												</Button>
											</div>
										</td>
									</tr>
									);
								})
							)}
							</tbody>
						</table>
					</div>
				</div>
			</Dialog>
		</div>
	);
}
