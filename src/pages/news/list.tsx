import { useState, useEffect, useCallback } from "react";
import { List } from "@refinedev/antd";
import { Table, Button, Space, message, App, Card, Form, Input, Switch, Select, InputNumber } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from "@ant-design/icons";
import { Link } from "react-router";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

type NewsRecord = {
  id: number;
  title: string;
  content: string | null;
  imageUrl: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const v = getVToken();
  if (v) (h as Record<string, string>)["X-V"] = v;
  return h;
}

export const NewsList = () => {
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [news, setNews] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingTitle, setSavingTitle] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/news`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        setNews([]);
        return;
      }
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/app-settings`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        form.setFieldValue("newsSectionTitle", data?.newsSectionTitle ?? "Latest News");
        form.setFieldValue("newsDetailHeader", data?.newsDetailHeader ?? "");
        form.setFieldValue("showNewsSectionHeading", data?.showNewsSectionHeading !== false);
        form.setFieldValue("showNewsCarouselOverlay", data?.showNewsCarouselOverlay !== false);
        form.setFieldValue("paymentBlockingMode", data?.paymentBlockingMode ?? "blockAfterGracePeriod");
        form.setFieldValue("paymentGraceDaysDefault", Number(data?.paymentGraceDaysDefault ?? 30));
      }
    } catch {
      // ignore
    }
  }, [form]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSectionTitle = async () => {
    setSavingTitle(true);
    try {
      const sectionTitle = form.getFieldValue("newsSectionTitle")?.trim() ?? "Latest News";
      const detailHeader = form.getFieldValue("newsDetailHeader")?.trim() ?? "";
      const showHeading = form.getFieldValue("showNewsSectionHeading") !== false;
      const showOverlay = form.getFieldValue("showNewsCarouselOverlay") !== false;
      const paymentBlockingMode =
        form.getFieldValue("paymentBlockingMode") === "blockOnAnyDue"
          ? "blockOnAnyDue"
          : "blockAfterGracePeriod";
      const paymentGraceDaysDefault = Number(form.getFieldValue("paymentGraceDaysDefault") ?? 30);
      const res = await fetch(`${API_URL}/app-settings`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          newsSectionTitle: sectionTitle || "Latest News",
          newsDetailHeader: detailHeader,
          showNewsSectionHeading: showHeading,
          showNewsCarouselOverlay: showOverlay,
          paymentBlockingMode,
          paymentGraceDaysDefault,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      message.success("Settings saved.");
    } catch {
      message.error("Failed to save settings.");
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDelete = (r: NewsRecord) => {
    modal.confirm({
      title: "Delete news?",
      content: `Remove "${r.title}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setDeletingId(r.id);
        try {
          const res = await fetch(`${API_URL}/news/${r.id}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          if (!res.ok) throw new Error("Delete failed");
          message.success("Deleted");
          loadList();
        } catch {
          message.error("Delete failed");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const imageUrl = (path: string | null) =>
    path ? `${API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}` : null;

  return (
    <List
      title="News"
      createButtonProps={{ children: "Add news", icon: <PlusOutlined /> }}
    >
      <Card
        size="small"
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            News settings (app)
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSectionTitle}>
          <Form.Item
            name="showNewsSectionHeading"
            label="Show heading above banner"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
          <Form.Item
            name="showNewsCarouselOverlay"
            label="Show overlay on banner (title + Read more)"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
          <Form.Item
            name="newsSectionTitle"
            label="Section heading (home carousel)"
            initialValue="Latest News"
          >
            <Input placeholder="e.g. Latest News" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="newsDetailHeader"
            label="Detail screen header"
            extra="Leave empty to hide the header text (back button only)"
          >
            <Input placeholder="e.g. News (leave empty to remove)" maxLength={100} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingTitle}>
              Save
            </Button>
          </Form.Item>
          <Card
            size="small"
            title="Outstanding payments settings"
            style={{ marginTop: 8, marginBottom: 12 }}
          >
            <Form.Item
              name="paymentBlockingMode"
              label="Service blocking mode"
              initialValue="blockAfterGracePeriod"
            >
              <Select
                options={[
                  { value: "blockAfterGracePeriod", label: "Block after grace period" },
                  { value: "blockOnAnyDue", label: "Block immediately when dues exist" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="paymentGraceDaysDefault"
              label="Default grace days"
              initialValue={30}
            >
              <InputNumber min={0} max={365} style={{ width: 160 }} />
            </Form.Item>
          </Card>
        </Form>
      </Card>

      <Table
        dataSource={news}
        loading={loading}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: "Image",
            dataIndex: "imageUrl",
            width: 80,
            render: (url: string | null) =>
              url ? (
                <img
                  src={imageUrl(url)!}
                  alt=""
                  style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <span style={{ color: "#999" }}>—</span>
              ),
          },
          { dataIndex: "title", title: "Heading", ellipsis: true },
          {
            dataIndex: "content",
            title: "Content",
            ellipsis: true,
            render: (c: string | null) =>
              c ? (c.length > 60 ? c.slice(0, 60) + "…" : c) : "—",
          },
          { dataIndex: "displayOrder", title: "Order", width: 70 },
          {
            title: "Actions",
            width: 140,
            render: (_: unknown, r: NewsRecord) => (
              <Space>
                <Link to={`/news/edit/${r.id}`}>
                  <Button type="link" size="small" icon={<EditOutlined />}>
                    Edit
                  </Button>
                </Link>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deletingId === r.id}
                  onClick={() => handleDelete(r)}
                >
                  Delete
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </List>
  );
};
