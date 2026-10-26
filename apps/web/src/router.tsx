import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { AlertsPage } from "./pages/Alerts/AlertsPage";
import { ComingSoon } from "./pages/Dashboard/ComingSoon";
import { DashboardLayout } from "./pages/Dashboard/Dashboard";
import { Landing } from "./pages/Landing/Landing";
import { NotFound } from "./pages/NotFound/NotFound";
import { ProjectLayout } from "./pages/Project/ProjectLayout";
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
              { index: true, element: <Navigate to="projects" replace /> },
              { path: "projects", element: <ProjectsPage /> },
              {
                path: "projects/:projectId",
                element: <ProjectLayout />,
                children: [
                  { index: true, element: <AlertsPage /> },
                  { path: "settings", element: <ProjectSettingsPage /> },
                ],
              },
              { path: "rules", element: <ComingSoon section="rules" /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
