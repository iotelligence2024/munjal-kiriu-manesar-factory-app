import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-preact";

import { Button } from "../../../../components/ui/button";
import { useSession } from "../../../context/SessionContext";
import { isItAdmin } from "../../../../utils/access-control";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

type MasterItem = { id: string; name: string };
type ModuleFlags = {
	travel_requisition: boolean;
	travel_expense_statement: boolean;
	digital_checksheet: boolean;
	department_master: boolean;
	checksheet_master: boolean;
	role_master: boolean;
	user_master: boolean;
	activity_mapping: boolean;
};
type ActivityMappingItem = {
	id?: string;
	department: string;
	role: string;
	modules: ModuleFlags;
};

const modules: Array<{ key: keyof ModuleFlags; label: string }> = [
	{ key: "travel_requisition", label: "Travel Requisition" },
	{ key: "travel_expense_statement", label: "Travel Expense Statement" },
	{ key: "digital_checksheet", label: "Digital Checksheet" },
	{ key: "department_master", label: "Department Master" },
	{ key: "checksheet_master", label: "Checksheet Master" },
	{ key: "role_master", label: "Role Master" },
	{ key: "user_master", label: "User Master" },
	{ key: "activity_mapping", label: "Activity Mapping" },
];

const emptyModules = (): ModuleFlags => ({
	travel_requisition: false,
	travel_expense_statement: false,
	digital_checksheet: false,
	department_master: false,
	checksheet_master: false,
	role_master: false,
	user_master: false,
	activity_mapping: false,
});

const makeKey = (department: string, role: string) =>
	`${department.trim().toLowerCase()}::${role.trim().toLowerCase()}`;

export default function ActivityMappingPage() {
	const { session } = useSession();
	const canEdit = isItAdmin(session);

	const [departments, setDepartments] = useState<MasterItem[]>([]);
	const [roles, setRoles] = useState<MasterItem[]>([]);
	const [items, setItems] = useState<ActivityMappingItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [departmentFilter, setDepartmentFilter] = useState<string>("__all__");

	const allMatrixRows = useMemo(() => {
		const itemMap = new Map(items.map((item) => [makeKey(item.department, item.role), item]));
		const rows: ActivityMappingItem[] = [];

		for (const department of departments) {
			for (const role of roles) {
				const key = makeKey(department.name, role.name);
				const existing = itemMap.get(key);
				rows.push(
					existing ?? {
						department: department.name,
						role: role.name,
						modules: emptyModules(),
					}
				);
			}
		}

		return rows;
	}, [departments, roles, items]);

	const matrixRows = useMemo(
		() =>
			departmentFilter === "__all__"
				? allMatrixRows
				: allMatrixRows.filter((row) => row.department === departmentFilter),
		[allMatrixRows, departmentFilter]
	);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError(null);

				const [departmentResponse, roleResponse, mappingResponse] = await Promise.all([
					fetch(`${API_BASE_URL}/api/department-master`),
					fetch(`${API_BASE_URL}/api/role-master`),
					fetch(`${API_BASE_URL}/api/activity-mapping`),
				]);

				const [departmentPayload, rolePayload, mappingPayload] = await Promise.all([
					departmentResponse.json().catch(() => null),
					roleResponse.json().catch(() => null),
					mappingResponse.json().catch(() => null),
				]);

				if (!departmentResponse.ok) throw new Error(departmentPayload?.message ?? "Unable to load departments.");
				if (!roleResponse.ok) throw new Error(rolePayload?.message ?? "Unable to load roles.");
				if (!mappingResponse.ok) throw new Error(mappingPayload?.message ?? "Unable to load activity mapping.");

				setDepartments(Array.isArray(departmentPayload?.items) ? departmentPayload.items : []);
				setRoles(Array.isArray(rolePayload?.items) ? rolePayload.items : []);
				setItems(Array.isArray(mappingPayload?.items) ? mappingPayload.items : []);
			} catch (loadError) {
				setError(loadError instanceof Error ? loadError.message : "Unable to load activity mapping.");
			} finally {
				setLoading(false);
			}
		};
		void loadData();
	}, []);

	const toggleCell = (row: ActivityMappingItem, key: keyof ModuleFlags) => {
		if (!canEdit) return;
		setMessage(null);
		setItems((current) => {
			const rowKey = makeKey(row.department, row.role);
			const next = [...current];
			const index = next.findIndex((item) => makeKey(item.department, item.role) === rowKey);
			if (index >= 0) {
				next[index] = {
					...next[index],
					modules: {
						...next[index].modules,
						[key]: !next[index].modules[key],
					},
				};
				return next;
			}
			next.push({
				department: row.department,
				role: row.role,
				modules: {
					...emptyModules(),
					[key]: true,
				},
			});
			return next;
		});
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			setError(null);
			setMessage(null);

			const payloadItems = allMatrixRows.map((row) => ({
				department: row.department,
				role: row.role,
				modules: row.modules ?? emptyModules(),
			}));

			const response = await fetch(`${API_BASE_URL}/api/activity-mapping`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items: payloadItems }),
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to save activity mapping.");
			}

			setItems(Array.isArray(payload?.items) ? payload.items : []);
			setMessage(payload?.message ?? "Activity mapping saved successfully.");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to save activity mapping.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5">
			<div className="mb-3 flex flex-wrap items-end justify-between gap-3">
				<div className="space-y-2">
					<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">Activity Mapping</p>
					<div className="w-[260px] max-w-full">
						<Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={loading}>
							<SelectTrigger className="h-10 bg-white text-sm text-slate-700">
								<SelectValue placeholder="Filter by department" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">All Departments</SelectItem>
								{departments.map((department) => (
									<SelectItem key={department.id} value={department.name}>
										{department.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<Button type="button" onClick={() => void handleSave()} disabled={!canEdit || saving || loading} className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">
					{saving ? "Saving..." : "Save Mapping"}
				</Button>
			</div>
			{!canEdit ? <div className="mb-3 rounded-xl border border-[rgba(245,158,11,0.25)] bg-[rgba(254,243,199,0.5)] px-4 py-3 text-sm text-amber-700">Only IT Admin can edit activity mapping.</div> : null}
			{error ? <div className="mb-3 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
			{message ? <div className="mb-3 rounded-xl border border-[rgba(5,150,105,0.2)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm text-[#047857]">{message}</div> : null}
			<div className="h-full overflow-auto rounded-xl border border-slate-300 bg-white/90">
				<table className="w-full min-w-[1200px] table-auto border-collapse text-sm">
					<thead>
						<tr className="bg-slate-100">
							<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Department</th>
							<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">Role</th>
							{modules.map((module) => (
								<th key={module.key} className="border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700">{module.label}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr><td colSpan={modules.length + 2} className="px-3 py-6 text-center text-slate-500">Loading activity mapping...</td></tr>
						) : matrixRows.length === 0 ? (
							<tr><td colSpan={modules.length + 2} className="px-3 py-6 text-center text-slate-500">Add departments and roles to manage activity mapping.</td></tr>
						) : (
							matrixRows.map((row) => (
								<tr key={`${row.department}-${row.role}`} className="odd:bg-slate-50/40 even:bg-white/90 text-slate-800">
									<td className="border border-slate-200 px-3 py-2.5 text-center">{row.department}</td>
									<td className="border border-slate-200 px-3 py-2.5 text-center">{row.role}</td>
									{modules.map((module) => {
										const enabled = Boolean(row.modules?.[module.key]);
										return (
											<td key={module.key} className="border border-slate-200 px-2 py-2 text-center">
												<button
													type="button"
													disabled={!canEdit}
													onClick={() => toggleCell(row, module.key)}
													className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
												>
													{enabled ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-rose-600" />}
												</button>
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
	);
}
