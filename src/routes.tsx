import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./app/layout";

import LoginPage from "./app/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";

import DashboardPage from "./app/(app)/dashboard/page";
import TravelRequisitionFormPage from "./app/(app)/hr/travel-requisition-form/page";
import TravelExpenseStatementPage from "./app/(app)/hr/travel-expense-statement/page";

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
		],
	},
]);

/* ---------------- PROVIDER ---------------- */

const RouterProviderComponent = () => {
	return <RouterProvider router={routes} />;
};

export default RouterProviderComponent;
