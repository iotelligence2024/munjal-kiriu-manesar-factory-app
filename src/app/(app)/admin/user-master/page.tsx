import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-preact";

import { Button } from "../../../../components/ui/button";
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

type MasterItem = {
	id: string;
	name: string;
};

type UserMasterItem = {
	id: string;
	employeeName: string;
	employeeCode: string;
	department: string;
	role: string;
	email: string;
	mobileNumber: string;
	username: string;
	approved: boolean;
};

type UserFormState = {
	id: string;
	employeeName: string;
	employeeCode: string;
	department: string;
	role: string;
	email: string;
	mobileNumber: string;
	username: string;
	password: string;
	approved: "YES" | "NO";
};

const flatInputStyle = {
	border: "none",
	outline: "none",
	boxShadow: "none",
	WebkitBoxShadow: "none",
};

const summaryShellClassName =
	"min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5";
const secondaryButtonClassName =
	"rounded-[1rem] border border-[rgba(30,64,175,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(231,239,250,0.9))] text-[#1e3a8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_20px_rgba(15,23,42,0.06)] transition-[background-color,border-color,color,box-shadow] hover:border-[rgba(30,64,175,0.28)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(226,236,249,0.96))] hover:text-[#1d4ed8] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_14px_28px_rgba(30,64,175,0.1)]";
const fieldLabelClassName = "text-sm font-medium text-[#4d5560]";
const signupSectionClassName =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";
const signupInputShellClassName =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";
const signupInputClassName =
	"h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none";

const tableHeadClassName = "border border-slate-300 px-3 py-2.5 text-center font-semibold text-slate-700";
const actionHeadClassName = `${tableHeadClassName} w-px whitespace-nowrap`;
const tableCellClassName = "border border-slate-200 px-3 py-2.5 text-center text-slate-800";
const actionCellClassName = `${tableCellClassName} w-px whitespace-nowrap`;

const emptyUserForm = (): UserFormState => ({
	id: "",
	employeeName: "",
	employeeCode: "",
	department: "",
	role: "",
	email: "",
	mobileNumber: "",
	username: "",
	password: "",
	approved: "NO",
});

export default function UserMasterPage() {
	const [departments, setDepartments] = useState<MasterItem[]>([]);
	const [roles, setRoles] = useState<MasterItem[]>([]);
	const [users, setUsers] = useState<UserMasterItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [userDialogOpen, setUserDialogOpen] = useState(false);
	const [savingUser, setSavingUser] = useState(false);
	const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm);

	const loadData = async () => {
		try {
			setLoading(true);
			setError(null);

			const [departmentResponse, roleResponse, userResponse] = await Promise.all([
				fetch(`${API_BASE_URL}/api/department-master`),
				fetch(`${API_BASE_URL}/api/role-master`),
				fetch(`${API_BASE_URL}/api/user-master`),
			]);

			const [departmentPayload, rolePayload, userPayload] = await Promise.all([
				departmentResponse.json().catch(() => null),
				roleResponse.json().catch(() => null),
				userResponse.json().catch(() => null),
			]);

			if (!departmentResponse.ok) {
				throw new Error(departmentPayload?.message ?? "Unable to load departments.");
			}
			if (!roleResponse.ok) {
				throw new Error(rolePayload?.message ?? "Unable to load roles.");
			}
			if (!userResponse.ok) {
				throw new Error(userPayload?.message ?? "Unable to load user master.");
			}

			setDepartments(Array.isArray(departmentPayload?.items) ? departmentPayload.items : []);
			setRoles(Array.isArray(rolePayload?.items) ? rolePayload.items : []);
			setUsers(Array.isArray(userPayload?.items) ? userPayload.items : []);
		} catch (loadError) {
			setError(
				loadError instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: loadError instanceof Error
						? loadError.message
						: "Unable to load user master."
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadData();
	}, []);

	const openUserDialog = (user: UserMasterItem) => {
		setUserForm({
			id: user.id,
			employeeName: user.employeeName,
			employeeCode: user.employeeCode,
			department: user.department ?? "",
			role: user.role ?? "",
			email: user.email ?? "",
			mobileNumber: user.mobileNumber ?? "",
			username: user.username ?? "",
			password: "",
			approved: user.approved ? "YES" : "NO",
		});
		setUserDialogOpen(true);
	};

	const handleUserFormChange = (field: keyof UserFormState, value: string) => {
		setUserForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSaveUser = async () => {
		try {
			setSavingUser(true);
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/user-master/${userForm.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					department: userForm.department,
					role: userForm.role,
					email: userForm.email,
					mobileNumber: userForm.mobileNumber,
					username: userForm.username,
					password: userForm.password,
					approved: userForm.approved === "YES",
				}),
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to update user master.");
			}

			setMessage(payload?.message ?? "User master updated successfully.");
			setUserDialogOpen(false);
			setUserForm(emptyUserForm());
			await loadData();
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to update user master.");
		} finally {
			setSavingUser(false);
		}
	};

	const handleDeleteUser = async (id: string) => {
		const confirmed = window.confirm("Delete this user?");
		if (!confirmed) return;

		try {
			setError(null);
			setMessage(null);

			const response = await fetch(`${API_BASE_URL}/api/user-master/${id}`, {
				method: "DELETE",
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(payload?.message ?? "Unable to delete user.");
			}

			setMessage(payload?.message ?? "User deleted successfully.");
			await loadData();
		} catch (deleteError) {
			setError(deleteError instanceof Error ? deleteError.message : "Unable to delete user.");
		}
	};

	return (
		<>
			<div className={summaryShellClassName}>
				<div className="mb-3 flex items-center justify-between">
					<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
						User Master
					</p>
				</div>

				{error ? <div className="mb-3 rounded-xl border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
				{message ? <div className="mb-3 rounded-xl border border-[rgba(5,150,105,0.2)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm text-[#047857]">{message}</div> : null}

				<div className="h-full overflow-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
					<table className="w-full min-w-[1100px] table-auto border-collapse text-sm">
						<thead>
							<tr className="bg-slate-100">
								<th className={tableHeadClassName}>Employee Name</th>
								<th className={tableHeadClassName}>Employee Code</th>
								<th className={tableHeadClassName}>Department</th>
								<th className={tableHeadClassName}>Role</th>
								<th className={tableHeadClassName}>Email</th>
								<th className={tableHeadClassName}>Mobile Number</th>
								<th className={tableHeadClassName}>Username</th>
								<th className={tableHeadClassName}>Approved</th>
								<th className={actionHeadClassName}>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={9} className="px-3 py-6 text-center text-slate-500">Loading user master...</td>
								</tr>
							) : users.length === 0 ? (
								<tr>
									<td colSpan={9} className="px-3 py-6 text-center text-slate-500">No user records available.</td>
								</tr>
							) : (
								users.map((user) => (
									<tr key={user.id} className="odd:bg-slate-50/40 even:bg-white/90 text-slate-800 hover:bg-sky-50/70">
										<td className={tableCellClassName}>{user.employeeName}</td>
										<td className={tableCellClassName}>{user.employeeCode}</td>
										<td className={tableCellClassName}>{user.department}</td>
										<td className={tableCellClassName}>{user.role}</td>
										<td className={tableCellClassName}>{user.email}</td>
										<td className={tableCellClassName}>{user.mobileNumber}</td>
									<td className={tableCellClassName}>{user.username}</td>
									<td className={tableCellClassName}>{user.approved ? "YES" : "NO"}</td>
									<td className={actionCellClassName}>
										<div className="flex items-center justify-center gap-2">
											<Button type="button" variant="outline" onClick={() => openUserDialog(user)} className="h-8 rounded-md border-slate-300 bg-white px-3 text-xs text-slate-700">
												<Pencil className="mr-1 h-3.5 w-3.5" />
												Edit
											</Button>
											<Button type="button" variant="outline" onClick={() => void handleDeleteUser(user.id)} className="h-8 rounded-md border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.9)] px-3 text-xs text-[#b91c1c]">
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

			<Dialog
				open={userDialogOpen}
				onOpenChange={(open) => {
					setUserDialogOpen(open);
					if (!open) {
						setUserForm(emptyUserForm());
					}
				}}
			>
				<DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-[rgba(30,64,175,0.16)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(235,243,251,0.98))] sm:max-w-[min(92vw,42rem)]">
					<DialogHeader>
						<DialogTitle className="pt-3 text-2xl tracking-[-0.03em] text-[#17181d]">Edit User Master</DialogTitle>
					</DialogHeader>

					<div className={signupSectionClassName}>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Employee Name</Label>
							<div className={signupInputShellClassName}>
								<Input value={userForm.employeeName} disabled className={signupInputClassName} style={flatInputStyle} />
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Employee Code</Label>
							<div className={signupInputShellClassName}>
								<Input value={userForm.employeeCode} disabled className={signupInputClassName} style={flatInputStyle} />
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Department</Label>
							<div className={signupInputShellClassName}>
							<Select value={userForm.department} onValueChange={(value) => handleUserFormChange("department", value)}>
								<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
									<SelectValue placeholder="Select department" />
								</SelectTrigger>
								<SelectContent>
									{departments.map((item) => (
										<SelectItem key={item.id} value={item.name}>
											{item.name}
										</SelectItem>
										))}
									</SelectContent>
							</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Role</Label>
							<div className={signupInputShellClassName}>
							<Select value={userForm.role} onValueChange={(value) => handleUserFormChange("role", value)}>
								<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									{roles.map((item) => (
										<SelectItem key={item.id} value={item.name}>
											{item.name}
										</SelectItem>
										))}
									</SelectContent>
							</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Email</Label>
							<div className={signupInputShellClassName}>
								<Input value={userForm.email} onChange={(e) => handleUserFormChange("email", e.currentTarget.value)} className={signupInputClassName} style={flatInputStyle} />
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Mobile Number</Label>
							<div className={signupInputShellClassName}>
								<Input value={userForm.mobileNumber} onChange={(e) => handleUserFormChange("mobileNumber", e.currentTarget.value)} className={signupInputClassName} style={flatInputStyle} />
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Username</Label>
							<div className={signupInputShellClassName}>
								<Input value={userForm.username} onChange={(e) => handleUserFormChange("username", e.currentTarget.value)} className={signupInputClassName} style={flatInputStyle} />
							</div>
						</div>
						<div className="space-y-2">
							<Label className={fieldLabelClassName}>Password</Label>
							<div className={signupInputShellClassName}>
								<Input type="password" value={userForm.password} onChange={(e) => handleUserFormChange("password", e.currentTarget.value)} placeholder="Leave blank to keep existing password" className={signupInputClassName} style={flatInputStyle} />
							</div>
						</div>
						<div className="space-y-2 sm:col-span-2">
							<Label className={fieldLabelClassName}>Approved</Label>
							<div className={signupInputShellClassName}>
							<Select value={userForm.approved} onValueChange={(value) => handleUserFormChange("approved", value as "YES" | "NO")}>
								<SelectTrigger className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0">
									<SelectValue placeholder="Select approval" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="YES">YES</SelectItem>
									<SelectItem value="NO">NO</SelectItem>
								</SelectContent>
							</Select>
							</div>
						</div>
					</div>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)} className={secondaryButtonClassName}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => void handleSaveUser()}
							disabled={
								savingUser ||
								!userForm.department ||
								!userForm.role ||
								!userForm.email.trim() ||
								!userForm.mobileNumber.trim() ||
								!userForm.username.trim()
							}
							className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white"
						>
							{savingUser ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
