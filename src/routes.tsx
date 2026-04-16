import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./app/layout";

import LoginPage from "./app/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";

import DashboardPage from "./app/(app)/dashboard/page";
import TravelRequisitionFormPage from "./app/(app)/hr/travel-requisition-form/page";
import TravelExpenseStatementPage from "./app/(app)/hr/travel-expense-statement/page";
import AdminPage from "./app/(app)/admin/page";
import ChecksheetMasterPage from "./app/(app)/admin/checksheet-master/page";
import DepartmentMasterPage from "./app/(app)/admin/department-master/page";
import RoleMasterPage from "./app/(app)/admin/role-master/page";
import UserMasterPage from "./app/(app)/admin/user-master/page";

/* ---------------- ROUTES ---------------- */

const routes = createBrowserRouter([
	{
		path: "/login",
		element: <LoginPage />,
		handle: { label: "LOGIN" },
	},
	{
		path: "/",
		element: (
			<ProtectedRoute>
				<RootLayout />
			</ProtectedRoute>
		),
		handle: { label: "MAINTENANCE 2.0 DASHBOARD" },
		children: [
			{
				index: true,
				element: <DashboardPage />,
				handle: { label: "HR" },
			},
			{
				path: "hr/travel-requisition-form",
				element: <TravelRequisitionFormPage />,
				handle: { label: "TRAVEL REQUISITION FORM" },
			},
			{
				path: "hr/travel-expense-statement",
				element: <TravelExpenseStatementPage />,
				handle: { label: "TRAVEL EXPENSE STATEMENT" },
			},
			{
				path: "admin",
				element: <AdminPage />,
				handle: { label: "ADMIN" },
			},
			{
				path: "admin/checksheet-master",
				element: <ChecksheetMasterPage />,
				handle: { label: "CHECKSHEET MASTER" },
			},
			{
				path: "admin/department-master",
				element: <DepartmentMasterPage />,
				handle: { label: "DEPARTMENT MASTER" },
			},
			{
				path: "admin/role-master",
				element: <RoleMasterPage />,
				handle: { label: "ROLE MASTER" },
			},
			{
				path: "admin/user-master",
				element: <UserMasterPage />,
				handle: { label: "USER MASTER" },
			},
		],
	},
]);

/* ---------------- PROVIDER ---------------- */

const RouterProviderComponent = () => {
	return <RouterProvider router={routes} />;
};

export default RouterProviderComponent;
