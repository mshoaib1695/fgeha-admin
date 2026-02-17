import type { RefineThemedLayoutSiderProps } from "@refinedev/antd";
import { CanAccess, useLink, useLogout, useMenu, useTranslate, useWarnAboutChange } from "@refinedev/core";
import { Button, Layout, Menu, theme } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { LogoutOutlined, UnorderedListOutlined } from "@ant-design/icons";
import type { CSSProperties } from "react";

export function CustomSider({ Title: TitleFromProps, meta, fixed }: RefineThemedLayoutSiderProps) {
  const { token } = theme.useToken();
  const translate = useTranslate();
  const Link = useLink();
  const { mutate: logout } = useLogout();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta });

  const RenderTitle = TitleFromProps;

  const handleLogout = () => {
    if (warnWhen) {
      const confirmed = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );
      if (!confirmed) return;
      setWarnWhen(false);
    }
    logout();
  };

  const toMenuItems = (items: typeof menuItems): ItemType[] =>
    items.map((item) => {
      const label = item.label ?? item.meta?.label ?? item.name;
      const icon = item.meta?.icon ?? <UnorderedListOutlined />;
      if (item.children.length > 0) {
        return {
          key: item.key,
          icon,
          label,
          children: toMenuItems(item.children),
        } satisfies ItemType;
      }

      return {
        key: item.key,
        icon,
        label: (
          <CanAccess
            resource={item.name}
            action="list"
            params={{ resource: item }}
          >
            <Link to={item.list ?? ""}>{label}</Link>
          </CanAccess>
        ),
      } satisfies ItemType;
    });

  const menuItemsWithLogout: ItemType[] = [
    ...toMenuItems(menuItems),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: (
        <Button type="link" style={{ padding: 0 }} onClick={handleLogout}>
          {translate("buttons.logout", "Logout")}
        </Button>
      ),
    },
  ];

  const siderStyles: CSSProperties = {
    backgroundColor: token.colorBgContainer,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    height: "100vh",
  };

  if (fixed) {
    siderStyles.position = "fixed";
    siderStyles.top = 0;
    siderStyles.left = 0;
    siderStyles.zIndex = 999;
  }

  return (
    <>
      {fixed ? <div style={{ width: 220 }} /> : null}
      <Layout.Sider width={220} style={siderStyles}>
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            height: "64px",
            backgroundColor: token.colorBgElevated,
          }}
        >
          {RenderTitle ? <RenderTitle collapsed={false} /> : null}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItemsWithLogout}
          style={{ border: "none", height: "calc(100% - 64px)", overflow: "auto" }}
        />
      </Layout.Sider>
    </>
  );
}
