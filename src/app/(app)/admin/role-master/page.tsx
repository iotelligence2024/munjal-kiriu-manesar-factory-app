import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-preact";

import { Button } from "../../../../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

type MasterItem = {
	id: string;
	name: string;
};

const flatInputStyle = {
	border: "none",
	outline: "none",
	boxShadow: "none",
	WebkitBoxShadow: "none",
};

const secondaryButtonClassName =
	"rounded-[1rem] border border-[rgba(30,64,175,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(231,239,250,0.9))] text-[#1e3a8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_20px_rgba(15,23,42,0.06)] transition-[background-color,border-color,color,box-shadow] hover:border-[rgba(30,64,175,0.28)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(226,236,249,0.96))] hover:text-[#1d4ed8] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_14px_28px_rgba(30,64,175,0.1)]";
const signupSectionClassName =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";
const signupInputShellClassName =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";
const fieldLabelClassName = "text-sm font-medium text-[#4d5560]";

const summaryShellClassName =
	"min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5";

const inputClassName =
	"bg-white text-slate-800 placeholder:text-slate-400 focus:border-slate-300 focus:ring-0";

const tableHeadClassName = "border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700";
const actionHeadClassName = `${tableHeadClassName} w-px whitespace-nowrap`;
const tableCellClassName = "border border-slate-200 px-3 py-2.5 text-center text-slate-800";
const actionCellClassName = `${tableCellClassName} w-px whitespace-nowrap`;

export default function RoleMasterPage() {
	const [items, setItems] = useState<MasterItem[]>([]);
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [editId, setEditId] = useState("");
	const [editName, setEditName] = useState("");
	const [savingEdit, setSavingEdit] = useState(false);

	const loadItems = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch(`${API_BASE_URL}/api/role-master`);
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to load role master.");
			}

			setItems(Array.isArray(payload?.items) ? payload.items : []);
		} catch (loadError) {
			setError(
				loadError instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: loadError instanceof Error
						? loadError.message
						: "Unable to load role master."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadItems();
	}, []);

	const handleCreate = async () => {
		if (!name.trim()) return;

		try {
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/role-master`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to create role.");
			}

			setName("");
			setMessage(payload?.message ?? "Role created successfully.");
			await loadItems();
		} catch (createError) {
			setError(createError instanceof Error ? createError.message : "Unable to create role.");
		}
	};

	const handleDelete = async (id: string) => {
		const confirmed = window.confirm("Delete this role?");
		if (!confirmed) return;

		try {
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/role-master/${id}`, {
				method: "DELETE",
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to delete role.");
			}

			setMessage(payload?.message ?? "Role deleted successfully.");
			await loadItems();
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Unable to delete role.");
		}
	};

	const openEditDialog = (item: MasterItem) => {
		setEditId(item.id);
		setEditName(item.name);
		setEditOpen(true);
	};

	const handleEdit = async () => {
		if (!editName.trim()) return;

		try {
			setSavingEdit(true);
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/role-master/${editId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName }),
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to update role.");
			}

			setEditOpen(false);
			setEditId("");
			setEditName("");
			setMessage(payload?.message ?? "Role updated successfully.");
			await loadItems();
		} catch (updateError) {
			setError(updateError instanceof Error ? updateError.message : "Unable to update role.");
		} finally {
			setSavingEdit(false);
		}
	};

	return (
		<>
		<div className={summaryShellClassName}>
			<div className="mb-3 flex items-end justify-between gap-3">
				<div className="flex-1 space-y-2">
					<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
						Role Master
					</p>
					<Input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Enter role name" className={inputClassName} />
				</div>
				<div className="flex items-end">
					<Button type="button" onClick={() => void handleCreate()} className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">
						<Plus className="mr-1 h-4 w-4" />
						Add Role
					</Button>
				</div>
			</div>

			{error ? <div className="mb-3 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
			{message ? <div className="mb-3 rounded-xl border border-[rgba(5,150,105,0.2)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm text-[#047857]">{message}</div> : null}

			<div className="h-full overflow-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
				<table className="w-full min-w-[420px] table-auto border-collapse text-sm">
					<thead>
						<tr className="bg-slate-100">
							<th className={tableHeadClassName}>Role Name</th>
							<th className={actionHeadClassName}>Action</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={2} className="px-3 py-6 text-center text-slate-500">Loading roles...</td>
							</tr>
						) : items.length === 0 ? (
							<tr>
								<td colSpan={2} className="px-3 py-6 text-center text-slate-500">No records available.</td>
							</tr>
						) : (
							items.map((item) => (
								<tr key={item.id} className="odd:bg-slate-50/40 even:bg-white/90 text-slate-800 hover:bg-sky-50/70">
									<td className={tableCellClassName}>{item.name}</td>
									<td className={actionCellClassName}>
										<div className="flex items-center justify-center gap-2">
											<Button type="button" variant="outline" onClick={() => openEditDialog(item)} className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs text-slate-700">
												<Pencil className="mr-1 h-3.5 w-3.5" />
												Edit
											</Button>
											<Button type="button" variant="outline" onClick={() => void handleDelete(item.id)} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-3 text-xs text-[#b91c1c]">
												<Trash2 className="mr-1 h-3.5 w-3.5" />
												Delete
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
		<Dialog open={editOpen} onOpenChange={setEditOpen}>
			<DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-[rgba(30,64,175,0.16)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(235,243,251,0.98))] sm:max-w-[min(92vw,32rem)]">
				<DialogHeader>
					<DialogTitle className="pt-3 text-2xl tracking-[-0.03em] text-[#17181d]">Edit Role</DialogTitle>
				</DialogHeader>
				<div className={signupSectionClassName}>
					<div className="space-y-2">
						<label className={fieldLabelClassName}>Role Name</label>
						<div className={signupInputShellClassName}>
							<Input value={editName} onChange={(e) => setEditName(e.currentTarget.value)} className="h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none" style={flatInputStyle} />
						</div>
					</div>
				</div>
				<div className="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onClick={() => setEditOpen(false)} className={secondaryButtonClassName}>
						Cancel
					</Button>
					<Button type="button" onClick={() => void handleEdit()} disabled={savingEdit || !editName.trim()} className="rounded-[1rem] border border-[rgba(30,64,175,0.16)] bg-[linear-gradient(135deg,#1e40af,#0284c7,#0f766e)] px-6 text-white shadow-[0_14px_28px_rgba(30,64,175,0.22)] hover:bg-[linear-gradient(135deg,#1d3a9a,#0369a1,#115e59)]">
						{savingEdit ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
		</>
	);
}
