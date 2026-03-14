import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Upload,
  Button,
  Space,
  message,
  Breadcrumb,
  Typography,
  theme,
  Switch,
} from "antd";
import { ArrowLeftOutlined, PictureOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import MDEditor from "@uiw/react-md-editor";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

type NewsRecord = {
  id: number;
  title: string;
  content: string | null;
  imageUrl: string | null;
  displayOrder: number;
  openDetail?: boolean | number;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const v = getVToken();
  if (v) (h as Record<string, string>)["X-V"] = v;
  return h;
}

export const NewsFormPage = () => {
  const { token } = theme.useToken();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id != null && id !== "";

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const newsId = parseInt(id!, 10);
    if (Number.isNaN(newsId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/news/${newsId}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load news");
        return res.json();
      })
      .then((row: NewsRecord) => {
        if (cancelled) return;
        form.setFieldsValue({
          title: row.title,
          content: row.content ?? "",
          imageUrl: row.imageUrl ?? "",
          displayOrder: row.displayOrder ?? 0,
          openDetail: row.openDetail !== false && row.openDetail !== 0,
        });
      })
      .catch(() => message.error("Failed to load news"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, form]);

  const uploadImageProps: UploadProps = {
    name: "file",
    maxCount: 1,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      const tokenVal = localStorage.getItem(TOKEN_KEY);
      const vToken = getVToken();
      const headers: Record<string, string> = {};
      if (tokenVal) headers["Authorization"] = `Bearer ${tokenVal}`;
      if (vToken) headers["X-V"] = vToken;
      const formData = new FormData();
      formData.append("file", file as File);
      try {
        const res = await fetch(`${API_URL}/news/upload-image`, {
          method: "POST",
          headers,
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message ?? "Upload failed");
        }
        const { url } = await res.json();
        form.setFieldValue("imageUrl", url);
        message.success("Image uploaded.");
        onSuccess?.(url);
      } catch (e) {
        message.error((e as Error).message ?? "Upload failed");
        onError?.(e as Error);
      }
    },
  };

  const handleFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = {
        title: (values.title as string)?.trim(),
        content: (values.content as string)?.trim() || null,
        imageUrl: (values.imageUrl as string)?.trim() || null,
        displayOrder: (values.displayOrder as number) ?? 0,
        openDetail: (values.openDetail as boolean) !== false,
      };
      if (isEdit && id) {
        const res = await fetch(`${API_URL}/news/${id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        message.success("News updated.");
      } else {
        const res = await fetch(`${API_URL}/news`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");
        message.success("News added.");
      }
      navigate("/news");
    } catch (e) {
      message.error((e as Error).message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const sectionCardStyle: React.CSSProperties = {
    marginBottom: 24,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowSecondary,
    overflow: "hidden",
  };

  const pageWrapStyle: React.CSSProperties = {
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
    padding: "24px 24px",
    minHeight: "100vh",
  };

  return (
    <div style={pageWrapStyle}>
      <Breadcrumb
        items={[
          { title: <Link to="/news">News</Link> },
          { title: isEdit ? "Edit" : "Add news" },
        ]}
        style={{ marginBottom: 24 }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isEdit ? "Edit news" : "Add news"}
        </Typography.Title>
        <Space>
          <Button onClick={() => navigate("/news")} icon={<ArrowLeftOutlined />}>
            Back
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            Save
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ displayOrder: 0, openDetail: true }}
        onFinish={handleFinish}
      >
        <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }} loading={loading}>
          <Form.Item
            name="imageUrl"
            label="Image"
            extra="Recommended size: 1200 × 600 px (2:1) for best display on home carousel and detail screen."
            rules={[{ required: true, message: "Image is required" }]}
          >
            <Input placeholder="Or upload below" />
          </Form.Item>
          <Form.Item label="Upload image" extra="PNG, JPEG, WebP, GIF — max 2MB">
            <Upload {...uploadImageProps}>
              <Button icon={<PictureOutlined />} style={{ borderRadius: 8 }}>
                Choose image
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item name="title" label="Heading (optional)">
            <Input placeholder="News heading" size="large" />
          </Form.Item>

          <Form.Item name="content" label="Content (optional, rich text / markdown)">
            <MDEditor data-color-mode="light" preview="live" height={280} />
          </Form.Item>

          <Form.Item name="displayOrder" label="Display order (optional)">
            <InputNumber min={0} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item
            name="openDetail"
            label="Open detail page when tapped"
            valuePropName="checked"
            extra="When off, the slide is not clickable (banner only)."
          >
            <Switch checkedChildren="On" unCheckedChildren="Off" />
          </Form.Item>
        </Card>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Button onClick={() => navigate("/news")}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};
