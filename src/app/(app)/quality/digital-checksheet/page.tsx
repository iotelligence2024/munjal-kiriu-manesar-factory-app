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
			</div>
		</div>
	);
}
