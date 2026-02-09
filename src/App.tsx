import { Refine, Authenticated } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  ThemedLayout,
  ThemedSider,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { VGate } from "./lib/VGate";
import { LoginPage } from "./pages/login";
import {
  UserList,
  UserShow,
  UserEdit,
} from "./pages/users";
import {
  RequestList,
  RequestShow,
} from "./pages/requests";
import { DashboardPage } from "./pages/dashboard";
import {
  RequestTypeList,
  RequestTypeCreate,
  RequestTypeEdit,
} from "./pages/request-types";
import { UsersWithRequestsPage } from "./pages/users-with-requests";
import { DailyBulletinList } from "./pages/daily-bulletin";
import { ServiceOptionsPage } from "./pages/service-options";
import { dataProvider } from "./providers/data";
import { authProvider } from "./providers/authProvider";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <VGate>
            <Refine
                dataProvider={dataProvider}
                authProvider={authProvider}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                resources={[
                  {
                    name: "dashboard",
                    list: "/",
                    meta: { label: "Dashboard" },
                  },
                  {
                    name: "request-types",
                    list: "/request-types",
                    create: "/request-types/create",
                    edit: "/request-types/edit/:id",
                    meta: { label: "Request types" },
                  },
                  {
                    name: "requests",
                    list: "/requests",
                    show: "/requests/show/:id",
                    meta: { label: "Requests" },
                  },
                  {
                    name: "users_with_requests",
                    list: "/users-with-requests",
                    meta: { label: "Users & requests" },
                  },
                  {
                    name: "users",
                    list: "/users",
                    edit: "/users/edit/:id",
                    show: "/users/show/:id",
                    meta: { label: "Users" },
                  },
                  {
                    name: "daily-bulletin",
                    list: "/daily-bulletin",
                    meta: { label: "Water tanker list" },
                  },
                  {
                    name: "service-options",
                    list: "/service-options",
                    meta: { label: "Service options" },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  title: { text: "FGEHA Admin" },
                }}
              >
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    element={
                      <Authenticated
                        key="authenticated"
                        redirectOnFail="/login"
                      >
                        <ThemedLayout
                          Header={() => <Header sticky />}
                          Sider={(props) => <ThemedSider {...props} fixed />}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<DashboardPage />} />
                    <Route path="/request-types">
                      <Route index element={<RequestTypeList />} />
                      <Route path="create" element={<RequestTypeCreate />} />
                      <Route path="edit/:id" element={<RequestTypeEdit />} />
                    </Route>
                    <Route path="/requests">
                      <Route index element={<RequestList />} />
                      <Route path="show/:id" element={<RequestShow />} />
                    </Route>
                    <Route path="/users-with-requests" element={<UsersWithRequestsPage />} />
                    <Route path="/users">
                      <Route index element={<UserList />} />
                      <Route path="edit/:id" element={<UserEdit />} />
                      <Route path="show/:id" element={<UserShow />} />
                    </Route>
                    <Route path="/daily-bulletin" element={<DailyBulletinList />} />
                    <Route path="/service-options" element={<ServiceOptionsPage />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
            </VGate>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
