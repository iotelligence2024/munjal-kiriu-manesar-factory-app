import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";

const app = express();

const PORT = Number(process.env.PORT ?? 54321);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "*";
const MONGODB_URI =
	process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/munjal-manesar";
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
		username: userDocument.username,
		role: "employee",
		approved: userDocument.approved,
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
		const { employeeName, employeeCode, department, username, password } = req.body ?? {};

		if (!employeeName || !employeeCode || !department || !username || !password) {
			return res.status(400).json({
				ok: false,
				message: "All signup fields are required.",
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

app.listen(PORT, () => {
	console.log(
		`Factory dashboard auth server running on http://localhost:${PORT} using MongoDB database "${DB_NAME}".`
	);
});
