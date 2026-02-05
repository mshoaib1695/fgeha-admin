import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Space,
  Switch,
  theme,
  Typography,
  Button,
} from "antd";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import type { AuthUser } from "../../providers/authProvider";

const { Text } = Typography;
const { useToken } = theme;

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<AuthUser>();
  const { mutate: logout } = useLogout();
  const { mode, setMode } = useContext(ColorModeContext);

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space size="middle">
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        {user?.fullName && <Text strong>{user.fullName}</Text>}
        {user?.email && <Text type="secondary">{user.email}</Text>}
        <Button type="default" size="small" onClick={() => logout()}>
          Logout
        </Button>
      </Space>
    </AntdLayout.Header>
  );
};
