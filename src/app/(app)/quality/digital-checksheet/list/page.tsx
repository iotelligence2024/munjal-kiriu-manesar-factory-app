import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../../../../context/SessionContext";
import { Button } from "../../../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../../components/ui/select";
import { Textarea } from "../../../../../components/ui/textarea";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

type ChecksheetItem = {
	id: string;
	name: string;
	"line-name": string;
	model: string;
	status: string;
	createdAt?: string;
	authorization?: Record<string, Record<string, { enable: boolean; frequency: string }>>;
	"check-points-mapping"?: Record<
		string,
		{ enable: boolean; name: string; sequence: number; input: boolean; mandatory?: boolean }
	>;
	"check-points"?: Array<Record<string, unknown>>;
};

type ChecksheetDataItem = {
	id: string;
	"checksheet-id": string;
	"checksheet-name": string;
	"line-name": string;
	model: string;
	date: string;
	month: string;
	status: "pending" | "in_progress" | "completed" | "approved";
	approval: string;
	approvalFlow?: Record<string, ApprovalStage>;
	approvalHistory?: ApprovalHistoryEntry[];
	"check-points-mapping"?: Record<string, unknown>;
	"check-points"?: Array<Record<string, unknown>>;
	createdAt?: string;
	updatedAt?: string;
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

type ApprovalHistoryEntry = {
	stage: string;
	action: string;
	actorUsername: string;
	actorName: string;
	actedAt: string;
	remarks: string;
	statusAfterAction: string;
};

type CheckPointFieldConfig = {
	enable?: boolean;
	name?: string;
	sequence?: number;
	input?: boolean;
	mandatory?: boolean;
};

const summaryShellClassName =
	"min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5";
const sectionClassName =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";
const tableHeadClassName = "border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700";
const tableCellClassName = "border border-slate-200 px-3 py-2.5 text-slate-800 align-middle";
const detailHeadClassName = "border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700 align-top";
const detailCellClassName = "border border-slate-200 px-3 py-2.5 text-slate-800 align-top";
const detailInputClassName =
	"h-9 !border-0 !bg-transparent text-sm !shadow-none outline-none !ring-0 focus:!border-0 focus:outline-none focus:!ring-0";
const detailTextareaClassName =
	"min-h-[2.25rem] resize-none overflow-hidden !border-0 !bg-transparent px-0 py-2 text-sm !shadow-none outline-none !ring-0 focus:!border-0 focus:outline-none focus:!ring-0";
const approvalTextareaClassName =
	"min-h-[7rem] resize-none overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-white px-4 py-3 text-sm text-[#17181d] placeholder:text-[#8c98a8] shadow-none outline-none ring-0 focus:border-[rgba(59,130,246,0.22)] focus:outline-none focus:ring-0";

const badgeClassName = (tone: "pending" | "neutral" | "completed" | "approval") =>
	[
		"inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em]",
		tone === "pending"
			? "border-[rgba(245,158,11,0.28)] bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(254,215,170,0.92))] text-[#c46b10]"
			: tone === "completed"
				? "border-[rgba(34,197,94,0.28)] bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(187,247,208,0.92))] text-[#2f7d57]"
				: tone === "approval"
					? "border-[rgba(34,197,94,0.28)] bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(187,247,208,0.92))] text-[#2f7d57]"
					: "border-[rgba(203,213,225,0.8)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] text-[#9aa3af]",
	].join(" ");

const formatDisplayDate = (value: string) => {
	if (!value) return "";

	const normalizedMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (normalizedMatch) {
		return value;
	}

	const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) {
		return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
	}

	return value;
};

const formatDisplayDateTime = (value: string) => {
	if (!value) return "-";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	const pad = (part: number) => String(part).padStart(2, "0");
	return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getMonthKeyFromDate = (value: string) => {
	const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (!match) return "";
	return `${match[2]}-${match[3]}`;
};

const parseDisplayDate = (value: string) => {
	const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (!match) return null;
	return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getChecksheetCreatedDate = (item: ChecksheetItem) => {
	const raw = item.createdAt ?? "";
	const parsed = raw ? new Date(raw) : null;
	return parsed && !Number.isNaN(parsed.getTime()) ? startOfDay(parsed) : null;
};

const getWeekKey = (value: string) => {
	const parsedDate = parseDisplayDate(value);
	if (!parsedDate) return "";

	const utcDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
	const dayNumber = utcDate.getUTCDay() || 7;
	utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
	const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
	const weekNumber = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

	return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

const getApprovalBadgeLabel = (stage: ApprovalStage) => {
	if (stage.approved) return "APPROVED";
	if (stage.queried || stage.action === "query") return "QUERY";
	return "PENDING";
};

const getApprovalBadgeClassName = (stage: ApprovalStage) => {
	if (stage.approved) return badgeClassName("approval");
	if (stage.queried || stage.action === "query") return badgeClassName("pending");
	return badgeClassName("neutral");
};

const getApprovalStageLabel = (stage: string) => {
	if (stage === "qualityEngineer") return "Quality Engineer";
	if (stage === "shiftIncharge") return "Shift Incharge";
	return stage
		.split("__")
		.filter(Boolean)
		.map((part) =>
			part
				.split("_")
				.filter(Boolean)
				.map((token) => token.charAt(0).toUpperCase() + token.slice(1))
				.join(" ")
		)
		.join(" - ");
};

const getApprovalActionLabel = (action: string) => {
	if (action === "approve") return "APPROVED";
	if (action === "query") return "QUERY RAISED";
	return action ? action.replaceAll("_", " ").toUpperCase() : "PENDING";
};

const getHistoryBadgeClassName = (action: string) => {
	if (action === "approve") return badgeClassName("approval");
	if (action === "query") return badgeClassName("pending");
	return badgeClassName("neutral");
};

const getApprovalFlowKey = (role: string) => {
	return role
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
};

const getApprovalStageKey = (department: string, role: string) => {
	const normalizedDepartment = department
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
	const normalizedRole = getApprovalFlowKey(role);
	return `${normalizedDepartment}__${normalizedRole}`;
};

const isApprovalStageApproved = (
	item: ChecksheetDataItem | null | undefined,
	department: string,
	role: string
) => {
	if (!item) return false;
	const approvalFlowKey = getApprovalStageKey(department, role);
	const stage = item.approvalFlow?.[approvalFlowKey];
	return Boolean(stage?.approved);
};

const normalizeRoleText = (value: unknown) =>
	String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const splitResponsibilities = (value: unknown) =>
	String(value ?? "")
		.split(/[\/,|]/)
		.map((item) => normalizeRoleText(item))
		.filter(Boolean);

const normalizeDepartmentText = (value: unknown) =>
	String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const splitDepartments = (value: unknown) =>
	String(value ?? "")
		.split(/[\/,|]/)
		.map((item) => normalizeDepartmentText(item))
		.filter(Boolean);

const withSrNoMapping = (mapping: Record<string, CheckPointFieldConfig>) => {
	const hasSrNo = Object.keys(mapping).some(
		(key) => key.trim().toLowerCase() === "sr-no"
	);
	if (hasSrNo) return mapping;

	return {
		"sr-no": {
			enable: true,
			name: "Sr No",
			sequence: 0,
			input: false,
			mandatory: false,
		},
		...mapping,
	};
};

const parseRangeToken = (token: string) => {
	const match = token.match(/^\s*(-?\d+(?:\.\d+)?)\s*[-~]\s*(-?\d+(?:\.\d+)?)\s*$/);
	if (!match) return null;
	const min = Number(match[1]);
	const max = Number(match[2]);
	if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
	return { min: Math.min(min, max), max: Math.max(min, max) };
};

const shouldHighlightSubmittedCell = ({
	isSubmitted,
	fieldKey,
	displayValue,
	originalRowValue,
}: {
	isSubmitted: boolean;
	fieldKey: string;
	displayValue: string;
	originalRowValue: unknown;
}) => {
	if (!isSubmitted) return false;

	const normalizedValue = String(displayValue ?? "").trim().toLowerCase();
	if (normalizedValue === "ng") return true;

	if (fieldKey !== "judgment") return false;

	const numericValue = Number(String(displayValue ?? "").trim());
	if (!Number.isFinite(numericValue)) return false;

	const tokens = (Array.isArray(originalRowValue) ? originalRowValue : [originalRowValue])
		.flatMap((raw) => String(raw ?? "").split(/[;,|]/))
		.map((token) => token.trim())
		.filter(Boolean);
	const ranges = tokens
		.map(parseRangeToken)
		.filter((value): value is { min: number; max: number } => value !== null);

	if (ranges.length === 0) return false;
	return !ranges.some((range) => numericValue >= range.min && numericValue <= range.max);
};

export default function DigitalChecksheetListPage() {
	const navigate = useNavigate();
	const { session } = useSession();
	const [searchParams] = useSearchParams();
	const [items, setItems] = useState<ChecksheetItem[]>([]);
	const [dataItems, setDataItems] = useState<ChecksheetDataItem[]>([]);
	const [selectedChecksheetId, setSelectedChecksheetId] = useState("");
	const [selectedRows, setSelectedRows] = useState<Array<Record<string, unknown>>>([]);
	const [reviewOpen, setReviewOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [approvalLoading, setApprovalLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [approvalRemarks, setApprovalRemarks] = useState<Record<string, string>>({});

	const lineName = searchParams.get("line-name") ?? "";
	const date = searchParams.get("date") ?? "";
	const checksheetIdFromQuery = searchParams.get("checksheet-id") ?? "";
	const selectedMonthKey = getMonthKeyFromDate(date);
	const selectedWeekKey = getWeekKey(date);

	useEffect(() => {
		const loadChecksheets = async () => {
			try {
				setLoading(true);
				setError(null);
				const query = new URLSearchParams();
				if (lineName) query.set("line-name", lineName);
				if (selectedMonthKey) query.set("month", selectedMonthKey);

				const [masterResponse, dataResponse] = await Promise.all([
					fetch(`${API_BASE_URL}/api/checksheet-master`),
					fetch(`${API_BASE_URL}/api/checksheet-data?${query.toString()}`),
				]);
				const [masterPayload, dataPayload] = await Promise.all([
					masterResponse.json().catch(() => null),
					dataResponse.json().catch(() => null),
				]);

				if (!masterResponse.ok) {
					throw new Error(masterPayload?.message ?? "Unable to load checksheets.");
				}
				if (!dataResponse.ok) {
					throw new Error(dataPayload?.message ?? "Unable to load checksheet data.");
				}

				setItems(Array.isArray(masterPayload?.items) ? masterPayload.items : []);
				setDataItems(Array.isArray(dataPayload?.items) ? dataPayload.items : []);
			} catch (loadError) {
				setError(
					loadError instanceof TypeError
						? "Authentication server is not reachable. Start the backend and try again."
						: loadError instanceof Error
							? loadError.message
							: "Unable to load checksheets."
				);
			} finally {
				setLoading(false);
			}
		};

		void loadChecksheets();
	}, [lineName, selectedMonthKey]);

	const filteredItems = useMemo(
		() =>
			items.filter((item) => {
				if (lineName && item["line-name"] !== lineName) return false;
				const createdDate = getChecksheetCreatedDate(item);
				const selectedDateValue = parseDisplayDate(date);
				if (!createdDate || !selectedDateValue) return true;
				return createdDate.getTime() <= startOfDay(selectedDateValue).getTime();
			}),
		[items, lineName, date]
	);

	const currentDateDataByChecksheetId = useMemo(
		() =>
			dataItems
				.filter((item) => item.date === date)
				.reduce<Record<string, ChecksheetDataItem>>((accumulator, item) => {
					accumulator[item["checksheet-id"]] = item;
					return accumulator;
				}, {}),
		[dataItems, date]
	);

	const selectedChecksheet = useMemo(
		() => filteredItems.find((item) => item.id === selectedChecksheetId) ?? null,
		[filteredItems, selectedChecksheetId]
	);
	const selectedDataItem = useMemo(
		() => (selectedChecksheet ? currentDateDataByChecksheetId[selectedChecksheet.id] ?? null : null),
		[selectedChecksheet, currentDateDataByChecksheetId]
	);
	const selectedResolvedDataItem = selectedDataItem;
	const normalizedSessionRole = normalizeRoleText(session?.role ?? "");
	const normalizedSessionDepartment = normalizeDepartmentText(session?.department ?? "");
	const isQueryRaised = useMemo(() => {
		if (!selectedResolvedDataItem) return false;

		if (selectedResolvedDataItem.approval === "query_raised") {
			return true;
		}

		return Object.values(selectedResolvedDataItem.approvalFlow ?? {}).some(
			(stage) => Boolean(stage?.queried) || stage?.action === "query"
		);
	}, [selectedResolvedDataItem]);
	const isReadOnlyChecksheet = useMemo(
		() => Boolean((selectedResolvedDataItem?.status === "completed" || selectedResolvedDataItem?.status === "approved") && !isQueryRaised),
		[selectedResolvedDataItem, isQueryRaised]
	);
	const isSubmittedChecksheet = useMemo(
		() => Boolean(selectedResolvedDataItem?.status === "completed" || selectedResolvedDataItem?.status === "approved"),
		[selectedResolvedDataItem]
	);

	const approvalStages = useMemo(() => {
		if (!selectedChecksheet?.authorization) return [];

		const stages = Object.entries(selectedChecksheet.authorization).flatMap(([department, roles]) =>
			Object.entries(roles ?? {})
				.filter(([, details]) => Boolean(details?.enable))
				.map(([role, details]) => ({
					id: `${department}-${role}`,
					department,
					role,
					frequency: String(details?.frequency ?? "").trim() || "Daily",
				}))
		);

		return stages;
	}, [selectedChecksheet]);

	const visibleApprovalStages = useMemo(() => {
		if (!selectedChecksheet) return [];

		const stages = approvalStages.filter((stage) => {
			if (stage.frequency.toLowerCase() !== "weekly") {
				return true;
			}

			const alreadyApprovedInWeek = dataItems.some((item) => {
				if (item["checksheet-id"] !== selectedChecksheet.id) return false;
				if (getWeekKey(item.date) !== selectedWeekKey) return false;

				const approvalStage =
					item.approvalFlow?.[stage.role === "Engineer" ? "qualityEngineer" : "shiftIncharge"];

				return Boolean(approvalStage?.approved);
			});

			return !alreadyApprovedInWeek;
		});

		return stages;
	}, [approvalStages, dataItems, selectedChecksheet, selectedWeekKey]);

	const isApprovalCompleted = useMemo(() => {
		if (!selectedChecksheet || !selectedResolvedDataItem) return false;
		if (selectedResolvedDataItem.approval === "approved") return true;
		if (approvalStages.length === 0) return false;

		return approvalStages.every((stage) => {
			if (stage.frequency.toLowerCase() === "weekly") {
				return dataItems.some((item) => {
					if (item["checksheet-id"] !== selectedChecksheet.id) return false;
					if (getWeekKey(item.date) !== selectedWeekKey) return false;
					return isApprovalStageApproved(item, stage.department, stage.role);
				});
			}

			return isApprovalStageApproved(selectedResolvedDataItem, stage.department, stage.role);
		});
	}, [approvalStages, dataItems, selectedChecksheet, selectedResolvedDataItem, selectedWeekKey]);

	const approvalStageDefaults: ApprovalStage = {
		approved: false,
		queried: false,
		action: "",
		approvedByUsername: "",
		approvedByName: "",
		approvedAt: "",
		remarks: "",
	};

	const visibleFields = useMemo(() => {
		const mapping = withSrNoMapping(
			(selectedChecksheet?.["check-points-mapping"] ?? {}) as Record<string, CheckPointFieldConfig>
		);

		return Object.entries(mapping)
			.filter(([, config]) => config?.enable)
			.sort((first, second) => Number(first[1].sequence ?? 0) - Number(second[1].sequence ?? 0));
	}, [selectedChecksheet]);

	useEffect(() => {
		if (!selectedChecksheet) {
			setSelectedRows([]);
			return;
		}

		const mapping = withSrNoMapping(
			(selectedChecksheet["check-points-mapping"] ?? {}) as Record<string, CheckPointFieldConfig>
		);
		const savedEntry = selectedResolvedDataItem;
		const sourceRows =
			Array.isArray(savedEntry?.["check-points"]) && savedEntry["check-points"].length > 0
				? savedEntry["check-points"]
				: selectedChecksheet["check-points"];

		setSelectedRows(
			Array.isArray(sourceRows)
				? sourceRows.map((row, rowIndex) => {
						const nextRow: Record<string, unknown> = { ...row };
						if (nextRow["sr-no"] === undefined || nextRow["sr-no"] === null || String(nextRow["sr-no"]).trim() === "") {
							nextRow["sr-no"] = String(rowIndex + 1);
						}

						Object.entries(mapping).forEach(([key, config]) => {
							if (!config?.input) {
								return;
							}

							if (Array.isArray(row?.[key])) {
								nextRow[key] = "";
							}
						});

						return nextRow;
					})
				: []
		);
	}, [selectedChecksheet, selectedResolvedDataItem]);

	const handleSelectChecksheet = (item: ChecksheetItem) => {
		setSelectedChecksheetId(item.id);
		setValidationError(null);
		setMessage(null);

		const nextQuery = new URLSearchParams(searchParams);
		nextQuery.set("checksheet-id", item.id);
		navigate(`/quality/digital-checksheet/list?${nextQuery.toString()}`, { replace: true });
	};

	useEffect(() => {
		if (filteredItems.length === 0) {
			setSelectedChecksheetId("");
			return;
		}

		const hasQueryChecksheet =
			checksheetIdFromQuery &&
			filteredItems.some((item) => item.id === checksheetIdFromQuery);

		if (hasQueryChecksheet) {
			if (selectedChecksheetId !== checksheetIdFromQuery) {
				setSelectedChecksheetId(checksheetIdFromQuery);
			}
			return;
		}

		const hasCurrentSelection = filteredItems.some((item) => item.id === selectedChecksheetId);
		if (hasCurrentSelection) {
			return;
		}

		const fallbackId = filteredItems[0]?.id ?? "";
		if (!fallbackId) return;

		setSelectedChecksheetId(fallbackId);
		const nextQuery = new URLSearchParams(searchParams);
		nextQuery.set("checksheet-id", fallbackId);
		navigate(`/quality/digital-checksheet/list?${nextQuery.toString()}`, { replace: true });
	}, [
		filteredItems,
		checksheetIdFromQuery,
		selectedChecksheetId,
		searchParams,
		navigate,
	]);

	const handleDetailCellChange = (rowIndex: number, key: string, value: string) => {
		if (isReadOnlyChecksheet) return;
		const rowResponsibility =
			selectedRows[rowIndex]?.responsibility ??
			selectedChecksheet?.["check-points"]?.[rowIndex]?.responsibility ??
			"";
		const rowDepartment =
			selectedRows[rowIndex]?.department ??
			selectedChecksheet?.["check-points"]?.[rowIndex]?.department ??
			"";
		const acceptedResponsibilities = splitResponsibilities(rowResponsibility);
		const acceptedDepartments = splitDepartments(rowDepartment);
		const roleAllowed =
			acceptedResponsibilities.length === 0 ||
			acceptedResponsibilities.includes(normalizedSessionRole);
		const departmentAllowed =
			acceptedDepartments.length === 0 ||
			acceptedDepartments.includes(normalizedSessionDepartment);
		const canEditRow =
			roleAllowed && departmentAllowed;
		if (!canEditRow) return;

		setSelectedRows((current) =>
			current.map((row, index) =>
				index === rowIndex
					? {
							...row,
							[key]: value,
						}
					: row
			)
		);
	};

	const rowEditPermissions = useMemo(
		() =>
			selectedRows.map((row, index) => {
				const rowResponsibility =
					row.responsibility ??
					selectedChecksheet?.["check-points"]?.[index]?.responsibility ??
					"";
				const rowDepartment =
					row.department ??
					selectedChecksheet?.["check-points"]?.[index]?.department ??
					"";
				const acceptedResponsibilities = splitResponsibilities(rowResponsibility);
				const acceptedDepartments = splitDepartments(rowDepartment);
				const roleAllowed =
					acceptedResponsibilities.length === 0 ||
					acceptedResponsibilities.includes(normalizedSessionRole);
				const departmentAllowed =
					acceptedDepartments.length === 0 ||
					acceptedDepartments.includes(normalizedSessionDepartment);
				return roleAllowed && departmentAllowed;
			}),
		[selectedRows, selectedChecksheet, normalizedSessionRole, normalizedSessionDepartment]
	);

	const canEditAnyCheckpoint = useMemo(
		() => rowEditPermissions.some(Boolean),
		[rowEditPermissions]
	);

	const saveChecksheetData = async (status: "in_progress" | "completed") => {
		if (!selectedChecksheet || !date) return false;

		try {
			setSaving(true);
			setError(null);
			setMessage(null);

			const month = date.match(/^\d{2}-(\d{2})-(\d{4})$/)
				? `${date.slice(3, 5)}-${date.slice(6, 10)}`
				: "";

			const response = await fetch(`${API_BASE_URL}/api/checksheet-data`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					"checksheet-id": selectedChecksheet.id,
					"checksheet-name": selectedChecksheet.name,
					"line-name": selectedChecksheet["line-name"],
					model: selectedChecksheet.model,
					date,
					month,
					status,
					approval: "not_started",
					actorDepartment: session?.department ?? "",
					actorRole: session?.role ?? "",
					actorUsername: session?.username ?? "",
					actorName: session?.employee_name ?? "",
					authorization: selectedChecksheet.authorization ?? {},
					"check-points-mapping": selectedChecksheet["check-points-mapping"] ?? {},
					"check-points": selectedRows,
				}),
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to save checksheet data.");
			}

			const savedItem = payload?.item as ChecksheetDataItem | undefined;
			if (savedItem) {
				setDataItems((current) => {
					const nextItems = current.filter((item) => item.id !== savedItem.id);
					return [savedItem, ...nextItems];
				});
			}
			setMessage(payload?.message ?? (status === "completed" ? "Checksheet submitted successfully." : "Draft saved successfully."));
			return true;
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to save checksheet data.");
			return false;
		} finally {
			setSaving(false);
		}
	};

	const handleSaveDraft = async () => {
		if (!selectedChecksheet) return;
		setValidationError(null);
		await saveChecksheetData("in_progress");
	};

	const handleReview = () => {
		if (!selectedChecksheet) return;
		const missingFields = selectedRows.flatMap((row, rowIndex) =>
			visibleFields.flatMap(([key, config]) => {
				if (!config.input || !config.mandatory) {
					return [];
				}

				const value = row[key];
				const normalizedValue = Array.isArray(value)
					? value.join(", ").trim()
					: String(value ?? "").trim();

				if (normalizedValue) {
					return [];
				}

				return [`Row ${rowIndex + 1} - ${config.name || key}`];
			})
		);

		if (missingFields.length > 0) {
			const message = `Following fields are mandatory:\n${missingFields.join("\n")}`;
			setValidationError(message);
			window.alert(message);
			return;
		}

		setValidationError(null);
		setReviewOpen(true);
	};

	const handleSubmitChecksheet = async () => {
		if (!selectedChecksheet) return;
		setValidationError(null);
		const saved = await saveChecksheetData("completed");
		if (saved) {
			setReviewOpen(false);
		}
	};

	const handleApprovalAction = async (stageKey: string, action: "approve" | "query") => {
		if (!selectedResolvedDataItem || !session?.username) return;

		try {
			setApprovalLoading(true);
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/checksheet-data/${selectedResolvedDataItem.id}/approve`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					stage: stageKey,
					action,
					actorUsername: session.username,
					actorName: session.employee_name,
					remarks: approvalRemarks[stageKey] ?? "",
				}),
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to update checksheet approval.");
			}

			const updatedItem = payload?.item as ChecksheetDataItem | undefined;
			if (updatedItem) {
				setDataItems((current) => {
					const nextItems = current.filter((item) => item.id !== updatedItem.id);
					return [updatedItem, ...nextItems];
				});
			}
			setApprovalRemarks((current) => ({ ...current, [stageKey]: "" }));
			setMessage(payload?.message ?? "Checksheet approval updated successfully.");
		} catch (approvalError) {
			setError(approvalError instanceof Error ? approvalError.message : "Unable to update checksheet approval.");
		} finally {
			setApprovalLoading(false);
		}
	};

	return (
		<div className="dashboard-glass flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
			<div className={`${summaryShellClassName} space-y-4 overflow-auto`}>
				<div className="space-y-1">
					<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
						Digital Checksheet List
					</p>
					<p className="text-sm text-slate-600">
						{lineName ? `Line Name: ${lineName}` : "All Line Names"}
						{date ? ` | Date: ${formatDisplayDate(date)}` : ""}
					</p>
				</div>
				<div className="rounded-xl border border-[rgba(59,130,246,0.16)] bg-white/80 px-4 py-3 text-sm text-slate-700">
					Logged In User Department: <span className="font-semibold text-slate-900">{session?.department || "-"}</span>
					{" | "}
					Role: <span className="font-semibold text-slate-900">{session?.role || "-"}</span>
				</div>

				{error ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
				{message ? <div className="rounded-xl border border-[rgba(5,150,105,0.2)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm text-[#047857]">{message}</div> : null}
				{validationError ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm whitespace-pre-line text-[#b91c1c]">{validationError}</div> : null}

				<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
					<table className="w-full min-w-[1100px] table-auto border-collapse text-sm">
						<thead>
							<tr className="bg-slate-100">
								<th className={`${tableHeadClassName} text-left`}>Checksheet Name</th>
								<th className={tableHeadClassName}>Pending</th>
								<th className={tableHeadClassName}>In Progress</th>
								<th className={tableHeadClassName}>Completed</th>
								<th className={tableHeadClassName}>Approval</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading checksheets...</td>
								</tr>
							) : filteredItems.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-slate-500">No checksheets available for this line.</td>
								</tr>
							) : (
								filteredItems.map((item) => {
									const savedItem = currentDateDataByChecksheetId[item.id];
									const itemApprovalStages = Object.entries(item.authorization ?? {}).flatMap(([department, roles]) =>
										Object.entries(roles ?? {})
											.filter(([, details]) => Boolean(details?.enable))
											.map(([role, details]) => ({
												department,
												role,
												frequency: String(details?.frequency ?? "").trim() || "Daily",
											}))
									);
									const isItemApproved =
										savedItem?.approval === "approved" ||
										(Boolean(savedItem) &&
											itemApprovalStages.length > 0 &&
											itemApprovalStages.every((stage) => {
												if (stage.frequency.toLowerCase() === "weekly") {
													return dataItems.some((dataItem) => {
														if (dataItem["checksheet-id"] !== item.id) return false;
														if (getWeekKey(dataItem.date) !== selectedWeekKey) return false;
														return isApprovalStageApproved(dataItem, stage.department, stage.role);
													});
												}

												return isApprovalStageApproved(savedItem, stage.department, stage.role);
											}));
									const approvedStageCount = Boolean(savedItem)
										? itemApprovalStages.filter((stage) => {
												if (stage.frequency.toLowerCase() === "weekly") {
													return dataItems.some((dataItem) => {
														if (dataItem["checksheet-id"] !== item.id) return false;
														if (getWeekKey(dataItem.date) !== selectedWeekKey) return false;
														return isApprovalStageApproved(dataItem, stage.department, stage.role);
													});
												}

												return isApprovalStageApproved(savedItem, stage.department, stage.role);
										  }).length
										: 0;
									const isItemApprovalInProgress =
										Boolean(savedItem) &&
										itemApprovalStages.length > 1 &&
										approvedStageCount > 0 &&
										approvedStageCount < itemApprovalStages.length;

									return (
									<tr key={item.id} className={`cursor-pointer odd:bg-slate-50/40 even:bg-white/90 hover:bg-sky-50/70 ${selectedChecksheetId === item.id ? "bg-sky-50/80" : ""}`} onClick={() => handleSelectChecksheet(item)}>
										<td className={`${tableCellClassName} text-left font-semibold`}>
											<div className="flex items-center gap-3">
												<span>{item.name}</span>
												<span
													className={[
														"inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]",
														selectedChecksheetId === item.id
															? "border-[rgba(34,197,94,0.28)] bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(187,247,208,0.92))] text-[#2f7d57]"
															: "border-[rgba(203,213,225,0.8)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] text-[#9aa3af]",
													].join(" ")}
												>
													{item.status}
												</span>
											</div>
										</td>
										<td className={`${tableCellClassName} text-center`}>
											<span className={badgeClassName(!savedItem || savedItem.status === "pending" ? "pending" : "neutral")}>Pending</span>
										</td>
										<td className={`${tableCellClassName} text-center`}>
											<span className={badgeClassName(savedItem?.status === "in_progress" ? "completed" : "neutral")}>In Progress</span>
										</td>
										<td className={`${tableCellClassName} text-center`}>
											<span className={badgeClassName(savedItem?.status === "completed" ? "completed" : "neutral")}>Completed</span>
										</td>
										<td className={`${tableCellClassName} text-center`}>
											<span
												className={badgeClassName(
													savedItem?.status === "approved" || isItemApproved
														? "approval"
														: isItemApprovalInProgress
															? "pending"
															: "neutral"
												)}
											>
												{savedItem?.status === "approved" || isItemApproved
													? "Approved"
													: isItemApprovalInProgress
														? "In Progress"
														: "Not Started"}
											</span>
										</td>
									</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{selectedChecksheet ? (
					<div className={sectionClassName}>
						<div className="mb-3 space-y-1">
							<h2 className="text-base font-semibold text-slate-800">{selectedChecksheet.name}</h2>
							<p className="text-sm text-slate-600">
								Line Name: {selectedChecksheet["line-name"]} | Model: {selectedChecksheet.model}
							</p>
						</div>

						<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
							<table className="w-full min-w-[980px] table-auto border-collapse text-sm">
								<thead>
									<tr className="bg-slate-100">
										{visibleFields.map(([key, config]) => (
											<th key={key} className={detailHeadClassName}>
												{config.name || key}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{selectedRows.length === 0 ? (
										<tr>
											<td colSpan={Math.max(visibleFields.length, 1)} className="px-3 py-6 text-center text-slate-500">
												No checkpoints available.
											</td>
										</tr>
									) : (
										selectedRows.map((row, rowIndex) => (
											<tr key={`${selectedChecksheet.id}-${rowIndex}`} className="odd:bg-slate-50/40 even:bg-white/90">
												{visibleFields.map(([key, config]) => {
													const rawValue = row[key];
													const displayValue = Array.isArray(rawValue)
														? rawValue.join(", ")
														: String(rawValue ?? "");
													const originalRowValue = selectedChecksheet?.["check-points"]?.[rowIndex]?.[key];
													const isHighlightedCell = shouldHighlightSubmittedCell({
														isSubmitted: isSubmittedChecksheet,
														fieldKey: key,
														displayValue,
														originalRowValue,
													});

													const canEditRow = rowEditPermissions[rowIndex] ?? false;
												if (!config.input || isReadOnlyChecksheet || !canEditRow) {
														return (
															<td
																key={key}
																className={`${detailCellClassName}${isHighlightedCell ? " bg-[rgba(254,226,226,0.82)] text-[#991b1b] font-semibold" : ""}`}
															>
																{displayValue}
															</td>
														);
													}

													const isLongText = key === "remarks" || key === "inspection-items" || key === "standard";
													const isOptionField =
														Array.isArray(originalRowValue) && originalRowValue.length > 1;
													const optionValues = isOptionField
														? (originalRowValue as unknown[]).map((value) => String(value))
														: [];

													return (
														<td
															key={key}
															className={`${detailCellClassName}${isHighlightedCell ? " bg-[rgba(254,226,226,0.82)] text-[#991b1b] font-semibold" : ""}`}
														>
															{isOptionField ? (
																<Select
																	value={displayValue || "__empty__"}
																	onValueChange={(value) => handleDetailCellChange(rowIndex, key, value === "__empty__" ? "" : value)}
																>
																	<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
																		<SelectValue placeholder="Select option" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="__empty__">Select option</SelectItem>
																		{optionValues.map((option) => (
																			<SelectItem key={option} value={option}>
																				{option}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															) : isLongText ? (
																<Textarea
																	rows={1}
																	value={displayValue}
																	onInput={(event) => {
																		const target = event.currentTarget;
																		target.style.height = "auto";
																		target.style.height = `${target.scrollHeight}px`;
																	}}
																	onChange={(event) => handleDetailCellChange(rowIndex, key, event.currentTarget.value)}
																	className={detailTextareaClassName}
																/>
															) : (
																<Input
																	value={displayValue}
																	onChange={(event) => handleDetailCellChange(rowIndex, key, event.currentTarget.value)}
																	className={detailInputClassName}
																/>
															)}
														</td>
													);
												})}
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
						{((!selectedResolvedDataItem || (selectedResolvedDataItem.status !== "completed" && selectedResolvedDataItem.status !== "approved")) || isQueryRaised) && canEditAnyCheckpoint ? (
							<div className="mt-4 flex justify-end gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={handleSaveDraft}
									disabled={saving || !canEditAnyCheckpoint}
									className="rounded-lg border-[rgba(34,197,94,0.22)] bg-[linear-gradient(135deg,rgba(240,253,244,0.96),rgba(220,252,231,0.92))] text-[#166534]"
								>
									{saving ? "Saving..." : "Save Draft"}
								</Button>
								<Button
									type="button"
									onClick={handleReview}
									disabled={!canEditAnyCheckpoint}
									className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
								>
									Review
								</Button>
							</div>
						) : null}
					</div>
				) : null}

				{selectedChecksheet ? (
					<div className={sectionClassName}>
						{visibleApprovalStages.length > 0 && !isQueryRaised && !isApprovalCompleted ? (
							<>
								<p className="mb-4 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
									Approval Sequence
								</p>
								<div className="space-y-4">
									{visibleApprovalStages.map((stage, index) => {
										const approvalFlowKey = getApprovalStageKey(stage.department, stage.role);
										const approvalStage =
											selectedResolvedDataItem?.approvalFlow?.[approvalFlowKey] ?? approvalStageDefaults;
										const previousStagesApproved = visibleApprovalStages
											.slice(0, index)
											.every((previousStage) => {
												const previousKey = getApprovalStageKey(previousStage.department, previousStage.role);
												const previousApproval =
													selectedResolvedDataItem?.approvalFlow?.[previousKey] ?? approvalStageDefaults;
												return Boolean(previousApproval.approved);
											});
										const canCurrentUserApprove =
											selectedDataItem?.status === "completed" &&
											session?.department?.trim().toLowerCase() === stage.department.trim().toLowerCase() &&
											session?.role?.trim().toLowerCase() === stage.role.trim().toLowerCase() &&
											!approvalStage.action &&
											previousStagesApproved;

										return (
											<div key={stage.id} className="rounded-xl border border-slate-200 bg-white p-4">
												<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
													<div>
														<p className="text-sm font-semibold text-slate-800">
															{index + 1}. {stage.department} - {stage.role}
														</p>
														<p className="text-xs text-slate-500">Approval Frequency: {stage.frequency}</p>
														<p className="text-xs text-slate-500">
															{approvalStage.action
																? `${approvalStage.action.toUpperCase()} by ${approvalStage.approvedByName || approvalStage.approvedByUsername} on ${formatDisplayDateTime(approvalStage.approvedAt)}`
																: "Pending approval"}
														</p>
														{approvalStage.remarks ? (
															<p className="mt-1 text-xs text-slate-500">
																Remarks: {approvalStage.remarks}
															</p>
														) : null}
													</div>
													<div className="flex items-center gap-3">
														<span className={getApprovalBadgeClassName(approvalStage)}>
															{getApprovalBadgeLabel(approvalStage)}
														</span>
													</div>
												</div>
												{canCurrentUserApprove ? (
													<div className="mt-4 space-y-3">
														<Textarea
															value={approvalRemarks[approvalFlowKey] ?? ""}
															onInput={(event) =>
																setApprovalRemarks((current) => ({
																	...current,
																	[approvalFlowKey]: event.currentTarget.value,
																}))
															}
															placeholder="Enter remarks for approval or query"
															className={approvalTextareaClassName}
														/>
														<div className="flex gap-3">
															<Button
																type="button"
																onClick={() => void handleApprovalAction(approvalFlowKey, "approve")}
																disabled={approvalLoading}
																className="h-9 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
															>
																Approve
															</Button>
															<Button
																type="button"
																variant="outline"
																onClick={() => void handleApprovalAction(approvalFlowKey, "query")}
																disabled={approvalLoading}
																className="h-9 rounded-lg border-[rgba(234,88,12,0.22)] bg-[rgba(255,247,237,0.9)] text-[#c2410c]"
															>
																Raise Query
															</Button>
														</div>
													</div>
												) : null}
											</div>
										);
									})}
								</div>
							</>
						) : null}

						{selectedResolvedDataItem?.approvalHistory && selectedResolvedDataItem.approvalHistory.length > 0 ? (
							<div className={`${visibleApprovalStages.length > 0 && !isQueryRaised && !isApprovalCompleted ? "mt-5" : ""} rounded-xl border border-slate-200 bg-[rgba(248,250,252,0.95)] p-4`}>
								<p className="mb-3 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
									Approval History
								</p>
								<div className="space-y-3">
									{selectedResolvedDataItem.approvalHistory.map((entry, index) => (
										<div
											key={`${entry.stage}-${entry.action}-${entry.actedAt}-${index}`}
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
													{entry.remarks ? (
														<p className="mt-1 text-xs text-slate-500">Remarks: {entry.remarks}</p>
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
					</div>
				) : null}

				<Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
					<DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-[rgba(30,64,175,0.16)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(235,243,251,0.98))] sm:max-w-[min(96vw,90rem)]">
						<DialogHeader>
							<DialogTitle className="pt-3 text-2xl tracking-[-0.03em] text-[#17181d]">
								Review Checksheet
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="rounded-xl border border-[rgba(59,130,246,0.16)] bg-white/80 px-4 py-3 text-sm text-slate-700">
								Please review and acknowledge the checksheet data before submission.
							</div>
							{selectedChecksheet ? (
								<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
									<table className="w-full min-w-[980px] table-auto border-collapse text-sm">
										<thead>
											<tr className="bg-slate-100">
												{visibleFields.map(([key, config]) => (
													<th key={key} className={detailHeadClassName}>
														{config.name || key}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{selectedRows.map((row, rowIndex) => (
												<tr key={`review-${selectedChecksheet.id}-${rowIndex}`} className="odd:bg-slate-50/40 even:bg-white/90">
													{visibleFields.map(([key]) => {
														const rawValue = row[key];
														const displayValue = Array.isArray(rawValue)
															? rawValue.join(", ")
															: String(rawValue ?? "");
														const originalRowValue = selectedChecksheet?.["check-points"]?.[rowIndex]?.[key];
														const isHighlightedCell = shouldHighlightSubmittedCell({
															isSubmitted: isSubmittedChecksheet,
															fieldKey: key,
															displayValue,
															originalRowValue,
														});

														return (
															<td
																key={key}
																className={`${detailCellClassName}${isHighlightedCell ? " bg-[rgba(254,226,226,0.82)] text-[#991b1b] font-semibold" : ""}`}
															>
																{displayValue}
															</td>
														);
													})}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : null}
							<div className="flex justify-end gap-3">
								<Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>
									Back
								</Button>
								<Button
									type="button"
									onClick={handleSubmitChecksheet}
									disabled={saving}
									className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
								>
									{saving ? "Submitting..." : "Submit Checksheet"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
