import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";
const DIGITAL_CHECKSHEET_LINE_STORAGE_KEY = "digital_checksheet_last_line_name";

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
	"line-name": string;
	date: string;
	month: string;
	status: "pending" | "in_progress" | "completed" | "approved";
	approval: string;
	approvalFlow?: Record<
		string,
		{
			approved: boolean;
			queried: boolean;
			action: string;
			approvedByUsername: string;
			approvedByName: string;
			approvedAt: string;
			remarks: string;
		}
	>;
	"check-points"?: Array<Record<string, unknown>>;
	updatedAt?: string;
	createdAt?: string;
};

const summaryShellClassName =
	"min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5";
const sectionClassName =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";
const inputShellClassName =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";
const fieldLabelClassName = "text-sm font-medium text-[#4d5560]";
const monthlyFixedColumnWidth = 170;
const monthlyStickyDescriptorKeys = new Set(["sr-no", "inspection-items", "standard", "method"]);
const getMonthlyDescriptorWidth = (key: string) =>
	key.trim().toLowerCase() === "sr-no" ? 84 : monthlyFixedColumnWidth;

const monthLabels = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const pad = (value: number) => String(value).padStart(2, "0");

const buildMonthValue = (date: Date) =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const formatDisplayDate = (date: Date) =>
	`${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

const formatDisplayDateTime = (value: string) => {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getWeekStartDate = (value: string) => {
	const parsedDate = parseDisplayDate(value);
	if (!parsedDate) return null;
	const start = new Date(parsedDate);
	const day = start.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	start.setDate(start.getDate() + diff);
	start.setHours(0, 0, 0, 0);
	return start;
};

const getWeekEndDate = (value: string) => {
	const weekStart = getWeekStartDate(value);
	if (!weekStart) return null;
	const end = new Date(weekStart);
	end.setDate(end.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseDisplayDate = (value: string) => {
	const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (!match) return null;
	return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
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

const getApprovalFlowKey = (role: string) =>
	role
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

const getApprovalStageKey = (department: string, role: string) => {
	const normalizedDepartment = department
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
	return `${normalizedDepartment}__${getApprovalFlowKey(role)}`;
};

const isApprovalStageApproved = (
	item: ChecksheetDataItem | null | undefined,
	department: string,
	role: string
) => {
	if (!item) return false;
	const approvalFlowKey = getApprovalStageKey(department, role);
	return Boolean(item.approvalFlow?.[approvalFlowKey]?.approved);
};

const getChecksheetCreatedDate = (item: ChecksheetItem) => {
	const raw = item.createdAt ?? "";
	const parsed = raw ? new Date(raw) : null;
	return parsed && !Number.isNaN(parsed.getTime()) ? startOfDay(parsed) : null;
};

export default function DigitalChecksheetPage() {
	const navigate = useNavigate();
	const [items, setItems] = useState<ChecksheetItem[]>([]);
	const [dataItems, setDataItems] = useState<ChecksheetDataItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedLineName, setSelectedLineName] = useState(() => {
		if (typeof window === "undefined") return "";
		return sessionStorage.getItem(DIGITAL_CHECKSHEET_LINE_STORAGE_KEY) ?? "";
	});
	const [selectedMonth, setSelectedMonth] = useState(buildMonthValue(new Date()));
	const [selectedMonthlyChecksheetId, setSelectedMonthlyChecksheetId] = useState("");

	useEffect(() => {
		const loadChecksheets = async () => {
			try {
				setLoading(true);
				setError(null);

				const monthQuery = selectedMonth.match(/^(\d{4})-(\d{2})$/)
					? `${selectedMonth.slice(5, 7)}-${selectedMonth.slice(0, 4)}`
					: "";
				const query = new URLSearchParams();
				if (monthQuery) query.set("month", monthQuery);
				if (selectedLineName) query.set("line-name", selectedLineName);

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
	}, [selectedLineName, selectedMonth]);

	const lineNameOptions = useMemo(
		() =>
			Array.from(
				new Set(
					items
						.map((item) => item["line-name"]?.trim())
						.filter((value): value is string => Boolean(value))
				)
			).sort((first, second) => first.localeCompare(second)),
		[items]
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (items.length === 0) return;

		if (selectedLineName && !lineNameOptions.includes(selectedLineName)) {
			setSelectedLineName("");
			sessionStorage.removeItem(DIGITAL_CHECKSHEET_LINE_STORAGE_KEY);
			return;
		}

		if (selectedLineName) {
			sessionStorage.setItem(DIGITAL_CHECKSHEET_LINE_STORAGE_KEY, selectedLineName);
			return;
		}

		sessionStorage.removeItem(DIGITAL_CHECKSHEET_LINE_STORAGE_KEY);
	}, [items.length, lineNameOptions, selectedLineName]);

	const visibleChecksheets = useMemo(
		() =>
			items.filter((item) =>
				selectedLineName ? item["line-name"] === selectedLineName : true
			),
		[items, selectedLineName]
	);

	useEffect(() => {
		if (visibleChecksheets.length === 0) {
			setSelectedMonthlyChecksheetId("");
			return;
		}

		const exists = visibleChecksheets.some((item) => item.id === selectedMonthlyChecksheetId);
		if (!exists) {
			setSelectedMonthlyChecksheetId(visibleChecksheets[0].id);
		}
	}, [visibleChecksheets, selectedMonthlyChecksheetId]);

	const selectedMonthlyChecksheet = useMemo(
		() => visibleChecksheets.find((item) => item.id === selectedMonthlyChecksheetId) ?? null,
		[visibleChecksheets, selectedMonthlyChecksheetId]
	);

	const monthlyDays = useMemo(() => {
		const [yearText, monthText] = selectedMonth.split("-");
		const year = Number(yearText);
		const monthIndex = Number(monthText) - 1;
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		return Array.from({ length: daysInMonth }, (_, index) => index + 1);
	}, [selectedMonth]);

	const monthlyMandatoryFields = useMemo(() => {
		const mapping = selectedMonthlyChecksheet?.["check-points-mapping"] ?? {};
		return Object.entries(mapping)
			.filter(([, config]) => Boolean(config?.enable) && Boolean(config?.input) && Boolean(config?.mandatory))
			.sort((first, second) => Number(first[1].sequence ?? 0) - Number(second[1].sequence ?? 0))
			.map(([key]) => key);
	}, [selectedMonthlyChecksheet]);

	const monthlyDescriptorFields = useMemo(() => {
		const mapping = selectedMonthlyChecksheet?.["check-points-mapping"] ?? {};
		const descriptorFields = Object.entries(mapping)
			.filter(([, config]) => Boolean(config?.enable) && !Boolean(config?.input))
			.sort((first, second) => Number(first[1].sequence ?? 0) - Number(second[1].sequence ?? 0))
			.map(([key, config]) => ({
				key,
				label: config?.name || key,
			}));
		const hasSrNo = descriptorFields.some((field) => field.key.trim().toLowerCase() === "sr-no");
		if (!hasSrNo) {
			return [{ key: "sr-no", label: "Sr No" }, ...descriptorFields];
		}
		return descriptorFields;
	}, [selectedMonthlyChecksheet]);

	const monthlyStickyOffsets = useMemo(() => {
		let offset = 0;
		const offsets: Record<string, number> = {};

		monthlyDescriptorFields.forEach((field) => {
			const normalizedKey = field.key.trim().toLowerCase();
			if (monthlyStickyDescriptorKeys.has(normalizedKey)) {
				offsets[field.key] = offset;
				offset += getMonthlyDescriptorWidth(field.key);
			}
		});

		return offsets;
	}, [monthlyDescriptorFields]);

	const monthlyRows = useMemo(() => {
		if (!selectedMonthlyChecksheet) return [];
		const rows = Array.isArray(selectedMonthlyChecksheet["check-points"])
			? selectedMonthlyChecksheet["check-points"]
			: [];

		return rows.map((row, index) => {
			const srNo = String(row?.["sr-no"] ?? index + 1);
			const inspectionItem = String(row?.["inspection-items"] ?? row?.["inspection_item"] ?? "");
			const label = inspectionItem || `Checkpoint ${index + 1}`;
			return {
				index,
				label: `${srNo}. ${label}`,
			};
		});
	}, [selectedMonthlyChecksheet]);

	const monthlyDataByDate = useMemo(() => {
		if (!selectedMonthlyChecksheet) return {};

		const byDate: Record<string, ChecksheetDataItem> = {};
		dataItems
			.filter((item) => item["checksheet-id"] === selectedMonthlyChecksheet.id)
			.forEach((item) => {
				const current = byDate[item.date];
				const currentTime = new Date(current?.updatedAt ?? current?.createdAt ?? "").getTime();
				const nextTime = new Date(item.updatedAt ?? item.createdAt ?? "").getTime();
				if (!current || nextTime >= currentTime) {
					byDate[item.date] = item;
				}
			});

		return byDate;
	}, [dataItems, selectedMonthlyChecksheet]);

	const monthlyApprovalViewRows = useMemo(() => {
		if (!selectedMonthlyChecksheet) return [];
		const monthKey = selectedMonth.match(/^(\d{4})-(\d{2})$/)
			? `${selectedMonth.slice(5, 7)}-${selectedMonth.slice(0, 4)}`
			: "";
		if (!monthKey) return [];
		const [yearText, monthText] = selectedMonth.split("-");
		const selectedYear = Number(yearText);
		const selectedMonthIndex = Number(monthText) - 1;
		const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
		const checksheetCreatedDate = getChecksheetCreatedDate(selectedMonthlyChecksheet);
		const weekKeysInMonth = Array.from(
			new Set(
				Array.from({ length: daysInMonth }, (_, idx) =>
					getWeekKey(formatDisplayDate(new Date(selectedYear, selectedMonthIndex, idx + 1)))
				).filter(Boolean)
			)
		);
		const availableWeekKeys = Array.from(
			new Set(
				Array.from({ length: daysInMonth }, (_, idx) => idx + 1)
					.filter((day) => {
						const currentDate = new Date(selectedYear, selectedMonthIndex, day);
						if (!checksheetCreatedDate) return true;
						return startOfDay(currentDate).getTime() >= checksheetCreatedDate.getTime();
					})
					.map((day) => getWeekKey(formatDisplayDate(new Date(selectedYear, selectedMonthIndex, day))))
					.filter(Boolean)
			)
		);

		const stageMeta = new Map<string, { department: string; role: string; frequency: string }>();
		Object.entries(selectedMonthlyChecksheet.authorization ?? {}).forEach(([department, roles]) => {
			Object.entries(roles ?? {}).forEach(([role, details]) => {
				if (!details?.enable) return;
				const frequency = String(details?.frequency ?? "").trim() || "Daily";
				if (!["weekly", "monthly"].includes(frequency.toLowerCase())) return;
				const normalizedDepartment = department
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "_")
					.replace(/^_+|_+$/g, "");
				const normalizedRole = role
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "_")
					.replace(/^_+|_+$/g, "");
				stageMeta.set(`${normalizedDepartment}__${normalizedRole}`, { department, role, frequency });
			});
		});

		const monthItems = dataItems.filter(
			(item) =>
				item["checksheet-id"] === selectedMonthlyChecksheet.id &&
				String(item.month ?? "").trim() === monthKey
		);
		const allChecksheetItems = dataItems.filter(
			(item) => item["checksheet-id"] === selectedMonthlyChecksheet.id
		);
		const rows: Array<{
			period: string;
			department: string;
			role: string;
			frequency: string;
			status: string;
			approvedBy: string;
			approvedAt: string;
			remarks: string;
			sourceDate: string;
		}> = [];

		const buildRow = (
			meta: { department: string; role: string; frequency: string },
			period: string,
			sourceDate: string,
			stageSnapshot:
				| {
					action: string;
					approved?: boolean;
					queried?: boolean;
					approvedByName?: string;
					approvedByUsername?: string;
					approvedAt?: string;
					remarks?: string;
				  }
				| undefined
		) => {
			const action = String(stageSnapshot?.action ?? "").trim().toLowerCase();
			const status = stageSnapshot?.approved
				? "APPROVED"
				: stageSnapshot?.queried
					? "QUERY RAISED"
					: action === "approve"
						? "APPROVED"
						: action === "query"
							? "QUERY RAISED"
							: "PENDING";
			return {
				period,
				department: meta.department,
				role: meta.role,
				frequency: meta.frequency,
				status,
				approvedBy: stageSnapshot?.approvedByName || stageSnapshot?.approvedByUsername || "-",
				approvedAt: stageSnapshot?.approvedAt ?? "",
				remarks: stageSnapshot?.remarks ?? "",
				sourceDate,
			};
		};

		stageMeta.forEach((meta, stageKey) => {
			const frequency = meta.frequency.trim().toLowerCase();
			if (frequency === "weekly") {
				const weeksToShow = availableWeekKeys.length > 0 ? availableWeekKeys : weekKeysInMonth;
				weeksToShow.forEach((weekKey, index) => {
					const weekItems = allChecksheetItems.filter((item) => getWeekKey(item.date) === weekKey);
					const weekCandidates = weekItems
						.map((item) => ({
							item,
							stage: item.approvalFlow?.[stageKey],
						}))
						.filter(({ stage }) =>
							Boolean(
								stage &&
								(
									stage.approved ||
									stage.queried ||
									String(stage.action ?? "").trim()
								)
							)
						);
					const latestStage = weekCandidates.reduce<typeof weekCandidates[number] | undefined>(
						(acc, current) => {
							const accTime = new Date(acc?.item.updatedAt ?? acc?.item.createdAt ?? "").getTime();
							const currentTime = new Date(current.item.updatedAt ?? current.item.createdAt ?? "").getTime();
							return !acc || currentTime >= accTime ? current : acc;
						},
						undefined
					)?.stage;
					const fallbackDate = formatDisplayDate(new Date(selectedYear, selectedMonthIndex, Math.min(index * 7 + 1, daysInMonth)));
					const anchorDate = weekItems[0]?.date || fallbackDate;
					const startDate = getWeekStartDate(anchorDate);
					const endDate = getWeekEndDate(anchorDate);
					const periodLabel = startDate && endDate
						? `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`
						: `Week ${index + 1}`;
					rows.push(buildRow(meta, periodLabel, weekItems[0]?.date ?? "", latestStage));
				});
				return;
			}

			const monthCandidates = monthItems
				.map((item) => ({
					item,
					stage: item.approvalFlow?.[stageKey],
				}))
				.filter(({ stage }) =>
					Boolean(
						stage &&
						(
							stage.approved ||
							stage.queried ||
							String(stage.action ?? "").trim()
						)
					)
				);
			const latestMonthStage = monthCandidates.reduce<typeof monthCandidates[number] | undefined>(
				(acc, current) => {
					const accTime = new Date(acc?.item.updatedAt ?? acc?.item.createdAt ?? "").getTime();
					const currentTime = new Date(current.item.updatedAt ?? current.item.createdAt ?? "").getTime();
					return !acc || currentTime >= accTime ? current : acc;
				},
				undefined
			)?.stage;
			const monthStart = new Date(selectedYear, selectedMonthIndex, 1);
			const monthEnd = new Date(selectedYear, selectedMonthIndex, daysInMonth);
			rows.push(
				buildRow(
					meta,
					`${formatDisplayDate(monthStart)} to ${formatDisplayDate(monthEnd)}`,
					monthItems[0]?.date ?? "",
					latestMonthStage
				)
			);
		});

		return rows.sort((a, b) => {
			const aTime = new Date(a.approvedAt || "").getTime();
			const bTime = new Date(b.approvedAt || "").getTime();
			return bTime - aTime;
		});
	}, [dataItems, selectedMonthlyChecksheet, selectedMonth]);

	const approvedCountByDate = useMemo(() => {
		const relevantDataItems = dataItems.filter((item) =>
			selectedLineName ? item["line-name"] === selectedLineName : true
		);
		const latestByChecksheetAndDate = relevantDataItems.reduce<Record<string, ChecksheetDataItem>>(
			(accumulator, item) => {
				const key = `${item.date}::${item["checksheet-id"]}`;
				const current = accumulator[key];
				const currentTime = new Date(current?.updatedAt ?? current?.createdAt ?? "").getTime();
				const nextTime = new Date(item.updatedAt ?? item.createdAt ?? "").getTime();

				if (!current || nextTime >= currentTime) {
					accumulator[key] = item;
				}

				return accumulator;
			},
			{}
		);

		const [yearText, monthText] = selectedMonth.split("-");
		const year = Number(yearText);
		const monthIndex = Number(monthText) - 1;
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		const counts: Record<string, number> = {};

		for (let day = 1; day <= daysInMonth; day += 1) {
			const currentDate = new Date(year, monthIndex, day);
			const currentDateKey = formatDisplayDate(currentDate);
			const currentWeekKey = getWeekKey(currentDateKey);

			const eligibleChecksheets = items.filter((item) => {
				if (selectedLineName && item["line-name"] !== selectedLineName) return false;
				const createdDate = getChecksheetCreatedDate(item);
				if (!createdDate) return true;
				return createdDate.getTime() <= startOfDay(currentDate).getTime();
			});

			counts[currentDateKey] = eligibleChecksheets.filter((item) => {
				const exactDataItem = latestByChecksheetAndDate[`${currentDateKey}::${item.id}`];
				if (!exactDataItem) return false;

				const approvalStages = Object.entries(item.authorization ?? {}).flatMap(([department, roles]) =>
					Object.entries(roles ?? {})
						.filter(([, details]) => Boolean(details?.enable))
						.map(([role, details]) => ({
							department,
							role,
							frequency: String(details?.frequency ?? "").trim() || "Daily",
						}))
				);

				if (exactDataItem.status === "approved" || exactDataItem.approval === "approved") {
					return true;
				}

				if (approvalStages.length === 0) {
					return false;
				}

				return approvalStages.every((stage) => {
					if (stage.frequency.toLowerCase() === "weekly") {
						return Object.values(latestByChecksheetAndDate).some((dataItem) => {
							if (dataItem["checksheet-id"] !== item.id) return false;
							if (getWeekKey(dataItem.date) !== currentWeekKey) return false;
							return isApprovalStageApproved(dataItem, stage.department, stage.role);
						});
					}

					return isApprovalStageApproved(exactDataItem, stage.department, stage.role);
				});
			}).length;
		}

		return counts;
	}, [dataItems, items, selectedLineName, selectedMonth]);

	const calendarDates = useMemo(() => {
		const [yearText, monthText] = selectedMonth.split("-");
		const year = Number(yearText);
		const monthIndex = Number(monthText) - 1;
		const firstDate = new Date(year, monthIndex, 1);
		const startDay = firstDate.getDay();
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		const cells: Array<{ key: string; day: number; type: "empty" | "current"; date: Date | null }> = [];

		for (let offset = 0; offset < startDay; offset += 1) {
			cells.push({
				key: `empty-start-${offset}`,
				day: 0,
				type: "empty",
				date: null,
			});
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			cells.push({
				key: `current-${day}`,
				day,
				type: "current",
				date: new Date(year, monthIndex, day),
			});
		}

		const remaining = (7 - (cells.length % 7)) % 7;
		for (let day = 1; day <= remaining; day += 1) {
			cells.push({
				key: `empty-end-${day}`,
				day: 0,
				type: "empty",
				date: null,
			});
		}

		return cells;
	}, [selectedMonth]);

	const selectedDate = useMemo(() => {
		const [yearText, monthText] = selectedMonth.split("-");
		const year = Number(yearText);
		const monthIndex = Number(monthText) - 1;
		return new Date(year, monthIndex, 1);
	}, [selectedMonth]);

	const monthTitle = `${monthLabels[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

	const handleOpenDay = (date: Date) => {
		if (!selectedLineName) return;

		navigate(
			`/quality/digital-checksheet/list?line-name=${encodeURIComponent(selectedLineName)}&date=${encodeURIComponent(formatDisplayDate(date))}`
		);
	};

	return (
		<div className="dashboard-glass flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
			<div className={`${summaryShellClassName} space-y-4 overflow-auto`}>
				<div className="space-y-1">
					<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
						Digital Checksheet
					</p>
				</div>

				{error ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}

				<div className={sectionClassName}>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Line Name</Label>
							<div className={inputShellClassName}>
								<Select value={selectedLineName || "__all__"} onValueChange={(value) => setSelectedLineName(value === "__all__" ? "" : value)}>
									<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
										<SelectValue placeholder="Select line name" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__all__">All Line Names</SelectItem>
										{lineNameOptions.map((lineName) => (
											<SelectItem key={lineName} value={lineName}>
												{lineName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Month-Year</Label>
							<div className={inputShellClassName}>
								<Input
									type="month"
									value={selectedMonth}
									onChange={(event) => setSelectedMonth(event.currentTarget.value)}
									className="h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] !shadow-none outline-none !ring-0 focus:!border-0 focus:outline-none focus:!ring-0"
								/>
							</div>
						</div>
					</div>
				</div>

				<div className={sectionClassName}>
					<div className="mb-4 flex items-center justify-between gap-3">
						<h2 className="text-lg font-semibold text-slate-800">{monthTitle}</h2>
						<div className="text-sm text-slate-600">
							{loading ? "Loading checksheets..." : `${visibleChecksheets.length} line item(s)`}
						</div>
					</div>

					<div className="grid grid-cols-7 gap-2">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
							<div key={day} className="rounded-xl border border-[rgba(148,163,184,0.2)] bg-[rgba(248,250,252,0.95)] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
								{day}
							</div>
						))}
					</div>

					<div className="mt-2 grid grid-cols-7 gap-2">
						{calendarDates.map((cell) => (
							(() => {
								const completedCount =
									cell.type === "current" && cell.date
										? approvedCountByDate[formatDisplayDate(cell.date)] ?? 0
										: 0;
								const totalLineChecksheets =
									cell.type === "current" && cell.date && selectedLineName
										? items.filter((item) => {
												if (item["line-name"] !== selectedLineName || !cell.date) return false;
												const createdDate = getChecksheetCreatedDate(item);
												if (!createdDate) return true;
												return createdDate.getTime() <= startOfDay(cell.date).getTime();
										  }).length
										: 0;
								const canOpenChecksheet =
									cell.type === "current" &&
									Boolean(selectedLineName) &&
									totalLineChecksheets > 0 &&
									Boolean(cell.date);
								const completionPercentage =
									totalLineChecksheets > 0
										? Math.round((completedCount / totalLineChecksheets) * 100)
										: 0;
								const isFullyComplete =
									totalLineChecksheets > 0 && completedCount === totalLineChecksheets;
								const isPartiallyComplete =
									totalLineChecksheets > 0 &&
									completedCount > 0 &&
									completedCount < totalLineChecksheets;

								return (
									<div
										key={cell.key}
										onClick={() => {
											if (canOpenChecksheet && cell.date) {
												handleOpenDay(cell.date);
											}
										}}
										className={[
											"min-h-[8.5rem] rounded-[1rem] border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]",
											cell.type === "current"
												? canOpenChecksheet
													? "cursor-pointer border-[rgba(148,163,184,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] hover:border-[rgba(37,99,235,0.28)] hover:bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(224,242,254,0.96))]"
													: "border-[rgba(148,163,184,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))]"
												: "border-transparent bg-transparent shadow-none",
										].join(" ")}
									>
										<div className={`mb-3 text-sm font-semibold ${cell.type === "current" ? "text-slate-800" : "text-transparent"}`}>
											{cell.type === "current" ? cell.day : "."}
										</div>
										<div className="space-y-2">
											{cell.type === "current" ? (
												selectedLineName ? (
													totalLineChecksheets > 0 ? (
														<div
															className={[
																"rounded-xl border px-2.5 py-3 text-center",
																isFullyComplete
																	? "border-[rgba(34,197,94,0.24)] bg-[linear-gradient(135deg,rgba(220,252,231,0.96),rgba(187,247,208,0.92))]"
																	: isPartiallyComplete
																		? "border-[rgba(245,158,11,0.24)] bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(254,215,170,0.92))]"
																		: "border-[rgba(239,68,68,0.2)] bg-[linear-gradient(135deg,rgba(254,242,242,0.96),rgba(254,226,226,0.92))]",
															].join(" ")}
														>
															<div className={`text-base font-bold ${isFullyComplete ? "text-[#15803d]" : isPartiallyComplete ? "text-[#c2410c]" : "text-[#b91c1c]"}`}>
																{completedCount}/{totalLineChecksheets}
															</div>
															<div className={`mt-1 text-xs font-semibold ${isFullyComplete ? "text-[#166534]" : isPartiallyComplete ? "text-[#9a3412]" : "text-[#991b1b]"}`}>
																{completionPercentage}%
															</div>
														</div>
													) : (
														<div className="rounded-xl border border-dashed border-[rgba(148,163,184,0.3)] px-2.5 py-3 text-center text-xs text-slate-400">
															No checksheet
														</div>
													)
												) : (
													<div className="rounded-xl border border-dashed border-[rgba(148,163,184,0.3)] px-2.5 py-3 text-center text-xs text-slate-400">
														Select line name
													</div>
												)
											) : null}
										</div>
									</div>
								);
							})()
						))}
					</div>
				</div>

				<div className={sectionClassName}>
					<div className="mb-4 grid gap-4 md:grid-cols-2 md:items-end">
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Monthly Checksheet View</Label>
							<div className={inputShellClassName}>
								<Select
									value={selectedMonthlyChecksheetId || "__empty__"}
									onValueChange={(value) =>
										setSelectedMonthlyChecksheetId(value === "__empty__" ? "" : value)
									}
									disabled={visibleChecksheets.length === 0}
								>
									<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
										<SelectValue placeholder="Select checksheet" />
									</SelectTrigger>
									<SelectContent>
										{visibleChecksheets.length === 0 ? (
											<SelectItem value="__empty__">No checksheet available</SelectItem>
										) : (
											visibleChecksheets.map((item) => (
												<SelectItem key={item.id} value={item.id}>
													{item.name}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
						<table className="w-full min-w-[1200px] table-auto border-collapse text-sm">
							<thead>
								<tr className="bg-slate-100">
									{monthlyDescriptorFields.map((field) => (
										<th
											key={`descriptor-head-${field.key}`}
											className={`${monthlyStickyDescriptorKeys.has(field.key.trim().toLowerCase()) ? "sticky z-20" : ""} border border-slate-300 bg-slate-100 px-3 py-2.5 text-left font-semibold text-slate-700`}
											style={monthlyStickyDescriptorKeys.has(field.key.trim().toLowerCase())
												? {
													left: `${monthlyStickyOffsets[field.key] ?? 0}px`,
													minWidth: `${getMonthlyDescriptorWidth(field.key)}px`,
													width: `${getMonthlyDescriptorWidth(field.key)}px`,
												}
												: undefined}
										>
											{field.label}
										</th>
									))}
									{monthlyDays.map((day) => (
										<th
											key={`day-${day}`}
											className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700"
										>
											{day}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{!selectedMonthlyChecksheet || monthlyRows.length === 0 ? (
									<tr>
										<td
											colSpan={monthlyDays.length + Math.max(monthlyDescriptorFields.length, 1)}
											className="px-4 py-8 text-center text-slate-500"
										>
											No checkpoint rows available for selected checksheet.
										</td>
									</tr>
								) : monthlyMandatoryFields.length === 0 ? (
									<tr>
										<td
											colSpan={monthlyDays.length + Math.max(monthlyDescriptorFields.length, 1)}
											className="px-4 py-8 text-center text-slate-500"
										>
											No mandatory input fields configured in checksheet master.
										</td>
									</tr>
								) : (
									monthlyRows.map((row) => (
										<tr key={`monthly-row-${row.index}`} className="odd:bg-slate-50/40 even:bg-white/90">
											{monthlyDescriptorFields.map((field) => {
												const sourceRow = selectedMonthlyChecksheet?.["check-points"]?.[row.index] as Record<string, unknown> | undefined;
												const rawDescriptorValue =
													field.key.trim().toLowerCase() === "sr-no"
														? sourceRow?.[field.key] ?? String(row.index + 1)
														: sourceRow?.[field.key];
												const descriptorValue = Array.isArray(rawDescriptorValue)
													? rawDescriptorValue.join(", ")
													: String(rawDescriptorValue ?? "");
												return (
													<td
														key={`descriptor-${field.key}-${row.index}`}
														className={`${monthlyStickyDescriptorKeys.has(field.key.trim().toLowerCase()) ? "sticky z-10" : ""} border border-slate-200 bg-white px-3 py-2.5 text-left text-slate-800`}
														style={monthlyStickyDescriptorKeys.has(field.key.trim().toLowerCase())
															? {
																left: `${monthlyStickyOffsets[field.key] ?? 0}px`,
																minWidth: `${getMonthlyDescriptorWidth(field.key)}px`,
																width: `${getMonthlyDescriptorWidth(field.key)}px`,
															}
															: undefined}
													>
														{descriptorValue || "-"}
													</td>
												);
											})}
											{monthlyDays.map((day) => {
												const [yearText, monthText] = selectedMonth.split("-");
												const dateKey = `${pad(day)}-${monthText}-${yearText}`;
												const dataForDay = monthlyDataByDate[dateKey];
												const rowValues = Array.isArray(dataForDay?.["check-points"])
													? dataForDay["check-points"]?.[row.index]
													: null;
												const cellValues = monthlyMandatoryFields
													.map((fieldKey) => {
														const rawValue = (rowValues as Record<string, unknown> | null)?.[fieldKey];
														const value = Array.isArray(rawValue)
															? rawValue.join(", ")
															: String(rawValue ?? "").trim();
														return value;
													})
													.filter(Boolean);

												return (
													<td
														key={`monthly-${row.index}-${day}`}
														className="border border-slate-200 px-2 py-2 text-center text-xs text-slate-700"
													>
														{cellValues.length > 0 ? cellValues.join(" | ") : "-"}
													</td>
												);
											})}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className={sectionClassName}>
					<div className="mb-3 flex items-center justify-between gap-3">
						<h2 className="text-base font-semibold text-slate-800">Monthly Approval Visibility</h2>
					</div>
					<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
						<table className="w-full min-w-[920px] table-auto border-collapse text-sm">
							<thead>
								<tr className="bg-slate-100">
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Period</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Department</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Role</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Frequency</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Status</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Done By</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Done On</th>
									<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Remarks</th>
								</tr>
							</thead>
							<tbody>
								{!selectedMonthlyChecksheet ? (
									<tr>
										<td colSpan={8} className="px-4 py-8 text-center text-slate-500">Select a checksheet to view approvals.</td>
									</tr>
								) : monthlyApprovalViewRows.length === 0 ? (
									<tr>
										<td colSpan={8} className="px-4 py-8 text-center text-slate-500">No weekly/monthly approvals recorded for this month.</td>
									</tr>
								) : (
									monthlyApprovalViewRows.map((row, index) => (
										<tr
											key={`${row.period}-${row.department}-${row.role}-${index}`}
											className={`odd:bg-slate-50/40 even:bg-white/90 ${
												row.status !== "PENDING" ? "cursor-pointer hover:bg-sky-50/70" : ""
											}`}
											onClick={() => {
												if (
													row.status === "PENDING" ||
													!selectedMonthlyChecksheet ||
													!selectedLineName ||
													!row.sourceDate
												) {
													return;
												}
												navigate(
													`/quality/digital-checksheet/list?line-name=${encodeURIComponent(selectedLineName)}&date=${encodeURIComponent(row.sourceDate)}&checksheet-id=${encodeURIComponent(selectedMonthlyChecksheet.id)}`
												);
											}}
										>
											<td
												className="border border-slate-200 px-3 py-2.5 text-center text-slate-800"
											>
												{row.period}
											</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{row.department}</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{row.role}</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{row.frequency}</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{row.status}</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{row.approvedBy}</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{formatDisplayDateTime(row.approvedAt)}</td>
											<td className="border border-slate-200 px-3 py-2.5 text-center text-slate-800">{row.remarks || "-"}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
