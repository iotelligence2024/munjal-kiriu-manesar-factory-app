"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { ScreenLoader } from "../ScreenLoader";
import { useSession } from "../../app/context/SessionContext";
import { ActionButton } from "../shared/action-button";
import {
	standardDangerStatusBadgeClassName,
	standardSuccessStatusBadgeClassName,
	standardWarningStatusBadgeClassName,
} from "../shared/standard-status";
import {
	moduleActionButtonClassName,
	moduleCardClassName,
	moduleCardHeaderClassName,
	moduleDangerButtonClassName,
	moduleDialogClassName,
	moduleGhostButtonClassName,
	moduleInputClassName,
	moduleInsetPanelClassName,
	moduleMutedTextClassName,
	moduleSelectClassName,
	moduleSummaryCardAccentClassName,
	moduleSummaryCardClassName,
	moduleSummaryCardContentClassName,
	moduleSummaryCardGlowClassName,
	moduleSummaryCardHeaderClassName,
	moduleSummaryCardTitleClassName,
	moduleSummaryCardValueClassName,
	moduleTableCellClassName,
	moduleTableHeadClassName,
	moduleTableRowClassName,
	moduleWarningButtonClassName,
} from "../shared/module-surface-theme";

const { protocol, hostname } = window.location;
const API_BASE = `${protocol}//${hostname}:54321/api/spare`;
const spareFormInputClassName = moduleInputClassName;
const spareFieldLabelClassName =
	"text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#5f6772]";
const spareDialogHeaderClassName = "border-b border-[rgba(30,64,175,0.14)] pb-3";
const spareDialogTitleClassName = "my-1 text-[#2f358f]";
const spareDialogClassName = `max-h-[90vh] overflow-y-auto ${moduleDialogClassName}`;

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Spare = {
	id: string;
	location: string;
	partCode: string;
	partName: string;
	category: string;
	description?: string;

	quantity: number;
	minThreshold: number;   // LOW level
	reorderLevel?: number;  // NEW
	maxThreshold: number;

	leadTimeDays?: number;  // NEW
	unit?: string;

	vendorCode: string;
	vendorName: string;

	// Procurement lifecycle
	pr?: {
		number: string;
		qty: number;
		date: string;
	};

	po?: {
		number: string;
		qty: number;
		date: string;
	};

	grn?: {
		number: string;
		qty: number;
		date: string;
	};
};

type SpareTxn = {
	id: string;
	spareId: string;
	action: "ADD" | "SUB" | "PR" | "PO" | "GRN";
	quantity: number;
	receiver?: string;
	reason?: string;
	timestamp: string;
};

function getSpareHistoryBadgeClassName(action: SpareTxn["action"]) {
	switch (action) {
		case "ADD":
		case "GRN":
			return standardSuccessStatusBadgeClassName;
		case "SUB":
			return standardDangerStatusBadgeClassName;
		case "PR":
		case "PO":
		default:
			return standardWarningStatusBadgeClassName;
	}
}

function getSpareStockStatusBadge(quantity: number, minThreshold: number) {
	if (quantity === 0) {
		return {
			label: "OUT",
			className: standardDangerStatusBadgeClassName,
		};
	}

	if (quantity <= minThreshold) {
		return {
			label: "LOW",
			className: standardWarningStatusBadgeClassName,
		};
	}

	return {
		label: "OK",
		className: standardSuccessStatusBadgeClassName,
	};
}

function ProcurementInfoHeader({ spare }: { spare: Spare }) {
	return (
		<div className={`${moduleInsetPanelClassName} grid gap-3 p-3 text-sm md:grid-cols-2`}>
			{spare.pr && (
				<div className="space-y-1">
					<p className={spareFieldLabelClassName}>PR Details</p>
					<p className="text-sm text-[#1f2430]">
						<span className="font-semibold text-[#2f358f]">{spare.pr.number}</span>
						<span className={`ml-2 ${moduleMutedTextClassName}`}>
							Qty {spare.pr.qty} | {new Date(spare.pr.date).toLocaleDateString()}
						</span>
					</p>
				</div>
			)}

			{spare.po && (
				<div className="space-y-1">
					<p className={spareFieldLabelClassName}>PO Details</p>
					<p className="text-sm text-[#1f2430]">
						<span className="font-semibold text-[#2f358f]">{spare.po.number}</span>
						<span className={`ml-2 ${moduleMutedTextClassName}`}>
							Qty {spare.po.qty} | {new Date(spare.po.date).toLocaleDateString()}
						</span>
					</p>
				</div>
			)}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function SpareCards() {
	const { session } = useSession();
	const department = session?.department?.toLowerCase().trim();
	const role = session?.role?.toLowerCase().trim();
	const isSuperAdmin = role === "superadmin" || role === "super admin";
	const canManageSpares =
		(department === "tool_room" && role === "incharge") || isSuperAdmin;
	const canDeleteSpares =
		(department === "tool_room" && role === "incharge") || isSuperAdmin;
	const canOpenEditDialog = canManageSpares || canDeleteSpares;

	const [spares, setSpares] = useState<Spare[]>([]);
	const [loading, setLoading] = useState(true);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historySpare, setHistorySpare] = useState<Spare | null>(null);
	const [history, setHistory] = useState<SpareTxn[]>([]);
	const [allHistory, setAllHistory] = useState<SpareTxn[]>([]);
	const [vendorLocked, setVendorLocked] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");

	const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");
	const [editingSpareId, setEditingSpareId] = useState<string | null>(null);

	/* ---------------- MODAL STATES ---------------- */

	const [prOpen, setPrOpen] = useState(false);
	const [poOpen, setPoOpen] = useState(false);
	const [grnOpen, setGrnOpen] = useState(false);

	const [procurementSpare, setProcurementSpare] = useState<Spare | null>(null);

	const [activeSpare, setActiveSpare] = useState<Spare | null>(null);

	const [mode, setMode] = useState<"ADD" | "SUB">("SUB");

	const [txnQty, setTxnQty] = useState<number>(0);
	const [receiver, setReceiver] = useState("");
	const [reason, setReason] = useState("");

	/* ---------------- FILTER STATES ---------------- */

	const [search, setSearch] = useState("");
	const [lowStockOnly, setLowStockOnly] = useState(false);
	const [outOfStockOnly, setOutOfStockOnly] = useState(false);

	/* ---------------- CREATE SPARE MODAL ---------------- */

	const [createOpen, setCreateOpen] = useState(false);

	const [newSpare, setNewSpare] = useState({
		location: "",
		partCode: "",
		partName: "",
		category: "",
		description: "",
		unit: "NOS",

		quantity: 0,
		minThreshold: 0,
		reorderLevel: 0,
		maxThreshold: 0,

		leadTimeDays: 0,
		vendorCode: "",
		vendorName: "",
	});

	const [prForm, setPrForm] = useState({
		number: "",
		qty: 0,
		date: "",
	});

	const [poForm, setPoForm] = useState({
		number: "",
		qty: 0,
		date: "",
	});

	const [grnForm, setGrnForm] = useState({
		number: "",
		qty: 0,
		date: "",
	});

	const [addSpareForm, setAddSpareForm] = useState({
		number: "",
		qty: 0,
		date: "",
	});


	/* ---------------- FETCH DATA ---------------- */

	useEffect(() => {
		const fetchSpares = async () => {
			try {
				setLoading(true);
				const res = await fetch(API_BASE);
				if (!res.ok) throw new Error("Failed to fetch spares");
				const data = await res.json();
				setSpares(data);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchSpares();
	}, []);

	useEffect(() => {
		const fetchHistory = async () => {
			try {
				const { protocol, hostname } = window.location;
				const res = await fetch(`${protocol}//${hostname}:54321/api/spare/history`);
				const data = await res.json();
				setAllHistory(data);
			} catch (err) {
				console.error("Failed to fetch history", err);
			}
		};

		fetchHistory();
	}, []);

	/* ---------------- DASHBOARD METRICS ---------------- */

	const isLowStock = (s: Spare) =>
		s.quantity > 0 && s.quantity <= s.minThreshold;

	const dashboard = useMemo(() => {
		const totalQty = spares.reduce((a, b) => a + b.quantity, 0);
		const low = spares.filter(isLowStock).length;


		const out = spares.filter(s => s.quantity === 0).length;

		return {
			totalItems: spares.length,
			totalQty,
			low,
			out,
		};
	}, [spares]);


	/* ---------------- FILTERED DATA ---------------- */

	const filteredData = useMemo(() => {
		return spares.filter(s => {

			// Search filter
			if (
				search &&
				!`${s.partCode} ${s.partName}`
					.toLowerCase()
					.includes(search.toLowerCase())
			)
				return false;

			// Category filter
			if (selectedCategory && s.category !== selectedCategory)
				return false;

			// Low stock filter
			if (lowStockOnly && !isLowStock(s)) return false;

			// Out of stock filter
			if (outOfStockOnly && s.quantity !== 0) return false;

			return true;
		});
	}, [spares, search, selectedCategory, lowStockOnly, outOfStockOnly]);

	const locationOptions = useMemo(
		() => Array.from(new Set(spares.map(s => s.location))).sort(),
		[spares]
	);

	const categoryOptions = useMemo(
		() =>
			Array.from(
				new Set(
					spares
						.map(s => s.category?.trim())
						.filter(Boolean)
				)
			).sort(),
		[spares]
	);

	const vendorOptions = useMemo(
		() =>
			Array.from(
				new Map(
					spares.map(s => [
						s.vendorCode,
						{
							vendorCode: s.vendorCode,
							vendorName: s.vendorName
						}
					])
				).values()
			),
		[spares]
	);

	if (loading) return <ScreenLoader message="Loading spare inventory..." />;

	/* ---------------- ACTION HANDLER ---------------- */

	const refreshHistory = async () => {
		try {
			const { protocol, hostname } = window.location;
			const res = await fetch(`${protocol}//${hostname}:54321/api/spare/history`);
			if (!res.ok) throw new Error("Failed to fetch history");
			const data = await res.json();
			setAllHistory(data);
		} catch (err) {
			console.error("Failed to refresh history", err);
		}
	};

	const submitTransaction = async () => {
		if (!activeSpare) return;

		if (mode === "SUB" && txnQty <= 0) return;

		try {
			let payload: any = {
				spareId: activeSpare.id,
			};

			if (mode === "SUB") {
				if (txnQty > activeSpare.quantity) {
					alert("Insufficient stock");
					return;
				}

				if (!receiver || !reason) {
					alert("Receiver and reason required");
					return;
				}

				payload = {
					...payload,
					action: "SUB",
					quantity: txnQty,
					receiver,
					reason,
				};
			}

			if (mode === "ADD") {
				if (addSpareForm.qty > (activeSpare.po?.qty ?? 0)) {
					alert("GRN quantity cannot exceed PO quantity");
					return;
				}

				if (!addSpareForm.number || addSpareForm.qty <= 0 || !addSpareForm.date) {
					alert("Reservation Number, Quantity and Date are mandatory");
					return;
				}

				payload = {
					spareId: activeSpare.id,
					action: "ADD_GRN",
					grn: addSpareForm,
				};
			}

			const res = await fetch(API_BASE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error("Transaction failed");

			const updated = await fetch(API_BASE).then(r => r.json());
			setSpares(updated);
			await refreshHistory();

			setActiveSpare(null);
			setTxnQty(0);
			setReceiver("");
			setReason("");
			setGrnForm({ number: "", qty: 0, date: "" });
			setAddSpareForm({ number: "", qty: 0, date: "" });

		} catch (err) {
			console.error(err);
			alert("Transaction failed");
		}
	};

	const submitPR = async () => {
		if (!procurementSpare) return;

		await fetch(API_BASE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "ADD_PR",
				spareId: procurementSpare.id,
				pr: prForm,
			}),
		});

		const updated = await fetch(API_BASE).then(r => r.json());
		setSpares(updated);

		setPrOpen(false);
		setPrForm({ number: "", qty: 0, date: "" });
	};

	const submitPO = async () => {
		if (!procurementSpare) return;

		await fetch(API_BASE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "ADD_PO",
				spareId: procurementSpare.id,
				po: poForm,
			}),
		});

		const updated = await fetch(API_BASE).then(r => r.json());
		setSpares(updated);

		setPoOpen(false);
		setPoForm({ number: "", qty: 0, date: "" });
	};


	const submitGRN = async () => {
		if (!procurementSpare) return;

		await fetch(API_BASE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "ADD_GRN",
				spareId: procurementSpare.id,
				grn: grnForm,
			}),
		});

		const updated = await fetch(API_BASE).then(r => r.json());
		setSpares(updated);
		setGrnOpen(false);
		setGrnForm({ number: "", qty: 0, date: "" });
	};

	const isDuplicateSpare = () => {
		return spares.some(
			s =>
				s.partCode.trim().toLowerCase() === newSpare.partCode.trim().toLowerCase() &&
				s.vendorCode.trim().toLowerCase() === newSpare.vendorCode.trim().toLowerCase()
		);
	};


	const submitCreateOrUpdate = async () => {
		if (!newSpare.location || !newSpare.vendorCode || !newSpare.vendorName) {
			alert("Location and Vendor are mandatory");
			return;
		}

		if (newSpare.maxThreshold < newSpare.minThreshold) {
			alert("Max Threshold cannot be less than Min Threshold");
			return;
		}

		if (formMode === "CREATE" && isDuplicateSpare()) {
			alert("Duplicate spare detected (same Part Code & Vendor)");
			return;
		}

		const payload =
			formMode === "CREATE"
				? {
					action: "CREATE",
					...newSpare,
				}
				: {
					action: "UPDATE",
					spareId: editingSpareId,
					location: newSpare.location,
					category: newSpare.category,
					description: newSpare.description,
					unit: newSpare.unit,
					minThreshold: newSpare.minThreshold,
					maxThreshold: newSpare.maxThreshold,
					reorderLevel: newSpare.reorderLevel,
					leadTimeDays: newSpare.leadTimeDays,
					vendorCode: newSpare.vendorCode,
					vendorName: newSpare.vendorName,
				};

		try {
			await fetch(API_BASE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const updated = await fetch(API_BASE).then(r => r.json());
			setSpares(updated);
			await refreshHistory();

			setCreateOpen(false);
			setFormMode("CREATE");
			setEditingSpareId(null);
		} catch (err) {
			console.error(err);
			alert("Operation failed");
		}
	};

	const submitDeleteSpare = async () => {
		if (!editingSpareId || !canDeleteSpares) return;

		const confirmed = window.confirm(
			"Delete this spare entry? This will also remove its transaction history."
		);

		if (!confirmed) return;

		try {
			const res = await fetch(API_BASE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "DELETE",
					spareId: editingSpareId,
					department: session?.department,
					role: session?.role,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => null);
				throw new Error(errorData?.message || "Delete failed");
			}

			const updated = await fetch(API_BASE).then(r => r.json());
			setSpares(updated);
			await refreshHistory();

			setCreateOpen(false);
			setFormMode("CREATE");
			setEditingSpareId(null);
			setVendorLocked(false);
		} catch (err) {
			console.error(err);
			alert(err instanceof Error ? err.message : "Delete failed");
		}
	};

	const handleKpiFilter = (type: "ALL" | "LOW" | "OUT") => {

		setSelectedCategory(""); // reset category when KPI clicked

		if (type === "LOW") {
			setLowStockOnly(true);
			setOutOfStockOnly(false);
			return;
		}

		if (type === "OUT") {
			setOutOfStockOnly(true);
			setLowStockOnly(false);
			return;
		}

		setLowStockOnly(false);
		setOutOfStockOnly(false);
	};

	const openHistory = (spare: Spare) => {
		setHistorySpare(spare);
		setHistoryLoading(true);

		const filtered = allHistory.filter(
			txn => (
				txn.spareId === spare.id
			)
		);

		setHistory(filtered);
		setHistoryLoading(false);
		setHistoryOpen(true);
	};

	const openEditSpare = (spare: Spare) => {
		setFormMode("EDIT");
		setEditingSpareId(spare.id);

		setNewSpare({
			location: spare.location,
			partCode: spare.partCode,
			partName: spare.partName,
			category: spare.category,
			description: spare.description ?? "",
			unit: spare.unit ?? "NOS",

			quantity: spare.quantity, // will be hidden
			minThreshold: spare.minThreshold,
			reorderLevel: spare.reorderLevel ?? 0,
			maxThreshold: spare.maxThreshold,

			leadTimeDays: spare.leadTimeDays ?? 0,
			vendorCode: spare.vendorCode,
			vendorName: spare.vendorName,
		});

		setVendorLocked(true);
		setCreateOpen(true);
	};

	const openPRModal = (spare: Spare) => {
		setProcurementSpare(spare);
		setPrForm({ number: "", qty: 0, date: "" });
		setPrOpen(true);
	};

	const openPOModal = (spare: Spare) => {
		setProcurementSpare(spare);
		setPoForm({ number: "", qty: 0, date: "" });
		setPoOpen(true);
	};

	const closeActiveSpareDialog = () => {
		setActiveSpare(null);
		setTxnQty(0);
		setReceiver("");
		setReason("");
		setAddSpareForm({ number: "", qty: 0, date: "" });
	};

	/* ---------------- UI ---------------- */

	return (
		<div className="space-y-6">

			{/* ================= DASHBOARD ================= */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<Kpi
					title="Total Spares"
					value={dashboard.totalItems}
					onClick={() => handleKpiFilter("ALL")}
					active={!lowStockOnly && !outOfStockOnly}
				/>

				<Kpi
					title="Total Quantity"
					value={dashboard.totalQty}
					onClick={() => handleKpiFilter("ALL")}
					active={!lowStockOnly && !outOfStockOnly}
				/>

				<Kpi
					title="Low Stock"
					value={dashboard.low}
					warning
					onClick={() => handleKpiFilter("LOW")}
					active={lowStockOnly}
				/>

				<Kpi
					title="Out of Stock"
					value={dashboard.out}
					danger
					onClick={() => handleKpiFilter("OUT")}
					active={outOfStockOnly}
				/>
			</div>

			{/* ================= TABLE ================= */}
			<Card className={moduleCardClassName}>
				<CardHeader className={`${moduleCardHeaderClassName} pb-3`}>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f358f]">Spare Inventory</h3>

						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Button
								size="sm"
								onClick={() => setCreateOpen(true)}
								hidden={!canManageSpares}
								className={moduleActionButtonClassName}
							>
								Add New Spare
							</Button>

							<select
								value={selectedCategory}
								onChange={e => setSelectedCategory(e.currentTarget.value)}
								className={`${moduleSelectClassName} w-full sm:w-[210px]`}
							>
								<option value="">All Categories</option>
								{categoryOptions.map(cat => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>

							<Input
								list="spare-search-options"
								placeholder="Search Part"
								className={`${moduleInputClassName} w-full sm:w-[240px]`}
								value={search}
								onChange={e => setSearch(e.currentTarget.value)}
							/>
						</div>

					</div>
				</CardHeader>


			<Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
				{historySpare && (
					<DialogContent className={`max-w-4xl ${spareDialogClassName}`}>
							<DialogHeader className={spareDialogHeaderClassName}>
								<DialogTitle className={spareDialogTitleClassName}>
									History – {historySpare.partName} ({historySpare.partCode})
								</DialogTitle>
							</DialogHeader>

							<div className="mb-4 grid gap-3 text-sm md:grid-cols-3">
								<div className={`${moduleInsetPanelClassName} p-3`}>
									<p className={spareFieldLabelClassName}>Location</p>
									<p className="mt-1 text-[#1f2430]">{historySpare.location}</p>
								</div>
								<div className={`${moduleInsetPanelClassName} p-3`}>
									<p className={spareFieldLabelClassName}>Vendor</p>
									<p className="mt-1 text-[#1f2430]">{historySpare.vendorName}</p>
								</div>
								<div className={`${moduleInsetPanelClassName} p-3`}>
									<p className={spareFieldLabelClassName}>Current Stock</p>
									<p className="mt-1 text-[#1f2430]">{historySpare.quantity}</p>
								</div>
							</div>

							<Table>
								<TableHeader>
									<TableRow className="text-center">
										<TableHead className={moduleTableHeadClassName}>Action</TableHead>
										<TableHead className={moduleTableHeadClassName}>Qty</TableHead>
										<TableHead className={moduleTableHeadClassName}>Receiver</TableHead>
										<TableHead className={moduleTableHeadClassName}>Reason</TableHead>
										<TableHead className={moduleTableHeadClassName}>Date</TableHead>
									</TableRow>
								</TableHeader>
							</Table>

							<div className="max-h-[50vh] overflow-y-auto border-t border-[rgba(95,103,114,0.12)]">
								<Table>
									<TableBody>
										{historyLoading ? (
											<TableRow className={moduleTableRowClassName}>
												<TableCell colSpan={5} className={`${moduleTableCellClassName} text-center ${moduleMutedTextClassName}`}>
													Loading history...
												</TableCell>
											</TableRow>
										) : history.length === 0 ? (
											<TableRow className={moduleTableRowClassName}>
												<TableCell colSpan={5} className={`${moduleTableCellClassName} text-center ${moduleMutedTextClassName}`}>
													No history available
												</TableCell>
											</TableRow>
										) : (
											history.map(h => (
												<TableRow key={h.id} className={moduleTableRowClassName}>
													<TableCell className={moduleTableCellClassName}>
														<Badge className={getSpareHistoryBadgeClassName(h.action)}>
															{h.action}
														</Badge>
													</TableCell>
													<TableCell className={moduleTableCellClassName}>{h.quantity}</TableCell>
													<TableCell className={moduleTableCellClassName}>{h.receiver || "-"}</TableCell>
													<TableCell className={moduleTableCellClassName}>{h.reason || "-"}</TableCell>
													<TableCell className={moduleTableCellClassName}>
														{new Date(h.timestamp).toLocaleString()}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
					</DialogContent>
				)}
			</Dialog>


				<CardContent className="relative p-0">
					<div className="w-full overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className={moduleTableHeadClassName}>Location</TableHead>
								<TableHead className={moduleTableHeadClassName}>Part Code</TableHead>
								<TableHead className={moduleTableHeadClassName}>Part Name</TableHead>
								<TableHead className={moduleTableHeadClassName}>Category</TableHead>
								<TableHead className={moduleTableHeadClassName}>Qty</TableHead>
								<TableHead className={moduleTableHeadClassName}>Min</TableHead>
								<TableHead className={moduleTableHeadClassName}>Max</TableHead>
								<TableHead className={moduleTableHeadClassName}>Vendor</TableHead>
								<TableHead className={moduleTableHeadClassName}>Status</TableHead>
								<TableHead hidden={!canManageSpares} className={moduleTableHeadClassName}>Add</TableHead>
								<TableHead hidden={!canManageSpares} className={moduleTableHeadClassName}>Subtract</TableHead>
								<TableHead className={moduleTableHeadClassName}>History</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{filteredData.length === 0 && (
								<TableRow>
									<TableCell colSpan={12} className={`${moduleTableCellClassName} py-8 text-center ${moduleMutedTextClassName}`}>
										No spare records found for the selected filters.
									</TableCell>
								</TableRow>
							)}
							{filteredData.map(s => {
								const needsReorder =
									s.quantity === 0 ||
									s.quantity <= s.minThreshold ||
									(s.reorderLevel !== undefined && s.quantity <= s.reorderLevel);

								const hasPR = !!s.pr;
								const hasPO = !!s.po;
								const stockStatusBadge = getSpareStockStatusBadge(
									s.quantity,
									s.minThreshold
								);

								return (
									<TableRow key={s.id} className={moduleTableRowClassName}>
										<TableCell className={moduleTableCellClassName}>{s.location}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.partCode}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.partName}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.category}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.quantity}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.minThreshold}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.maxThreshold}</TableCell>
										<TableCell className={moduleTableCellClassName}>{s.vendorName}</TableCell>
										<TableCell className={moduleTableCellClassName}>
											<Badge className={stockStatusBadge.className}>
												{stockStatusBadge.label}
											</Badge>

										</TableCell>
										<TableCell hidden={!canManageSpares} className={moduleTableCellClassName}>
											<div className="flex flex-wrap justify-center gap-2">
											{/* ADD — only after PO */}
											<Button
												size="sm"
												className={moduleActionButtonClassName}
												hidden={!hasPO}
												onClick={() => {
													setMode("ADD");
													setActiveSpare(s);
													setTxnQty(0);
													setAddSpareForm({ number: "", qty: 0, date: "" });
												}}
											>
												ADD
											</Button>
											<Button
												size="sm"
												className={moduleWarningButtonClassName}
												hidden={!needsReorder || hasPR}
												onClick={() => openPRModal(s)}
											>
												PR
											</Button>

											{/* PO */}
											<Button
												size="sm"
												className={moduleActionButtonClassName}
												hidden={!hasPR || hasPO}
												onClick={() => openPOModal(s)}
											>
												PO
											</Button>
											</div>

										</TableCell>
										<TableCell hidden={!canManageSpares} className={moduleTableCellClassName}>
											<div className="flex justify-center">
											<ActionButton
												kind="subtract"
												hidden={s.quantity === 0}
												onClick={() => {
													setMode("SUB");
													setActiveSpare(s);
													setTxnQty(0);
													setReceiver("");
													setReason("");
													setAddSpareForm({ number: "", qty: 0, date: "" });
												}}
											>
												Subtract
											</ActionButton>
											</div>

										</TableCell>
										<TableCell className={moduleTableCellClassName}>
											<div className="flex flex-wrap justify-center gap-2">
											<ActionButton
												kind="history"
												onClick={() => openHistory(s)}
											>
												History
											</ActionButton>
											<ActionButton
												kind="edit"
												hidden={!canOpenEditDialog}
												onClick={() => openEditSpare(s)}
											>
												Edit
											</ActionButton>
											</div>
										</TableCell>

									</TableRow>
								);
							})}
						</TableBody>

					</Table>
					</div>
				</CardContent>
			</Card>

			<Dialog
				open={createOpen}
				onOpenChange={(open) => {
					setCreateOpen(open);

					if (!open) {
						setFormMode("CREATE");
						setEditingSpareId(null);
						setVendorLocked(false);
						setNewSpare({
							location: "",
							partCode: "",
							partName: "",
							category: "",
							description: "",
							unit: "NOS",
							quantity: 0,
							minThreshold: 0,
							reorderLevel: 0,
							maxThreshold: 0,
							leadTimeDays: 0,
							vendorCode: "",
							vendorName: "",
						});
					}
				}}
			>
				<DialogContent className={`max-w-4xl ${spareDialogClassName}`}>
						<div className="space-y-5">
							<DialogHeader className={spareDialogHeaderClassName}>
								<DialogTitle className={spareDialogTitleClassName}>
									{formMode === "CREATE" ? "Add New Spare" : "Edit Spare"}
								</DialogTitle>
							</DialogHeader>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-6">
								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Location *</Label>
									<Input
										list="location-options"
										className={moduleInputClassName}
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.location}
										onChange={e =>
											setNewSpare(s => ({ ...s, location: e.currentTarget.value.toUpperCase() }))
										}
									/>
									<datalist id="location-options">
										{locationOptions.map(loc => (
											<option key={loc} value={loc} />
										))}
									</datalist>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Part Code *</Label>
									<Input
										className={moduleInputClassName}
										disabled={formMode === "EDIT"}
										value={newSpare.partCode}
										onChange={e =>
											setNewSpare(s => ({ ...s, partCode: e.currentTarget.value.toUpperCase() }))
										}
									/>
								</div>

								<div className="space-y-2 md:col-span-6">
									<Label className={spareFieldLabelClassName}>Part Name *</Label>
									<Input
										className={moduleInputClassName}
										disabled={formMode === "EDIT"}
										value={newSpare.partName}
										onChange={e =>
											setNewSpare(s => ({ ...s, partName: e.currentTarget.value.toUpperCase() }))
										}
									/>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Category *</Label>
									<select
										className={moduleSelectClassName}
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.category}
										onChange={e =>
											setNewSpare(s => ({ ...s, category: e.currentTarget.value }))
										}
									>
										<option value="">Select Category</option>
										<option value="Common">Common</option>
										<option value="Uncommon">Uncommon</option>
										<option value="Critical">Critical</option>
										<option value="Electrical">Electrical</option>
										<option value="Mechanical">Mechanical</option>
										<option value="General">General</option>
									</select>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Description *</Label>
									<Input
										className={moduleInputClassName}
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.description}
										onChange={e =>
											setNewSpare(s => ({ ...s, description: e.currentTarget.value }))
										}
									/>
								</div>

								{formMode === "CREATE" && (
									<div className="space-y-2 md:col-span-3">
										<Label className={spareFieldLabelClassName}>Initial Quantity</Label>
										<Input
											className={moduleInputClassName}
											type="number"
											value={newSpare.quantity}
											onChange={e =>
												setNewSpare(s => ({ ...s, quantity: +e.currentTarget.value }))
											}
										/>
									</div>
								)}

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Min Threshold</Label>
									<Input
										className={moduleInputClassName}
										type="number"
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.minThreshold}
										onChange={e =>
											setNewSpare(s => ({ ...s, minThreshold: +e.currentTarget.value }))
										}
									/>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Max Threshold</Label>
									<Input
										className={moduleInputClassName}
										type="number"
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.maxThreshold}
										onChange={e =>
											setNewSpare(s => ({ ...s, maxThreshold: +e.currentTarget.value }))
										}
									/>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Re-Order Level</Label>
									<Input
										className={moduleInputClassName}
										type="number"
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.reorderLevel}
										onChange={e =>
											setNewSpare(s => ({ ...s, reorderLevel: +e.currentTarget.value }))
										}
									/>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Lead Time (Days)</Label>
									<Input
										className={moduleInputClassName}
										type="number"
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.leadTimeDays}
										onChange={e =>
											setNewSpare(s => ({ ...s, leadTimeDays: +e.currentTarget.value }))
										}
									/>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Unit</Label>
									<select
										className={moduleSelectClassName}
										disabled={formMode === "EDIT" && !canManageSpares}
										value={newSpare.unit}
										onChange={e =>
											setNewSpare(s => ({ ...s, unit: e.currentTarget.value }))
										}
									>
										<option value="NOS">NOS</option>
										<option value="PCS">PCS</option>
										<option value="SET">SET</option>
										<option value="KG">KG</option>
									</select>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Vendor Code *</Label>
									<Input
										list="vendor-options"
										disabled={(vendorLocked && !!newSpare.vendorName) || (formMode === "EDIT" && !canManageSpares)}
										className={moduleInputClassName}
										value={newSpare.vendorCode}
										onChange={e => {
											const val = e.currentTarget.value;
											const match = vendorOptions.find(
												v => `${v.vendorCode} - ${v.vendorName}` === val
											);

											if (match) {
												setNewSpare(s => ({
													...s,
													vendorCode: match.vendorCode,
													vendorName: match.vendorName,
												}));
												setVendorLocked(true);
											} else {
												setVendorLocked(false);
												setNewSpare(s => ({ ...s, vendorCode: val.toUpperCase() }));
											}
										}}
									/>
								</div>

								<div className="space-y-2 md:col-span-3">
									<Label className={spareFieldLabelClassName}>Vendor Name *</Label>
									<Input
										list="vendor-options"
										disabled={(vendorLocked && !!newSpare.vendorCode) || (formMode === "EDIT" && !canManageSpares)}
										className={moduleInputClassName}
										value={newSpare.vendorName}
										onChange={e => {
											const val = e.currentTarget.value;
											const match = vendorOptions.find(
												v => `${v.vendorCode} - ${v.vendorName}` === val
											);

											if (match) {
												setNewSpare(s => ({
													...s,
													vendorCode: match.vendorCode,
													vendorName: match.vendorName,
												}));
												setVendorLocked(true);
											} else {
												setVendorLocked(false);
												setNewSpare(s => ({ ...s, vendorName: val.toUpperCase() }));
											}
										}}
									/>
									<datalist id="vendor-options">
										{vendorOptions.map(v => (
											<option
												key={v.vendorCode}
												value={`${v.vendorCode} - ${v.vendorName}`}
											/>
										))}
									</datalist>
								</div>

								{vendorLocked && canManageSpares && (
									<div className="flex justify-end md:col-span-6">
										<Button
											size="sm"
											type="button"
											variant="outline"
											className={moduleGhostButtonClassName}
											onClick={() => {
												setVendorLocked(false);
												setNewSpare(s => ({
													...s,
													vendorCode: "",
													vendorName: "",
												}));
											}}
										>
											Reset Vendor
										</Button>
									</div>
								)}
							</div>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									type="button"
									hidden={!(formMode === "EDIT" && canDeleteSpares)}
									className={moduleDangerButtonClassName}
									onClick={submitDeleteSpare}
								>
									Delete Spare
								</Button>
								<Button
									type="button"
									variant="outline"
									className={moduleGhostButtonClassName}
									onClick={() => setCreateOpen(false)}
								>
									Cancel
								</Button>
								<Button
									hidden={formMode === "EDIT" && !canManageSpares}
									className={moduleActionButtonClassName}
									onClick={submitCreateOrUpdate}
								>
									{formMode === "CREATE" ? "Create Spare" : "Update Spare"}
								</Button>
							</div>
						</div>
				</DialogContent>
			</Dialog>

			<Dialog open={prOpen} onOpenChange={setPrOpen}>
				{procurementSpare && (
					<DialogContent className={`max-w-lg ${spareDialogClassName}`}>
						<div className="space-y-4">
							<DialogHeader className={spareDialogHeaderClassName}>
								<DialogTitle className={spareDialogTitleClassName}>Raise PR</DialogTitle>
							</DialogHeader>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>PR Number</Label>
								<Input
									value={prForm.number}
									className={spareFormInputClassName}
									onChange={e => setPrForm(f => ({ ...f, number: e.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Quantity</Label>
								<Input
									type="number"
									value={prForm.qty}
									className={spareFormInputClassName}
									onChange={e => setPrForm(f => ({ ...f, qty: +e.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Date</Label>
								<Input
									type="date"
									value={prForm.date}
									className={spareFormInputClassName}
									onChange={e => setPrForm(f => ({ ...f, date: e.currentTarget.value }))}
								/>
							</div>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									type="button"
									variant="outline"
									className={moduleGhostButtonClassName}
									onClick={() => setPrOpen(false)}
								>
									Cancel
								</Button>
								<Button className={moduleActionButtonClassName} onClick={submitPR}>
									Submit PR
								</Button>
							</div>
						</div>
					</DialogContent>
				)}
			</Dialog>

			<Dialog open={poOpen} onOpenChange={setPoOpen}>
				{procurementSpare && (
					<DialogContent className={`max-w-lg ${spareDialogClassName}`}>
						<div className="space-y-4">
							<DialogHeader className={spareDialogHeaderClassName}>
								<DialogTitle className={spareDialogTitleClassName}>Raise PO</DialogTitle>
							</DialogHeader>

							{procurementSpare.pr && <ProcurementInfoHeader spare={procurementSpare} />}

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>PO Number</Label>
								<Input
									value={poForm.number}
									className={spareFormInputClassName}
									onChange={e => setPoForm(f => ({ ...f, number: e.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Quantity</Label>
								<Input
									type="number"
									value={poForm.qty}
									className={spareFormInputClassName}
									onChange={e => setPoForm(f => ({ ...f, qty: +e.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Date</Label>
								<Input
									type="date"
									value={poForm.date}
									className={spareFormInputClassName}
									onChange={e => setPoForm(f => ({ ...f, date: e.currentTarget.value }))}
								/>
							</div>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									type="button"
									variant="outline"
									className={moduleGhostButtonClassName}
									onClick={() => setPoOpen(false)}
								>
									Cancel
								</Button>
								<Button className={moduleActionButtonClassName} onClick={submitPO}>
									Submit PO
								</Button>
							</div>
						</div>
					</DialogContent>
				)}
			</Dialog>

			<Dialog open={grnOpen} onOpenChange={setGrnOpen}>
				{procurementSpare && (
					<DialogContent className={`max-w-lg ${spareDialogClassName}`}>
						<div className="space-y-4">
							<DialogHeader className={spareDialogHeaderClassName}>
								<DialogTitle className={spareDialogTitleClassName}>Reservation</DialogTitle>
							</DialogHeader>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Reservation Number</Label>
								<Input
									value={grnForm.number}
									className={spareFormInputClassName}
									onChange={e => setGrnForm(f => ({ ...f, number: e.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Quantity</Label>
								<Input
									type="number"
									value={grnForm.qty}
									className={spareFormInputClassName}
									onChange={e => setGrnForm(f => ({ ...f, qty: +e.currentTarget.value }))}
								/>
							</div>

							<div className="space-y-2">
								<Label className={spareFieldLabelClassName}>Date</Label>
								<Input
									type="date"
									value={grnForm.date}
									className={spareFormInputClassName}
									onChange={e => setGrnForm(f => ({ ...f, date: e.currentTarget.value }))}
								/>
							</div>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button
									type="button"
									variant="outline"
									className={moduleGhostButtonClassName}
									onClick={() => setGrnOpen(false)}
								>
									Cancel
								</Button>
								<Button className={moduleActionButtonClassName} onClick={submitGRN}>
									Submit GRN
								</Button>
							</div>
						</div>
					</DialogContent>
				)}
			</Dialog>

			{/* ================= MODAL ================= */}
			<Dialog open={!!activeSpare} onOpenChange={(open) => !open && closeActiveSpareDialog()}>
				{activeSpare && (
					<DialogContent className={`max-w-lg ${spareDialogClassName}`}>
						<div className="space-y-4">
						<DialogHeader className={spareDialogHeaderClassName}>
							<DialogTitle className={spareDialogTitleClassName}>
								{mode === "ADD" ? "Add Spare" : "Consume Spare"}
							</DialogTitle>
						</DialogHeader>

						<div className={`${moduleInsetPanelClassName} space-y-1 p-3`}>
							<p className="text-sm font-semibold text-[#1f2430]">{activeSpare.partName}</p>
							<p className="text-xs uppercase tracking-[0.14em] text-[#5f6772]">
								{activeSpare.partCode}
							</p>
						</div>

						{/* PR + PO Context */}
						{mode === "ADD" && (
							<ProcurementInfoHeader spare={activeSpare} />
						)}


						{/* ADD MODE → GRN */}
						{mode === "ADD" && (
							<>
								<Label className={spareFieldLabelClassName}>Reservation Number *</Label>
								<Input
									value={addSpareForm.number}
									className={spareFormInputClassName}
									onChange={e =>
										setAddSpareForm(f => ({ ...f, number: e.currentTarget.value }))
									}
								/>

								<Label className={spareFieldLabelClassName}>Quantity *</Label>
								<Input
									type="number"
									value={addSpareForm.qty}
									className={spareFormInputClassName}
									onChange={e =>
										setAddSpareForm(f => ({ ...f, qty: +e.currentTarget.value }))
									}
								/>

								<Label className={spareFieldLabelClassName}>Date *</Label>
								<Input
									type="date"
									value={addSpareForm.date}
									className={spareFormInputClassName}
									onChange={e =>
										setAddSpareForm(f => ({ ...f, date: e.currentTarget.value }))
									}
								/>
							</>
						)}

						{/* SUB MODE → Receiver */}
						{mode === "SUB" && (
							<>
								<Label className={spareFieldLabelClassName}>Quantity *</Label>
								<Input
									type="number"
									value={txnQty}
									className={spareFormInputClassName}
									onChange={e => setTxnQty(+e.currentTarget.value)}
								/>

								<Label className={spareFieldLabelClassName}>Receiver Name *</Label>
								<Input
									list="receiver-options"
									className={spareFormInputClassName}
									onChange={e => setReceiver(e.currentTarget.value.toUpperCase())}
								/>

								<Label className={spareFieldLabelClassName}>Reason *</Label>
								<Input
									value={reason}
									className={spareFormInputClassName}
									onChange={e => setReason(e.currentTarget.value)}
								/>
							</>
						)}

						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="outline"
								className={moduleGhostButtonClassName}
								onClick={closeActiveSpareDialog}
							>
								Cancel
							</Button>
							<Button
								className={mode === "SUB" ? moduleDangerButtonClassName : moduleActionButtonClassName}
								onClick={submitTransaction}
							>
								Confirm
							</Button>
						</div>
						</div>
					</DialogContent>
				)}
			</Dialog>
		</div>
	);
}

function Kpi({
	title,
	value,
	danger = false,
	warning = false,
	active = false,
	onClick,
}: {
	title: string;
	value: number;
	danger?: boolean;
	warning?: boolean;
	active?: boolean;
	onClick?: () => void;
}) {
	const valueClassName = danger
		? "text-[#b42318]"
		: warning
			? "text-[#b45309]"
			: "text-[#2f358f]";

	const accentClassName = active
		? "ring-2 ring-[rgba(30,64,175,0.2)] border-[rgba(30,64,175,0.2)]"
		: danger
			? "border-[rgba(185,28,28,0.18)]"
			: warning
				? "border-[rgba(245,158,11,0.22)]"
				: "border-[rgba(30,64,175,0.14)]";

	return (
		<motion.div whileHover={{ scale: 1.015 }} transition={{ duration: 0.2 }}>
			<Card
				onClick={onClick}
				className={`
					${moduleSummaryCardClassName}
					cursor-pointer
					backdrop-blur-xl
					transition
					${accentClassName}
				`}
			>
				<div className={moduleSummaryCardAccentClassName} />
				<div className={moduleSummaryCardGlowClassName} />
				<CardHeader className={moduleSummaryCardHeaderClassName}>
					<CardTitle className={moduleSummaryCardTitleClassName}>
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent className={moduleSummaryCardContentClassName}>
					<p className={`${moduleSummaryCardValueClassName} ${valueClassName}`}>
						{value}
					</p>
				</CardContent>
			</Card>
		</motion.div>
	);
}
