import { useState } from "react";
import { Plus, Trash2 } from "lucide-preact";
import type { JSX } from "preact";
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

type ItineraryRow = {
	depart: string;
	arrive: string;
	date: string;
	timings: string;
	remarks: string;
};

type SubmissionSummary = {
	id: number;
	date: string;
	employeeName: string;
	employeeCode: string;
	type: string;
	budget: string;
	availed: string;
	createdAt: string;
};

const pad = (value: number) => String(value).padStart(2, "0");

const formatDate = (value: string | Date) => {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const formatDateTime = (value: Date) => {
	return `${formatDate(value)} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
		value.getSeconds()
	)}`;
};

const createEmptyRow = (): ItineraryRow => ({
	depart: "",
	arrive: "",
	date: "",
	timings: "",
	remarks: "",
});

const sectionClass =
	"rounded-2xl border border-[rgba(148,163,184,0.34)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] md:p-5";

const sectionTitleClass =
	"mb-4 font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700";
const fieldSurfaceClass =
	"bg-white text-slate-800 placeholder:text-slate-400 transition-shadow focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300/60 focus-visible:ring-offset-0";

type FieldProps = {
	label: string;
	children: JSX.Element;
};

const Field = ({ label, children }: FieldProps) => (
	<div>
		<label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
			{label}
		</label>
		{children}
	</div>
);

const AutoGrowTextarea = (props: JSX.HTMLAttributes<HTMLTextAreaElement>) => {
	const handleInput: JSX.GenericEventHandler<HTMLTextAreaElement> = (event) => {
		const target = event.currentTarget;
		target.style.height = "auto";
		target.style.height = `${target.scrollHeight}px`;
	};

	return (
		<Textarea
			rows={5}
			{...props}
			onInput={handleInput}
			className={`resize-none overflow-hidden ${fieldSurfaceClass} ${props.className ?? ""}`}
		/>
	);
};

export default function TravelRequisitionFormPage() {
	const [open, setOpen] = useState(false);
	const [formKey, setFormKey] = useState(0);
	const [submissionList, setSubmissionList] = useState<SubmissionSummary[]>([]);

	const [employeeName, setEmployeeName] = useState("");
	const [employeeCode, setEmployeeCode] = useState("");
	const [department, setDepartment] = useState("");
	const [travelType, setTravelType] = useState("");
	const [travelDate, setTravelDate] = useState("");
	const [budget, setBudget] = useState("");
	const [availed, setAvailed] = useState("");

	const [itineraryRows, setItineraryRows] = useState<ItineraryRow[]>(
		Array.from({ length: 5 }, () => createEmptyRow())
	);

	const resetForm = () => {
		setEmployeeName("");
		setEmployeeCode("");
		setDepartment("");
		setTravelType("");
		setTravelDate("");
		setBudget("");
		setAvailed("");
		setItineraryRows(Array.from({ length: 5 }, () => createEmptyRow()));
		setFormKey((prev) => prev + 1);
	};

	const handleRowChange = (
		index: number,
		field: keyof ItineraryRow,
		value: string
	) => {
		setItineraryRows((prev) =>
			prev.map((row, rowIndex) =>
				rowIndex === index ? { ...row, [field]: value } : row
			)
		);
	};

	const handleAddRow = (index: number) => {
		setItineraryRows((prev) => {
			const next = [...prev];
			next.splice(index + 1, 0, createEmptyRow());
			return next;
		});
	};

	const handleDeleteRow = (index: number) => {
		setItineraryRows((prev) => {
			if (prev.length > 5) {
				return prev.filter((_, rowIndex) => rowIndex !== index);
			}
			return prev.map((row, rowIndex) =>
				rowIndex === index ? createEmptyRow() : row
			);
		});
	};

	const handleSubmit: JSX.GenericEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();

		const today = new Date();
		const createdAt = formatDateTime(today);

		const summary: SubmissionSummary = {
			id: Date.now(),
			date: travelDate ? formatDate(travelDate) : "-",
			employeeName: employeeName || "-",
			employeeCode: employeeCode || "-",
			type: travelType || "-",
			budget: budget || "-",
			availed: availed || "-",
			createdAt,
		};

		setSubmissionList((prev) => [summary, ...prev]);
		setOpen(false);
		resetForm();
	};

	return (
		<div className="dashboard-glass flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-5">
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="!flex !h-[90vh] !max-h-[90vh] !max-w-[1200px] !flex-col !gap-0 overflow-hidden border-[rgba(148,163,184,0.32)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] p-0"
					overlayClassName="bg-slate-900/55 backdrop-blur-[2px]"
				>
					<div className="flex h-full flex-col">
						<DialogHeader className="border-b border-slate-200 px-6 py-4">
							<DialogTitle className="font-headline uppercase tracking-[0.14em] text-slate-700">
								Travel Requisition Form
							</DialogTitle>
						</DialogHeader>

						<div className="min-h-0 flex-1 overflow-y-scroll p-4 md:p-6">
							<form key={formKey} className="space-y-5" onSubmit={handleSubmit}>
								<div className={sectionClass}>
									<p className={sectionTitleClass}>Employee Details</p>
									<div className="space-y-3">
										<Field label="Employee Name">
											<Input
												value={employeeName}
												onInput={(e) => setEmployeeName(e.currentTarget.value)}
												className={fieldSurfaceClass}
											/>
										</Field>

										<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
											<Field label="Employee Code">
												<Input
													value={employeeCode}
													onInput={(e) => setEmployeeCode(e.currentTarget.value)}
													className={fieldSurfaceClass}
												/>
											</Field>
											<Field label="Department">
												<Input
													value={department}
													onInput={(e) => setDepartment(e.currentTarget.value)}
													className={fieldSurfaceClass}
												/>
											</Field>
										</div>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Travel Summary</p>
									<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
										<Field label="Type">
											<Select value={travelType} onValueChange={setTravelType}>
												<SelectTrigger className={fieldSurfaceClass}>
													<SelectValue placeholder="Select travel type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="personal">Personal</SelectItem>
													<SelectItem value="official">Official</SelectItem>
												</SelectContent>
											</Select>
										</Field>
										<Field label="Date">
											<Input
												type="date"
												value={travelDate}
												onInput={(e) => setTravelDate(e.currentTarget.value)}
												className={fieldSurfaceClass}
											/>
										</Field>
										<Field label="Budget">
											<Input
												value={budget}
												onInput={(e) => setBudget(e.currentTarget.value)}
												className={fieldSurfaceClass}
											/>
										</Field>
										<Field label="Availed">
											<Input
												value={availed}
												onInput={(e) => setAvailed(e.currentTarget.value)}
												className={fieldSurfaceClass}
											/>
										</Field>
									</div>
								</div>

									<div className={sectionClass}>
										<p className={sectionTitleClass}>Itinerary</p>
										<div className="overflow-x-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
											<table className="w-full min-w-[980px] border-collapse text-sm text-slate-800">
												<thead>
													<tr className="bg-slate-100 text-left text-slate-700">
														<th className="border border-slate-300 px-3 py-2.5 font-semibold">Date</th>
														<th className="border border-slate-300 px-3 py-2.5 font-semibold">Timings</th>
														<th className="border border-slate-300 px-3 py-2.5 font-semibold">Depart</th>
													<th className="border border-slate-300 px-3 py-2.5 font-semibold">Arrive</th>
													<th className="border border-slate-300 px-3 py-2.5 font-semibold">Remarks</th>
													<th className="border border-slate-300 px-3 py-2.5 text-center font-semibold">Action</th>
												</tr>
												</thead>
												<tbody>
													{itineraryRows.map((row, rowIndex) => (
														<tr key={rowIndex} className="odd:bg-slate-50/40 even:bg-white/90 text-slate-800">
														<td className="border border-slate-200 p-1.5">
															<Input
																type="date"
																value={row.date}
																onInput={(e) =>
																	handleRowChange(rowIndex, "date", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.timings}
																onInput={(e) =>
																	handleRowChange(rowIndex, "timings", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.depart}
																onInput={(e) =>
																	handleRowChange(rowIndex, "depart", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.arrive}
																onInput={(e) =>
																	handleRowChange(rowIndex, "arrive", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<Input
																value={row.remarks}
																onInput={(e) =>
																	handleRowChange(rowIndex, "remarks", e.currentTarget.value)
																}
																className={`h-9 border-slate-200 shadow-none ${fieldSurfaceClass}`}
															/>
														</td>
														<td className="border border-slate-200 p-1.5">
															<div className="flex items-center justify-center gap-1.5">
																<Button
																	type="button"
																	variant="outline"
																	size="icon"
																	onClick={() => handleAddRow(rowIndex)}
																	className="h-8 w-8 border-slate-300 bg-white"
																>
																	<Plus className="h-4 w-4 text-slate-700" />
																</Button>
																{itineraryRows.length > 5 ? (
																	<Button
																		type="button"
																		variant="outline"
																		size="icon"
																		onClick={() => handleDeleteRow(rowIndex)}
																		className="h-8 w-8 border-slate-300 bg-white"
																	>
																		<Trash2 className="h-4 w-4 text-rose-600" />
																	</Button>
																) : null}
															</div>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
									<div className={sectionClass}>
										<p className={sectionTitleClass}>Travel Type and Logistics</p>
										<div className="space-y-3">
											<div className="grid grid-cols-2 gap-3">
												<label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
													<input type="radio" name="travelTypeCategory" />
													Domestic
												</label>
												<label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
													<input type="radio" name="travelTypeCategory" />
													International
												</label>
											</div>

											<div className="grid grid-cols-3 gap-3">
												{["Air", "Train", "Road"].map((mode) => (
													<label
														key={mode}
														className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
													>
														<input type="checkbox" />
														{mode}
													</label>
												))}
											</div>

											<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
												<Field label="Hotel Requisition (Y/N)">
													<Select>
														<SelectTrigger className={fieldSurfaceClass}>
															<SelectValue placeholder="Select" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="yes">Yes</SelectItem>
															<SelectItem value="no">No</SelectItem>
														</SelectContent>
													</Select>
												</Field>
												<Field label="Hotel Budget">
													<Input className={fieldSurfaceClass} />
												</Field>
											</div>

											<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
												<Field label="Visa (Y/N)">
													<Select>
														<SelectTrigger className={fieldSurfaceClass}>
															<SelectValue placeholder="Select" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="yes">Yes</SelectItem>
															<SelectItem value="no">No</SelectItem>
														</SelectContent>
													</Select>
												</Field>
												<Field label="Visa Budget">
													<Input className={fieldSurfaceClass} />
												</Field>
											</div>
										</div>
									</div>

									<div className="space-y-5">
										<div className={sectionClass}>
											<p className={sectionTitleClass}>Imprest for Domestic Travel</p>
											<div className="grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-6">
													<Field label="Entitlement">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="No. of Days">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="Total">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
											</div>
											<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-8">
													<Field label="Special Approval (if any)">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
												<div className="md:col-span-4">
													<Field label="Amount">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
											</div>
										</div>

										<div className={sectionClass}>
											<p className={sectionTitleClass}>Imprest for Foreign Travel</p>
											<div className="grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-6">
													<Field label="Entitlement">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="No. of Days">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
												<div className="md:col-span-3">
													<Field label="Total">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
											</div>

											<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-8">
													<Field label="Special Approval (if any)">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
												<div className="md:col-span-4">
													<Field label="Amount">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
											</div>

											<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
												<div className="md:col-span-8">
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.11em] text-slate-600">
														Denomination
													</label>
													<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
														{["Euro", "Dollar", "GBP", "OTHS"].map((currency) => (
															<label
																key={currency}
																className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
															>
																<input type="radio" name="forexDenomination" value={currency} />
																{currency}
															</label>
														))}
													</div>
												</div>
												<div className="md:col-span-4">
													<Field label="Total Forex Required">
														<Input className={fieldSurfaceClass} />
													</Field>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className={sectionClass}>
									<p className={sectionTitleClass}>Travel Justification</p>
									<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
										<Field label="Reason of Travel">
											<AutoGrowTextarea />
										</Field>
										<Field label="Output Expected from the Travel">
											<AutoGrowTextarea />
										</Field>
									</div>
									<div className="mt-4">
										<Field label="Flight Changes if Required, Please Mention">
											<AutoGrowTextarea />
										</Field>
									</div>
								</div>

								<div className="flex justify-end border-t border-slate-300 pt-4">
									<Button
										type="submit"
										className="min-w-40 rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white shadow-[0_10px_22px_rgba(29,78,216,0.28)] hover:opacity-95"
									>
										Submit
									</Button>
								</div>
							</form>
						</div>
					</div>
				</DialogContent>

				<div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5">
					<div className="mb-3 flex items-center justify-between">
						<p className="font-headline text-sm font-bold uppercase tracking-[0.14em] text-slate-700">
							Travel Requisition Summary
						</p>
						<DialogTrigger asChild>
							<Button className="rounded-lg bg-[linear-gradient(90deg,#1d4ed8,#0891b2)] text-white">
								New Travel Requisition
							</Button>
						</DialogTrigger>
					</div>
				<div className="h-full overflow-auto rounded-xl border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] text-slate-800">
					<table className="w-full min-w-[860px] border-collapse text-sm text-slate-800">
						<thead>
							<tr className="bg-slate-100 text-left text-slate-700">
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Travel Date</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Employee Name</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Emp Code</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Type</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Budget</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Availed</th>
								<th className="border border-slate-300 px-3 py-2.5 font-semibold">Submitted At</th>
							</tr>
						</thead>
						<tbody>
							{submissionList.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
										No submissions yet. Click "New Travel Requisition" to add one.
									</td>
								</tr>
							) : (
								submissionList.map((item) => (
									<tr key={item.id} className="odd:bg-slate-50/40 even:bg-white/90 text-slate-800">
										<td className="border border-slate-200 px-3 py-2.5">{item.date}</td>
										<td className="border border-slate-200 px-3 py-2.5">{item.employeeName}</td>
										<td className="border border-slate-200 px-3 py-2.5">{item.employeeCode}</td>
										<td className="border border-slate-200 px-3 py-2.5">{item.type}</td>
										<td className="border border-slate-200 px-3 py-2.5">{item.budget}</td>
										<td className="border border-slate-200 px-3 py-2.5">{item.availed}</td>
										<td className="border border-slate-200 px-3 py-2.5">{item.createdAt}</td>
									</tr>
								))
							)}
							</tbody>
						</table>
					</div>
				</div>
			</Dialog>
		</div>
	);
}
