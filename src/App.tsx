import { Refine, Authenticated, useGetIdentity } from "@refinedev/core";
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
import {
  AppstoreOutlined,
  DashboardOutlined,
  FileTextOutlined,
  InboxOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header } from "./components/header";
import { IdleSessionLogout } from "./components/IdleSessionLogout";
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
  RequestEdit,
  RequestShow,
} from "./pages/requests";
import { DashboardPage } from "./pages/dashboard";
import { PrivacyPage } from "./pages/privacy";
import {
  RequestTypeList,
  RequestTypeCreate,
  RequestTypeEdit,
} from "./pages/request-types";
import { UsersWithRequestsPage } from "./pages/users-with-requests";
import { DailyBulletinList } from "./pages/daily-bulletin";
import { ServiceOptionsPage } from "./pages/service-options";
import {
  SubSectorList,
  SubSectorCreate,
  SubSectorEdit,
} from "./pages/sub-sectors";
import { dataProvider } from "./providers/data";
import { authProvider, type AuthUser } from "./providers/authProvider";
import { API_URL } from "./providers/constants";

function SiderTitle({ collapsed }: { collapsed: boolean }) {
  const { data: user } = useGetIdentity<AuthUser>();
  const profileImageUrl =
    user?.profileImage && user.profileImage.trim()
      ? `${API_URL.replace(/\/$/, "")}/${user.profileImage.replace(/^\//, "")}`
      : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={user?.fullName ?? "User"}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            objectFit: "cover",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        />
      ) : (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "#1677ff",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {(user?.fullName ?? "U").charAt(0).toUpperCase()}
        </div>
      )}
      {!collapsed ? <span style={{ fontWeight: 700 }}>FGEHA Admin</span> : null}
    </div>
  );
}

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
                    meta: { label: "Dashboard", icon: <DashboardOutlined /> },
                  },
                  {
                    name: "request-types",
                    list: "/request-types",
                    create: "/request-types/create",
                    edit: "/request-types/edit/:id",
                    meta: { label: "Request types", icon: <AppstoreOutlined /> },
                  },
                  {
                    name: "requests",
                    list: "/requests",
                    edit: "/requests/edit/:id",
                    show: "/requests/show/:id",
                    meta: { label: "Requests", icon: <FileTextOutlined /> },
                  },
                  {
                    name: "users_with_requests",
                    list: "/users-with-requests",
                    meta: { label: "Users & requests", icon: <UserSwitchOutlined /> },
                  },
                  {
                    name: "users",
                    list: "/users",
                    edit: "/users/edit/:id",
                    show: "/users/show/:id",
                    meta: { label: "Users", icon: <UserOutlined /> },
                  },
                  {
                    name: "daily-bulletin",
                    list: "/daily-bulletin",
                    meta: { label: "Water tanker list", icon: <InboxOutlined /> },
                  },
                  {
                    name: "service-options",
                    list: "/service-options",
                    meta: { label: "Service options", icon: <SettingOutlined /> },
                  },
                  {
                    name: "sub-sectors",
                    list: "/sub-sectors",
                    create: "/sub-sectors/create",
                    edit: "/sub-sectors/edit/:id",
                    meta: { label: "Sub-sectors", icon: <TeamOutlined /> },
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
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route
                    element={
                      <Authenticated
                        key="authenticated"
                        redirectOnFail="/login"
                      >
                        <ThemedLayout
                          Header={() => <Header sticky />}
                          Sider={(props) => <ThemedSider {...props} fixed Title={SiderTitle} />}
                        >
                          <IdleSessionLogout />
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
                      <Route path="edit/:id" element={<RequestEdit />} />
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
                    <Route path="/sub-sectors">
                      <Route index element={<SubSectorList />} />
                      <Route path="create" element={<SubSectorCreate />} />
                      <Route path="edit/:id" element={<SubSectorEdit />} />
                    </Route>
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
