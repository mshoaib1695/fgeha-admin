import { useState, useEffect } from "react";
import { Show, TextField, DateField } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import { Typography, Select, Button, Space, message } from "antd";
import { API_URL, TOKEN_KEY } from "../../providers/constants";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const RequestShow = () => {
  const { query } = useShow();
  const record = query?.data?.data;
  const [status, setStatus] = useState<string>("pending");
  const [updating, setUpdating] = useState(false);
  const invalidate = useInvalidate();

  useEffect(() => {
    if (record?.status) setStatus(record.status);
  }, [record?.id, record?.status]);

  const handleUpdateStatus = async () => {
    if (!record?.id) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/requests/${record.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to update status");
      }
      message.success("Status updated");
      invalidate({ resource: "requests", invalidates: ["detail", "list"] });
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Show isLoading={query?.isLoading}>
      <Title level={5}>ID</Title>
      <TextField value={record?.id} />
      <Title level={5}>Type</Title>
      <TextField value={record?.requestType?.name ?? record?.requestTypeId ?? "-"} />
      <Title level={5}>Description</Title>
      <TextField value={record?.description} />
      <Title level={5}>Status</Title>
      <Space>
        <Select
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          style={{ width: 140 }}
        />
        <Button
          type="primary"
          onClick={handleUpdateStatus}
          loading={updating}
        >
          Update status
        </Button>
      </Space>
      <Title level={5}>User</Title>
      <TextField value={record?.user?.email ?? record?.userId ?? "-"} />
      <Title level={5}>Created at</Title>
      <DateField value={record?.createdAt} />
      <Title level={5}>Updated at</Title>
      <DateField value={record?.updatedAt} />
    </Show>
  );
};
