export type Machine = {
	machineName: string;
	mouldName: string;
	model: string;
	status: "MACHINE RUNNING" | "MACHINE IN BREAKDOWN" | "NO PRODUCTION PLAN" | "MOULD CHANGEOVER IN PROGRESS";
	plan: number;
	production: number;
	strokeCount: number;
	utilizationLimit: number;
	healthScore: number;
	oilLevel: number;
	lastPMDone: string;
	mouldLoadedAt: string;
};

export type RealTimeMachineData = Machine & {
	cycleTime: number;
	partCount: number;
	liveStatus:
	| "MACHINE RUNNING"
	| "MACHINE IN BREAKDOWN"
	| "NO PRODUCTION PLAN"
	| "MOULD CHANGEOVER IN PROGRESS";
};

export const machineData: Machine[] = [{
	machineName: "JSW",
	mouldName: "MS-03390-YRA-01-003-L-F",
	model: "M-100A",
	status: "MACHINE RUNNING",
	plan: 5000,
	production: 17500,
	strokeCount: 85000,
	utilizationLimit: 100000,
	healthScore: 92,
	oilLevel: 80,
	lastPMDone: "2023-10-15",
	mouldLoadedAt: "2023-10-15"
}, {
	machineName: "Ferro-1, 911 T II",
	mouldName: "Ferro-1, 911 T II",
	model: "M-100B",
	status: "MOULD CHANGEOVER IN PROGRESS",
	plan: 5000,
	production: 7500,
	strokeCount: 98500,
	utilizationLimit: 100000,
	healthScore: 78,
	oilLevel: 65,
	lastPMDone: "2023-09-20",
	mouldLoadedAt: "2023-10-15"
}, {
	machineName: "JSW 850T-1",
	mouldName: "JSW 850T-1",
	model: "M-200X",
	status: "MACHINE IN BREAKDOWN",
	plan: 5000,
	production: 7500,
	strokeCount: 150200,
	utilizationLimit: 200000,
	healthScore: 45,
	oilLevel: 20,
	lastPMDone: "2023-08-01",
	mouldLoadedAt: "2023-10-15"
}, {
	machineName: "JSW 850T-2",
	mouldName: "JSW 850T-2",
	model: "M-100A",
	status: "MACHINE RUNNING",
	plan: 5000,
	production: 7500,
	strokeCount: 45000,
	utilizationLimit: 100000,
	healthScore: 88,
	oilLevel: 95,
	lastPMDone: "2023-11-01",
	mouldLoadedAt: "2023-10-15"
}, {
	machineName: "JSW 1000 T",
	mouldName: "JSW 1000 T",
	model: "M-300P",
	status: "NO PRODUCTION PLAN",
	plan: 5000,
	production: 7500,
	strokeCount: 1500,
	utilizationLimit: 150000,
	healthScore: 99,
	oilLevel: 75,
	lastPMDone: "2023-10-25",
	mouldLoadedAt: "2023-10-15"
}];

export type Asset = {
	serialNo: string;
	name: string;
	category: "Machinery" | "Tooling" | "Electronics" | "Facility";
	status: "In Use" | "In Repair" | "In Storage" | "Decommissioned";
	location: string;
	purchaseDate: string;
	value: number;
	serviceInterval?: number;
	nextServiceDate?: string;
	attachmentsCount?: number;
	expiryDate?: string;
};

export const assetData: Asset[] = [
	{
		serialNo: "ASSET-001",
		name: "CNC Mill",
		category: "Machinery",
		status: "In Use",
		location: "Shop Floor A",
		purchaseDate: "2021-06-10",
		value: 120000,
		serviceInterval: 6,
		nextServiceDate: "2024-08-10",
		attachmentsCount: 2,
		expiryDate: "2026-06-10",
	},
	{
		serialNo: "ASSET-002",
		name: "Laser Scanner",
		category: "Electronics",
		status: "In Use",
		location: "Quality Lab",
		purchaseDate: "2022-03-15",
		value: 35000,
		serviceInterval: 12,
		nextServiceDate: "2025-03-15",
		attachmentsCount: 1,
		expiryDate: "2025-03-15",
	},
	{
		serialNo: "ASSET-003",
		name: "Forklift",
		category: "Facility",
		status: "In Repair",
		location: "Warehouse",
		purchaseDate: "2019-01-20",
		value: 25000,
		serviceInterval: 4,
		nextServiceDate: "2024-05-20",
		expiryDate: "2023-01-20",
	},
	{
		serialNo: "ASSET-004",
		name: "Torque Wrench Calibration Kit",
		category: "Tooling",
		status: "In Storage",
		location: "Tool Crib",
		purchaseDate: "2023-08-01",
		value: 5000,
		expiryDate: "2028-08-01",
	},
	{
		serialNo: "ASSET-005",
		name: "Air Compressor",
		category: "Facility",
		status: "Decommissioned",
		location: "Storage Yard",
		purchaseDate: "2015-05-30",
		value: 8000,
	},
];

export type TeamMember = {
	id: string;
	name: string;
	role: "Operator" | "Maintenance Engineer" | "Supervisor" | "QA";
	department: string;
};

export const teamData: TeamMember[] = [
	{
		id: "EMP-001",
		name: "John Doe",
		role: "Maintenance Engineer",
		department: "Maintenance",
	},
	{
		id: "EMP-002",
		name: "Jane Smith",
		role: "Operator",
		department: "Production",
	},
	{
		id: "EMP-003",
		name: "Mike Brown",
		role: "Supervisor",
		department: "Production",
	},
	{ id: "EMP-004", name: "Sara Wilson", role: "QA", department: "Quality" },
	{
		id: "EMP-005",
		name: "Chris Green",
		role: "Maintenance Engineer",
		department: "Maintenance",
	},
];

export type MachineStats = {
	running: number;
	breakdown: number;
	maintenance: number;
	idle: number;
	pendingPM: number;
	activeBreakdowns: number;
	qualityAlerts: number;
};

// export const machineStats: MachineStats = {
// 	running: machineData.filter((m) => m.status === "MACHINE RUNNING").length,
// 	breakdown: machineData.filter((m) => m.status === "MACHINE IN BREAKDOWN").length,
// 	maintenance: machineData.filter((m) => m.status === "MOULD CHANGEOVER IN PROGRESS").length,
// 	idle: machineData.filter((m) => m.status === "NO PRODUCTION PLAN").length,
// 	pendingPM: 3,
// 	activeBreakdowns: 1,
// 	qualityAlerts: 2,
// };

export type BreakdownLog = {
	id: string;
	machineId: string;
	downtimeStart: string;
	downtimeEnd: string | null;
	rootCause: string;
	status: "Open" | "Closed";
	recurrence: number;
};

export const breakdownLogs: BreakdownLog[] = [
	{
		id: "BD-001",
		machineId: "MC-003",
		downtimeStart: "2023-10-26T10:00:00Z",
		downtimeEnd: "2023-10-26T14:30:00Z",
		rootCause: "Hydraulic pump failure",
		status: "Closed",
		recurrence: 3,
	},
	{
		id: "BD-002",
		machineId: "MC-006",
		downtimeStart: "2023-10-27T08:15:00Z",
		downtimeEnd: null,
		rootCause: "Cooling system leak",
		status: "Open",
		recurrence: 1,
	},
	{
		id: "BD-003",
		machineId: "MC-001",
		downtimeStart: "2023-09-15T14:00:00Z",
		downtimeEnd: "2023-09-15T15:00:00Z",
		rootCause: "Sensor malfunction",
		status: "Closed",
		recurrence: 1,
	},
];

export type PMTask = {
	ticketId: string;
	mouldId: string;
	mouldName: string;
	location: string;
	activity: string;
	checksheets: string;
	status: "Completed" | "In Progress" | "Overdue" | "Scheduled";
	assignee: string;
	dueDate: string;
	checklist?: string[];
};

export const pmSchedule: PMTask[] = [
	{
		ticketId: "PM-001",
		mouldId: "MS-03390-YRA-01-003-L-F",
		mouldName: "YRA",
		location: "Shop Floor A",
		activity: "Monthly Lubrication",
		checksheets: "Monthly",
		status: "In Progress",
		assignee: "John Doe",
		dueDate: "2024-07-15",
		checklist: [
			"Check lubrication levels",
			"Grease all fittings",
			"Inspect for leaks",
		],
	},
];

export type Checksheet = {
	id: string;
	name: string;
	category: "ECM" | "HVAC" | "Fixture" | "Mould";
	tasks: string[];
};

export const checksheetData: Checksheet[] = [
	{
		id: "CS-001",
		name: "ECM Daily Inspection",
		category: "ECM",
		tasks: [
			"Check for error codes",
			"Inspect wiring harness",
			"Listen for unusual noises",
		],
	},
	{
		id: "CS-002",
		name: "HVAC Monthly Service",
		category: "HVAC",
		tasks: [
			"Clean filters",
			"Check refrigerant levels",
			"Inspect blower motor",
		],
	},
	{
		id: "CS-003",
		name: "Fixture Pre-Production Setup",
		category: "Fixture",
		tasks: [
			"Verify clamp pressure",
			"Check alignment pins",
			"Confirm sensor functionality",
		],
	},
	{
		id: "CS-004",
		name: "Mould General PM",
		category: "Mould",
		tasks: [
			"Clean mould face",
			"Inspect for flashing",
			"Lubricate ejector pins",
			"Check cooling channels",
		],
	},
];
export const mouldDetailData = {
	_id: {
		$oid: "6944b914445ade15c38fb678",
	},
	part_code: ["3390", "3400"],
	part_name: "Blower Case LH",
	model: "YRA",
	mould_no: "361",
	mould_id_no: "MS-03390-YRA-01-003-L-F",
	thms_id: "S831PM339010D0R0",
	asset_number: "1022833401",
	customer_name: "MSIL",
	mould_commissioning_date: "2015-09-01",
	mould_steel_core_cavity: "NIMAX",
	mould_weight_core: "5.25",
	mould_weight_cavity: "3.75 ",
	mould_size: "1240 x 1720 x 1171",
	number_of_cavities: "1+1",
	tool_maker: "STEC/361",
	job_id: 361,
	mould_clamping_tonnage: "910 T",
	plastic_raw_material: "PP 20% TF",
	drawing_2d_available: "Available",
	cad_3d_available: "Available",
	cad_data_location: "STEC",
	cad_data_revision: "STEC",
	regulatory_marking_applicable: "N",
	regulatory_marking_spec_available: "NA",
	regulatory_marking_type: "NA",
	number_of_gates: 6,
	gate_type: "Sequential",
	hot_runner_id: "S2014051586",
	hot_runner_make: "YUDO",
	hot_runner_zones: 18,
	ejector_system_type: "Knock out Rod",
	cooling_line_lpm_core: 7,
	cooling_line_lpm_cavity: 8,
	mould_location: "3",
};

export type MouldDetail = typeof mouldDetailData;
export const mouldSelectionOptions = [
	{ model: "YRA", mould_no: "301", mould_id_no: "MS-03390-YRA-01-003-L-F", part_name: "Blower Case LH" },
	{ model: "YRA", mould_no: "300", mould_id_no: "MS-03290-YRA-01-006-R-F", part_name: "Blower Case RH" },
	{ model: "YRA D", mould_no: "DNRP", mould_id_no: "MS-02150-YRA-01-007-R-F", part_name: "P-Tank" },
	{ model: "YP8", mould_no: "DNRP", mould_id_no: "MS-00810-YP8-01-008-R-F", part_name: "P-Tank" },
	{ model: "YL1", mould_no: "DNRP", mould_id_no: "MS-01340-YL1-01-009-R-F", part_name: "Heater Case" },
	{ model: "YRA", mould_no: "486", mould_id_no: "MS-02700-YBA-01-012-R-F", part_name: "P-Tank" },
	{ model: "YC5", mould_no: "DNRP", mould_id_no: "MS-09781-YC5-01-014-R-F", part_name: "Heater Case" },
	{ model: "YRA C", mould_no: "DNRP", mould_id_no: "MS-02161-YRA-02-015-R-F", part_name: "P-Tank 2nd set" },
	{ model: "YHB", mould_no: "502", mould_id_no: "MS-07990-YHB-01-016-R-S", part_name: "COOLING CASE UPPER" },
	{ model: "YHB", mould_no: "501", mould_id_no: "MS-07980-YHB-01-017-R-S", part_name: "COOLING CASE LOWER" },
	{ model: "YHB", mould_no: "520", mould_id_no: "MS-06732-YHB-01-019-R-F", part_name: "Blower Case" },
	{ model: "YL7 G", mould_no: "239", mould_id_no: "MS-00320-YL7-01-022-R-F", part_name: "P-TANK-G" },
	{ model: "YL1", mould_no: "DNRP", mould_id_no: "MS-00781-YL1-01-023-R-F", part_name: "P-TANK" },
	{ model: "YL7 B", mould_no: "DNRP", mould_id_no: "MS-001130-YL7-01-024-R-F", part_name: "P-TANK" },
	{ model: "YP8", mould_no: "187", mould_id_no: "MS-06530-YP8-01-025-R-F", part_name: "HEATER CASE" },
	{ model: "YBA Minor", mould_no: "635", mould_id_no: "MS-05600-YBA-01-027-R-F", part_name: "P-Tank" },
	{ model: "YAD", mould_no: "301", mould_id_no: "MS-08290-YAD-01-028-R-S", part_name: "Clamp" },
	{ model: "YE-3", mould_no: "STEC", mould_id_no: "MS-08560-YE3-01-029-R-F", part_name: "Bracket" },
	{ model: "YP8/YHA", mould_no: "411", mould_id_no: "MS-07530-YP8-01-031-R-F", part_name: "HEATER CASE" },
	{ model: "YRA", mould_no: "407", mould_id_no: "MS-04510-YRA-01-032-R-F", part_name: "HEATER CASE" },
	{ model: "YWD", mould_no: "763", mould_id_no: "MS-09180-YWD-01-37-R-S", part_name: "HEATER CASE RH" },
	{ model: "YWD", mould_no: "764", mould_id_no: "MS-05500-YWD-01-38-R-F", part_name: "BLOWER CASE RH" },
	{ model: "YG8", mould_no: "706", mould_id_no: "MS-06780-YG8-01-40-L-F", part_name: "Blower Case LH" },
	{ model: "YG8", mould_no: "783", mould_id_no: "MS-06760-YG8-01-39-R-F", part_name: "Heater Case RH" },
	{ model: "YG8", mould_no: "724", mould_id_no: "MS-01810-YG8-01-41-L-F", part_name: "HEATER CASE LH" },
	{ model: "YOM", mould_no: "707", mould_id_no: "MS-01070-YOM-01-042-R-S", part_name: "Cooling Case RH" },
	{ model: "YOM", mould_no: "708", mould_id_no: "MS-01080-YOM-01-043-R-S", part_name: "Case Dust Air" },
	{ model: "YOM", mould_no: "710", mould_id_no: "MS-06240-YOM-01-044-R-S", part_name: "Case Dust Air" },
	{ model: "YFGTHS", mould_no: "777", mould_id_no: "MS-07450-YFGTHS-01-045-R-F", part_name: "Plate Non AC" },
	{ model: "YFGNM", mould_no: "779", mould_id_no: "MS-07710-YFGNM-01-046-R-F", part_name: "P Tank" },
	{ model: "Ace Edge", mould_no: "570", mould_id_no: "TA-0260-AceEdge-01-48-R-S", part_name: "P Tank" },
	{ model: "Ace Edge", mould_no: "572", mould_id_no: "TA-05960-AceEdge-01-49-R-S", part_name: "EVV Cover" },
	{ model: "Ace Edge", mould_name: "603", mould_id_no: "TA-0860-AceEdge-01-50-R-S", part_name: "Mounting Bracket" },
	{ model: "C110", mould_no: "674", mould_id_no: "TA-03340-C110-01-52-R-S", part_name: "Foot Duct" },
	{ model: "C110", mould_no: "675", mould_id_no: "TA-06460-C110-01-53-R-S", part_name: "Mounting Bracket" },
	{ model: "YG8", mould_no: "763", mould_id_no: "MS-01230-YG8-01-55-R-S", part_name: "EVV Cover" },
	{ model: "YSDM", mould_no: "670", mould_id_no: "MS-02900-YSDM-01-56-R-F", part_name: "Return duct" },
	{ model: "YG8", mould_no: "772", mould_id_no: "MS-07360-YG8-01-57-R-S", part_name: "Flange Case" },
	{ model: "YWD", mould_no: "709", mould_id_no: "MS-09070-YWD-01-58-L-S", part_name: "Door Lever" },
	{ model: "YE-3", mould_no: "397", mould_id_no: "MS-01390-YE3-01-59-L-F", part_name: "Heater Case LH" },
	{ model: "YWD", mould_no: "711", mould_id_no: "MS-03720-YWD-01-60-L-F", part_name: "BLOWER CASE" },
	{ model: "YWD", mould_no: "781", mould_id_no: "MS-03784-YWD-01-61-R-S", part_name: "BLOWER CASE LH" },
	{ model: "YRA C", mould_no: "830", mould_id_no: "MS-02161-YRA-03-63-R-F", part_name: "Drum" },
	{ model: "YED", mould_no: "960", mould_id_no: "MS-06732-YED-01-65-R-F", part_name: "P-tank 3rd set" },
	{ model: "YHB", mould_no: "973", mould_id_no: "MS-07990-YHB-01-067-R-S", part_name: "Blower case" },
	{ model: "YED", mould_no: "Japa", mould_id_no: "MS-03022-YED-01-64-R-F", part_name: "COOLING CASE UPPER" },
	{ model: "YXA", mould_no: "MOL-714", mould_id_no: "MS-08530-YXA-01-034-R-F", part_name: "Sliding door" },
	{ model: "YJC", mould_no: "MOL-400", mould_id_no: "MS-05420-YJC-01-004-R-F", part_name: "P Tank" },
	{ model: "YOM", mould_no: "MOL-704", mould_id_no: "MS-06600-YOM-01-036-R-S", part_name: "Blower case" },
	{ model: "YG8", mould_no: "MOL-706", mould_id_no: "MS-01770-YG8-01-47-R-F", part_name: "Heater Case" },
	{ model: "YL8", mould_no: "MOL--", mould_id_no: "MS-01510-YL8-01-68-R-S", part_name: "Cooling Case RH" },
	{ model: "YL8", mould_no: "MOL-153", mould_id_no: "MS-01520-YL8-01-69-R-S", part_name: "Cooling case" },
	{ model: "YL1/YRA", mould_no: "MOL--", mould_id_no: "MS-01981-YL1-01-70-R-F", part_name: "Cooling case" },
	{ model: "YOM", mould_no: "MOL-703", mould_id_no: "MS-03710-YOM-01-035-R-F", part_name: "Blower Case" },
	{ model: "Y17", mould_no: "MOL-971", mould_id_no: "MS-09410-Y17-01-71-R-F", part_name: "Blower case" },
	{ model: "Y17", mould_no: "MOL-964", mould_id_no: "MS-07720-Y17-01-72-R-F", part_name: "Blower Case" },
	{ model: "YHB", mould_no: "MOL-721", mould_id_no: "MS-00960-YHB-01-018-R-F", part_name: "Blower Case LH" },
	{ model: "YCA", mould_no: "MOL-586", mould_id_no: "MS-09910-YCA-01-021-R-F", part_name: "Heater Case" }
];
export const pmPlanningStats = {
	monthlyStatus: 92,
	passedDue: 3,
	yearlyPlanVsActual: {
		plan: 140,
		actual: 128,
	},
	teamMembers: 12,
};

export const sparePartStats = {
	mouldSpareConsumption: 1250,
	fixtureSpareConsumption: 870,
	reorderLevelMet: 8,
};

export type SkillMatrixMember = {
	id: string;
	name: string;
	post: "Operator" | "Maintenance Engineer" | "Supervisor" | "QA" | "Team Lead";
};

export const skillMatrixData: SkillMatrixMember[] = [
	{ id: "EMP-001", name: "John Doe", post: "Maintenance Engineer" },
	{ id: "EMP-002", name: "Jane Smith", post: "Operator" },
	{ id: "EMP-003", name: "Mike Brown", post: "Supervisor" },
	{ id: "EMP-004", name: "Sara Wilson", post: "QA" },
	{ id: "EMP-005", name: "Chris Green", post: "Maintenance Engineer" },
	{ id: "EMP-006", name: "Alex Ray", post: "Team Lead" },
];

export const yearlyBreakdownData = [
	{ month: "Jan", breakdowns: 4 },
	{ month: "Feb", breakdowns: 3 },
	{ month: "Mar", breakdowns: 5 },
	{ month: "Apr", breakdowns: 4 },
	{ month: "May", breakdowns: 6 },
	{ month: "Jun", breakdowns: 5 },
	{ month: "Jul", breakdowns: 7 },
	{ month: "Aug", breakdowns: 6 },
	{ month: "Sep", breakdowns: 5 },
	{ month: "Oct", breakdowns: 8 },
	{ month: "Nov", breakdowns: 7 },
	{ month: "Dec", breakdowns: 9 },
];

export const topBreakdownsData = [
	{ name: "Hydraulic Leak", value: 12, fill: "hsl(var(--chart-1))" },
	{ name: "Sensor Failure", value: 8, fill: "hsl(var(--chart-2))" },
	{ name: "Overheating", value: 5, fill: "hsl(var(--chart-3))" },
];
