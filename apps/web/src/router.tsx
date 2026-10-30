import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { AlertsPage } from "./pages/Alerts/AlertsPage";
import { ConnectorsPage } from "./pages/Connectors/ConnectorsPage";
import { DashboardLayout } from "./pages/Dashboard/Dashboard";
import { Landing } from "./pages/Landing/Landing";
import { NotFound } from "./pages/NotFound/NotFound";
import { AiContextPage } from "./pages/Project/AiContextPage";
import { DeliveriesPage } from "./pages/Project/DeliveriesPage";
import { ProjectLayout } from "./pages/Project/ProjectLayout";
import { RulesPage } from "./pages/Project/RulesPage";
import { ProjectSettingsPage } from "./pages/ProjectSettings/ProjectSettingsPage";
import { ProjectsPage } from "./pages/Projects/ProjectsPage";
import { SignIn } from "./pages/SignIn/SignIn";

function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/signin", element: <SignIn /> },
      {
        element: <RequireAuth />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="connectors" replace /> },
              { path: "connectors", element: <ConnectorsPage /> },
              { path: "projects", element: <ProjectsPage /> },
              {
                path: "projects/:projectId",
                element: <ProjectLayout />,
                children: [
                  { index: true, element: <AlertsPage /> },
                  { path: "context", element: <AiContextPage /> },
                  { path: "rules", element: <RulesPage /> },
                  { path: "deliveries", element: <DeliveriesPage /> },
                  { path: "settings", element: <ProjectSettingsPage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
