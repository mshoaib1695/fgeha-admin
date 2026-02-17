import { useState, useEffect, useCallback } from "react";
import { Card, Select, Table, Button, Space, message, Modal, Form, Input, InputNumber, Upload } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined, PictureOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

type RequestType = { id: number; name: string; slug: string };
type OptionType = "form" | "list" | "rules" | "link" | "phone";
type IssueImageRequirement = "none" | "optional" | "required";
type RuleItem = { description?: string };
type OptionRecord = {
  id: number;
  requestTypeId: number;
  label: string;
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
  requestNumberPrefix?: string | null;
};

const OPTION_TYPES: { value: OptionType; label: string }[] = [
  { value: "form", label: "Form (create request)" },
  { value: "list", label: "List (e.g. tanker list, requests)" },
  { value: "rules", label: "Rules (static content)" },
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

export const ServiceOptionsPage = () => {
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [options, setOptions] = useState<OptionRecord[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const loadRequestTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const res = await fetch(`${API_URL}/request-types`, { headers: authHeaders() });
      const list = await res.json();
      setRequestTypes(Array.isArray(list) ? list : []);
      if (selectedTypeId == null && list?.length > 0) setSelectedTypeId(list[0].id);
    } catch {
      setRequestTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, [selectedTypeId]);

  const loadOptions = useCallback(async () => {
    if (selectedTypeId == null) {
      setOptions([]);
      return;
    }
    setLoadingOptions(true);
    try {
      const res = await fetch(
        `${API_URL}/request-type-options?requestTypeId=${selectedTypeId}`,
        { headers: authHeaders() }
      );
      if (!res.ok) {
        setOptions([]);
        return;
      }
      const list = await res.json();
      setOptions(Array.isArray(list) ? list : []);
    } catch {
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [selectedTypeId]);

  useEffect(() => {
    loadRequestTypes();
  }, [loadRequestTypes]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const openCreate = () => {
    setEditingId(null);
    form.setFieldsValue({
      label: "",
      optionType: "form",
      displayOrder: options.length,
      issueImage: "optional",
      listKey: undefined,
      rules: [{ description: "" }],
      url: "",
      phoneNumber: "",
      imageUrl: "",
      requestNumberPrefix: "",
    });
    setModalOpen(true);
  };

  const openEdit = (row: OptionRecord) => {
    setEditingId(row.id);
    const cfg = row.config;
    let rules: RuleItem[] = [];
    if (cfg?.rules && Array.isArray(cfg.rules) && cfg.rules.length > 0) {
      rules = cfg.rules.map((r) => ({ description: r.description ?? "" }));
    } else if (cfg?.content) {
      rules = [{ description: String(cfg.content) }];
    }
    if (rules.length === 0) rules = [{ description: "" }];
    form.setFieldsValue({
      label: row.label,
      optionType: row.optionType,
      displayOrder: row.displayOrder,
      issueImage: row.config?.issueImage ?? "optional",
      listKey: row.config?.listKey,
      rules,
      url: row.config?.url ?? "",
      imageUrl: row.imageUrl ?? "",
      phoneNumber: row.config?.phoneNumber ?? "",
      requestNumberPrefix: row.requestNumberPrefix ?? "",
    });
    setModalOpen(true);
  };

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

  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    const values = form.getFieldsValue();
    if (selectedTypeId == null) {
      message.error("Select a request type first.");
      return;
    }
    const payload = {
      requestTypeId: selectedTypeId,
      label: values.label?.trim(),
      optionType: values.optionType,
      displayOrder: values.displayOrder ?? 0,
      config: undefined as Record<string, unknown> | undefined,
      imageUrl: values.imageUrl?.trim() || null,
      requestNumberPrefix: values.requestNumberPrefix?.trim()?.toUpperCase() || null,
    };
    if (values.optionType === "form") payload.config = { issueImage: values.issueImage ?? "optional" };
    if (values.optionType === "list") payload.config = { listKey: values.listKey };
    if (values.optionType === "rules") {
      const rulesList = Array.isArray(values.rules) ? values.rules : [];
      payload.config = {
        rules: rulesList
          .map((r: RuleItem) => ({ description: (r.description ?? "").trim() }))
          .filter((r: RuleItem) => r.description),
      };
    }
    if (values.optionType === "link") payload.config = { url: values.url ?? "" };
    if (values.optionType === "phone") payload.config = { phoneNumber: values.phoneNumber ?? "" };

    setSaving(true);
    try {
      if (editingId != null) {
        const res = await fetch(`${API_URL}/request-type-options/${editingId}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            label: payload.label,
            optionType: payload.optionType,
            displayOrder: payload.displayOrder,
            config: payload.config ?? null,
            imageUrl: payload.imageUrl,
            requestNumberPrefix: payload.requestNumberPrefix,
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
      setModalOpen(false);
      loadOptions();
    } catch (e) {
      message.error((e as Error).message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete option?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/request-type-options/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { message?: string }).message;
        throw new Error(typeof msg === "string" && msg.trim() ? msg : "Delete failed");
      }
      message.success("Option deleted.");
      loadOptions();
    } catch (e) {
      message.error((e as Error).message ?? "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { title: "Label", dataIndex: "label", key: "label" },
    { title: "Type", dataIndex: "optionType", key: "optionType" },
    {
      title: "Config",
      key: "config",
      render: (_: unknown, row: OptionRecord) => {
        if (row.optionType === "list" && row.config?.listKey)
          return LIST_KEYS.find((k) => k.value === row.config?.listKey)?.label ?? row.config.listKey;
        if (row.optionType === "rules") {
          const rules = row.config?.rules;
          if (Array.isArray(rules) && rules.length > 0)
            return `${rules.length} rule(s)`;
          if (row.config?.content)
            return (row.config.content as string).slice(0, 40) + (row.config.content.length > 40 ? "…" : "");
        }
        if (row.optionType === "link" && row.config?.url) return row.config.url;
        if (row.optionType === "phone" && row.config?.phoneNumber) return row.config.phoneNumber;
        return "—";
      },
    },
    { title: "Order", dataIndex: "displayOrder", key: "displayOrder", width: 70 },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, row: OptionRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={deletingId === row.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleDelete(row.id);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card title="Service options (per request type)">
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space wrap>
          <span>Request type:</span>
          <Select
            loading={loadingTypes}
            value={selectedTypeId ?? undefined}
            onChange={(v) => setSelectedTypeId(v ?? null)}
            style={{ minWidth: 220 }}
            options={requestTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.slug})` }))}
            placeholder="Select request type"
          />
        </Space>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={selectedTypeId == null}>
            Add option
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loadingOptions}
          dataSource={options}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Space>

      <Modal
        title={editingId != null ? "Edit option" : "Add option"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input placeholder="e.g. Order Water Tanker" />
          </Form.Item>
          <Form.Item name="optionType" label="Type" rules={[{ required: true }]}>
            <Select options={OPTION_TYPES} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.optionType !== curr.optionType}>
            {({ getFieldValue }) => {
              const type = getFieldValue("optionType");
              if (type === "list")
                return (
                  <Form.Item name="listKey" label="List" rules={[{ required: true }]}>
                    <Select options={LIST_KEYS} placeholder="Select list type" />
                  </Form.Item>
                );
              if (type === "form")
                return (
                  <Form.Item name="issueImage" label="Photo upload in request form" initialValue="optional">
                    <Select
                      options={[
                        { value: "none", label: "Hidden" },
                        { value: "optional", label: "Optional" },
                        { value: "required", label: "Required" },
                      ]}
                    />
                  </Form.Item>
                );
              if (type === "rules")
                return (
                  <Form.Item label="Rules (list of rule text)">
                    <Form.List name="rules">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...rest }) => (
                            <Card size="small" key={key} style={{ marginBottom: 12 }}>
                              <Space direction="vertical" style={{ width: "100%" }}>
                                <Form.Item {...rest} name={[name, "description"]} label="Rule">
                                  <Input.TextArea rows={3} placeholder="Rule text" />
                                </Form.Item>
                                <Button type="link" danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                                  Remove rule
                                </Button>
                              </Space>
                            </Card>
                          ))}
                          <Button type="dashed" onClick={() => add({ description: "" })} block>
                            + Add rule
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                );
              if (type === "link")
                return (
                  <Form.Item name="url" label="URL">
                    <Input placeholder="https://..." />
                  </Form.Item>
                );
              if (type === "phone")
                return (
                  <Form.Item
                    name="phoneNumber"
                    label="Phone / mobile number"
                    rules={[{ required: true, message: "Please enter phone number" }]}
                  >
                    <Input placeholder="+92 300 1234567" />
                  </Form.Item>
                );
              return null;
            }}
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.optionType !== curr.optionType}>
            {({ getFieldValue }) => {
              const type = getFieldValue("optionType");
              if (type !== "form") return null;
              return (
                <Form.Item
                  name="requestNumberPrefix"
                  label="Request ID prefix"
                  rules={[{ required: true, message: "Prefix is required for form option" }]}
                  extra='Example: "OWT" creates OWT#0001'
                >
                  <Input maxLength={20} placeholder="e.g. OWT" />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item name="displayOrder" label="Display order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image (shown on app after header)">
            <Input placeholder="Upload below or paste image URL" />
          </Form.Item>
          <Form.Item label="Upload image">
            <Upload {...uploadImageProps}>
              <Button icon={<PictureOutlined />}>Select image (PNG, JPEG, WebP, GIF, max 2MB)</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
