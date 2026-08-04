import { useState, useEffect, useCallback } from "react";
import { List } from "@refinedev/antd";
import { Table, Tag, Card, Form, Switch, Button, message } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { API_URL, TOKEN_KEY } from "../../providers/constants";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return h;
}

type FeedbackRecord = {
  id: number;
  rating: number;
  feedback: string | null;
  createdAt: string;
  user?: {
    id: number;
    fullName?: string;
    email?: string;
  };
};

export const FeedbackList = () => {
  const [form] = Form.useForm();
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRating, setSavingRating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/app-settings`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        form.setFieldValue("ratingEnabled", data?.ratingEnabled === true);
      }
    } catch {
      // ignore
    }
  }, [form]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveRating = async (values?: { ratingEnabled?: boolean }) => {
    setSavingRating(true);
    try {
      const enabled = (values ?? form.getFieldsValue()).ratingEnabled === true;
      const res = await fetch(`${API_URL}/app-settings`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ ratingEnabled: enabled }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      form.setFieldValue("ratingEnabled", data?.ratingEnabled === true);
      message.success("Rating setting saved.");
    } catch {
      message.error("Failed to save rating setting.");
    } finally {
      setSavingRating(false);
    }
  };

  const loadList = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        setItems([]);
        return;
      }
      const json = await res.json();
      const data = json?.data ?? (Array.isArray(json) ? json : []);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const ratingColor = (r: number) => {
    if (r >= 4) return "green";
    if (r >= 3) return "orange";
    return "red";
  };

  return (
    <List title="App feedback">
      <Card
        size="small"
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            Rating / review modal
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        <Form form={form} layout="vertical" onFinish={(values) => handleSaveRating(values)}>
          <Form.Item
            name="ratingEnabled"
            label="Show rating to users"
            valuePropName="checked"
            initialValue={true}
            extra="When On, users see the rating modal after completing requests. When Off, the rating modal is never shown."
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingRating}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Table
        dataSource={items}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20, showSizeChanger: true }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: "8px 0", whiteSpace: "pre-wrap" }}>
              {record.feedback?.trim() || <span style={{ color: "#999" }}>No feedback text</span>}
            </div>
          ),
          rowExpandable: (record) => !!record.feedback?.trim(),
        }}
        columns={[
          {
            dataIndex: "createdAt",
            title: "Date",
            width: 180,
            render: (v: string) =>
              v ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-",
          },
          {
            dataIndex: ["user", "fullName"],
            title: "User",
            width: 160,
            render: (_: unknown, r: FeedbackRecord) => r.user?.fullName ?? "-",
          },
          {
            dataIndex: ["user", "email"],
            title: "Email",
            width: 200,
            ellipsis: true,
            render: (_: unknown, r: FeedbackRecord) => r.user?.email ?? "-",
          },
          {
            dataIndex: "rating",
            title: "Rating",
            width: 100,
            render: (r: number) => (
              <Tag color={ratingColor(r)}>
                {r} {r === 1 ? "star" : "stars"}
              </Tag>
            ),
          },
          {
            dataIndex: "feedback",
            title: "Feedback",
            ellipsis: true,
            render: (v: string | null) => (v?.trim() ? v : <span style={{ color: "#999" }}>—</span>),
          },
        ]}
      />
    </List>
  );
};
