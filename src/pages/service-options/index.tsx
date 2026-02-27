import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Card, Select, Table, Button, Space, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

type RequestType = { id: number; name: string; slug: string };
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

const LIST_KEYS = [
  { value: "daily_bulletin", label: "Water tanker list (daily bulletin)" },
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this option?");
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
    { title: "Hint", dataIndex: "hint", key: "hint", render: (value: string | null | undefined) => value || "—" },
    { title: "Type", dataIndex: "optionType", key: "optionType" },
    {
      title: "Config",
      key: "config",
      render: (_: unknown, row: OptionRecord) => {
        if (row.optionType === "list" && row.config?.listKey)
          return LIST_KEYS.find((k) => k.value === row.config?.listKey)?.label ?? row.config.listKey;
        if (row.optionType === "rules") {
          const rules = row.config?.rules;
          if (Array.isArray(rules) && rules.length > 0) return `${rules.length} rule(s)`;
          if (row.config?.content)
            return (row.config.content as string).slice(0, 40) + (row.config.content.length > 40 ? "…" : "");
        }
        if (row.optionType === "notification") {
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
      width: 140,
      render: (_: unknown, row: OptionRecord) => (
        <Space>
          <Link to={`/service-options/edit/${row.id}`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
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
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Service options (per request type)">
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Space wrap align="center">
          <span>Request type:</span>
          <Select
            loading={loadingTypes}
            value={selectedTypeId ?? undefined}
            onChange={(v) => setSelectedTypeId(v ?? null)}
            style={{ minWidth: 220 }}
            options={requestTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.slug})` }))}
            placeholder="Select request type"
          />
          {selectedTypeId != null ? (
            <Link to={`/service-options/create?requestTypeId=${selectedTypeId}`}>
              <Button type="primary" icon={<PlusOutlined />}>
                Add option
              </Button>
            </Link>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} disabled>
              Add option
            </Button>
          )}
        </Space>
        <Table
          rowKey="id"
          loading={loadingOptions}
          dataSource={options}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Space>
    </Card>
  );
};
