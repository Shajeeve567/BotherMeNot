import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from "react-router";
import { RequireAuth } from "./components/RequireAuth";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Landing } from "./pages/Landing/Landing";
import { NotFound } from "./pages/NotFound/NotFound";
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
          { path: "/dashboard", element: <Navigate to="/dashboard/home" replace /> },
          { path: "/dashboard/:tab", element: <Dashboard /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
