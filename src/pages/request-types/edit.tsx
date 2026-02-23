import { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Checkbox, Upload, message, Card } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

export const RequestTypeEdit = () => {
  const [underConstructionEnabled, setUnderConstructionEnabled] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const { formProps, saveButtonProps } = useForm({
    resource: "request-types",
  });

  const handleIconUpload = async (file: File) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      message.error("Not authenticated.");
      return;
    }
    setIconUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const v = getVToken();
      if (v) headers["X-V"] = v;
      const res = await fetch(`${API_URL}/request-types/upload-icon`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Upload failed");
      }
      const { url } = await res.json();
      formProps.form?.setFieldValue("iconUrl", url);
      message.success("Icon uploaded. Save the form to keep it.");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIconUploading(false);
    }
  };

  useEffect(() => {
    const v = formProps.initialValues as Record<string, unknown> | undefined;
    if (!v) return;
    const underConstruction = v.underConstruction ?? v.under_construction;
    if (underConstruction === true || underConstruction === 1) {
      setUnderConstructionEnabled(true);
    }
  }, [formProps.initialValues]);

  const handleFinish = (values: Record<string, unknown>) => {
    let next = values;
    if (!underConstructionEnabled) {
      next = { ...next, underConstruction: false, underConstructionMessage: null };
    } else {
      next = { ...next, underConstruction: true };
    }
    formProps.onFinish?.(next);
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Display order" name="displayOrder">
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
        <Card size="small" title="Maintenance page" style={{ marginBottom: 24 }}>
          <Form.Item>
            <Checkbox
              checked={underConstructionEnabled}
              onChange={(e) => setUnderConstructionEnabled(e.target.checked)}
            >
              Show maintenance page for this service
            </Checkbox>
            <div style={{ color: "rgba(0,0,0,0.45)", fontSize: 12, marginTop: 4 }}>
              When checked, users tapping this request type in the app will see a maintenance page with your message instead of options or form.
            </div>
          </Form.Item>
          {underConstructionEnabled && (
            <Form.Item
              name="underConstructionMessage"
              label="Maintenance message"
              extra="Shown on the maintenance page when user opens this request type"
            >
              <Input.TextArea rows={3} placeholder="e.g. PAGE IS UNDER CONSTRUCTION 🚧 or Under maintenance. We'll be back soon." />
            </Form.Item>
          )}
        </Card>
        <Form.Item
          name="iconUrl"
          label="Icon (optional)"
          extra="Shown on the mobile app home. SVG, PNG, JPEG, WebP or GIF, max 1024KB."
        >
          <Input placeholder="Icon URL or upload below" />
        </Form.Item>
        <Form.Item label="Upload icon" extra="Replaces the URL above.">
          <Upload.Dragger
            name="icon"
            multiple={false}
            accept=".svg,.png,.jpg,.jpeg,.webp,.gif,image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
            showUploadList={false}
            beforeUpload={(file) => {
              handleIconUpload(file);
              return false;
            }}
            disabled={iconUploading}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: "#40a9ff" }} />
            </p>
            <p className="ant-upload-text">Click or drag SVG/image here (max 1024KB)</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
    </Edit>
  );
};
