  import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Upload,
  Button,
  Space,
  message,
  Select,
  Checkbox,
  Typography,
  Breadcrumb,
  theme,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  PictureOutlined,
  MinusCircleOutlined,
  FormOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  BellOutlined,
  LinkOutlined,
  PhoneOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";
import { AllowedDaysField } from "../request-types/AllowedDaysField";

type OptionType = "form" | "list" | "rules" | "notification" | "link" | "phone";
type IssueImageRequirement = "none" | "optional" | "required";
type RuleItem = { description?: string };

type OptionRecord = {
  id: number;
  requestTypeId: number;
  label: string;
  slug?: string | null;
  optionType: OptionType;
  config: {
    issueImage?: IssueImageRequirement;
    listKey?: string;
    content?: string;
    url?: string;
    phoneNumber?: string;
    rules?: RuleItem[];
  } | null;
  displayOrder: number;
  imageUrl?: string | null;
  headerIcon?: string | null;
  hint?: string | null;
  requestNumberPrefix?: string | null;
  duplicateRestrictionPeriod?: string | null;
  restrictionStartTime?: string | null;
  restrictionEndTime?: string | null;
  restrictionDays?: string | null;
};

const DUPLICATE_PERIOD_OPTIONS = [
  { value: "none", label: "None" },
  { value: "day", label: "Once per calendar day" },
  { value: "week", label: "Once per calendar week" },
  { value: "month", label: "Once per calendar month" },
];

const OPTION_TYPES: { value: OptionType; label: string }[] = [
  { value: "form", label: "Form (create request)" },
  { value: "list", label: "List (e.g. tanker list, requests)" },
  { value: "rules", label: "Rules (static content)" },
  { value: "notification", label: "Notification (single content block)" },
  { value: "link", label: "Link (URL)" },
  { value: "phone", label: "Phone (tap to call)" },
];

const LIST_KEYS = [
  { value: "daily_bulletin", label: "Water tanker list (daily bulletin)" },
  { value: "requests", label: "List of requests (this type)" },
  { value: "news", label: "News" },
];

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const v = getVToken();
  if (v) (h as Record<string, string>)["X-V"] = v;
  return h;
}

export const ServiceOptionFormPage = () => {
  const { token } = theme.useToken();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = id != null && id !== "";
  const requestTypeIdFromQuery = searchParams.get("requestTypeId");

  const [form] = Form.useForm();

  const sectionCardStyle: React.CSSProperties = {
    marginBottom: 24,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowSecondary,
    overflow: "hidden",
  };
  const sectionTitleStyle: React.CSSProperties = {
    marginBottom: 0,
    fontSize: token.fontSize,
    fontWeight: 600,
    color: token.colorTextHeading,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };
  const pageWrapStyle: React.CSSProperties = {
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    padding: "24px 24px",
    minHeight: "100vh",
  };
  const colProps = { xs: 24, sm: 24, md: 12 } as const;
  const ruleBlockStyle: React.CSSProperties = {
    marginBottom: 16,
    padding: 16,
    background: token.colorFillQuaternary,
    borderRadius: token.borderRadius,
    border: `1px solid ${token.colorBorderSecondary}`,
  };
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [requestTypeId, setRequestTypeId] = useState<number | null>(
    requestTypeIdFromQuery ? parseInt(requestTypeIdFromQuery, 10) : null
  );
  const [pageTitle, setPageTitle] = useState(isEdit ? "Edit service option" : "Add service option");

  useEffect(() => {
    if (!isEdit) {
      const rtId = requestTypeIdFromQuery ? parseInt(requestTypeIdFromQuery, 10) : null;
      const resolved = rtId && !Number.isNaN(rtId) ? rtId : null;
      setRequestTypeId(resolved);
      setPageTitle("Add service option");
      if (resolved != null) form.setFieldValue("requestTypeId", resolved);
      return;
    }
    const optionId = parseInt(id!, 10);
    if (Number.isNaN(optionId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/request-type-options/${optionId}`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load option");
        return res.json();
      })
      .then((row: OptionRecord) => {
        if (cancelled) return;
        setRequestTypeId(row.requestTypeId);
        setPageTitle(`Edit: ${row.label}`);
        const cfg = row.config;
        let rules: RuleItem[] = [];
        if (cfg?.rules && Array.isArray(cfg.rules) && cfg.rules.length > 0) {
          rules = cfg.rules.map((r) => ({ description: r.description ?? "" }));
        } else if (cfg?.content) {
          rules = [{ description: String(cfg.content) }];
        }
        if (rules.length === 0) rules = [{ description: "" }];
        const hasWindow = !!(row.restrictionStartTime || row.restrictionEndTime || row.restrictionDays);
        form.setFieldsValue({
          label: row.label,
          slug: row.slug ?? "",
          optionType: row.optionType,
          displayOrder: row.displayOrder,
          issueImage: row.config?.issueImage ?? "optional",
          listKey: row.config?.listKey,
          rules,
          notificationContent: row.config?.content ?? "",
          url: row.config?.url ?? "",
          imageUrl: row.imageUrl ?? "",
          headerIcon: row.headerIcon ?? "",
          hint: row.hint ?? "",
          phoneNumber: row.config?.phoneNumber ?? "",
          requestNumberPrefix: row.requestNumberPrefix ?? "",
          duplicateRestrictionPeriod: row.duplicateRestrictionPeriod ?? "none",
          restrictionWindowEnabled: hasWindow,
          restrictionStartTime: row.restrictionStartTime ?? "",
          restrictionEndTime: row.restrictionEndTime ?? "",
          restrictionDays: row.restrictionDays ?? "",
        });
      })
      .catch(() => message.error("Failed to load option"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, requestTypeIdFromQuery, form]);

  const uploadImageProps: UploadProps = {
    name: "file",
    maxCount: 1,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      const token = localStorage.getItem(TOKEN_KEY);
      const vToken = getVToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (vToken) headers["X-V"] = vToken;
      const formData = new FormData();
      formData.append("file", file as File);
      try {
        const res = await fetch(`${API_URL}/request-type-options/upload-image`, {
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
    const rtId = isEdit ? requestTypeId : values.requestTypeId ?? requestTypeId;
    if (rtId == null || typeof rtId !== "number") {
      message.error("Select a request type.");
      return;
    }
    const isForm = values.optionType === "form";
    const windowEnabled = !!values.restrictionWindowEnabled;
    const payload = {
      requestTypeId: rtId,
      label: (values.label as string)?.trim(),
      slug: (values.slug as string)?.trim() || null,
      optionType: values.optionType,
      displayOrder: (values.displayOrder as number) ?? 0,
      config: undefined as Record<string, unknown> | undefined,
      imageUrl: (values.imageUrl as string)?.trim() || null,
      headerIcon: (values.headerIcon as string)?.trim() || null,
      hint: (values.hint as string)?.trim() || null,
      requestNumberPrefix: (values.requestNumberPrefix as string)?.trim()?.toUpperCase() || null,
      duplicateRestrictionPeriod: isForm ? ((values.duplicateRestrictionPeriod as string) ?? "none") : null,
      restrictionStartTime: isForm && windowEnabled ? (values.restrictionStartTime as string)?.trim() || null : null,
      restrictionEndTime: isForm && windowEnabled ? (values.restrictionEndTime as string)?.trim() || null : null,
      restrictionDays: isForm && windowEnabled ? (values.restrictionDays as string)?.trim() || null : null,
    };
    if (values.optionType === "form") payload.config = { issueImage: (values.issueImage as string) ?? "optional" };
    if (values.optionType === "list") payload.config = { listKey: values.listKey };
    if (values.optionType === "rules") {
      const rulesList = Array.isArray(values.rules) ? values.rules : [];
      payload.config = {
        rules: rulesList
          .map((r: RuleItem) => ({ description: (r.description ?? "").trim() }))
          .filter((r: RuleItem) => r.description),
      };
    }
    if (values.optionType === "notification") {
      payload.config = { content: String(values.notificationContent ?? "").trim() };
    }
    if (values.optionType === "link") payload.config = { url: values.url ?? "" };
    if (values.optionType === "phone") payload.config = { phoneNumber: values.phoneNumber ?? "" };

    setSaving(true);
    try {
      if (isEdit && id) {
        const res = await fetch(`${API_URL}/request-type-options/${id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            label: payload.label,
            optionType: payload.optionType,
            slug: payload.slug,
            displayOrder: payload.displayOrder,
            config: payload.config ?? null,
            imageUrl: payload.imageUrl,
            headerIcon: payload.headerIcon,
            hint: payload.hint,
            requestNumberPrefix: payload.requestNumberPrefix,
            duplicateRestrictionPeriod: payload.duplicateRestrictionPeriod,
            restrictionStartTime: payload.restrictionStartTime,
            restrictionEndTime: payload.restrictionEndTime,
            restrictionDays: payload.restrictionDays,
          }),
        });
        if (!res.ok) throw new Error("Update failed");
        message.success("Option updated.");
      } else {
        const res = await fetch(`${API_URL}/request-type-options`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");
        message.success("Option added.");
      }
      navigate("/service-options");
    } catch (e) {
      message.error((e as Error).message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => navigate("/service-options");

  const actionButtons = (
    <Space size="middle">
      <Button size="large" onClick={goBack}>
        Cancel
      </Button>
      <Button type="primary" size="large" htmlType="submit" loading={saving} onClick={() => form.submit()}>
        Save changes
      </Button>
    </Space>
  );

  if (!isEdit && (requestTypeId == null || Number.isNaN(requestTypeId))) {
    return (
      <div style={pageWrapStyle}>
        <Breadcrumb
          items={[
            { title: <Link to="/service-options">Service options</Link> },
            { title: "Add option" },
          ]}
          style={{ marginBottom: 24 }}
        />
        <Card style={{ ...sectionCardStyle, padding: 32 }} bodyStyle={{ padding: 0 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Missing or invalid request type. Please go back and choose a request type, then click &quot;Add option&quot;.
          </Typography.Paragraph>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={goBack}>
            Back to Service options
          </Button>
        </Card>
      </div>
    );
  }

  if (isEdit && !loading && requestTypeId == null) {
    return (
      <div style={pageWrapStyle}>
        <Breadcrumb
          items={[
            { title: <Link to="/service-options">Service options</Link> },
            { title: "Edit" },
          ]}
          style={{ marginBottom: 24 }}
        />
        <Card style={{ ...sectionCardStyle, padding: 32 }} bodyStyle={{ padding: 0 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Option not found or could not be loaded.
          </Typography.Paragraph>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={goBack}>
            Back to Service options
          </Button>
        </Card>
      </div>
    );
  }

  const initialValues = {
    displayOrder: 0,
    optionType: "form" as OptionType,
    issueImage: "optional",
    duplicateRestrictionPeriod: "none",
    restrictionWindowEnabled: false,
  };

  return (
    <div style={pageWrapStyle}>
      <Breadcrumb
        items={[
          { title: <Link to="/service-options">Service options</Link> },
          { title: isEdit ? pageTitle.replace(/^Edit: /, "") : "Add option" },
        ]}
        style={{ marginBottom: 8 }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 4, fontWeight: 600 }}>
            {pageTitle}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {isEdit ? "Update this service option. Changes apply in the app after saving." : "Define how this option appears and behaves in the app."}
          </Typography.Text>
        </div>
        <div>{actionButtons}</div>
      </div>

      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
        <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }} loading={loading}>
          <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
            <AppstoreOutlined style={{ color: token.colorPrimary }} />
            <span>Basic info</span>
          </div>
          <Row gutter={24}>
            <Col {...colProps}>
              <Form.Item
                name="label"
                label="Option name"
                rules={[{ required: true, message: "Enter a name for this option" }]}
                extra="Shown to users in the app (e.g. Order Water Tanker, Water line issue)"
              >
                <Input placeholder="e.g. Order Water Tanker" size="large" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="slug"
                label="Slug"
                extra="For analytics and filters. Leave empty to auto-generate from the name."
              >
                <Input placeholder="e.g. order_water_tanker" maxLength={120} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col {...colProps}>
              <Form.Item
                name="optionType"
                label="What does this option do?"
                rules={[{ required: true }]}
                extra="Form = user submits a request. List = open a list. Rules = static text. Link = open URL. Phone = tap to call."
              >
                <Select options={OPTION_TYPES} placeholder="Select type" />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="hint"
                label="Subtitle (optional)"
                extra="Short text under the option name in the app. Leave empty for default."
              >
                <Input placeholder="e.g. Submit a request" maxLength={120} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.optionType !== curr.optionType}>
          {({ getFieldValue }) => {
            const type = getFieldValue("optionType");
            if (type === "list")
              return (
                <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                    <UnorderedListOutlined style={{ color: token.colorPrimary }} />
                    <span>List settings</span>
                  </div>
                  <Form.Item name="listKey" label="Which list?" rules={[{ required: true, message: "Select a list" }]}>
                    <Select options={LIST_KEYS} placeholder="Select list type" />
                  </Form.Item>
                </Card>
              );
            if (type === "form")
              return (
                <>
                  <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                    <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                      <FormOutlined style={{ color: token.colorPrimary }} />
                      <span>Form settings</span>
                    </div>
                    <Row gutter={24}>
                      <Col {...colProps}>
                        <Form.Item
                          name="issueImage"
                          label="Photo in request form"
                          initialValue="optional"
                          extra="Should users attach a photo when submitting?"
                        >
                          <Select
                            options={[
                              { value: "none", label: "Hidden" },
                              { value: "optional", label: "Optional" },
                              { value: "required", label: "Required" },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col {...colProps}>
                        <Form.Item
                          name="requestNumberPrefix"
                          label="Request ID prefix"
                          rules={[{ required: true, message: "Required for form options (e.g. OWT)" }]}
                          extra="Request numbers will look like OWT#0001, OWT#0002, …"
                        >
                          <Input maxLength={20} placeholder="e.g. OWT" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                  <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                    <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                      <ClockCircleOutlined style={{ color: token.colorPrimary }} />
                      <span>When users can submit</span>
                    </div>
                    <Row gutter={24}>
                      <Col {...colProps}>
                        <Form.Item
                          name="duplicateRestrictionPeriod"
                          label="Limit duplicate requests"
                          extra="Same address can submit only one request per period (cancelled requests don't count)"
                        >
                          <Select options={DUPLICATE_PERIOD_OPTIONS} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 16 }}>
                      If unchecked, users can submit anytime.
                    </Typography.Text>
                    <Row>
                      <Col span={24}>
                        <Form.Item
                          name="restrictionWindowEnabled"
                          valuePropName="checked"
                          getValueFromEvent={(e) => e.target.checked}
                        >
                          <Checkbox
                            onChange={(e) => {
                              if (!e.target.checked) {
                                form.setFieldsValue({
                                  restrictionStartTime: "",
                                  restrictionEndTime: "",
                                  restrictionDays: "",
                                });
                              }
                            }}
                          >
                            Restrict to a time window (e.g. only 1–3 PM on weekdays)
                          </Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.restrictionWindowEnabled !== curr.restrictionWindowEnabled}>
                      {() =>
                        form.getFieldValue("restrictionWindowEnabled") ? (
                          <Row gutter={24} align="top">
                            <Col xs={24} sm={24} md={10}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                                <Form.Item
                                  label="From"
                                  name="restrictionStartTime"
                                  rules={[{ required: true, message: "Required" }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input size="small" placeholder="13:00" style={{ width: 88 }} />
                                </Form.Item>
                                <Form.Item
                                  label="To"
                                  name="restrictionEndTime"
                                  rules={[{ required: true, message: "Required" }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input size="small" placeholder="14:00" style={{ width: 88 }} />
                                </Form.Item>
                              </div>
                            </Col>
                            <Col xs={24} sm={24} md={14}>
                              <Form.Item
                                label="Allowed days"
                                name="restrictionDays"
                                rules={[{ required: true, message: "Select at least one day" }]}
                                style={{ marginBottom: 0 }}
                              >
                                <AllowedDaysField />
                              </Form.Item>
                            </Col>
                          </Row>
                        ) : null
                      }
                    </Form.Item>
                  </Card>
                </>
              );
            if (type === "rules")
              return (
                <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                    <FileTextOutlined style={{ color: token.colorPrimary }} />
                    <span>Rules content</span>
                  </div>
                  <Form.Item label="Rule items">
                    <Form.List name="rules">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...rest }) => (
                            <div
                              key={key}
                            style={ruleBlockStyle}
                            >
                              <Form.Item {...rest} name={[name, "description"]} noStyle>
                                <Input.TextArea rows={2} placeholder="Rule text" style={{ marginBottom: 8 }} />
                              </Form.Item>
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                                style={{ padding: 0 }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button type="dashed" onClick={() => add({ description: "" })} block style={{ borderRadius: 8 }}>
                            + Add rule
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                </Card>
              );
            if (type === "notification")
              return (
                <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                    <BellOutlined style={{ color: token.colorPrimary }} />
                    <span>Notification content</span>
                  </div>
                  <Form.Item name="notificationContent" rules={[{ required: true, message: "Enter the text to show" }]}>
                    <Input.TextArea rows={4} placeholder="Text shown in the app" />
                  </Form.Item>
                </Card>
              );
            if (type === "link")
              return (
                <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                    <LinkOutlined style={{ color: token.colorPrimary }} />
                    <span>Link</span>
                  </div>
                  <Form.Item name="url" label="URL" rules={[{ required: true, message: "Enter the URL" }]}>
                    <Input placeholder="https://..." allowClear />
                  </Form.Item>
                </Card>
              );
            if (type === "phone")
              return (
                <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
                  <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
                    <PhoneOutlined style={{ color: token.colorPrimary }} />
                    <span>Phone</span>
                  </div>
                  <Form.Item
                    name="phoneNumber"
                    label="Number"
                    rules={[{ required: true, message: "Enter the phone number" }]}
                  >
                    <Input placeholder="+92 300 1234567" />
                  </Form.Item>
                </Card>
              );
            return null;
          }}
        </Form.Item>

        <Card style={sectionCardStyle} bodyStyle={{ padding: "20px 24px" }}>
          <div style={{ ...sectionTitleStyle, marginBottom: 20 }}>
            <SettingOutlined style={{ color: token.colorPrimary }} />
            <span>Appearance in app</span>
          </div>
          <Row gutter={24}>
            <Col {...colProps}>
              <Form.Item name="displayOrder" label="Display order" extra="Lower numbers appear first. Use 0, 1, 2, …">
                <InputNumber min={0} style={{ width: "100%", maxWidth: 120 }} />
              </Form.Item>
            </Col>
            <Col {...colProps}>
              <Form.Item
                name="headerIcon"
                label="Header icon"
                extra="Ionicons name (e.g. water-outline) or one emoji. Optional."
              >
                <Input placeholder="e.g. water-outline or 📋" maxLength={80} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="imageUrl" label="Image URL" extra="Image shown below the header in the app. Optional.">
            <Input placeholder="Or paste URL / upload below" />
          </Form.Item>
          <Form.Item label="Upload image">
            <Upload {...uploadImageProps}>
              <Button icon={<PictureOutlined />} style={{ borderRadius: 8 }}>
                Choose image (PNG, JPEG, WebP, GIF, max 2MB)
              </Button>
            </Upload>
          </Form.Item>
        </Card>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${token.colorBorderSecondary}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {actionButtons}
        </div>
      </Form>
    </div>
  );
};
