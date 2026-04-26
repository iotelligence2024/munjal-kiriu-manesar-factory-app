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

type TicketRow = {
	departureDate: string;
	fromPlace: string;
	departureTime: string;
	arrivalDate: string;
	toPlace: string;
	arrivalTime: string;
	mode: string;
	classTicketNo: string;
	amount: string;
};

type DailyExpenseRow = {
	date: string;
	roomRentLoading: string;
	roomTaxes: string;
	privateStayAllowance: string;
	dailyAllowance: string;
	incidentalExpenses: string;
	conveyance: string;
	privateConveyance: string;
	telephone: string;
	postageTelegram: string;
	miscExpense: string;
	total: string;
};

type ConveyanceRow = {
	date: string;
	from: string;
	to: string;
	mode: string;
	amount: string;
};

type HeadExpenseRow = {
	head: string;
	paidBy: string;
	drCr: string;
	code: string;
	amount: string;
};

const MIN_TICKET_ROWS = 6;
const MIN_CONVEYANCE_ROWS = 10;

type SubmissionSummary = {
	id: string;
	date: string;
	voucherNo: string;
	employeeName: string;
	employeeCode: string;
	grade: string;
	departmentBranch: string;
	designation: string;
	totalCostOfTour: string;
	advanceTakenFromCompany: string;
	expensesPaidByCompany: string;
	payableToFromCompany: string;
	status: string;
	approvalCycle: number;
	createdAt: string;
	approvalFlow: ApprovalFlow;
	approvalHistory: ApprovalHistoryEntry[];
	details: Record<string, unknown>;
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

const numberBelowTwenty = [
	"Zero",
	"One",
	"Two",
	"Three",
	"Four",
	"Five",
	"Six",
	"Seven",
	"Eight",
	"Nine",
	"Ten",
	"Eleven",
	"Twelve",
	"Thirteen",
	"Fourteen",
	"Fifteen",
	"Sixteen",
	"Seventeen",
	"Eighteen",
	"Nineteen",
];

const tensWords = [
	"",
	"",
	"Twenty",
	"Thirty",
	"Forty",
	"Fifty",
	"Sixty",
	"Seventy",
	"Eighty",
	"Ninety",
];

const convertBelowThousand = (value: number): string => {
	if (value === 0) return "";
	if (value < 20) return numberBelowTwenty[value];
	if (value < 100) {
		const tens = Math.floor(value / 10);
		const remainder = value % 10;
		return `${tensWords[tens]}${remainder ? ` ${numberBelowTwenty[remainder]}` : ""}`;
	}

	const hundreds = Math.floor(value / 100);
	const remainder = value % 100;
	return `${numberBelowTwenty[hundreds]} Hundred${remainder ? ` ${convertBelowThousand(remainder)}` : ""}`;
};

const convertNumberToWords = (value: number): string => {
	if (!Number.isFinite(value) || value <= 0) return "Zero Rupees Only";
	if (value === 0) return "Zero Rupees Only";

	const crore = Math.floor(value / 10000000);
	const lakh = Math.floor((value % 10000000) / 100000);
	const thousand = Math.floor((value % 100000) / 1000);
	const remainder = value % 1000;

	const parts = [
		crore ? `${convertBelowThousand(crore)} Crore` : "",
		lakh ? `${convertBelowThousand(lakh)} Lakh` : "",
		thousand ? `${convertBelowThousand(thousand)} Thousand` : "",
		remainder ? convertBelowThousand(remainder) : "",
	].filter(Boolean);

	return `${parts.join(" ").trim()} Rupees Only`;
};

const parseMoneyValue = (value: string) => Number(String(value ?? "").trim() || 0) || 0;
const combineDateAndTime = (date: string, time: string) => {
	if (!date || !time) return null;
	const combined = new Date(`${date}T${time}`);
	return Number.isNaN(combined.getTime()) ? null : combined;
};

const formatMoneyDisplay = (value: number) => {
	const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
	return safeValue.toFixed(2);
};

const normalizePaidByValue = (value: string) => value.trim().toLowerCase();

const getLegacyMoneyAmount = (value: unknown) => {
	if (typeof value === "object" && value !== null) {
		const record = value as Record<string, unknown>;
		if (typeof record.amount === "string") return record.amount;
		const rupees = String(record.rupees ?? "");
		const paise = String(record.paise ?? "");
		const combined = parseMoneyValue(rupees) + parseMoneyValue(paise) / 100;
		return rupees || paise ? formatMoneyDisplay(combined) : "";
	}
	return "";
};

const normalizeTicketRows = (rows: unknown): TicketRow[] =>
	Array.isArray(rows) && rows.length
		? rows.map((row) => {
			const record = (row ?? {}) as Record<string, unknown>;
			return {
				departureDate: String(record.departureDate ?? ""),
				fromPlace: String(record.fromPlace ?? ""),
				departureTime: String(record.departureTime ?? ""),
				arrivalDate: String(record.arrivalDate ?? ""),
				toPlace: String(record.toPlace ?? ""),
				arrivalTime: String(record.arrivalTime ?? ""),
				mode: String(record.mode ?? ""),
				classTicketNo: String(record.classTicketNo ?? ""),
				amount: getLegacyMoneyAmount(record),
			};
		})
		: Array.from({ length: MIN_TICKET_ROWS }, () => createTicketRow());

const normalizeDailyExpenseRows = (rows: unknown): DailyExpenseRow[] =>
	Array.isArray(rows) && rows.length
		? rows.map((row) => {
			const record = (row ?? {}) as Record<string, unknown>;
			return {
				date: String(record.date ?? ""),
				roomRentLoading: String(record.roomRentLoading ?? ""),
				roomTaxes: String(record.roomTaxes ?? ""),
				privateStayAllowance: String(record.privateStayAllowance ?? ""),
				dailyAllowance: String(record.dailyAllowance ?? ""),
				incidentalExpenses: String(record.incidentalExpenses ?? ""),
				conveyance: String(record.conveyance ?? ""),
				privateConveyance: String(record.privateConveyance ?? ""),
				telephone: String(record.telephone ?? ""),
				postageTelegram: String(record.postageTelegram ?? ""),
				miscExpense: String(record.miscExpense ?? ""),
				total: String(record.total ?? ""),
			};
		})
		: Array.from({ length: 8 }, () => createDailyExpenseRow());

const normalizeConveyanceRows = (rows: unknown): ConveyanceRow[] =>
	Array.isArray(rows) && rows.length
		? rows.map((row) => {
			const record = (row ?? {}) as Record<string, unknown>;
			return {
				date: String(record.date ?? ""),
				from: String(record.from ?? ""),
				to: String(record.to ?? ""),
				mode: String(record.mode ?? ""),
				amount: getLegacyMoneyAmount(record),
			};
		})
		: Array.from({ length: MIN_CONVEYANCE_ROWS }, () => createConveyanceRow());

const normalizeHeadExpenseRows = (rows: unknown): HeadExpenseRow[] =>
	Array.isArray(rows) && rows.length
		? rows.map((row, index) => {
			const record = (row ?? {}) as Record<string, unknown>;
			const fallback = defaultHeadExpenseRows()[index] ?? { head: "", paidBy: "", drCr: "", code: "", amount: "" };
			return {
				head: String(record.head ?? fallback.head),
				paidBy: String(record.paidBy ?? fallback.paidBy),
				drCr: String(record.drCr ?? fallback.drCr),
				code: String(record.code ?? fallback.code),
				amount: getLegacyMoneyAmount(record),
			};
		})
		: defaultHeadExpenseRows();

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
	if (status === "APPROVED") return getApprovalBadgeClassName({ approved: true, queried: false, action: "", approvedByUsername: "", approvedByName: "", approvedAt: "", remarks: "" });
	if (status === "QUERY_RAISED" || status.endsWith("_QUERY")) return getApprovalBadgeClassName({ approved: false, queried: true, action: "query", approvedByUsername: "", approvedByName: "", approvedAt: "", remarks: "" });
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

const sectionClass =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";
const sectionTitleClass =
	"mb-4 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700";
const fieldShellClass =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";
const fieldSurfaceClass =
	"h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none";
const textareaSurfaceClass =
	"!h-auto min-h-[7rem] resize-none !rounded-none !border-0 !bg-transparent px-0 py-3 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none";
const inlineTextareaShellClass = `${fieldShellClass} py-0`;
const inlineTextareaClass = `${textareaSurfaceClass} min-h-[9rem]`;

type FieldProps = {
	label: string;
	children: JSX.Element;
};

const Field = ({ label, children }: FieldProps) => (
	<div>
		<label className="mb-2 block text-sm font-medium text-[#4d5560]">{label}</label>
		<div className={fieldShellClass}>{children}</div>
	</div>
);

const createTicketRow = (): TicketRow => ({
	departureDate: "",
	fromPlace: "",
	departureTime: "",
	arrivalDate: "",
	toPlace: "",
	arrivalTime: "",
	mode: "",
	classTicketNo: "",
	amount: "",
});

const createDailyExpenseRow = (): DailyExpenseRow => ({
	date: "",
	roomRentLoading: "",
	roomTaxes: "",
	privateStayAllowance: "",
	dailyAllowance: "",
	incidentalExpenses: "",
	conveyance: "",
	privateConveyance: "",
	telephone: "",
	postageTelegram: "",
	miscExpense: "",
	total: "",
});

const createConveyanceRow = (): ConveyanceRow => ({
	date: "",
	from: "",
	to: "",
	mode: "",
	amount: "",
});

const defaultHeadExpenseRows = (): HeadExpenseRow[] => ([
	{ head: "Cost of Tickets", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Conveyance", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Daily Allowance (Boarding)", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Lodging", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Pvt. Stay Allowance (Lodging)", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Incidental Expense", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Telephones", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Postage & Telegram", paidBy: "", drCr: "", code: "", amount: "" },
	{ head: "Others", paidBy: "", drCr: "", code: "", amount: "" },
]);

export default function TravelExpenseStatementPage() {
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
	const [grade, setGrade] = useState("");
	const [departmentBranch, setDepartmentBranch] = useState(session?.department ?? "");
	const [designation, setDesignation] = useState(session?.role ?? "");
	const [expenseDate, setExpenseDate] = useState("");
	const [voucherNo, setVoucherNo] = useState("");
	const [departureDate, setDepartureDate] = useState("");
	const [departureTime, setDepartureTime] = useState("");
	const [arrivalDate, setArrivalDate] = useState("");
	const [arrivalTime, setArrivalTime] = useState("");
	const [durationDays, setDurationDays] = useState("");
	const [durationHours, setDurationHours] = useState("");
	const [productDeptCode, setProductDeptCode] = useState("");
	const [deptCodeChargeable, setDeptCodeChargeable] = useState("");
	const [townsTravelled, setTownsTravelled] = useState("");
	const [businessAttended, setBusinessAttended] = useState("");
	const [advanceTakenFromCompany, setAdvanceTakenFromCompany] = useState("");
	const [amountInWords, setAmountInWords] = useState("");
	const [selectedAuthorityUsername, setSelectedAuthorityUsername] = useState("");

	const [headExpenseRows, setHeadExpenseRows] = useState<HeadExpenseRow[]>(defaultHeadExpenseRows());
	const [ticketRows, setTicketRows] = useState<TicketRow[]>(Array.from({ length: MIN_TICKET_ROWS }, () => createTicketRow()));
	const [dailyExpenseRows, setDailyExpenseRows] = useState<DailyExpenseRow[]>(Array.from({ length: 8 }, () => createDailyExpenseRow()));
	const [conveyanceRows, setConveyanceRows] = useState<ConveyanceRow[]>(Array.from({ length: MIN_CONVEYANCE_ROWS }, () => createConveyanceRow()));

	const ticketExpenseTotal = ticketRows.reduce((sum, row) => sum + parseMoneyValue(row.amount), 0);
	const conveyanceTravelTotal = conveyanceRows.reduce((sum, row) => sum + parseMoneyValue(row.amount), 0);
	const dailyExpenseBreakdown = dailyExpenseRows.reduce(
		(accumulator, row) => {
			accumulator.lodging += Number(row.roomRentLoading || 0) || 0;
			accumulator.roomTaxes += Number(row.roomTaxes || 0) || 0;
			accumulator.privateStayAllowance += Number(row.privateStayAllowance || 0) || 0;
			accumulator.dailyAllowance += Number(row.dailyAllowance || 0) || 0;
			accumulator.incidentalExpenses += Number(row.incidentalExpenses || 0) || 0;
			accumulator.conveyance += Number(row.conveyance || 0) || 0;
			accumulator.privateConveyance += Number(row.privateConveyance || 0) || 0;
			accumulator.telephone += Number(row.telephone || 0) || 0;
			accumulator.postageTelegram += Number(row.postageTelegram || 0) || 0;
			accumulator.miscExpense += Number(row.miscExpense || 0) || 0;
			return accumulator;
		},
		{
			lodging: 0,
			roomTaxes: 0,
			privateStayAllowance: 0,
			dailyAllowance: 0,
			incidentalExpenses: 0,
			conveyance: 0,
			privateConveyance: 0,
			telephone: 0,
			postageTelegram: 0,
			miscExpense: 0,
		}
	);
	const totalCostOfTourValue =
		ticketExpenseTotal +
		conveyanceTravelTotal +
		dailyExpenseBreakdown.lodging +
		dailyExpenseBreakdown.roomTaxes +
		dailyExpenseBreakdown.privateStayAllowance +
		dailyExpenseBreakdown.dailyAllowance +
		dailyExpenseBreakdown.incidentalExpenses +
		dailyExpenseBreakdown.conveyance +
		dailyExpenseBreakdown.privateConveyance +
		dailyExpenseBreakdown.telephone +
		dailyExpenseBreakdown.postageTelegram +
		dailyExpenseBreakdown.miscExpense;
	const totalCostOfTour = totalCostOfTourValue.toFixed(2);
	const expensesPaidByCompanyValue = headExpenseRows.reduce((sum, row) => {
		if (normalizePaidByValue(row.paidBy) !== "paid by company") return sum;
		return sum + parseMoneyValue(row.amount);
	}, 0);
	const payableFromCompanyValue = headExpenseRows.reduce((sum, row) => {
		if (normalizePaidByValue(row.paidBy) !== "paid by self") return sum;
		return sum + parseMoneyValue(row.amount);
	}, 0);
	const expensesPaidByCompanyDisplay = formatMoneyDisplay(expensesPaidByCompanyValue);
	const payableFromCompanyDisplay = formatMoneyDisplay(payableFromCompanyValue);
	const hasTravelWindow = Boolean(departureDate && departureTime && arrivalDate && arrivalTime);
	const isTravelWindowInvalid =
		hasTravelWindow &&
		Boolean(combineDateAndTime(departureDate, departureTime) && combineDateAndTime(arrivalDate, arrivalTime)) &&
		(combineDateAndTime(arrivalDate, arrivalTime)?.getTime() ?? 0) < (combineDateAndTime(departureDate, departureTime)?.getTime() ?? 0);

	useEffect(() => {
		const computedHeadAmounts = new Map<string, string>([
			["Cost of Tickets", formatMoneyDisplay(ticketExpenseTotal)],
			["Conveyance", formatMoneyDisplay(conveyanceTravelTotal + dailyExpenseBreakdown.conveyance + dailyExpenseBreakdown.privateConveyance)],
			["Daily Allowance (Boarding)", formatMoneyDisplay(dailyExpenseBreakdown.dailyAllowance)],
			["Lodging", formatMoneyDisplay(dailyExpenseBreakdown.lodging + dailyExpenseBreakdown.roomTaxes)],
			["Pvt. Stay Allowance (Lodging)", formatMoneyDisplay(dailyExpenseBreakdown.privateStayAllowance)],
			["Incidental Expense", formatMoneyDisplay(dailyExpenseBreakdown.incidentalExpenses)],
			["Telephones", formatMoneyDisplay(dailyExpenseBreakdown.telephone)],
			["Postage & Telegram", formatMoneyDisplay(dailyExpenseBreakdown.postageTelegram)],
			["Others", formatMoneyDisplay(dailyExpenseBreakdown.miscExpense)],
		]);

		setHeadExpenseRows((previousRows) => {
			let changed = false;
			const nextRows = previousRows.map((row) => {
				const computed = computedHeadAmounts.get(row.head);
				if (!computed) return row;
				if (row.amount === computed) return row;
				changed = true;
				return {
					...row,
					amount: computed,
				};
			});

			return changed ? nextRows : previousRows;
		});
	}, [ticketExpenseTotal, conveyanceTravelTotal, dailyExpenseBreakdown]);

	useEffect(() => {
		setAmountInWords(convertNumberToWords(Number(totalCostOfTour || 0)));
	}, [totalCostOfTour]);

	useEffect(() => {
		const start = combineDateAndTime(departureDate, departureTime);
		const end = combineDateAndTime(arrivalDate, arrivalTime);
		if (!start || !end || end.getTime() < start.getTime()) {
			setDurationDays("");
			setDurationHours("");
			return;
		}

		const diffMs = end.getTime() - start.getTime();
		const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
		const days = Math.floor(totalHours / 24);
		const hours = totalHours % 24;

		setDurationDays(String(days));
		setDurationHours(String(hours));
	}, [departureDate, departureTime, arrivalDate, arrivalTime]);

	useEffect(() => {
		setDailyExpenseRows((previousRows) => {
			let changed = false;
			const nextRows = previousRows.map((row) => {
				const computedTotal = formatMoneyDisplay(
					parseMoneyValue(row.roomRentLoading) +
					parseMoneyValue(row.roomTaxes) +
					parseMoneyValue(row.privateStayAllowance) +
					parseMoneyValue(row.dailyAllowance) +
					parseMoneyValue(row.incidentalExpenses) +
					parseMoneyValue(row.conveyance) +
					parseMoneyValue(row.privateConveyance) +
					parseMoneyValue(row.telephone) +
					parseMoneyValue(row.postageTelegram) +
					parseMoneyValue(row.miscExpense)
				);

				if (row.total === computedTotal) return row;
				changed = true;
				return { ...row, total: computedTotal };
			});

			return changed ? nextRows : previousRows;
		});
	}, [dailyExpenseRows]);

	const resetForm = () => {
		setEmployeeName(session?.employee_name ?? "");
		setEmployeeCode(session?.employee_code ?? "");
		setGrade("");
		setDepartmentBranch(session?.department ?? "");
		setDesignation(session?.role ?? "");
		setExpenseDate("");
		setVoucherNo("");
		setDepartureDate("");
		setDepartureTime("");
		setArrivalDate("");
		setArrivalTime("");
		setDurationDays("");
		setDurationHours("");
		setProductDeptCode("");
		setDeptCodeChargeable("");
		setTownsTravelled("");
		setBusinessAttended("");
		setAdvanceTakenFromCompany("");
		setAmountInWords("");
		setSelectedAuthorityUsername("");
		setHrRemarks("");
		setFinanceRemarks("");
		setAuthorityRemarks("");
		setHeadExpenseRows(defaultHeadExpenseRows());
		setTicketRows(Array.from({ length: MIN_TICKET_ROWS }, () => createTicketRow()));
		setDailyExpenseRows(Array.from({ length: 8 }, () => createDailyExpenseRow()));
		setConveyanceRows(Array.from({ length: MIN_CONVEYANCE_ROWS }, () => createConveyanceRow()));
		setSubmitError(null);
		setApprovalError(null);
		setSelectedSubmission(null);
		setIsEditMode(false);
		setFormKey((prev) => prev + 1);
	};

	useEffect(() => {
		setEmployeeName(session?.employee_name ?? "");
		setEmployeeCode(session?.employee_code ?? "");
		setDepartmentBranch(session?.department ?? "");
		setDesignation(session?.role ?? "");
	}, [session]);

	const hydrateFormFromSubmission = (item: SubmissionSummary) => {
		const details = item.details ?? {};
		setEmployeeName(item.employeeName === "-" ? "" : item.employeeName);
		setEmployeeCode(item.employeeCode === "-" ? "" : item.employeeCode);
		setGrade(item.grade === "-" ? "" : item.grade);
		setDepartmentBranch(item.departmentBranch === "-" ? "" : item.departmentBranch);
		setDesignation(item.designation === "-" ? "" : item.designation);
		setExpenseDate(item.date === "-" ? "" : item.date);
		setVoucherNo(item.voucherNo === "-" ? "" : item.voucherNo);
		setAdvanceTakenFromCompany(item.advanceTakenFromCompany === "-" ? "" : item.advanceTakenFromCompany);
		setDepartureDate(String(details.departureDate ?? ""));
		setDepartureTime(String(details.departureTime ?? ""));
		setArrivalDate(String(details.arrivalDate ?? ""));
		setArrivalTime(String(details.arrivalTime ?? ""));
		setDurationDays(String(details.durationDays ?? ""));
		setDurationHours(String(details.durationHours ?? ""));
		setProductDeptCode(String(details.productDeptCode ?? ""));
		setDeptCodeChargeable(String(details.deptCodeChargeable ?? ""));
		setTownsTravelled(String(details.townsTravelled ?? ""));
		setBusinessAttended(String(details.businessAttended ?? ""));
		setAmountInWords(
			String(details.amountInWords ?? "").trim() || convertNumberToWords(Number(item.totalCostOfTour || 0))
		);
		setSelectedAuthorityUsername(item.approvalFlow?.financeHod?.selectedAuthorityUsername ?? "");
		setHrRemarks(item.approvalFlow?.hrHod?.remarks ?? "");
		setFinanceRemarks(item.approvalFlow?.financeHod?.remarks ?? "");
		setAuthorityRemarks(item.approvalFlow?.approvingAuthority?.remarks ?? "");
		setHeadExpenseRows(normalizeHeadExpenseRows(details.headExpenseRows));
		setTicketRows(normalizeTicketRows(details.ticketRows));
		setDailyExpenseRows(normalizeDailyExpenseRows(details.dailyExpenseRows));
		setConveyanceRows(normalizeConveyanceRows(details.conveyanceRows));
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

	const loadSubmissionList = async () => {
		try {
			setSummaryLoading(true);
			setSummaryError(null);

			const response = await fetch(`${API_BASE_URL}/api/travel-expense-statements`);
			const payload = await response.json().catch(() => null);

			if (!response.ok) throw new Error(payload?.message ?? "Unable to load travel expense statements.");

			setSubmissionList(Array.isArray(payload?.items) ? payload.items : []);
		} catch (error) {
			setSummaryError(
				error instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: error instanceof Error
						? error.message
						: "Unable to load travel expense statements."
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
			if (!response.ok) throw new Error(payload?.message ?? "Unable to load approving authority options.");
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
	const canFinanceApprove = normalizedDepartment.includes("finance") && isHodRole;
	const canApprovingAuthorityApprove =
		selectedSubmission?.approvalFlow?.financeHod?.selectedAuthorityUsername?.trim().toLowerCase() === normalizedUsername;
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

	const handleDelete = async (id: string) => {
		const confirmed = window.confirm("Delete this travel expense statement?");
		if (!confirmed) return;

		try {
			setSummaryError(null);
			const response = await fetch(`${API_BASE_URL}/api/travel-expense-statements/${id}`, {
				method: "DELETE",
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok) throw new Error(payload?.message ?? "Unable to delete travel expense statement.");
			setSubmissionList((prev) => prev.filter((item) => item.id !== id));
		} catch (error) {
			setSummaryError(
				error instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: error instanceof Error
						? error.message
						: "Unable to delete travel expense statement."
			);
		}
	};

	const handleApproval = async (
		stage: "hrHod" | "financeHod" | "approvingAuthority",
		action: "approve" | "query"
	) => {
		if (!selectedSubmission || !session) return;

		const remarksValue =
			stage === "hrHod" ? hrRemarks : stage === "financeHod" ? financeRemarks : authorityRemarks;

		if (!remarksValue.trim()) {
			setApprovalError("Remarks are mandatory for both approval and raise query.");
			return;
		}

		const chosenAuthority = approvedUsers.find((item) => item.username === selectedAuthorityUsername);

		try {
			setApprovalLoading(true);
			setApprovalError(null);

			const response = await fetch(`${API_BASE_URL}/api/travel-expense-statements/${selectedSubmission.id}/approve`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					stage,
					action,
					actorUsername: session.username,
					actorName: session.employee_name,
					selectedAuthorityUsername,
					selectedAuthorityName: chosenAuthority?.employee_name ?? "",
					remarks: remarksValue,
				}),
			});

			const payload = await response.json().catch(() => null);
			if (!response.ok) throw new Error(payload?.message ?? "Unable to record approval.");

			const updatedItem = payload?.item as SubmissionSummary | undefined;
			if (updatedItem) {
				setSubmissionList((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
				setSelectedSubmission(updatedItem);
				hydrateFormFromSubmission(updatedItem);
			}
		} catch (error) {
			setApprovalError(error instanceof Error ? error.message : "Unable to record approval.");
		} finally {
			setApprovalLoading(false);
		}
	};

	const updateRow = <T,>(setter: (value: T[]) => void, rows: T[], index: number, key: keyof T, value: string) => {
		setter(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
	};

	const handleAddTicketRow = (index: number) => {
		setTicketRows((previousRows) => {
			const nextRows = [...previousRows];
			nextRows.splice(index + 1, 0, createTicketRow());
			return nextRows;
		});
	};

	const handleDeleteTicketRow = (index: number) => {
		setTicketRows((previousRows) => {
			if (previousRows.length > MIN_TICKET_ROWS) {
				return previousRows.filter((_, rowIndex) => rowIndex !== index);
			}
			return previousRows.map((row, rowIndex) => (rowIndex === index ? createTicketRow() : row));
		});
	};

	const handleAddConveyanceRow = (index: number) => {
		setConveyanceRows((previousRows) => {
			const nextRows = [...previousRows];
			nextRows.splice(index + 1, 0, createConveyanceRow());
			return nextRows;
		});
	};

	const handleDeleteConveyanceRow = (index: number) => {
		setConveyanceRows((previousRows) => {
			if (previousRows.length > MIN_CONVEYANCE_ROWS) {
				return previousRows.filter((_, rowIndex) => rowIndex !== index);
			}
			return previousRows.map((row, rowIndex) => (rowIndex === index ? createConveyanceRow() : row));
		});
	};

	const handleSubmit: JSX.GenericEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();

		if (!employeeName.trim() || !employeeCode.trim()) {
			setSubmitError("Employee name and employee code are required.");
			return;
		}

		const hasAnyTicketValue = ticketRows.some((row) =>
			[
				row.departureDate,
				row.fromPlace,
				row.departureTime,
				row.arrivalDate,
				row.toPlace,
				row.arrivalTime,
				row.mode,
				row.classTicketNo,
				row.amount,
			].some((value) => value.trim())
		);
		const hasAnyDailyExpenseValue = dailyExpenseRows.some((row) =>
			[
				row.date,
				row.roomRentLoading,
				row.roomTaxes,
				row.privateStayAllowance,
				row.dailyAllowance,
				row.incidentalExpenses,
				row.conveyance,
				row.privateConveyance,
				row.telephone,
				row.postageTelegram,
				row.miscExpense,
			].some((value) => value.trim())
		);
		const hasAnyConveyanceValue = conveyanceRows.some((row) =>
			[row.date, row.from, row.to, row.mode, row.amount].some((value) => value.trim())
		);

		if ((hasAnyTicketValue || hasAnyDailyExpenseValue || hasAnyConveyanceValue) && !hasTravelWindow) {
			setSubmitError("Fill Departure Date/Time and Arrival Date/Time before entering table details.");
			return;
		}
		if (isTravelWindowInvalid) {
			setSubmitError("Arrival Date/Time must be after Departure Date/Time.");
			return;
		}

		const invalidTicketRowIndex = ticketRows.findIndex((row) =>
			row.amount.trim() &&
			[
				row.departureDate,
				row.fromPlace,
				row.departureTime,
				row.arrivalDate,
				row.toPlace,
				row.arrivalTime,
				row.mode,
				row.classTicketNo,
			].some((value) => !value.trim())
		);

		if (invalidTicketRowIndex >= 0) {
			setSubmitError(`Complete all fields in Cost Of Tickets row ${invalidTicketRowIndex + 1} when an amount is entered.`);
			return;
		}

		const invalidConveyanceRowIndex = conveyanceRows.findIndex((row) =>
			row.amount.trim() &&
			[row.date, row.from, row.to, row.mode].some((value) => !value.trim())
		);

		if (invalidConveyanceRowIndex >= 0) {
			setSubmitError(`Complete all fields in Conveyance row ${invalidConveyanceRowIndex + 1} when an amount is entered.`);
			return;
		}

		const invalidDailyExpenseRowIndex = dailyExpenseRows.findIndex((row) =>
			[
				row.roomRentLoading,
				row.roomTaxes,
				row.privateStayAllowance,
				row.dailyAllowance,
				row.incidentalExpenses,
				row.conveyance,
				row.privateConveyance,
				row.telephone,
				row.postageTelegram,
				row.miscExpense,
			].some((value) => value.trim()) && !row.date.trim()
		);

		if (invalidDailyExpenseRowIndex >= 0) {
			setSubmitError(`Date is mandatory in Expense Details row ${invalidDailyExpenseRowIndex + 1} when any expense is entered.`);
			return;
		}

		const hasDateOutsideTourRange = (dateValue: string) =>
			Boolean(dateValue && (dateValue < departureDate || dateValue > arrivalDate));

		const ticketRangeErrorIndex = ticketRows.findIndex((row) =>
			row.amount.trim() && (hasDateOutsideTourRange(row.departureDate) || hasDateOutsideTourRange(row.arrivalDate))
		);
		if (ticketRangeErrorIndex >= 0) {
			setSubmitError(`Cost Of Tickets row ${ticketRangeErrorIndex + 1} dates must be between Departure and Arrival dates.`);
			return;
		}

		const dailyRangeErrorIndex = dailyExpenseRows.findIndex((row) =>
			row.date.trim() && hasDateOutsideTourRange(row.date)
		);
		if (dailyRangeErrorIndex >= 0) {
			setSubmitError(`Expense Details row ${dailyRangeErrorIndex + 1} date must be between Departure and Arrival dates.`);
			return;
		}

		const conveyanceRangeErrorIndex = conveyanceRows.findIndex((row) =>
			row.date.trim() && hasDateOutsideTourRange(row.date)
		);
		if (conveyanceRangeErrorIndex >= 0) {
			setSubmitError(`Conveyance row ${conveyanceRangeErrorIndex + 1} date must be between Departure and Arrival dates.`);
			return;
		}

		const invalidHeadExpenseRowIndex = headExpenseRows.findIndex((row) =>
			parseMoneyValue(row.amount) > 0 && !row.paidBy.trim()
		);

		if (invalidHeadExpenseRowIndex >= 0) {
			setSubmitError(`Paid by Co/Self is mandatory in Particulars row ${invalidHeadExpenseRowIndex + 1} when amount is greater than zero.`);
			return;
		}

		const payload = {
			employeeName: employeeName.trim(),
			employeeCode: employeeCode.trim().toUpperCase(),
			grade: grade.trim(),
			departmentBranch: departmentBranch.trim(),
			designation: designation.trim(),
			expenseDate: expenseDate.trim(),
			voucherNo: voucherNo.trim(),
			totalCostOfTour,
			advanceTakenFromCompany: advanceTakenFromCompany.trim(),
			expensesPaidByCompany: expensesPaidByCompanyDisplay,
			payableToFromCompany: payableFromCompanyDisplay,
			status:
				selectedSubmission && isQueryRaised(selectedSubmission)
					? "SUBMITTED"
					: selectedSubmission?.status ?? "SUBMITTED",
			details: {
				departureDate,
				departureTime,
				arrivalDate,
				arrivalTime,
				durationDays,
				durationHours,
				productDeptCode,
				deptCodeChargeable,
				townsTravelled,
				businessAttended,
				amountInWords,
				headExpenseRows,
				ticketRows,
				dailyExpenseRows,
				conveyanceRows,
			},
		};

		try {
			setSubmitLoading(true);
			setSubmitError(null);

			const response = await fetch(
				selectedSubmission && isEditMode
					? `${API_BASE_URL}/api/travel-expense-statements/${selectedSubmission.id}`
					: `${API_BASE_URL}/api/travel-expense-statements`,
				{
					method: selectedSubmission && isEditMode ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			const responsePayload = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					responsePayload?.message ??
						(selectedSubmission ? "Unable to resubmit travel expense statement." : "Unable to submit travel expense statement.")
				);
			}

			const savedItem = responsePayload?.item as SubmissionSummary | undefined;
			if (savedItem) {
				setSubmissionList((prev) => {
					const existingIndex = prev.findIndex((item) => item.id === savedItem.id);
					if (existingIndex >= 0) {
						return prev.map((item) => (item.id === savedItem.id ? savedItem : item));
					}
					return [savedItem, ...prev];
				});
			}

			resetForm();
			setOpen(false);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : "Unable to submit travel expense statement.");
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
					if (!nextOpen) resetForm();
				}}
			>
				<DialogContent className="max-h-[92vh] max-w-[92vw] overflow-hidden rounded-[1.5rem] border border-[rgba(59,130,246,0.15)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.98))] p-0 shadow-[0_24px_48px_rgba(15,23,42,0.18)] xl:max-w-[1400px]">
					<div className="flex max-h-[92vh] flex-col overflow-hidden">
						<DialogHeader className="border-b border-slate-200 px-5 py-4">
							<DialogTitle className="font-headline text-base font-semibold uppercase tracking-[0.14em] text-slate-800">
								{selectedSubmission ? (isEditMode ? "Edit Travel Expense Statement" : "View Travel Expense Statement") : "New Travel Expense Statement"}
							</DialogTitle>
						</DialogHeader>

						<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5" key={formKey}>
							<form className="space-y-5" onSubmit={handleSubmit}>
								<div className={sectionClass}>
									<p className={sectionTitleClass}>Travel Expense Statement</p>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
										<Field label="Name">
											<Input value={employeeName} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Grade">
											<Input value={grade} onInput={(e) => setGrade(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Deptt/Branch">
											<Input value={departmentBranch} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Emp. Code">
											<Input value={employeeCode} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Designation">
											<Input value={designation} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Date">
											<Input type="date" value={expenseDate} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Voucher No.">
											<Input value={voucherNo} placeholder="Auto-generated on first save" className={fieldSurfaceClass} disabled />
										</Field>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Travel Details</p>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
										<Field label="Departure Date">
											<Input type="date" value={departureDate} onInput={(e) => setDepartureDate(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Departure Time">
											<Input type="time" value={departureTime} onInput={(e) => setDepartureTime(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Arrival Date">
											<Input type="date" value={arrivalDate} onInput={(e) => setArrivalDate(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Arrival Time">
											<Input type="time" value={arrivalTime} onInput={(e) => setArrivalTime(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Duration Days">
											<Input value={durationDays} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Duration Hrs">
											<Input value={durationHours} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Product/Deptt. Code">
											<Input value={productDeptCode} onInput={(e) => setProductDeptCode(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Deptt. Code Chargeable">
											<Input value={deptCodeChargeable} onInput={(e) => setDeptCodeChargeable(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
									</div>
									<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
										<div>
											<label className="mb-2 block text-sm font-medium text-[#4d5560]">Towns Travelled</label>
											<div className={inlineTextareaShellClass}>
												<Textarea value={townsTravelled} onInput={(e) => setTownsTravelled(e.currentTarget.value)} className={inlineTextareaClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
											</div>
										</div>
										<div>
											<label className="mb-2 block text-sm font-medium text-[#4d5560]">Business Attended</label>
											<div className={inlineTextareaShellClass}>
												<Textarea value={businessAttended} onInput={(e) => setBusinessAttended(e.currentTarget.value)} className={inlineTextareaClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
											</div>
										</div>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Cost Of Tickets</p>
									{!hasTravelWindow ? <p className="mb-2 text-xs font-medium text-amber-700">Fill Departure Date/Time and Arrival Date/Time to enable this table.</p> : null}
									<div className="overflow-auto rounded-xl border border-slate-300 bg-white">
										<table className="w-full min-w-[1200px] border-collapse text-sm">
											<thead>
												<tr className="bg-slate-100 text-slate-700">
													{["Departure Date", "From Place", "Dep. Time", "Arrival Date", "To Place", "Arr. Time", "Mode", "Class/Ticket No.", "Amount", "Actions"].map((label) => (
														<th key={label} className="border border-slate-300 px-3 py-2 text-left font-semibold">{label}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{ticketRows.map((row, index) => {
													const isRowRequired = Boolean(row.amount.trim());
													return (
													<tr key={`ticket-${index}`}>
														<td className="border border-slate-300 px-2 py-1"><Input type="date" min={departureDate || undefined} max={arrivalDate || undefined} required={isRowRequired} value={row.departureDate} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "departureDate", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input required={isRowRequired} value={row.fromPlace} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "fromPlace", e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input type="time" required={isRowRequired} value={row.departureTime} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "departureTime", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input type="date" min={departureDate || undefined} max={arrivalDate || undefined} required={isRowRequired} value={row.arrivalDate} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "arrivalDate", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input required={isRowRequired} value={row.toPlace} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "toPlace", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input type="time" required={isRowRequired} value={row.arrivalTime} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "arrivalTime", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1">
															<Select
																value={row.mode}
																onValueChange={(value) => updateRow(setTicketRows, ticketRows, index, "mode", value)}
																disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															>
																<SelectTrigger className={`${fieldSurfaceClass} h-10 w-full border-0 bg-transparent px-0`}>
																	<SelectValue placeholder="Select mode" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="Air">Air</SelectItem>
																	<SelectItem value="Rail">Rail</SelectItem>
																	<SelectItem value="Bus">Bus</SelectItem>
																</SelectContent>
															</Select>
														</td>
														<td className="border border-slate-300 px-2 py-1"><Input required={isRowRequired} value={row.classTicketNo} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "classTicketNo", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input value={row.amount} onInput={(e) => updateRow(setTicketRows, ticketRows, index, "amount", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 p-1.5">
															<div className="flex items-center justify-center gap-1.5">
																<Button type="button" variant="outline" size="icon" onClick={() => handleAddTicketRow(index)} className="h-8 w-8 border-slate-300 bg-white" disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
																	<Plus className="h-4 w-4 text-slate-700" />
																</Button>
																{ticketRows.length > MIN_TICKET_ROWS ? (
																	<Button type="button" variant="outline" size="icon" onClick={() => handleDeleteTicketRow(index)} className="h-8 w-8 border-slate-300 bg-white" disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
																		<Trash2 className="h-4 w-4 text-rose-600" />
																	</Button>
																) : null}
															</div>
														</td>
													</tr>
												)})}
											</tbody>
										</table>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Expense Details (In Rupees)</p>
									{!hasTravelWindow ? <p className="mb-2 text-xs font-medium text-amber-700">Fill Departure Date/Time and Arrival Date/Time to enable this table.</p> : null}
									<div className="overflow-auto rounded-xl border border-slate-300 bg-white">
										<table className="w-full min-w-[1500px] border-collapse text-sm">
											<thead>
												<tr className="bg-slate-100 text-slate-700">
													{["Date", "Room Rent Loading", "Room Taxes", "Pvt. Stay Allowance", "Daily Allowance", "Incidental Expenses", "Conveyance", "Pvt. Conveyance", "Telephone", "Postage & Telegram", "Misc. Expense", "Total"].map((label) => (
														<th key={label} className="border border-slate-300 px-3 py-2 text-left font-semibold">{label}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{dailyExpenseRows.map((row, index) => {
													const isDateRequired = Boolean(
														row.roomRentLoading.trim() ||
														row.roomTaxes.trim() ||
														row.privateStayAllowance.trim() ||
														row.dailyAllowance.trim() ||
														row.incidentalExpenses.trim() ||
														row.conveyance.trim() ||
														row.privateConveyance.trim() ||
														row.telephone.trim() ||
														row.postageTelegram.trim() ||
														row.miscExpense.trim()
													);
													return (
													<tr key={`daily-${index}`}>
														{(Object.keys(row) as Array<keyof DailyExpenseRow>).map((key) => (
															<td key={key} className="border border-slate-300 px-2 py-1">
																<Input
																	type={key === "date" ? "date" : "text"}
																	min={key === "date" ? (departureDate || undefined) : undefined}
																	max={key === "date" ? (arrivalDate || undefined) : undefined}
																	required={key === "date" ? isDateRequired : false}
																	value={row[key]}
																	onInput={(e) => updateRow(setDailyExpenseRows, dailyExpenseRows, index, key, e.currentTarget.value)}
																	className={fieldSurfaceClass}
																	disabled={key === "total" || !hasTravelWindow || (selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval)}
																/>
															</td>
														))}
													</tr>
												)})}
											</tbody>
										</table>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Conveyance</p>
									{!hasTravelWindow ? <p className="mb-2 text-xs font-medium text-amber-700">Fill Departure Date/Time and Arrival Date/Time to enable this table.</p> : null}
									<div className="overflow-auto rounded-xl border border-slate-300 bg-white">
										<table className="w-full min-w-[900px] border-collapse text-sm">
											<thead>
												<tr className="bg-slate-100 text-slate-700">
													{["Date", "From", "To", "Mode", "Amount", "Actions"].map((label) => (
														<th key={label} className="border border-slate-300 px-3 py-2 text-left font-semibold">{label}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{conveyanceRows.map((row, index) => {
													const isRowRequired = Boolean(row.amount.trim());
													return (
													<tr key={`conveyance-${index}`}>
														<td className="border border-slate-300 px-2 py-1"><Input type="date" min={departureDate || undefined} max={arrivalDate || undefined} required={isRowRequired} value={row.date} onInput={(e) => updateRow(setConveyanceRows, conveyanceRows, index, "date", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input required={isRowRequired} value={row.from} onInput={(e) => updateRow(setConveyanceRows, conveyanceRows, index, "from", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input required={isRowRequired} value={row.to} onInput={(e) => updateRow(setConveyanceRows, conveyanceRows, index, "to", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input required={isRowRequired} value={row.mode} onInput={(e) => updateRow(setConveyanceRows, conveyanceRows, index, "mode", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input value={row.amount} onInput={(e) => updateRow(setConveyanceRows, conveyanceRows, index, "amount", e.currentTarget.value)} className={fieldSurfaceClass} disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 p-1.5">
															<div className="flex items-center justify-center gap-1.5">
																<Button type="button" variant="outline" size="icon" onClick={() => handleAddConveyanceRow(index)} className="h-8 w-8 border-slate-300 bg-white" disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
																	<Plus className="h-4 w-4 text-slate-700" />
																</Button>
																{conveyanceRows.length > MIN_CONVEYANCE_ROWS ? (
																	<Button type="button" variant="outline" size="icon" onClick={() => handleDeleteConveyanceRow(index)} className="h-8 w-8 border-slate-300 bg-white" disabled={!hasTravelWindow || selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}>
																		<Trash2 className="h-4 w-4 text-rose-600" />
																	</Button>
																) : null}
															</div>
														</td>
													</tr>
												)})}
											</tbody>
										</table>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Particulars</p>
									<div className="overflow-auto rounded-xl border border-slate-300 bg-white">
										<table className="w-full min-w-[860px] border-collapse text-sm">
											<thead>
												<tr className="bg-slate-100 text-slate-700">
													<th className="border border-slate-300 px-3 py-2 text-left font-semibold">Particulars</th>
													<th className="border border-slate-300 px-3 py-2 text-left font-semibold">Paid by Co/Self</th>
													<th className="border border-slate-300 px-3 py-2 text-left font-semibold">DR/CR</th>
													<th className="border border-slate-300 px-3 py-2 text-left font-semibold">Code</th>
													<th className="border border-slate-300 px-3 py-2 text-left font-semibold">Amount</th>
												</tr>
											</thead>
											<tbody>
												{headExpenseRows.map((row, index) => {
													const isPaidByRequired = parseMoneyValue(row.amount) > 0;
													return (
													<tr key={row.head}>
														<td className="border border-slate-300 px-3 py-2 font-medium text-slate-700">{row.head}</td>
														<td className="border border-slate-300 px-2 py-1">
															<Select
																value={row.paidBy}
																onValueChange={(value) => updateRow(setHeadExpenseRows, headExpenseRows, index, "paidBy", value)}
																disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval}
															>
																<SelectTrigger className={`${fieldSurfaceClass} h-10 w-full border-0 bg-transparent px-0 ${isPaidByRequired && !row.paidBy.trim() ? "text-rose-600" : ""}`}>
																	<SelectValue placeholder="Select" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="Paid by Company">Paid by Company</SelectItem>
																	<SelectItem value="Paid by Self">Paid by Self</SelectItem>
																</SelectContent>
															</Select>
														</td>
														<td className="border border-slate-300 px-2 py-1"><Input value={row.drCr} onInput={(e) => updateRow(setHeadExpenseRows, headExpenseRows, index, "drCr", e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input value={row.code} onInput={(e) => updateRow(setHeadExpenseRows, headExpenseRows, index, "code", e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} /></td>
														<td className="border border-slate-300 px-2 py-1"><Input value={row.amount} className={fieldSurfaceClass} disabled /></td>
													</tr>
												)})}
											</tbody>
										</table>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Settlement</p>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
										<Field label="Advance Taken From Company">
											<Input value={advanceTakenFromCompany} onInput={(e) => setAdvanceTakenFromCompany(e.currentTarget.value)} className={fieldSurfaceClass} disabled={selectedSubmission !== null && !isEditMode && !canCurrentUserEditForApproval} />
										</Field>
										<Field label="Expenses Paid By Company">
											<Input value={expensesPaidByCompanyDisplay} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Payable From Company">
											<Input value={payableFromCompanyDisplay} className={fieldSurfaceClass} disabled />
										</Field>
										<Field label="Total Cost Of Tour">
											<Input value={totalCostOfTour} className={fieldSurfaceClass} disabled />
										</Field>
									</div>
									<div className="mt-4">
										<label className="mb-2 block text-sm font-medium text-[#4d5560]">Amount In Words</label>
										<div className={inlineTextareaShellClass}>
											<Textarea value={amountInWords} className={`${textareaSurfaceClass} min-h-[5.5rem]`} disabled />
										</div>
									</div>
								</div>

								{selectedSubmission ? (
									<div className={sectionClass}>
										{selectedSubmission.approvalHistory.length > 0 ? (
											<div className="mb-5 rounded-xl border border-slate-200 bg-[rgba(248,250,252,0.95)] p-4">
												<p className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Approval History</p>
												<div className="space-y-3">
													{selectedSubmission.approvalHistory.map((entry, index) => (
														<div key={`${entry.cycle}-${entry.stage}-${entry.action}-${entry.actedAt}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
															<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
																<div>
																	<p className="text-sm font-semibold text-slate-800">{index + 1}. {getApprovalStageLabel(entry.stage)}</p>
																	<p className="text-xs text-slate-500">{entry.actorName || entry.actorUsername || "System"} on {formatDisplayDateTime(entry.actedAt)}</p>
																	{entry.selectedAuthorityName ? <p className="text-xs text-slate-500">Approving Authority: {entry.selectedAuthorityName}</p> : null}
																	{entry.remarks ? <p className="mt-1 text-xs text-slate-500">Remarks: {entry.remarks}</p> : null}
																</div>
																<span className={getHistoryBadgeClassName(entry.action)}>{getApprovalActionLabel(entry.action)}</span>
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
														{selectedSubmission.approvalFlow.hrHod.remarks ? <p className="mt-1 text-xs text-slate-500">Remarks: {selectedSubmission.approvalFlow.hrHod.remarks}</p> : null}
													</div>
													<span className={getApprovalBadgeClassName(selectedSubmission.approvalFlow.hrHod)}>{getApprovalBadgeLabel(selectedSubmission.approvalFlow.hrHod)}</span>
												</div>
												{!isSelectedSubmissionQueryRaised && !selectedSubmission.approvalFlow.hrHod.approved && canHrApprove ? (
													<div className="mt-4 space-y-3">
														<Textarea value={hrRemarks} onInput={(e) => setHrRemarks(e.currentTarget.value)} placeholder="Enter remarks for approval or query" className={`${textareaSurfaceClass} min-h-[5.5rem]`} />
														<div className="flex gap-3">
															<Button type="button" onClick={() => void handleApproval("hrHod", "approve")} disabled={approvalLoading} className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">Approve</Button>
															<Button type="button" variant="outline" onClick={() => void handleApproval("hrHod", "query")} disabled={approvalLoading} className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]">Raise Query</Button>
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
															{selectedSubmission.approvalFlow.financeHod.remarks ? <p className="mt-1 text-xs text-slate-500">Remarks: {selectedSubmission.approvalFlow.financeHod.remarks}</p> : null}
														</div>
														<span className={`${getApprovalBadgeClassName(selectedSubmission.approvalFlow.financeHod)} w-fit`}>{getApprovalBadgeLabel(selectedSubmission.approvalFlow.financeHod)}</span>
													</div>

													<div>
														<label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">Approving Authority</label>
														<Select value={selectedAuthorityUsername} onValueChange={setSelectedAuthorityUsername} disabled={selectedSubmission.approvalFlow.financeHod.approved || !canFinanceApprove}>
															<SelectTrigger className={fieldSurfaceClass}>
																<SelectValue placeholder={approvedUsersLoading ? "Loading users..." : "Select approving authority"} />
															</SelectTrigger>
															<SelectContent>
																{approvedUsers.map((user) => (
																	<SelectItem key={user.id} value={user.username}>{user.employee_name} ({user.department})</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													{!isSelectedSubmissionQueryRaised && !selectedSubmission.approvalFlow.financeHod.approved && canFinanceApprove && selectedSubmission.approvalFlow.hrHod.approved ? (
														<div className="space-y-3">
															<Textarea value={financeRemarks} onInput={(e) => setFinanceRemarks(e.currentTarget.value)} placeholder="Enter remarks for approval or query" className={`${textareaSurfaceClass} min-h-[5.5rem]`} />
															<div className="flex gap-3">
																<Button type="button" onClick={() => void handleApproval("financeHod", "approve")} disabled={approvalLoading || !selectedAuthorityUsername} className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">Approve</Button>
																<Button type="button" variant="outline" onClick={() => void handleApproval("financeHod", "query")} disabled={approvalLoading} className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]">Raise Query</Button>
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
														{selectedSubmission.approvalFlow.approvingAuthority.remarks ? <p className="mt-1 text-xs text-slate-500">Remarks: {selectedSubmission.approvalFlow.approvingAuthority.remarks}</p> : null}
													</div>
													<span className={getApprovalBadgeClassName(selectedSubmission.approvalFlow.approvingAuthority)}>{getApprovalBadgeLabel(selectedSubmission.approvalFlow.approvingAuthority)}</span>
												</div>
												{!isSelectedSubmissionQueryRaised && !selectedSubmission.approvalFlow.approvingAuthority.action && canApprovingAuthorityApprove && selectedSubmission.approvalFlow.financeHod.approved ? (
													<div className="mt-3 space-y-3">
														<Textarea value={authorityRemarks} onInput={(e) => setAuthorityRemarks(e.currentTarget.value)} placeholder="Enter remarks for approval or query" className={`${textareaSurfaceClass} min-h-[5.5rem]`} />
														<div className="flex gap-3">
															<Button type="button" onClick={() => void handleApproval("approvingAuthority", "approve")} disabled={approvalLoading} className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">Approve</Button>
															<Button type="button" variant="outline" onClick={() => void handleApproval("approvingAuthority", "query")} disabled={approvalLoading} className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]">Raise Query</Button>
														</div>
													</div>
												) : null}
											</div>
										</div>
									</div>
								) : null}

								{approvalError ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{approvalError}</div> : null}
								{submitError ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{submitError}</div> : null}

								<div className="flex justify-end gap-3 border-t border-slate-300 pt-4">
									{!selectedSubmission || isEditMode ? (
										<Button type="submit" disabled={submitLoading} className="min-w-40 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white shadow-[0_10px_22px_rgba(29,78,216,0.28)] hover:opacity-95">
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
						<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Travel Expense Statement Summary</p>
						<DialogTrigger asChild>
							<Button className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">New Travel Expense Statement</Button>
						</DialogTrigger>
					</div>
					{summaryError ? <div className="mb-3 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{summaryError}</div> : null}
					<div className="h-full overflow-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
						<table className="w-full min-w-[1080px] border-collapse text-sm text-slate-800">
							<thead>
								<tr className="bg-slate-100 text-center text-slate-700">
									{["Date", "Voucher No.", "Employee Name", "Emp Code", "Dept/Branch", "Designation", "Total Cost Of Tour", "Status", "Submitted At", "Actions"].map((label) => (
										<th key={label} className="border border-slate-300 px-3 py-2.5 font-semibold">{label}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{summaryLoading ? (
									<tr><td colSpan={10} className="px-3 py-6 text-center text-sm text-slate-500">Loading travel expense statements...</td></tr>
								) : submissionList.length === 0 ? (
									<tr><td colSpan={10} className="px-3 py-6 text-center text-sm text-slate-500">No submissions yet. Click "New Travel Expense Statement" to add one.</td></tr>
								) : (
									submissionList.map((item) => {
										const isActionLocked = hasApprovalStarted(item);
										const canInitiatorManageItem = isInitiator(item);

										return (
											<tr key={item.id} className="cursor-pointer odd:bg-slate-50/40 even:bg-white/90 hover:bg-sky-50/70" onClick={() => openViewMode(item)}>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{formatDisplayDate(item.date)}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{item.voucherNo}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{item.employeeName}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{item.employeeCode}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{item.departmentBranch}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{item.designation}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{item.totalCostOfTour}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center"><span className={`${getSummaryStatusClassName(item.status)} justify-center`}>{getSummaryStatusLabel(item.status)}</span></td>
												<td className="border border-slate-200 px-3 py-2.5 text-center">{formatDisplayDateTime(item.createdAt)}</td>
												<td className="border border-slate-200 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
													<div className="flex items-center justify-center gap-2">
														<Button type="button" variant="outline" onClick={() => openEditMode(item)} disabled={isActionLocked || !canInitiatorManageItem} className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs text-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">Edit</Button>
														<Button type="button" variant="outline" onClick={() => void handleDelete(item.id)} disabled={isActionLocked || !canInitiatorManageItem} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-3 text-xs text-[#b91c1c] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400">Delete</Button>
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
