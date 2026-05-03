import { useEffect, useMemo, useRef, useState } from "react";
import { BetweenHorizonalStart, Pencil, Trash2 } from "lucide-preact";

import { Button } from "../../../../components/ui/button";
import { Checkbox } from "../../../../components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

type MasterItem = {
	id: string;
	name: string;
};

type MappingFieldState = {
	id: string;
	key: string;
	name: string;
	enable: boolean;
	sequence: number;
	input: boolean;
	mandatory: boolean;
};

type CheckPointRow = {
	id: string;
	enable: boolean;
	[key: string]: string | boolean;
};

type AuthorizationRow = {
	id: string;
	department: string;
	role: string;
	enable: boolean;
	frequency: string;
};

type ChecksheetItem = {
	id: string;
	name: string;
	"line-name": string;
	model: string;
	"revision-no": number;
	"revision-date": string;
	status: string;
	"check-points-mapping": Record<
		string,
		{ enable: boolean; name: string; sequence: number; input: boolean; mandatory: boolean }
	>;
	"check-points": Array<Record<string, unknown>>;
	authorization?: Record<string, Record<string, { enable: boolean; frequency: string }>>;
	"revision-history"?: Record<string, unknown>;
};

type FormState = {
	name: string;
	"line-name": string;
	model: string;
	status: string;
};

const defaultMappingFields: MappingFieldState[] = [
	{ id: "sr-no", key: "sr-no", name: "Sr No", enable: true, sequence: 1, input: false, mandatory: false },
	{ id: "inspection-items", key: "inspection-items", name: "Inspection Items", enable: true, sequence: 2, input: false, mandatory: false },
	{ id: "standard", key: "standard", name: "Standard", enable: true, sequence: 3, input: false, mandatory: false },
	{ id: "method", key: "method", name: "Method", enable: true, sequence: 4, input: false, mandatory: false },
	{ id: "frequency", key: "frequency", name: "Frequency", enable: true, sequence: 5, input: false, mandatory: false },
	{ id: "department", key: "department", name: "Department", enable: true, sequence: 6, input: false, mandatory: false },
	{ id: "responsibility", key: "responsibility", name: "Responsibility", enable: true, sequence: 7, input: false, mandatory: false },
	{ id: "judgment", key: "judgment", name: "Judgment", enable: true, sequence: 8, input: true, mandatory: false },
	{ id: "remarks", key: "remarks", name: "Remarks", enable: true, sequence: 9, input: true, mandatory: false },
];

const emptyForm = (): FormState => ({
	name: "",
	"line-name": "",
	model: "",
	status: "active",
});

const summaryShellClassName =
	"min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5";
const sectionClassName =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";
const inputShellClassName =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";
const inputClassName =
	"h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none";
const flatInputStyle = {
	border: "none",
	outline: "none",
	boxShadow: "none",
	WebkitBoxShadow: "none",
};
const tableInputClassName =
	"h-9 !border-0 !bg-transparent text-sm !shadow-none outline-none !ring-0 focus:!border-0 focus:outline-none focus:!ring-0 focus:!shadow-none focus-visible:!border-0 focus-visible:outline-none focus-visible:!ring-0 focus-visible:!shadow-none";
const autoGrowTextareaClassName =
	"min-h-[2.25rem] resize-none overflow-hidden !border-0 !bg-transparent px-0 py-2 text-sm !shadow-none outline-none !ring-0 focus:!border-0 focus:outline-none focus:!ring-0 focus:!shadow-none focus-visible:!border-0 focus-visible:outline-none focus-visible:!ring-0 focus-visible:!shadow-none";
const fieldLabelClassName = "text-sm font-medium text-[#4d5560]";
const tableHeadClassName = "border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700 align-top";
const tableCellClassName = "border border-slate-200 px-3 py-2.5 text-slate-800 align-top";
const summaryTableCellClassName = `${tableCellClassName} text-center`;
const OTHER_LINE_OPTION = "__other__";
const OTHER_MODEL_OPTION = "__other_model__";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatDisplayDate = (value: string) => {
	if (!value) return "";

	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;

	return `${day}-${month}-${year}`;
};

const createMappingField = (
	sequence: number,
	overrides: Partial<MappingFieldState> = {}
): MappingFieldState => ({
	id: overrides.id ?? createId(),
	key: overrides.key ?? "",
	name: overrides.name ?? "",
	enable: overrides.enable ?? true,
	sequence,
	input: overrides.input ?? false,
	mandatory: overrides.mandatory ?? false,
});

const buildEmptyCheckPointRow = (mappingFields: MappingFieldState[]): CheckPointRow => {
	const row: CheckPointRow = {
		id: createId(),
		enable: true,
	};

	mappingFields
		.filter((field) => field.enable)
		.forEach((field) => {
			row[field.key] = "";
		});

	return row;
};

const buildEmptyAuthorizationRow = (): AuthorizationRow => ({
	id: createId(),
	department: "",
	role: "",
	enable: true,
	frequency: "",
});

const normalizeMappingFields = (fields: MappingFieldState[]) =>
	fields
		.slice()
		.sort((first, second) => first.sequence - second.sequence)
		.map((field, index) => ({
			...field,
			sequence: index + 1,
		}));

const mappingToRows = (
	mapping: Record<string, { enable: boolean; name: string; sequence: number; input: boolean; mandatory?: boolean }> | undefined
) => {
	if (!mapping || Object.keys(mapping).length === 0) {
		return defaultMappingFields;
	}

	const rows = Object.entries(mapping).map(([key, value]) =>
		createMappingField(value.sequence, {
			id: key,
			key,
			name: value.name ?? "",
			enable: Boolean(value.enable),
			input: Boolean(value.input),
			mandatory: Boolean(value.mandatory),
			sequence: Number(value.sequence ?? 0),
		})
	);

	const hasDepartment = rows.some((row) => row.key.trim().toLowerCase() === "department");
	const hasSrNo = rows.some((row) => row.key.trim().toLowerCase() === "sr-no");
	if (!hasSrNo) {
		rows.push(
			createMappingField(0.5, {
				id: "sr-no",
				key: "sr-no",
				name: "Sr No",
				enable: true,
				input: false,
				mandatory: false,
			})
		);
	}

	if (!hasDepartment) {
		const responsibilityRow = rows.find(
			(row) => row.key.trim().toLowerCase() === "responsibility"
		);
		const sequence =
			responsibilityRow && Number.isFinite(responsibilityRow.sequence)
				? responsibilityRow.sequence - 0.5
				: rows.length + 1;

		rows.push(
			createMappingField(sequence, {
				id: "department",
				key: "department",
				name: "Department",
				enable: true,
				input: false,
				mandatory: false,
			})
		);
	}

	return normalizeMappingFields(rows);
};

const authorizationToRows = (
	authorization: Record<string, Record<string, { enable: boolean; frequency: string }>> | undefined
) => {
	const rows: AuthorizationRow[] = [];

	Object.entries(authorization ?? {}).forEach(([department, roles]) => {
		Object.entries(roles ?? {}).forEach(([role, details]) => {
			rows.push({
				id: createId(),
				department,
				role,
				enable: Boolean(details?.enable),
				frequency: details?.frequency ?? "",
			});
		});
	});

	return rows.length > 0 ? rows : [buildEmptyAuthorizationRow()];
};

const AutoGrowTextarea = ({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}) => {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const resizeTextarea = () => {
		const target = textareaRef.current;
		if (!target) return;

		target.style.height = "auto";
		target.style.height = `${target.scrollHeight}px`;
	};

	useEffect(() => {
		resizeTextarea();
		const frameId = window.requestAnimationFrame(() => {
			resizeTextarea();
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [value]);

	return (
		<Textarea
			ref={textareaRef}
			rows={1}
			value={value}
			placeholder={placeholder}
			onInput={(event) => {
				const target = event.currentTarget;
				target.style.height = "auto";
				target.style.height = `${target.scrollHeight}px`;
			}}
			onFocus={resizeTextarea}
			onChange={(event) => onChange(event.currentTarget.value)}
			className={autoGrowTextareaClassName}
			style={flatInputStyle}
		/>
	);
};

export default function ChecksheetMasterPage() {
	const [items, setItems] = useState<ChecksheetItem[]>([]);
	const [departments, setDepartments] = useState<MasterItem[]>([]);
	const [roles, setRoles] = useState<MasterItem[]>([]);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [mappingFields, setMappingFields] = useState<MappingFieldState[]>(defaultMappingFields);
	const [checkPoints, setCheckPoints] = useState<CheckPointRow[]>([
		buildEmptyCheckPointRow(defaultMappingFields),
	]);
	const [authorizationRows, setAuthorizationRows] = useState<AuthorizationRow[]>([
		buildEmptyAuthorizationRow(),
	]);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingId, setEditingId] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [lineNameSelection, setLineNameSelection] = useState(OTHER_LINE_OPTION);
	const [modelSelection, setModelSelection] = useState(OTHER_MODEL_OPTION);

	const enabledMappingFields = useMemo(
		() =>
			[...mappingFields]
				.filter((field) => field.enable && field.key.trim())
				.sort((first, second) => first.sequence - second.sequence),
		[mappingFields]
	);

	const activeChecksheet = useMemo(
		() => items.find((item) => item.id === editingId) ?? null,
		[editingId, items]
	);
	const lineNameOptions = useMemo(
		() =>
			Array.from(
				new Set(
					items
						.map((item) => String(item["line-name"] ?? "").trim())
						.filter(Boolean)
				)
			).sort((first, second) => first.localeCompare(second)),
		[items]
	);
	const modelOptions = useMemo(
		() =>
			Array.from(
				new Set(
					items
						.map((item) => String(item.model ?? "").trim())
						.filter(Boolean)
				)
			).sort((first, second) => first.localeCompare(second)),
		[items]
	);

	const autoRevisionNo = activeChecksheet ? Number(activeChecksheet["revision-no"] ?? 1) + 1 : 1;
	const autoRevisionDate = new Date().toISOString().slice(0, 10);
	const autoRevisionDateDisplay = formatDisplayDate(autoRevisionDate);

	const loadData = async () => {
		try {
			setLoading(true);
			setError(null);

			const [checksheetResponse, departmentResponse, roleResponse] = await Promise.all([
				fetch(`${API_BASE_URL}/api/checksheet-master`),
				fetch(`${API_BASE_URL}/api/department-master`),
				fetch(`${API_BASE_URL}/api/role-master`),
			]);

			const [checksheetPayload, departmentPayload, rolePayload] = await Promise.all([
				checksheetResponse.json().catch(() => null),
				departmentResponse.json().catch(() => null),
				roleResponse.json().catch(() => null),
			]);

			if (!checksheetResponse.ok) {
				throw new Error(checksheetPayload?.message ?? "Unable to load checksheet master.");
			}
			if (!departmentResponse.ok) {
				throw new Error(departmentPayload?.message ?? "Unable to load department master.");
			}
			if (!roleResponse.ok) {
				throw new Error(rolePayload?.message ?? "Unable to load role master.");
			}

			setItems(Array.isArray(checksheetPayload?.items) ? checksheetPayload.items : []);
			setDepartments(Array.isArray(departmentPayload?.items) ? departmentPayload.items : []);
			setRoles(Array.isArray(rolePayload?.items) ? rolePayload.items : []);
		} catch (loadError) {
			setError(
				loadError instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: loadError instanceof Error
						? loadError.message
						: "Unable to load checksheet data."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	const resetForm = () => {
		setForm(emptyForm());
		setMappingFields(defaultMappingFields);
		setCheckPoints([buildEmptyCheckPointRow(defaultMappingFields)]);
		setAuthorizationRows([buildEmptyAuthorizationRow()]);
		setEditingId("");
		setLineNameSelection(OTHER_LINE_OPTION);
		setModelSelection(OTHER_MODEL_OPTION);
	};

	const handleOpenCreateModal = () => {
		resetForm();
		if (lineNameOptions.length > 0) {
			setLineNameSelection(lineNameOptions[0]);
			setForm((current) => ({ ...current, "line-name": lineNameOptions[0] }));
		}
		if (modelOptions.length > 0) {
			setModelSelection(modelOptions[0]);
			setForm((current) => ({ ...current, model: modelOptions[0] }));
		}
		setError(null);
		setMessage(null);
		setModalOpen(true);
	};

	const handleEditExisting = (item: ChecksheetItem) => {
		const nextMappingFields = mappingToRows(item["check-points-mapping"]);
		const nextCheckPoints =
			Array.isArray(item["check-points"]) && item["check-points"].length > 0
				? item["check-points"].map((point) => {
						const row: CheckPointRow = {
							id: createId(),
							enable: Boolean(point?.enable ?? true),
						};

						nextMappingFields
							.filter((field) => field.enable && field.key.trim())
							.forEach((field) => {
								const value = point?.[field.key];
								row[field.key] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
							});

						return row;
					})
				: [buildEmptyCheckPointRow(nextMappingFields)];

		setEditingId(item.id);
		setForm({
			name: item.name ?? "",
			"line-name": item["line-name"] ?? "",
			model: item.model ?? "",
			status: item.status ?? "active",
		});
		setLineNameSelection(item["line-name"] ?? OTHER_LINE_OPTION);
		setModelSelection(item.model ?? OTHER_MODEL_OPTION);
		setMappingFields(nextMappingFields);
		setCheckPoints(nextCheckPoints);
		setAuthorizationRows(authorizationToRows(item.authorization));
		setError(null);
		setMessage(`Editing checksheet "${item.name}".`);
		setModalOpen(true);
	};

	const handleFormChange = (field: keyof FormState, value: string) => {
		setForm((current) => ({ ...current, [field]: value }));
	};

	const handleMappingChange = (id: string, field: keyof MappingFieldState, value: string | boolean) => {
		setMappingFields((current) =>
			normalizeMappingFields(
				current.map((item) =>
					item.id === id
						? {
								...item,
								[field]: value,
							}
						: item
				)
			)
		);
	};

	const handleInsertMappingField = (sequence: number) => {
		setMappingFields((current) => normalizeMappingFields([...current, createMappingField(sequence)]));
	};

	const handleRemoveMappingField = (id: string) => {
		setMappingFields((current) => {
			if (current.length === 1) return current;
			return normalizeMappingFields(current.filter((item) => item.id !== id));
		});
	};

	useEffect(() => {
		setCheckPoints((current) => {
			const nextRows = current.map((row) => {
				const nextRow: CheckPointRow = {
					id: String(row.id),
					enable: Boolean(row.enable),
				};

				enabledMappingFields.forEach((field) => {
					nextRow[field.key] = typeof row[field.key] === "string" ? String(row[field.key]) : "";
				});

				return nextRow;
			});

			return nextRows.length > 0 ? nextRows : [buildEmptyCheckPointRow(mappingFields)];
		});
	}, [enabledMappingFields.length, mappingFields]);

	const handleRemoveRow = (id: string) => {
		setCheckPoints((current) => {
			const nextRows = current.filter((row) => row.id !== id);
			return nextRows.length > 0 ? nextRows : [buildEmptyCheckPointRow(mappingFields)];
		});
	};

	const handleInsertCheckPointRow = (index: number) => {
		setCheckPoints((current) => {
			const nextRows = [...current];
			nextRows.splice(index + 1, 0, buildEmptyCheckPointRow(mappingFields));
			return nextRows;
		});
	};

	const handleCheckPointChange = (id: string, key: string, value: string | boolean) => {
		setCheckPoints((current) =>
			current.map((row) => (row.id === id ? { ...row, [key]: value } : row))
		);
	};

	const handleAuthorizationChange = (
		id: string,
		field: keyof AuthorizationRow,
		value: string | boolean
	) => {
		setAuthorizationRows((current) =>
			current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
		);
	};

	const handleInsertAuthorizationRow = (index: number) => {
		setAuthorizationRows((current) => {
			const nextRows = [...current];
			nextRows.splice(index + 1, 0, buildEmptyAuthorizationRow());
			return nextRows;
		});
	};

	const handleRemoveAuthorizationRow = (id: string) => {
		setAuthorizationRows((current) => {
			const nextRows = current.filter((row) => row.id !== id);
			return nextRows.length > 0 ? nextRows : [buildEmptyAuthorizationRow()];
		});
	};

	const buildPayload = () => {
		const mappingPayload = enabledMappingFields.reduce<Record<string, { enable: boolean; name: string; sequence: number; input: boolean; mandatory: boolean }>>(
			(accumulator, field) => {
				accumulator[field.key.trim()] = {
					enable: field.enable,
					name: field.name.trim() || field.key.trim(),
					sequence: field.sequence,
					input: field.input,
					mandatory: field.input ? field.mandatory : false,
				};
				return accumulator;
			},
			{}
		);

		const checkPointPayload = checkPoints.map((row, index) => {
			const entry: Record<string, unknown> = {
				enable: Boolean(row.enable),
			};

			enabledMappingFields.forEach((field) => {
				const fieldKey = field.key.trim();
				if (fieldKey === "sr-no") {
					entry[fieldKey] = String(index + 1);
					return;
				}
				const rawValue = typeof row[fieldKey] === "string" ? String(row[fieldKey]).trim() : "";
				entry[fieldKey] =
					fieldKey === "judgment"
						? rawValue.split(",").map((value) => value.trim()).filter(Boolean)
						: rawValue;
			});

			return entry;
		});

		const authorizationPayload = authorizationRows.reduce<Record<string, Record<string, { enable: boolean; frequency: string }>>>(
			(accumulator, row) => {
				const department = row.department.trim();
				const role = row.role.trim();
				if (!department || !role) return accumulator;

				if (!accumulator[department]) {
					accumulator[department] = {};
				}

				accumulator[department][role] = {
					enable: Boolean(row.enable),
					frequency: row.frequency.trim(),
				};

				return accumulator;
			},
			{}
		);

		return {
			...form,
			"revision-no": autoRevisionNo,
			"revision-date": autoRevisionDate,
			"check-points-mapping": mappingPayload,
			"check-points": checkPointPayload,
			authorization: authorizationPayload,
		};
	};

	const handleSave = async () => {
		if (!form.name.trim() || !form["line-name"].trim() || !form.model.trim()) return;
		if (enabledMappingFields.length === 0) {
			setError("Enable at least one mapping field before adding check points.");
			return;
		}

		try {
			setSaving(true);
			setError(null);
			setMessage(null);

			const response = await fetch(
				editingId ? `${API_BASE_URL}/api/checksheet-master/${editingId}` : `${API_BASE_URL}/api/checksheet-master`,
				{
					method: editingId ? "PATCH" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(buildPayload()),
				}
			);
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to save checksheet.");
			}

			resetForm();
			setModalOpen(false);
			setMessage(payload?.message ?? (editingId ? "Checksheet updated successfully." : "Checksheet created successfully."));
			await loadData();
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to save checksheet.");
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteChecksheet = async (item: ChecksheetItem) => {
		const confirmed = window.confirm(`Delete checksheet "${item.name}"? This action cannot be undone.`);
		if (!confirmed) return;

		try {
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/checksheet-master/${item.id}`, {
				method: "DELETE",
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to delete checksheet.");
			}

			setMessage(payload?.message ?? "Checksheet deleted successfully.");
			await loadData();
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Unable to delete checksheet.");
		}
	};

	const renderFormSections = () => (
		<div className="space-y-4">
			{error ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
			<div className={sectionClassName}>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
					<div className="space-y-2">
						<Label className={fieldLabelClassName}>Name</Label>
						<div className={inputShellClassName}>
							<Input value={form.name} disabled={Boolean(editingId)} onChange={(e) => handleFormChange("name", e.currentTarget.value)} className={inputClassName} style={flatInputStyle} />
						</div>
					</div>
					<div className="space-y-2">
						<Label className={fieldLabelClassName}>Line Name</Label>
						<div className={inputShellClassName}>
							{editingId ? (
								<Input value={form["line-name"]} disabled className={inputClassName} style={flatInputStyle} />
							) : (
								<Select
									value={lineNameSelection}
									onValueChange={(value) => {
										setLineNameSelection(value);
										handleFormChange("line-name", value === OTHER_LINE_OPTION ? "" : value);
									}}
								>
									<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
										<SelectValue placeholder="Select existing line name or Other" />
									</SelectTrigger>
									<SelectContent>
										{lineNameOptions.map((lineName) => (
											<SelectItem key={lineName} value={lineName}>
												{lineName}
											</SelectItem>
										))}
										<SelectItem value={OTHER_LINE_OPTION}>Other</SelectItem>
									</SelectContent>
								</Select>
							)}
						</div>
						{!editingId && lineNameSelection === OTHER_LINE_OPTION ? (
							<div className={inputShellClassName}>
								<Input
									value={form["line-name"]}
									onChange={(e) => handleFormChange("line-name", e.currentTarget.value)}
									placeholder="Enter new line name"
									className={inputClassName}
									style={flatInputStyle}
								/>
							</div>
						) : null}
					</div>
					<div className="space-y-2">
						<Label className={fieldLabelClassName}>Model</Label>
						<div className={inputShellClassName}>
							{editingId ? (
								<Input value={form.model} disabled className={inputClassName} style={flatInputStyle} />
							) : (
								<Select
									value={modelSelection}
									onValueChange={(value) => {
										setModelSelection(value);
										handleFormChange("model", value === OTHER_MODEL_OPTION ? "" : value);
									}}
								>
									<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
										<SelectValue placeholder="Select existing model or Other" />
									</SelectTrigger>
									<SelectContent>
										{modelOptions.map((model) => (
											<SelectItem key={model} value={model}>
												{model}
											</SelectItem>
										))}
										<SelectItem value={OTHER_MODEL_OPTION}>Other</SelectItem>
									</SelectContent>
								</Select>
							)}
						</div>
						{!editingId && modelSelection === OTHER_MODEL_OPTION ? (
							<div className={inputShellClassName}>
								<Input
									value={form.model}
									onChange={(e) => handleFormChange("model", e.currentTarget.value)}
									placeholder="Enter new model"
									className={inputClassName}
									style={flatInputStyle}
								/>
							</div>
						) : null}
					</div>
					<div className="space-y-2">
						<Label className={fieldLabelClassName}>Revision No</Label>
						<div className={inputShellClassName}>
							<Input value={String(autoRevisionNo)} disabled className={inputClassName} style={flatInputStyle} />
						</div>
					</div>
					<div className="space-y-2">
						<Label className={fieldLabelClassName}>Revision Date</Label>
						<div className={inputShellClassName}>
							<Input value={autoRevisionDateDisplay} disabled className={inputClassName} style={flatInputStyle} />
						</div>
					</div>
					<div className="space-y-2">
						<Label className={fieldLabelClassName}>Status</Label>
						<div className={inputShellClassName}>
							<Select value={form.status} onValueChange={(value) => handleFormChange("status", value)}>
								<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>

			<div className={sectionClassName}>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-base font-semibold text-slate-800">Step 1: Check-Points Mapping</h2>
				</div>
				<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
					<table className="w-full min-w-[860px] table-auto border-collapse text-sm">
						<thead>
							<tr className="bg-slate-100">
								<th className={tableHeadClassName}>Sequence</th>
								<th className={tableHeadClassName}>Key</th>
								<th className={tableHeadClassName}>Display Name</th>
								<th className={tableHeadClassName}>Enable</th>
								<th className={tableHeadClassName}>Input</th>
								<th className={tableHeadClassName}>Mandatory</th>
								<th className={tableHeadClassName}>Action</th>
							</tr>
						</thead>
						<tbody>
							{mappingFields.map((field) => (
								<tr key={field.id} className="odd:bg-slate-50/40 even:bg-white/90">
									<td className={tableCellClassName}>{field.sequence}</td>
									<td className={tableCellClassName}>
										<Input value={field.key} onChange={(e) => handleMappingChange(field.id, "key", e.currentTarget.value)} className={tableInputClassName} style={flatInputStyle} />
									</td>
									<td className={tableCellClassName}>
										<Input value={field.name} onChange={(e) => handleMappingChange(field.id, "name", e.currentTarget.value)} className={tableInputClassName} style={flatInputStyle} />
									</td>
									<td className={tableCellClassName}>
										<div className="flex justify-center">
											<Checkbox checked={field.enable} onCheckedChange={(checked) => handleMappingChange(field.id, "enable", checked === true)} />
										</div>
									</td>
									<td className={tableCellClassName}>
										<div className="flex justify-center">
											<Checkbox checked={field.input} onCheckedChange={(checked) => handleMappingChange(field.id, "input", checked === true)} />
										</div>
									</td>
									<td className={tableCellClassName}>
										<div className="flex justify-center">
											<Checkbox
												checked={field.input && field.mandatory}
												disabled={!field.input}
												onCheckedChange={(checked) => handleMappingChange(field.id, "mandatory", checked === true)}
											/>
										</div>
									</td>
									<td className={tableCellClassName}>
										<div className="flex items-center justify-center gap-2">
											<Button type="button" variant="outline" onClick={() => handleInsertMappingField(field.sequence + 0.5)} className="h-8 rounded-md border-slate-300 bg-white px-2 text-xs text-slate-700" title="Insert row below">
												<BetweenHorizonalStart className="h-3.5 w-3.5" />
											</Button>
											<Button type="button" variant="outline" onClick={() => handleRemoveMappingField(field.id)} disabled={mappingFields.length === 1} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-2 text-xs text-[#b91c1c]" title="Delete row">
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className={sectionClassName}>
				<div className="mb-3 flex items-center justify-between gap-3">
					<h2 className="text-base font-semibold text-slate-800">Step 2: Check-Points</h2>
				</div>
				<div className="mb-3 text-sm text-slate-600">
					For `judgment`, enter comma-separated values like `OK, NG`.
				</div>
				<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
					<table className="w-full min-w-[860px] table-auto border-collapse text-sm">
						<thead>
							<tr className="bg-slate-100">
								{enabledMappingFields.map((field) => (
									<th key={field.id} className={tableHeadClassName}>{field.name || field.key}</th>
								))}
								<th className={tableHeadClassName}>Enable</th>
								<th className={tableHeadClassName}>Action</th>
							</tr>
						</thead>
						<tbody>
							{checkPoints.map((row, index) => (
								<tr key={row.id} className="odd:bg-slate-50/40 even:bg-white/90">
										{enabledMappingFields.map((field) => (
										<td key={`${row.id}-${field.id}`} className={tableCellClassName}>
											{field.key === "sr-no" ? (
												<Input
													value={String(index + 1)}
													disabled
													className={tableInputClassName}
													style={flatInputStyle}
												/>
											) : field.key === "inspection-items" || field.key === "standard" ? (
												<AutoGrowTextarea
													value={typeof row[field.key] === "string" ? String(row[field.key]) : ""}
													onChange={(value) => handleCheckPointChange(row.id, field.key, value)}
												/>
											) : field.key === "responsibility" ? (
												<Select
													value={(typeof row[field.key] === "string" ? String(row[field.key]) : "") || "__empty__"}
													onValueChange={(value) => handleCheckPointChange(row.id, field.key, value === "__empty__" ? "" : value)}
												>
													<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
														<SelectValue placeholder="Select role" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__empty__">Select role</SelectItem>
														{roles.map((item) => (
															<SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : field.key === "department" ? (
												<Select
													value={(typeof row[field.key] === "string" ? String(row[field.key]) : "") || "__empty__"}
													onValueChange={(value) => handleCheckPointChange(row.id, field.key, value === "__empty__" ? "" : value)}
												>
													<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
														<SelectValue placeholder="Select department" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__empty__">Select department</SelectItem>
														{departments.map((item) => (
															<SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : field.key === "frequency" ? (
												<Select
													value={(typeof row[field.key] === "string" ? String(row[field.key]) : "") || "__empty__"}
													onValueChange={(value) => handleCheckPointChange(row.id, field.key, value === "__empty__" ? "" : value)}
												>
													<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
														<SelectValue placeholder="Select frequency" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="__empty__">Select frequency</SelectItem>
														<SelectItem value="Daily">Daily</SelectItem>
														<SelectItem value="Weekly">Weekly</SelectItem>
														<SelectItem value="Monthly">Monthly</SelectItem>
													</SelectContent>
												</Select>
											) : (
												<Input value={typeof row[field.key] === "string" ? String(row[field.key]) : ""} onChange={(e) => handleCheckPointChange(row.id, field.key, e.currentTarget.value)} className={tableInputClassName} style={flatInputStyle} />
											)}
										</td>
									))}
									<td className={tableCellClassName}>
										<div className="flex justify-center">
											<Checkbox checked={Boolean(row.enable)} onCheckedChange={(checked) => handleCheckPointChange(row.id, "enable", checked === true)} />
										</div>
									</td>
									<td className={tableCellClassName}>
										<div className="flex items-center justify-center gap-2">
											<Button type="button" variant="outline" onClick={() => handleInsertCheckPointRow(index)} className="h-8 rounded-md border-slate-300 bg-white px-2 text-xs text-slate-700" title="Insert row below">
												<BetweenHorizonalStart className="h-3.5 w-3.5" />
											</Button>
											<Button type="button" variant="outline" onClick={() => handleRemoveRow(String(row.id))} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-2 text-xs text-[#b91c1c]" title="Delete row">
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className={sectionClassName}>
				<div className="mb-3 flex items-center justify-between gap-3">
					<h2 className="text-base font-semibold text-slate-800">Step 3: Authorization</h2>
				</div>
				<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
					<table className="w-full min-w-[860px] table-auto border-collapse text-sm">
						<thead>
							<tr className="bg-slate-100">
								<th className={tableHeadClassName}>Department</th>
								<th className={tableHeadClassName}>Role</th>
								<th className={tableHeadClassName}>Frequency</th>
								<th className={tableHeadClassName}>Enable</th>
								<th className={tableHeadClassName}>Action</th>
							</tr>
						</thead>
						<tbody>
							{authorizationRows.map((row, index) => (
								<tr key={row.id} className="odd:bg-slate-50/40 even:bg-white/90">
									<td className={tableCellClassName}>
										<Select value={row.department || "__empty__"} onValueChange={(value) => handleAuthorizationChange(row.id, "department", value === "__empty__" ? "" : value)}>
											<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
												<SelectValue placeholder="Select department" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__empty__">Select department</SelectItem>
												{departments.map((item) => (
													<SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</td>
									<td className={tableCellClassName}>
										<Select value={row.role || "__empty__"} onValueChange={(value) => handleAuthorizationChange(row.id, "role", value === "__empty__" ? "" : value)}>
											<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__empty__">Select role</SelectItem>
												{roles.map((item) => (
													<SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</td>
									<td className={tableCellClassName}>
										<Select value={row.frequency || "__empty__"} onValueChange={(value) => handleAuthorizationChange(row.id, "frequency", value === "__empty__" ? "" : value)}>
											<SelectTrigger className="h-9 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
												<SelectValue placeholder="Select frequency" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__empty__">Select frequency</SelectItem>
												<SelectItem value="Daily">Daily</SelectItem>
												<SelectItem value="Weekly">Weekly</SelectItem>
												<SelectItem value="Monthly">Monthly</SelectItem>
											</SelectContent>
										</Select>
									</td>
									<td className={tableCellClassName}>
										<div className="flex justify-center">
											<Checkbox checked={row.enable} onCheckedChange={(checked) => handleAuthorizationChange(row.id, "enable", checked === true)} />
										</div>
									</td>
									<td className={tableCellClassName}>
										<div className="flex items-center justify-center gap-2">
											<Button type="button" variant="outline" onClick={() => handleInsertAuthorizationRow(index)} className="h-8 rounded-md border-slate-300 bg-white px-2 text-xs text-slate-700" title="Insert row below">
												<BetweenHorizonalStart className="h-3.5 w-3.5" />
											</Button>
											<Button type="button" variant="outline" onClick={() => handleRemoveAuthorizationRow(row.id)} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-2 text-xs text-[#b91c1c]" title="Delete row">
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="mt-4 flex justify-end">
					<Button type="button" onClick={() => void handleSave()} disabled={saving || !form.name.trim() || !form["line-name"].trim() || !form.model.trim() || enabledMappingFields.length === 0} className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">
						{saving ? "Saving..." : editingId ? "Update Checksheet" : "Create Checksheet"}
					</Button>
				</div>
			</div>
		</div>
	);

	return (
		<div className={`${summaryShellClassName} space-y-4 overflow-auto`}>
			<div className="flex items-center justify-between gap-3">
				<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
					Checksheet Master
				</p>
				<Button type="button" onClick={handleOpenCreateModal} className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">
					Create Checksheet
				</Button>
			</div>

			{message ? <div className="rounded-xl border border-[rgba(5,150,105,0.2)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm text-[#047857]">{message}</div> : null}
			{!modalOpen && error ? <div className="rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}

			<div className={sectionClassName}>
				<div className="overflow-auto rounded-xl border border-slate-300 bg-white/80">
					<table className="w-full min-w-[820px] table-auto border-collapse text-sm">
						<thead>
							<tr className="bg-slate-100">
								<th className={tableHeadClassName}>Name</th>
								<th className={tableHeadClassName}>Line Name</th>
								<th className={tableHeadClassName}>Model</th>
								<th className={tableHeadClassName}>Revision No</th>
								<th className={tableHeadClassName}>Revision Date</th>
								<th className={tableHeadClassName}>Status</th>
								<th className={tableHeadClassName}>Check Points</th>
								<th className={tableHeadClassName}>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={8} className="px-3 py-6 text-center text-slate-500">Loading checksheets...</td>
								</tr>
							) : items.length === 0 ? (
								<tr>
									<td colSpan={8} className="px-3 py-6 text-center text-slate-500">No checksheets available.</td>
								</tr>
							) : (
								items.map((item) => (
									<tr key={item.id} className="cursor-pointer odd:bg-slate-50/40 even:bg-white/90 hover:bg-sky-50/70" onClick={() => handleEditExisting(item)}>
										<td className={summaryTableCellClassName}>{item.name}</td>
										<td className={summaryTableCellClassName}>{item["line-name"]}</td>
										<td className={summaryTableCellClassName}>{item.model}</td>
										<td className={summaryTableCellClassName}>{item["revision-no"]}</td>
										<td className={summaryTableCellClassName}>{formatDisplayDate(item["revision-date"])}</td>
										<td className={summaryTableCellClassName}>{item.status}</td>
										<td className={summaryTableCellClassName}>{item["check-points"]?.length ?? 0}</td>
										<td className={summaryTableCellClassName}>
											<div className="flex items-center justify-center gap-2">
												<Button type="button" variant="outline" onClick={(event) => {
													event.stopPropagation();
													handleEditExisting(item);
												}} className="h-8 rounded-md border-slate-300 bg-white px-2 text-xs text-slate-700" title="Edit checksheet">
													<Pencil className="h-3.5 w-3.5" />
												</Button>
												<Button type="button" variant="outline" onClick={(event) => {
													event.stopPropagation();
													void handleDeleteChecksheet(item);
												}} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-2 text-xs text-[#b91c1c]" title="Delete checksheet">
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<Dialog
				open={modalOpen}
				onOpenChange={(open) => {
					setModalOpen(open);
					if (!open) {
						resetForm();
						setError(null);
					}
				}}
			>
				<DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-[rgba(30,64,175,0.16)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(235,243,251,0.98))] sm:max-w-[min(96vw,90rem)]">
					<DialogHeader className="border-b border-[rgba(30,64,175,0.1)] bg-[linear-gradient(180deg,rgba(248,250,255,0.96),rgba(226,236,249,0.84))] px-6 py-6">
						<DialogTitle className="pt-3 text-2xl tracking-[-0.03em] text-[#17181d]">
							{editingId ? "Edit Checksheet" : "Create Checksheet"}
						</DialogTitle>
					</DialogHeader>
					<div className="px-1 pb-2 pt-4">
						{renderFormSections()}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
