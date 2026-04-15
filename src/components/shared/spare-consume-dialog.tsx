"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
	moduleActionButtonClassName,
	moduleDialogClassName,
	moduleGhostButtonClassName,
	moduleInsetPanelClassName,
	moduleInputClassName,
	moduleMutedTextClassName,
	moduleSelectClassName,
	moduleTableCellClassName,
	moduleTableHeadClassName,
	moduleTableRowClassName,
} from "./module-surface-theme";

type SpareOption = {
	id: string;
	partCode: string;
	partName: string;
	quantity: number;
};

type CartItem = {
	spare: SpareOption;
	quantity: number;
};

type SpareHistoryItem = {
	spareId?: string;
	partCode: string;
	partName: string;
	quantity: number;
};

type SpareHistoryPayload = {
	receiver: string;
	reason: string;
	items: SpareHistoryItem[];
	consumed?: boolean;
	consumed_at?: string;
};

type SpareConsumeDialogProps = {
	title: string;
	assetName: string;
	reasonPrefix: string;
	existingSpareHistory?: { items?: SpareHistoryItem[] } | null;
	lockMessage: string;
	noSpareButtonLabel: string;
	confirmButtonLabel: string;
	submitErrorMessage: string;
	includeConsumedMeta?: boolean;
	onClose: () => void;
	onAfterSubmit: () => Promise<void> | void;
	saveNoSpare: (payload: SpareHistoryPayload) => Promise<void>;
	saveWithItems: (payload: SpareHistoryPayload) => Promise<void>;
};

const radioCardBaseClassName =
	"cursor-pointer rounded-[0.95rem] border px-4 py-3 transition-colors";

const radioCardSelectedClassName =
	"border-[rgba(30,64,175,0.18)] bg-[linear-gradient(135deg,rgba(30,64,175,0.14),rgba(8,145,178,0.14))] text-[#1f2430]";

const radioCardIdleClassName =
	"border-[rgba(95,103,114,0.12)] bg-white/82 text-[#5f6772] hover:bg-[rgba(59,130,246,0.08)]";

const sectionTitleClassName =
	"text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]";

const warningBannerClassName =
	"rounded-[0.95rem] border border-[rgba(234,179,8,0.28)] bg-[rgba(250,204,21,0.18)] px-4 py-3 text-sm text-[#854d0e]";

const getSpareApi = () => {
	const { protocol, hostname } = window.location;
	return `${protocol}//${hostname}:54321/api/spare`;
};

export function SpareConsumeDialog({
	title,
	assetName,
	reasonPrefix,
	existingSpareHistory,
	lockMessage,
	noSpareButtonLabel,
	confirmButtonLabel,
	submitErrorMessage,
	includeConsumedMeta = false,
	onClose,
	onAfterSubmit,
	saveNoSpare,
	saveWithItems,
}: SpareConsumeDialogProps) {
	const [spares, setSpares] = useState<SpareOption[]>([]);
	const [selectedSpareId, setSelectedSpareId] = useState("");
	const [qty, setQty] = useState(1);
	const [receiver, setReceiver] = useState("");
	const [reason, setReason] = useState("");
	const [cart, setCart] = useState<CartItem[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [consumeSpare, setConsumeSpare] = useState<"YES" | "NO" | "">("");

	const hasSpareHistory = Boolean(existingSpareHistory);
	const historyItems = existingSpareHistory?.items ?? [];

	useEffect(() => {
		if (hasSpareHistory || consumeSpare !== "YES") {
			return;
		}

		fetch(getSpareApi())
			.then((res) => res.json())
			.then((data) => setSpares(Array.isArray(data) ? data : []))
			.catch(console.error);
	}, [consumeSpare, hasSpareHistory]);

	const selectedSpare = useMemo(
		() => spares.find((spare) => spare.id === selectedSpareId),
		[spares, selectedSpareId]
	);

	const addToCart = () => {
		if (!selectedSpare) {
			alert("Select spare");
			return;
		}

		if (qty <= 0) {
			alert("Quantity must be greater than zero");
			return;
		}

		const existing = cart.find((item) => item.spare.id === selectedSpare.id);
		const existingQty = existing?.quantity ?? 0;
		const totalQty = existingQty + qty;

		if (totalQty > selectedSpare.quantity) {
			alert(`Available quantity: ${selectedSpare.quantity}`);
			return;
		}

		setCart((prev) => {
			if (existing) {
				return prev.map((item) =>
					item.spare.id === selectedSpare.id
						? { ...item, quantity: totalQty }
						: item
				);
			}

			return [...prev, { spare: selectedSpare, quantity: qty }];
		});

		setSelectedSpareId("");
		setQty(1);
	};

	const submitAll = async () => {
		if (!consumeSpare) {
			alert("Please select whether spare consumption is required");
			return;
		}

		setSubmitting(true);

		try {
			if (consumeSpare === "NO") {
				const payload: SpareHistoryPayload = {
					receiver: "NA",
					reason: `${reasonPrefix} - No spare consumption`,
					items: [],
					...(includeConsumedMeta
						? {
								consumed: false,
								consumed_at: new Date().toISOString(),
							}
						: {}),
				};

				await saveNoSpare(payload);
				await onAfterSubmit();
				onClose();
				return;
			}

			if (!cart.length) {
				alert("No spare items added");
				return;
			}

			if (!receiver.trim() || !reason.trim()) {
				alert("Receiver and reason are mandatory");
				return;
			}

			for (const item of cart) {
				const stockPayload = {
					action: "SUB",
					spareId: item.spare.id,
					quantity: item.quantity,
					receiver: receiver.trim(),
					reason: `${reasonPrefix} - ${reason.trim()}`,
				};

				const response = await fetch(getSpareApi(), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(stockPayload),
				});

				if (!response.ok) {
					throw new Error(`Stock update failed for ${item.spare.partCode}`);
				}
			}

			const payload: SpareHistoryPayload = {
				receiver: receiver.trim(),
				reason: `${reasonPrefix} - ${reason.trim()}`,
				items: cart.map((item) => ({
					spareId: item.spare.id,
					partCode: item.spare.partCode,
					partName: item.spare.partName,
					quantity: item.quantity,
				})),
				...(includeConsumedMeta
					? {
							consumed: true,
							consumed_at: new Date().toISOString(),
						}
					: {}),
			};

			await saveWithItems(payload);
			await onAfterSubmit();
			onClose();
		} catch (error) {
			console.error(error);
			alert(submitErrorMessage);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
		>
			<DialogContent className={`${moduleDialogClassName} max-w-3xl p-0`}>
				<DialogHeader className="border-b border-[rgba(30,64,175,0.14)] px-6 py-5">
					<DialogTitle className="text-center text-base font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
						{title} - {assetName}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 p-6">
					{!hasSpareHistory && (
						<div className={`${moduleInsetPanelClassName} space-y-3 p-4`}>
							<Label className={sectionTitleClassName}>
								Is spare consumption required?
							</Label>
							<div className="grid gap-3 md:grid-cols-2">
								{[
									{
										value: "YES" as const,
										label: "Yes",
										description: "Select parts, quantity, receiver, and reason.",
									},
									{
										value: "NO" as const,
										label: "No",
										description: "Record the activity without consuming spare stock.",
									},
								].map((option) => {
									const selected = consumeSpare === option.value;

									return (
										<label
											key={option.value}
											className={`${radioCardBaseClassName} ${
												selected
													? radioCardSelectedClassName
													: radioCardIdleClassName
											}`}
										>
											<input
												type="radio"
												name="consumeSpare"
												value={option.value}
												checked={selected}
												onChange={() => setConsumeSpare(option.value)}
												className="sr-only"
											/>
											<div className="flex items-start gap-3">
												<div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(30,64,175,0.28)] bg-white/90">
													<div
														className={`h-2 w-2 rounded-full ${
															selected ? "bg-[#1d4ed8]" : "bg-transparent"
														}`}
													/>
												</div>
												<div className="space-y-1">
													<div className="text-sm font-semibold uppercase tracking-[0.12em]">
														{option.label}
													</div>
													<div className={moduleMutedTextClassName}>
														{option.description}
													</div>
												</div>
											</div>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{hasSpareHistory && (
						<div className="space-y-4">
							<div className={warningBannerClassName}>{lockMessage}</div>
							<div className={`${moduleInsetPanelClassName} overflow-hidden`}>
								<div className="border-b border-[rgba(30,64,175,0.14)] px-4 py-3">
									<h4 className={sectionTitleClassName}>Consumed Spares</h4>
								</div>
								<div className="overflow-x-auto">
									<Table className="w-full table-fixed">
										<TableHeader>
											<TableRow className="text-center">
												<TableHead className={`${moduleTableHeadClassName} text-left`}>
													Part Code
												</TableHead>
												<TableHead className={`${moduleTableHeadClassName} text-left`}>
													Part Name
												</TableHead>
												<TableHead className={`${moduleTableHeadClassName} text-center`}>
													Quantity
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{historyItems.map((item, index) => (
												<TableRow key={`${item.partCode}-${index}`} className={moduleTableRowClassName}>
													<TableCell className={`${moduleTableCellClassName} text-left`}>
														{item.partCode}
													</TableCell>
													<TableCell className={`${moduleTableCellClassName} text-left`}>
														{item.partName}
													</TableCell>
													<TableCell className={`${moduleTableCellClassName} text-center font-semibold`}>
														{item.quantity}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						</div>
					)}

					{!hasSpareHistory && consumeSpare === "YES" && (
						<div className="space-y-4">
							<div className={`${moduleInsetPanelClassName} space-y-4 p-4`}>
								<div className="grid gap-4 md:grid-cols-3 md:items-end">
									<div className="md:col-span-2">
										<Label className={sectionTitleClassName}>Select Spare</Label>
										<select
											value={selectedSpareId}
											onChange={(event) => setSelectedSpareId(event.currentTarget.value)}
											className={`${moduleSelectClassName} mt-2`}
										>
											<option value="">-- Select Spare --</option>
											{spares.map((spare) => (
												<option key={spare.id} value={spare.id}>
													{spare.partCode} - {spare.partName} (Avail: {spare.quantity})
												</option>
											))}
										</select>
									</div>

									<div>
										<Label className={sectionTitleClassName}>Quantity</Label>
										<Input
											type="number"
											min={1}
											value={qty}
											onChange={(event) => setQty(Number(event.currentTarget.value) || 0)}
											className={`${moduleInputClassName} mt-2`}
										/>
									</div>
								</div>

								<Button className={`${moduleActionButtonClassName} w-full`} onClick={addToCart}>
									Add Spare
								</Button>
							</div>

							{cart.length > 0 && (
								<div className={`${moduleInsetPanelClassName} space-y-4 p-4`}>
									<h4 className={sectionTitleClassName}>Selected Spares</h4>
									<div className="overflow-x-auto">
										<Table className="w-full table-fixed">
											<TableHeader>
												<TableRow className="text-center">
													<TableHead className={`${moduleTableHeadClassName} text-left`}>
														Part
													</TableHead>
													<TableHead className={`${moduleTableHeadClassName} text-center`}>
														Quantity
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{cart.map((item) => (
													<TableRow key={item.spare.id} className={moduleTableRowClassName}>
														<TableCell className={`${moduleTableCellClassName} text-left`}>
															{item.spare.partName} ({item.spare.partCode})
														</TableCell>
														<TableCell className={`${moduleTableCellClassName} text-center font-semibold`}>
															{item.quantity}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<Label className={sectionTitleClassName}>Receiver *</Label>
											<Input
												value={receiver}
												onChange={(event) =>
													setReceiver(event.currentTarget.value.toUpperCase())
												}
												className={`${moduleInputClassName} mt-2`}
											/>
										</div>
										<div>
											<Label className={sectionTitleClassName}>Reason *</Label>
											<Input
												value={reason}
												onChange={(event) => setReason(event.currentTarget.value)}
												className={`${moduleInputClassName} mt-2`}
											/>
										</div>
									</div>

									<Button
										className={`${moduleActionButtonClassName} w-full`}
										disabled={submitting}
										onClick={submitAll}
									>
										{submitting ? "Submitting..." : confirmButtonLabel}
									</Button>
								</div>
							)}
						</div>
					)}

					{!hasSpareHistory && consumeSpare === "NO" && (
						<Button
							className={`${moduleGhostButtonClassName} w-full`}
							disabled={submitting}
							onClick={submitAll}
						>
							{submitting ? "Submitting..." : noSpareButtonLabel}
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
