import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";

const app = express();

const PORT = Number(process.env.PORT ?? 54321);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "*";
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/munjal-manesar";
const DB_NAME = "munjal-manesar";

app.use(
	cors({
		origin: CLIENT_ORIGIN === "*" ? true : CLIENT_ORIGIN,
		credentials: true,
	})
);
app.use(express.json());

const userSchema = new mongoose.Schema(
	{
		employeeName: {
			type: String,
			required: true,
			trim: true,
		},
		employeeCode: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		department: {
			type: String,
			required: true,
			trim: true,
		},
		role: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		mobileNumber: {
			type: String,
			required: true,
			trim: true,
		},
		username: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		approved: {
			type: Boolean,
			default: false,
		},
	},
	{
		collection: "user-master",
		timestamps: true,
		versionKey: false,
	}
);

const User = mongoose.models.UserMaster || mongoose.model("UserMaster", userSchema);

const departmentMasterSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
	},
	{
		collection: "department-master",
		timestamps: true,
		versionKey: false,
	}
);

const DepartmentMaster =
	mongoose.models.DepartmentMaster ||
	mongoose.model("DepartmentMaster", departmentMasterSchema);

const roleMasterSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
	},
	{
		collection: "role-master",
		timestamps: true,
		versionKey: false,
	}
);

const RoleMaster =
	mongoose.models.RoleMaster ||
	mongoose.model("RoleMaster", roleMasterSchema);

const checksheetMappingValueSchema = new mongoose.Schema(
	{
		enable: {
			type: Boolean,
			default: true,
		},
		name: {
			type: String,
			trim: true,
			default: "",
		},
		sequence: {
			type: Number,
			default: 0,
		},
		input: {
			type: Boolean,
			default: false,
		},
		mandatory: {
			type: Boolean,
			default: false,
		},
	},
	{ _id: false }
);

const checksheetMasterSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		"line-name": {
			type: String,
			required: true,
			trim: true,
		},
		model: {
			type: String,
			required: true,
			trim: true,
		},
		"revision-no": {
			type: Number,
			default: 1,
		},
		"revision-date": {
			type: String,
			trim: true,
			default: "",
		},
		status: {
			type: String,
			trim: true,
			default: "active",
		},
		"check-points-mapping": {
			type: Map,
			of: checksheetMappingValueSchema,
			default: {},
		},
		"check-points": {
			type: [mongoose.Schema.Types.Mixed],
			default: [],
		},
		authorization: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		"revision-history": {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		collection: "checksheet-master",
		timestamps: true,
		versionKey: false,
	}
);

const ChecksheetMaster =
	mongoose.models.ChecksheetMaster ||
	mongoose.model("ChecksheetMaster", checksheetMasterSchema);

const checksheetDataSchema = new mongoose.Schema(
	{
		"checksheet-id": {
			type: String,
			required: true,
			trim: true,
		},
		"checksheet-name": {
			type: String,
			required: true,
			trim: true,
		},
		"line-name": {
			type: String,
			required: true,
			trim: true,
		},
		model: {
			type: String,
			trim: true,
			default: "",
		},
		date: {
			type: String,
			required: true,
			trim: true,
		},
		month: {
			type: String,
			trim: true,
			default: "",
		},
		status: {
			type: String,
			trim: true,
			default: "pending",
		},
		approval: {
			type: String,
			trim: true,
			default: "not_started",
		},
		approvalFlow: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		approvalHistory: [
			{
				stage: { type: String, trim: true, default: "" },
				action: { type: String, trim: true, default: "" },
				actorUsername: { type: String, trim: true, default: "" },
				actorName: { type: String, trim: true, default: "" },
				actedAt: { type: Date, default: null },
				remarks: { type: String, trim: true, default: "" },
				statusAfterAction: { type: String, trim: true, default: "" },
			},
		],
		"check-points-mapping": {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		"check-points": {
			type: [mongoose.Schema.Types.Mixed],
			default: [],
		},
	},
	{
		collection: "checksheet-data",
		timestamps: true,
		versionKey: false,
	}
);

checksheetDataSchema.index(
	{ "checksheet-id": 1, date: 1 },
	{ unique: true }
);

const ChecksheetData =
	mongoose.models.ChecksheetData ||
	mongoose.model("ChecksheetData", checksheetDataSchema);

const createEmptyChecksheetApprovalStage = () => ({
	approved: false,
	queried: false,
	action: "",
	approvedByUsername: "",
	approvedByName: "",
	approvedAt: null,
	remarks: "",
});

const createApprovalStageKey = (department, role) => {
	const normalize = (value) =>
		String(value ?? "")
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "");

	return `${normalize(department)}__${normalize(role)}`;
};

const buildChecksheetApprovalFlow = (authorization, currentApprovalFlow = {}) => {
	const nextApprovalFlow =
		currentApprovalFlow && typeof currentApprovalFlow === "object"
			? { ...currentApprovalFlow }
			: {};

	Object.entries(authorization ?? {}).forEach(([department, roles]) => {
		Object.entries(roles ?? {}).forEach(([role, details]) => {
			if (!details?.enable) return;

			const stageKey = createApprovalStageKey(department, role);
			if (!nextApprovalFlow[stageKey] || typeof nextApprovalFlow[stageKey] !== "object") {
				nextApprovalFlow[stageKey] = createEmptyChecksheetApprovalStage();
			}
		});
	});

	return nextApprovalFlow;
};

const approvalStageSchema = {
	approved: { type: Boolean, default: false },
	queried: { type: Boolean, default: false },
	action: { type: String, trim: true, default: "" },
	approvedByUsername: { type: String, trim: true, default: "" },
	approvedByName: { type: String, trim: true, default: "" },
	approvedAt: { type: Date, default: null },
	remarks: { type: String, trim: true, default: "" },
};

const travelRequisitionSchema = new mongoose.Schema(
	{
		employeeName: {
			type: String,
			required: true,
			trim: true,
		},
		employeeCode: {
			type: String,
			required: true,
			trim: true,
		},
		department: {
			type: String,
			trim: true,
			default: "",
		},
		travelType: {
			type: String,
			trim: true,
			default: "",
		},
		travelDate: {
			type: String,
			trim: true,
			default: "",
		},
		budget: {
			type: String,
			trim: true,
			default: "",
		},
		availed: {
			type: String,
			trim: true,
			default: "",
		},
		status: {
			type: String,
			trim: true,
			default: "SUBMITTED",
		},
		approvalCycle: {
			type: Number,
			default: 1,
		},
		approvalFlow: {
			hrHod: approvalStageSchema,
			financeHod: {
				...approvalStageSchema,
				selectedAuthorityUsername: { type: String, trim: true, default: "" },
				selectedAuthorityName: { type: String, trim: true, default: "" },
			},
			approvingAuthority: approvalStageSchema,
		},
		approvalHistory: [
			{
				cycle: { type: Number, default: 1 },
				stage: { type: String, trim: true, default: "" },
				action: { type: String, trim: true, default: "" },
				actorUsername: { type: String, trim: true, default: "" },
				actorName: { type: String, trim: true, default: "" },
				actedAt: { type: Date, default: null },
				remarks: { type: String, trim: true, default: "" },
				selectedAuthorityUsername: { type: String, trim: true, default: "" },
				selectedAuthorityName: { type: String, trim: true, default: "" },
				statusAfterAction: { type: String, trim: true, default: "" },
			},
		],
		itineraryRows: [
			{
				depart: { type: String, trim: true, default: "" },
				arrive: { type: String, trim: true, default: "" },
				date: { type: String, trim: true, default: "" },
				timings: { type: String, trim: true, default: "" },
				remarks: { type: String, trim: true, default: "" },
			},
		],
		details: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
	},
	{
		collection: "travel-requisitions",
		timestamps: true,
		versionKey: false,
	}
);

const TravelRequisition =
	mongoose.models.TravelRequisition ||
	mongoose.model("TravelRequisition", travelRequisitionSchema);

async function connectToDatabase() {
	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	await mongoose.connect(MONGODB_URI, {
		dbName: DB_NAME,
	});

	return mongoose.connection;
}

function sanitizeUser(userDocument) {
	return {
		id: userDocument._id.toString(),
		employee_name: userDocument.employeeName,
		employee_code: userDocument.employeeCode,
		department: userDocument.department,
		role: userDocument.role,
		email: userDocument.email,
		mobile_number: userDocument.mobileNumber,
		username: userDocument.username,
		approved: userDocument.approved,
	};
}

function sanitizeTravelRequisition(document) {
	return {
		id: document._id.toString(),
		date: document.travelDate || "-",
		employeeName: document.employeeName || "-",
		employeeCode: document.employeeCode || "-",
		department: document.department || "-",
		type: document.travelType || "-",
		budget: document.budget || "-",
		availed: document.availed || "-",
		status: document.status || "SUBMITTED",
		approvalCycle: Number(document.approvalCycle ?? 1),
		createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : "",
		approvalFlow: {
			hrHod: {
				approved: Boolean(document.approvalFlow?.hrHod?.approved),
				queried: Boolean(document.approvalFlow?.hrHod?.queried),
				action: document.approvalFlow?.hrHod?.action ?? "",
				approvedByUsername: document.approvalFlow?.hrHod?.approvedByUsername ?? "",
				approvedByName: document.approvalFlow?.hrHod?.approvedByName ?? "",
				approvedAt:
					document.approvalFlow?.hrHod?.approvedAt instanceof Date
						? document.approvalFlow.hrHod.approvedAt.toISOString()
						: "",
				remarks: document.approvalFlow?.hrHod?.remarks ?? "",
			},
			financeHod: {
				approved: Boolean(document.approvalFlow?.financeHod?.approved),
				queried: Boolean(document.approvalFlow?.financeHod?.queried),
				action: document.approvalFlow?.financeHod?.action ?? "",
				approvedByUsername: document.approvalFlow?.financeHod?.approvedByUsername ?? "",
				approvedByName: document.approvalFlow?.financeHod?.approvedByName ?? "",
				approvedAt:
					document.approvalFlow?.financeHod?.approvedAt instanceof Date
						? document.approvalFlow.financeHod.approvedAt.toISOString()
						: "",
				selectedAuthorityUsername:
					document.approvalFlow?.financeHod?.selectedAuthorityUsername ?? "",
				selectedAuthorityName:
					document.approvalFlow?.financeHod?.selectedAuthorityName ?? "",
				remarks: document.approvalFlow?.financeHod?.remarks ?? "",
			},
			approvingAuthority: {
				approved: Boolean(document.approvalFlow?.approvingAuthority?.approved),
				queried: Boolean(document.approvalFlow?.approvingAuthority?.queried),
				action: document.approvalFlow?.approvingAuthority?.action ?? "",
				approvedByUsername:
					document.approvalFlow?.approvingAuthority?.approvedByUsername ?? "",
				approvedByName: document.approvalFlow?.approvingAuthority?.approvedByName ?? "",
				approvedAt:
					document.approvalFlow?.approvingAuthority?.approvedAt instanceof Date
						? document.approvalFlow.approvingAuthority.approvedAt.toISOString()
						: "",
				remarks: document.approvalFlow?.approvingAuthority?.remarks ?? "",
			},
		},
		approvalHistory: Array.isArray(document.approvalHistory)
			? document.approvalHistory.map((entry) => ({
					cycle: Number(entry?.cycle ?? 1),
					stage: entry?.stage ?? "",
					action: entry?.action ?? "",
					actorUsername: entry?.actorUsername ?? "",
					actorName: entry?.actorName ?? "",
					actedAt: entry?.actedAt instanceof Date ? entry.actedAt.toISOString() : "",
					remarks: entry?.remarks ?? "",
					selectedAuthorityUsername: entry?.selectedAuthorityUsername ?? "",
					selectedAuthorityName: entry?.selectedAuthorityName ?? "",
					statusAfterAction: entry?.statusAfterAction ?? "",
				}))
			: [],
		itineraryRows: document.itineraryRows ?? [],
		details: document.details ?? {},
	};
}

function sanitizeDepartment(document) {
	return {
		id: document._id.toString(),
		name: document.name ?? "",
		createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : "",
		updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : "",
	};
}

function sanitizeRole(document) {
	return {
		id: document._id.toString(),
		name: document.name ?? "",
		createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : "",
		updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : "",
	};
}

function sanitizeChecksheet(document) {
	return {
		id: document._id.toString(),
		name: document.name ?? "",
		"line-name": document["line-name"] ?? "",
		model: document.model ?? "",
		"revision-no": Number(document["revision-no"] ?? 1),
		"revision-date": document["revision-date"] ?? "",
		status: document.status ?? "active",
		"check-points-mapping":
			document["check-points-mapping"] instanceof Map
				? Object.fromEntries(document["check-points-mapping"].entries())
				: document["check-points-mapping"] ?? {},
		"check-points": Array.isArray(document["check-points"]) ? document["check-points"] : [],
		authorization: document.authorization ?? {},
		"revision-history": document["revision-history"] ?? {},
		createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : "",
		updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : "",
	};
}

function sanitizeChecksheetData(document) {
	const rawApprovalFlow =
		document.approvalFlow && typeof document.approvalFlow === "object"
			? document.approvalFlow
			: {};
	const approvalFlow = Object.entries(rawApprovalFlow).reduce((accumulator, [stageKey, stageValue]) => {
		accumulator[stageKey] = {
			approved: Boolean(stageValue?.approved),
			queried: Boolean(stageValue?.queried),
			action: stageValue?.action ?? "",
			approvedByUsername: stageValue?.approvedByUsername ?? "",
			approvedByName: stageValue?.approvedByName ?? "",
			approvedAt:
				stageValue?.approvedAt instanceof Date
					? stageValue.approvedAt.toISOString()
					: "",
			remarks: stageValue?.remarks ?? "",
		};
		return accumulator;
	}, {});

	return {
		id: document._id.toString(),
		"checksheet-id": document["checksheet-id"] ?? "",
		"checksheet-name": document["checksheet-name"] ?? "",
		"line-name": document["line-name"] ?? "",
		model: document.model ?? "",
		date: document.date ?? "",
		month: document.month ?? "",
		status: document.status ?? "pending",
		approval: document.approval ?? "not_started",
		approvalFlow,
		approvalHistory: Array.isArray(document.approvalHistory)
			? document.approvalHistory.map((entry) => ({
					stage: entry?.stage ?? "",
					action: entry?.action ?? "",
					actorUsername: entry?.actorUsername ?? "",
					actorName: entry?.actorName ?? "",
					actedAt: entry?.actedAt instanceof Date ? entry.actedAt.toISOString() : "",
					remarks: entry?.remarks ?? "",
					statusAfterAction: entry?.statusAfterAction ?? "",
				}))
			: [],
		"check-points-mapping": document["check-points-mapping"] ?? {},
		"check-points": Array.isArray(document["check-points"]) ? document["check-points"] : [],
		createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : "",
		updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : "",
	};
}

app.get("/api/health", async (_req, res) => {
	try {
		await connectToDatabase();

		return res.status(200).json({
			ok: true,
			database: DB_NAME,
			status: "connected",
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Database connection failed",
		});
	}
});

app.post("/api/signup", async (req, res) => {
	try {
		const { employeeName, employeeCode, department, role, email, mobileNumber, username, password } = req.body ?? {};

		if (!employeeName || !employeeCode || !department || !role || !email || !mobileNumber || !username || !password) {
			return res.status(400).json({
				ok: false,
				message: "All signup fields including contact details are required.",
			});
		}

		await connectToDatabase();

		const normalizedUsername = String(username).trim().toLowerCase();
		const normalizedEmployeeCode = String(employeeCode).trim().toUpperCase();

		const existingUser = await User.findOne({
			$or: [
				{ username: normalizedUsername },
				{ employeeCode: normalizedEmployeeCode },
			],
		}).lean();

		if (existingUser) {
			return res.status(409).json({
				ok: false,
				message: "Username or employee code already exists.",
			});
		}

		const passwordHash = await bcrypt.hash(String(password), 10);

		const createdUser = await User.create({
			employeeName: String(employeeName).trim(),
			employeeCode: normalizedEmployeeCode,
			department: String(department).trim(),
			role: String(role).trim(),
			email: String(email).trim().toLowerCase(),
			mobileNumber: String(mobileNumber).trim(),
			username: normalizedUsername,
			passwordHash,
			approved: false,
		});

		return res.status(201).json({
			ok: true,
			message: "Signup request submitted. Please wait for IT approval.",
			user: sanitizeUser(createdUser),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to create user.",
		});
	}
});

app.post("/api/login", async (req, res) => {
	try {
		const { username, password } = req.body ?? {};

		if (!username || !password) {
			return res.status(400).json({
				ok: false,
				message: "Username and password are required.",
			});
		}

		await connectToDatabase();

		const normalizedUsername = String(username).trim().toLowerCase();
		const user = await User.findOne({ username: normalizedUsername });

		if (!user) {
			return res.status(404).json({
				ok: false,
				code: "USER_NOT_FOUND",
				message: "User not found. Please sign up first.",
			});
		}

		const passwordMatched = await bcrypt.compare(String(password), user.passwordHash);

		if (!passwordMatched) {
			return res.status(401).json({
				ok: false,
				code: "INVALID_CREDENTIALS",
				message: "Invalid username or password.",
			});
		}

		if (!user.approved) {
			return res.status(403).json({
				ok: false,
				code: "NOT_APPROVED",
				message: "Your account is pending IT approval.",
			});
		}

		return res.status(200).json({
			ok: true,
			...sanitizeUser(user),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to login.",
		});
	}
});

app.get("/api/travel-requisitions", async (_req, res) => {
	try {
		await connectToDatabase();

		const documents = await TravelRequisition.find()
			.sort({ createdAt: -1 })
			.lean();

		return res.status(200).json({
			ok: true,
			items: documents.map(sanitizeTravelRequisition),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load travel requisitions.",
		});
	}
});

app.post("/api/travel-requisitions", async (req, res) => {
	try {
		const {
			employeeName,
			employeeCode,
			department,
			travelType,
			travelDate,
			budget,
			availed,
			itineraryRows,
			details,
		} = req.body ?? {};

		if (!employeeName || !employeeCode) {
			return res.status(400).json({
				ok: false,
				message: "Employee name and employee code are required.",
			});
		}

		await connectToDatabase();

		const createdDocument = await TravelRequisition.create({
			employeeName: String(employeeName).trim(),
			employeeCode: String(employeeCode).trim().toUpperCase(),
			department: String(department ?? "").trim(),
			travelType: String(travelType ?? "").trim(),
			travelDate: String(travelDate ?? "").trim(),
			budget: String(budget ?? "").trim(),
			availed: String(availed ?? "").trim(),
			status: "SUBMITTED",
			approvalCycle: 1,
			approvalFlow: {
				hrHod: {},
				financeHod: {},
				approvingAuthority: {},
			},
			approvalHistory: [],
			itineraryRows: Array.isArray(itineraryRows) ? itineraryRows : [],
			details: details && typeof details === "object" ? details : {},
		});

		return res.status(201).json({
			ok: true,
			message: "Travel requisition submitted successfully.",
			item: sanitizeTravelRequisition(createdDocument),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to save travel requisition.",
		});
	}
});

app.get("/api/user-master/approved-users", async (_req, res) => {
	try {
		await connectToDatabase();

		const users = await User.find({ approved: true }).sort({ employeeName: 1 }).lean();

		return res.status(200).json({
			ok: true,
			items: users.map((user) => ({
				id: user._id.toString(),
				username: user.username,
				employee_name: user.employeeName,
				employee_code: user.employeeCode,
				department: user.department,
				role: user.role,
			})),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load approved users.",
		});
	}
});

app.get("/api/department-master", async (_req, res) => {
	try {
		await connectToDatabase();

		const items = await DepartmentMaster.find().sort({ name: 1 }).lean();

		return res.status(200).json({
			ok: true,
			items: items.map(sanitizeDepartment),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load departments.",
		});
	}
});

app.post("/api/department-master", async (req, res) => {
	try {
		const { name } = req.body ?? {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				ok: false,
				message: "Department name is required.",
			});
		}

		await connectToDatabase();

		const normalizedName = String(name).trim();
		const existingDepartment = await DepartmentMaster.findOne({
			name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
		}).lean();

		if (existingDepartment) {
			return res.status(409).json({
				ok: false,
				message: "Department already exists.",
			});
		}

		const createdDepartment = await DepartmentMaster.create({
			name: normalizedName,
		});

		return res.status(201).json({
			ok: true,
			message: "Department created successfully.",
			item: sanitizeDepartment(createdDepartment),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to create department.",
		});
	}
});

app.delete("/api/department-master/:id", async (req, res) => {
	try {
		await connectToDatabase();

		const deletedDepartment = await DepartmentMaster.findByIdAndDelete(req.params.id).lean();

		if (!deletedDepartment) {
			return res.status(404).json({
				ok: false,
				message: "Department not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Department deleted successfully.",
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to delete department.",
		});
	}
});

app.patch("/api/department-master/:id", async (req, res) => {
	try {
		const { name } = req.body ?? {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				ok: false,
				message: "Department name is required.",
			});
		}

		await connectToDatabase();

		const normalizedName = String(name).trim();
		const existingDepartment = await DepartmentMaster.findOne({
			_id: { $ne: req.params.id },
			name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
		}).lean();

		if (existingDepartment) {
			return res.status(409).json({
				ok: false,
				message: "Department already exists.",
			});
		}

		const updatedDepartment = await DepartmentMaster.findByIdAndUpdate(
			req.params.id,
			{ name: normalizedName },
			{ new: true }
		).lean();

		if (!updatedDepartment) {
			return res.status(404).json({
				ok: false,
				message: "Department not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Department updated successfully.",
			item: sanitizeDepartment(updatedDepartment),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to update department.",
		});
	}
});

app.get("/api/role-master", async (_req, res) => {
	try {
		await connectToDatabase();

		const items = await RoleMaster.find().sort({ name: 1 }).lean();

		return res.status(200).json({
			ok: true,
			items: items.map(sanitizeRole),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load roles.",
		});
	}
});

app.get("/api/checksheet-master", async (_req, res) => {
	try {
		await connectToDatabase();

		const items = await ChecksheetMaster.find().sort({ createdAt: -1 }).lean();

		return res.status(200).json({
			ok: true,
			items: items.map(sanitizeChecksheet),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load checksheets.",
		});
	}
});

app.post("/api/checksheet-master", async (req, res) => {
	try {
		const {
			name,
			"line-name": lineName,
			model,
			status,
			authorization,
			"check-points-mapping": checkPointsMapping,
			"check-points": checkPoints,
		} = req.body ?? {};

		if (!name || !String(name).trim() || !lineName || !String(lineName).trim() || !model || !String(model).trim()) {
			return res.status(400).json({
				ok: false,
				message: "Checksheet name, line name and model are required.",
			});
		}

		if (!checkPointsMapping || typeof checkPointsMapping !== "object" || Array.isArray(checkPointsMapping) || Object.keys(checkPointsMapping).length === 0) {
			return res.status(400).json({
				ok: false,
				message: "Create check-points mapping before saving the checksheet.",
			});
		}

		await connectToDatabase();
		const revisionNo = 1;
		const revisionDate = new Date().toISOString().slice(0, 10);
		const normalizedStatus =
			String(status ?? "active").trim().toLowerCase() === "inactive"
				? "inactive"
				: "active";
		const nextRevisionHistory = {
			[revisionNo]: {
				"revision-no": revisionNo,
				"revision-date": revisionDate,
				status: normalizedStatus,
				name: String(name).trim(),
				"line-name": String(lineName).trim(),
				model: String(model).trim(),
				"check-points-mapping": checkPointsMapping,
				"check-points": Array.isArray(checkPoints) ? checkPoints : [],
				authorization: authorization && typeof authorization === "object" ? authorization : {},
			},
		};

		const createdChecksheet = await ChecksheetMaster.create({
			name: String(name).trim(),
			"line-name": String(lineName).trim(),
			model: String(model).trim(),
			"revision-no": revisionNo,
			"revision-date": revisionDate,
			status: normalizedStatus,
			"check-points-mapping": checkPointsMapping,
			"check-points": Array.isArray(checkPoints) ? checkPoints : [],
			authorization: authorization && typeof authorization === "object" ? authorization : {},
			"revision-history": nextRevisionHistory,
		});

		return res.status(201).json({
			ok: true,
			message: "Checksheet created successfully.",
			item: sanitizeChecksheet(createdChecksheet),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to create checksheet.",
		});
	}
});

app.patch("/api/checksheet-master/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			status,
			authorization,
			"revision-no": revisionNo,
			"revision-date": revisionDate,
			"check-points-mapping": checkPointsMapping,
			"check-points": checkPoints,
		} = req.body ?? {};

		if (!checkPointsMapping || typeof checkPointsMapping !== "object" || Array.isArray(checkPointsMapping) || Object.keys(checkPointsMapping).length === 0) {
			return res.status(400).json({
				ok: false,
				message: "Create check-points mapping before saving the checksheet.",
			});
		}

		await connectToDatabase();

		const checksheet = await ChecksheetMaster.findById(id);

		if (!checksheet) {
			return res.status(404).json({
				ok: false,
				message: "Checksheet not found.",
			});
		}

		const nextRevisionNo = Number(revisionNo) || Number(checksheet["revision-no"] ?? 1) + 1;
		const nextRevisionDate = String(revisionDate ?? new Date().toISOString().slice(0, 10)).trim();
		const normalizedStatus =
			String(status ?? "active").trim().toLowerCase() === "inactive"
				? "inactive"
				: "active";

		const revisionHistory =
			checksheet["revision-history"] && typeof checksheet["revision-history"] === "object"
				? { ...checksheet["revision-history"] }
				: {};

		revisionHistory[nextRevisionNo] = {
			"revision-no": nextRevisionNo,
			"revision-date": nextRevisionDate,
			status: normalizedStatus,
			name: checksheet.name,
			"line-name": checksheet["line-name"],
			model: checksheet.model,
			"check-points-mapping": checkPointsMapping,
			"check-points": Array.isArray(checkPoints) ? checkPoints : [],
			authorization: authorization && typeof authorization === "object" ? authorization : {},
		};

		checksheet.status = normalizedStatus;
		checksheet["revision-no"] = nextRevisionNo;
		checksheet["revision-date"] = nextRevisionDate;
		checksheet["check-points-mapping"] = checkPointsMapping;
		checksheet["check-points"] = Array.isArray(checkPoints) ? checkPoints : [];
		checksheet.authorization = authorization && typeof authorization === "object" ? authorization : {};
		checksheet["revision-history"] = revisionHistory;

		const updatedChecksheet = await checksheet.save();

		return res.status(200).json({
			ok: true,
			message: "Checksheet updated successfully.",
			item: sanitizeChecksheet(updatedChecksheet),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to update checksheet.",
		});
	}
});

app.get("/api/checksheet-data", async (req, res) => {
	try {
		await connectToDatabase();

		const filters = {};
		const lineName = String(req.query["line-name"] ?? "").trim();
		const date = String(req.query.date ?? "").trim();
		const month = String(req.query.month ?? "").trim();

		if (lineName) {
			filters["line-name"] = lineName;
		}

		if (date) {
			filters.date = date;
		} else if (month) {
			filters.month = month;
		}

		const items = await ChecksheetData.find(filters).sort({ updatedAt: -1, createdAt: -1 });

		return res.status(200).json({
			ok: true,
			items: items.map(sanitizeChecksheetData),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load checksheet data.",
		});
	}
});

app.post("/api/checksheet-data", async (req, res) => {
	try {
		const {
			"checksheet-id": checksheetId,
			"checksheet-name": checksheetName,
			"line-name": lineName,
			model,
			date,
			month,
			status,
			approval,
			authorization,
			"check-points-mapping": checkPointsMapping,
			"check-points": checkPoints,
		} = req.body ?? {};

		if (!checksheetId || !String(checksheetId).trim() || !date || !String(date).trim()) {
			return res.status(400).json({
				ok: false,
				message: "Checksheet id and date are required.",
			});
		}

		await connectToDatabase();

		const normalizedStatus =
			String(status ?? "").trim().toLowerCase() === "completed" ? "completed" : "in_progress";
		const normalizedApproval =
			normalizedStatus === "completed"
				? String(approval ?? "not_started").trim().toLowerCase() || "not_started"
				: "not_started";
		const existingItem = await ChecksheetData.findOne({
			"checksheet-id": String(checksheetId).trim(),
			date: String(date).trim(),
		});
		const hadQueryRaised = Object.values(existingItem?.approvalFlow ?? {}).some(
			(stageValue) =>
				stageValue &&
				typeof stageValue === "object" &&
				(Boolean(stageValue.queried) || stageValue.action === "query")
		);

		const approvalFlow = hadQueryRaised
			? buildChecksheetApprovalFlow(
					authorization && typeof authorization === "object" ? authorization : {},
					{}
			  )
			: buildChecksheetApprovalFlow(
					authorization && typeof authorization === "object" ? authorization : {},
					existingItem?.approvalFlow
			  );
		const approvalHistory = Array.isArray(existingItem?.approvalHistory)
			? existingItem.approvalHistory
			: [];
		const nextApprovalHistory =
			hadQueryRaised && normalizedStatus === "completed"
				? [
						...approvalHistory,
						{
							stage: "requestor",
							action: "resubmitted",
							actorUsername: "",
							actorName: String(checksheetName ?? "").trim(),
							actedAt: new Date(),
							remarks: "Checksheet resubmitted after query raised.",
							statusAfterAction: "completed",
						},
				  ]
				: approvalHistory;

		const item = await ChecksheetData.findOneAndUpdate(
			{
				"checksheet-id": String(checksheetId).trim(),
				date: String(date).trim(),
			},
			{
				$set: {
					"checksheet-id": String(checksheetId).trim(),
					"checksheet-name": String(checksheetName ?? "").trim(),
					"line-name": String(lineName ?? "").trim(),
					model: String(model ?? "").trim(),
					date: String(date).trim(),
					month: String(month ?? "").trim(),
					status: normalizedStatus,
					approval: normalizedApproval,
					approvalFlow,
					approvalHistory: nextApprovalHistory,
					"check-points-mapping":
						checkPointsMapping && typeof checkPointsMapping === "object" ? checkPointsMapping : {},
					"check-points": Array.isArray(checkPoints) ? checkPoints : [],
				},
			},
			{
				new: true,
				upsert: true,
				setDefaultsOnInsert: true,
			}
		);

		return res.status(200).json({
			ok: true,
			message:
				normalizedStatus === "completed"
					? "Checksheet submitted successfully."
					: "Draft saved successfully.",
			item: sanitizeChecksheetData(item),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to save checksheet data.",
		});
	}
});

app.patch("/api/checksheet-data/:id/approve", async (req, res) => {
	try {
		const { id } = req.params;
		const { stage, action, actorUsername, actorName, remarks } = req.body ?? {};

		if (!stage || !action || !actorUsername) {
			return res.status(400).json({
				ok: false,
				message: "Approval stage, action and actor username are required.",
			});
		}

		const currentAction = String(action).trim().toLowerCase();
		if (!["approve", "query"].includes(currentAction)) {
			return res.status(400).json({
				ok: false,
				message: "Unsupported approval action.",
			});
		}

		await connectToDatabase();
		const document = await ChecksheetData.findById(id);

		if (!document) {
			return res.status(404).json({
				ok: false,
				message: "Checksheet data not found.",
			});
		}

		const currentStage = String(stage).trim();
		const approvedAt = new Date();
		const remarksValue = String(remarks ?? "").trim();
		const username = String(actorUsername).trim().toLowerCase();
		const name = String(actorName ?? "").trim();
		const currentApprovalFlow =
			document.approvalFlow && typeof document.approvalFlow === "object"
				? { ...document.approvalFlow }
				: {};
		const existingStage =
			currentApprovalFlow[currentStage] && typeof currentApprovalFlow[currentStage] === "object"
				? currentApprovalFlow[currentStage]
				: {};

		currentApprovalFlow[currentStage] = {
			...existingStage,
			approved: currentAction === "approve",
			queried: currentAction === "query",
			action: currentAction,
			approvedByUsername: username,
			approvedByName: name,
			approvedAt,
			remarks: remarksValue,
		};

		document.approvalFlow = currentApprovalFlow;
		document.approvalHistory = [
			...(Array.isArray(document.approvalHistory) ? document.approvalHistory : []),
			{
				stage: currentStage,
				action: currentAction,
				actorUsername: username,
				actorName: name,
				actedAt: approvedAt,
				remarks: remarksValue,
				statusAfterAction: currentAction === "approve" ? "approved" : "query_raised",
			},
		];

		const approvalStages = Object.values(currentApprovalFlow).filter(
			(stageValue) => stageValue && typeof stageValue === "object"
		);
		const allApproved =
			approvalStages.length > 0 &&
			approvalStages.every((stageValue) => Boolean(stageValue.approved));

		document.approval = currentAction === "query" ? "query_raised" : allApproved ? "approved" : "pending";
		document.status = currentAction === "query" ? "pending" : allApproved ? "approved" : "completed";

		const updatedDocument = await document.save();

		return res.status(200).json({
			ok: true,
			message: currentAction === "approve" ? "Checksheet approved successfully." : "Query raised successfully.",
			item: sanitizeChecksheetData(updatedDocument),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to update checksheet approval.",
		});
	}
});

app.post("/api/role-master", async (req, res) => {
	try {
		const { name } = req.body ?? {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				ok: false,
				message: "Role name is required.",
			});
		}

		await connectToDatabase();

		const normalizedName = String(name).trim();
		const existingRole = await RoleMaster.findOne({
			name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
		}).lean();

		if (existingRole) {
			return res.status(409).json({
				ok: false,
				message: "Role already exists.",
			});
		}

		const createdRole = await RoleMaster.create({
			name: normalizedName,
		});

		return res.status(201).json({
			ok: true,
			message: "Role created successfully.",
			item: sanitizeRole(createdRole),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to create role.",
		});
	}
});

app.delete("/api/role-master/:id", async (req, res) => {
	try {
		await connectToDatabase();

		const deletedRole = await RoleMaster.findByIdAndDelete(req.params.id).lean();

		if (!deletedRole) {
			return res.status(404).json({
				ok: false,
				message: "Role not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Role deleted successfully.",
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to delete role.",
		});
	}
});

app.patch("/api/role-master/:id", async (req, res) => {
	try {
		const { name } = req.body ?? {};

		if (!name || !String(name).trim()) {
			return res.status(400).json({
				ok: false,
				message: "Role name is required.",
			});
		}

		await connectToDatabase();

		const normalizedName = String(name).trim();
		const existingRole = await RoleMaster.findOne({
			_id: { $ne: req.params.id },
			name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
		}).lean();

		if (existingRole) {
			return res.status(409).json({
				ok: false,
				message: "Role already exists.",
			});
		}

		const updatedRole = await RoleMaster.findByIdAndUpdate(
			req.params.id,
			{ name: normalizedName },
			{ new: true }
		).lean();

		if (!updatedRole) {
			return res.status(404).json({
				ok: false,
				message: "Role not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Role updated successfully.",
			item: sanitizeRole(updatedRole),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to update role.",
		});
	}
});

app.get("/api/user-master", async (_req, res) => {
	try {
		await connectToDatabase();

		const users = await User.find().sort({ employeeName: 1 }).lean();

		return res.status(200).json({
			ok: true,
			items: users.map((user) => ({
				...sanitizeUser(user),
				employeeName: user.employeeName,
				employeeCode: user.employeeCode,
				mobileNumber: user.mobileNumber,
				createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : "",
				updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : "",
			})),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to load user master.",
		});
	}
});

app.patch("/api/user-master/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { department, role, email, mobileNumber, username, password, approved } = req.body ?? {};

		await connectToDatabase();

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({
				ok: false,
				message: "User not found.",
			});
		}

		if (!department || !role || !email || !mobileNumber || !username) {
			return res.status(400).json({
				ok: false,
				message: "Department, role, email, mobile number and username are required.",
			});
		}

		const normalizedUsername = String(username).trim().toLowerCase();
		const normalizedEmail = String(email).trim().toLowerCase();

		const duplicateUser = await User.findOne({
			_id: { $ne: id },
			username: normalizedUsername,
		}).lean();

		if (duplicateUser) {
			return res.status(409).json({
				ok: false,
				message: "Username already exists.",
			});
		}

		user.department = String(department).trim();
		user.role = String(role).trim();
		user.email = normalizedEmail;
		user.mobileNumber = String(mobileNumber).trim();
		user.username = normalizedUsername;
		user.approved = Boolean(approved);

		if (password && String(password).trim()) {
			user.passwordHash = await bcrypt.hash(String(password), 10);
		}

		const updatedUser = await user.save();

		return res.status(200).json({
			ok: true,
			message: "User master updated successfully.",
			item: {
				...sanitizeUser(updatedUser),
				employeeName: updatedUser.employeeName,
				employeeCode: updatedUser.employeeCode,
				mobileNumber: updatedUser.mobileNumber,
				createdAt: updatedUser.createdAt instanceof Date ? updatedUser.createdAt.toISOString() : "",
				updatedAt: updatedUser.updatedAt instanceof Date ? updatedUser.updatedAt.toISOString() : "",
			},
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to update user master.",
		});
	}
});

app.delete("/api/user-master/:id", async (req, res) => {
	try {
		await connectToDatabase();

		const deletedUser = await User.findByIdAndDelete(req.params.id).lean();

		if (!deletedUser) {
			return res.status(404).json({
				ok: false,
				message: "User not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "User deleted successfully.",
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to delete user.",
		});
	}
});

app.put("/api/travel-requisitions/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			employeeName,
			employeeCode,
			department,
			travelType,
			travelDate,
			budget,
			availed,
			itineraryRows,
			details,
			status,
		} = req.body ?? {};

		if (!employeeName || !employeeCode) {
			return res.status(400).json({
				ok: false,
				message: "Employee name and employee code are required.",
			});
		}

		await connectToDatabase();

		const document = await TravelRequisition.findById(id);

		if (!document) {
			return res.status(404).json({
				ok: false,
				message: "Travel requisition not found.",
			});
		}

		const previousStatus = String(document.status ?? "").trim();
		const isQueryResubmission =
			previousStatus === "QUERY_RAISED" || previousStatus.endsWith("_QUERY");

		document.employeeName = String(employeeName).trim();
		document.employeeCode = String(employeeCode).trim().toUpperCase();
		document.department = String(department ?? "").trim();
		document.travelType = String(travelType ?? "").trim();
		document.travelDate = String(travelDate ?? "").trim();
		document.budget = String(budget ?? "").trim();
		document.availed = String(availed ?? "").trim();
		document.itineraryRows = Array.isArray(itineraryRows) ? itineraryRows : [];
		document.details = details && typeof details === "object" ? details : {};
		document.status = isQueryResubmission
			? "SUBMITTED"
			: String(status ?? "SUBMITTED").trim() || "SUBMITTED";

		if (isQueryResubmission) {
			document.approvalHistory = [
				...(Array.isArray(document.approvalHistory) ? document.approvalHistory : []),
				{
					cycle: Number(document.approvalCycle ?? 1),
					stage: "requestor",
					action: "resubmitted",
					actorUsername: "",
					actorName: document.employeeName,
					actedAt: new Date(),
					remarks: "Requisition resubmitted after query raised.",
					selectedAuthorityUsername: "",
					selectedAuthorityName: "",
					statusAfterAction: "SUBMITTED",
				},
			];
			document.approvalCycle = Number(document.approvalCycle ?? 1) + 1;
			document.approvalFlow = {
				hrHod: {},
				financeHod: {},
				approvingAuthority: {},
			};
		}

		const updatedDocument = await document.save();

		if (!updatedDocument) {
			return res.status(404).json({
				ok: false,
				message: "Travel requisition not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Travel requisition updated successfully.",
			item: sanitizeTravelRequisition(updatedDocument),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to update travel requisition.",
		});
	}
});

app.delete("/api/travel-requisitions/:id", async (req, res) => {
	try {
		const { id } = req.params;
		await connectToDatabase();

		const deletedDocument = await TravelRequisition.findByIdAndDelete(id).lean();

		if (!deletedDocument) {
			return res.status(404).json({
				ok: false,
				message: "Travel requisition not found.",
			});
		}

		return res.status(200).json({
			ok: true,
			message: "Travel requisition deleted successfully.",
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to delete travel requisition.",
		});
	}
});

app.patch("/api/travel-requisitions/:id/approve", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			stage,
			action,
			actorUsername,
			actorName,
			selectedAuthorityUsername,
			selectedAuthorityName,
			remarks,
		} = req.body ?? {};

		if (!stage || !actorUsername || !action) {
			return res.status(400).json({
				ok: false,
				message: "Approval stage, action and actor username are required.",
			});
		}

		await connectToDatabase();
		const document = await TravelRequisition.findById(id);

		if (!document) {
			return res.status(404).json({
				ok: false,
				message: "Travel requisition not found.",
			});
		}

		const currentStage = String(stage).trim();
		const currentAction = String(action).trim().toLowerCase();
		const username = String(actorUsername).trim().toLowerCase();
		const name = String(actorName ?? "").trim();
		const approvedAt = new Date();
		const remarksValue = String(remarks ?? "").trim();

		if (!["approve", "query"].includes(currentAction)) {
			return res.status(400).json({
				ok: false,
				message: "Unsupported approval action.",
			});
		}
		if (!remarksValue) {
			return res.status(400).json({
				ok: false,
				message: "Remarks are required for approval and query actions.",
			});
		}

		if (currentStage === "hrHod") {
			if (document.approvalFlow?.hrHod?.approved && currentAction === "approve") {
				return res.status(409).json({ ok: false, message: "HR HOD / Admin HOD already approved this requisition." });
			}

			document.approvalFlow.hrHod = {
				approved: currentAction === "approve",
				queried: currentAction === "query",
				action: currentAction,
				approvedByUsername: username,
				approvedByName: name,
				approvedAt,
				remarks: remarksValue,
			};
			document.status = currentAction === "approve" ? "HR_HOD_APPROVED" : "QUERY_RAISED";
		} else if (currentStage === "financeHod") {
			if (!document.approvalFlow?.hrHod?.approved) {
				return res.status(409).json({ ok: false, message: "HR HOD / Admin HOD approval is required first." });
			}
			if (currentAction === "approve" && (!selectedAuthorityUsername || !selectedAuthorityName)) {
				return res.status(400).json({ ok: false, message: "Finance HOD must select an approving authority." });
			}

			document.approvalFlow.financeHod = {
				approved: currentAction === "approve",
				queried: currentAction === "query",
				action: currentAction,
				approvedByUsername: username,
				approvedByName: name,
				approvedAt,
				selectedAuthorityUsername:
					currentAction === "approve"
						? String(selectedAuthorityUsername).trim().toLowerCase()
						: document.approvalFlow?.financeHod?.selectedAuthorityUsername ?? "",
				selectedAuthorityName:
					currentAction === "approve"
						? String(selectedAuthorityName).trim()
						: document.approvalFlow?.financeHod?.selectedAuthorityName ?? "",
				remarks: remarksValue,
			};
			document.status = currentAction === "approve" ? "FINANCE_HOD_APPROVED" : "QUERY_RAISED";
		} else if (currentStage === "approvingAuthority") {
			const assignedUsername =
				document.approvalFlow?.financeHod?.selectedAuthorityUsername?.trim().toLowerCase() ?? "";

			if (!document.approvalFlow?.financeHod?.approved) {
				return res.status(409).json({ ok: false, message: "Finance HOD approval is required first." });
			}
			if (!assignedUsername) {
				return res.status(409).json({ ok: false, message: "Finance HOD must select an approving authority first." });
			}
			if (assignedUsername !== username) {
				return res.status(403).json({ ok: false, message: "Only the selected approving authority can approve this requisition." });
			}

			document.approvalFlow.approvingAuthority = {
				approved: currentAction === "approve",
				queried: currentAction === "query",
				action: currentAction,
				approvedByUsername: username,
				approvedByName: name,
				approvedAt,
				remarks: remarksValue,
			};
			document.status = currentAction === "approve" ? "APPROVED" : "QUERY_RAISED";
		} else {
			return res.status(400).json({
				ok: false,
				message: "Unsupported approval stage.",
			});
		}

		document.approvalHistory = [
			...(Array.isArray(document.approvalHistory) ? document.approvalHistory : []),
			{
				cycle: Number(document.approvalCycle ?? 1),
				stage: currentStage,
				action: currentAction,
				actorUsername: username,
				actorName: name,
				actedAt: approvedAt,
				remarks: remarksValue,
				selectedAuthorityUsername:
					currentStage === "financeHod" && currentAction === "approve"
						? String(selectedAuthorityUsername ?? "").trim().toLowerCase()
						: document.approvalFlow?.financeHod?.selectedAuthorityUsername ?? "",
				selectedAuthorityName:
					currentStage === "financeHod" && currentAction === "approve"
						? String(selectedAuthorityName ?? "").trim()
						: document.approvalFlow?.financeHod?.selectedAuthorityName ?? "",
				statusAfterAction: document.status,
			},
		];

		await document.save();

		return res.status(200).json({
			ok: true,
			message: "Approval recorded successfully.",
			item: sanitizeTravelRequisition(document),
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			message: error instanceof Error ? error.message : "Unable to record approval.",
		});
	}
});

app.listen(PORT, () => {
	console.log(
		`Factory dashboard auth server running on http://localhost:${PORT} using MongoDB database "${DB_NAME}".`
	);
});
