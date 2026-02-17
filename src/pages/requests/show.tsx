import { useState, useEffect } from "react";
import { Show, TextField, DateField } from "@refinedev/antd";
import { useShow, useInvalidate } from "@refinedev/core";
import { Typography, Select, Button, Space, message, Image, Card, Col, Descriptions, Row } from "antd";
import { API_URL, TOKEN_KEY } from "../../providers/constants";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancel" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const RequestShow = () => {
  const { query } = useShow();
  const record = query?.data?.data;
  const [status, setStatus] = useState<string>("pending");
  const [updating, setUpdating] = useState(false);
  const invalidate = useInvalidate();

  useEffect(() => {
    if (record?.status) setStatus(record.status === "done" ? "completed" : record.status);
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

  const issueImageUrl = record?.issueImageUrl
    ? String(record.issueImageUrl).startsWith("http")
      ? String(record.issueImageUrl)
      : `${API_URL.replace(/\/$/, "")}${String(record.issueImageUrl).startsWith("/") ? "" : "/"}${String(record.issueImageUrl)}`
    : null;

  return (
    <Show isLoading={query?.isLoading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card size="small" title="Request information">
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size="small"
              items={[
                { key: "id", label: "ID", children: <TextField value={record?.id} /> },
                {
                  key: "requestNumber",
                  label: "Request no",
                  children: <TextField value={record?.requestNumber ?? "-"} />,
                },
                {
                  key: "type",
                  label: "Type",
                  children: <TextField value={record?.requestType?.name ?? record?.requestTypeId ?? "-"} />,
                },
                {
                  key: "serviceOption",
                  label: "Service option",
                  children: <TextField value={record?.requestTypeOption?.label ?? "-"} />,
                },
                { key: "houseNo", label: "House no", children: <TextField value={record?.houseNo ?? "-"} /> },
                { key: "streetNo", label: "Street no", children: <TextField value={record?.streetNo ?? "-"} /> },
                { key: "subSector", label: "Sub-sector", children: <TextField value={record?.subSectorId ?? "-"} /> },
                {
                  key: "description",
                  label: "Description",
                  children: <Typography.Paragraph style={{ marginBottom: 0 }}>{record?.description ?? "-"}</Typography.Paragraph>,
                  span: 2,
                },
              ]}
            />
          </Card>
          <Card size="small" title="Applicant information" style={{ marginTop: 16 }}>
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              size="small"
              items={[
                { key: "fullName", label: "Full name", children: <TextField value={record?.user?.fullName ?? "-"} /> },
                { key: "email", label: "Email", children: <TextField value={record?.user?.email ?? record?.userId ?? "-"} /> },
                { key: "phone", label: "Phone", children: <TextField value={`${record?.user?.phoneCountryCode ?? ""} ${record?.user?.phoneNumber ?? ""}`.trim() || "-"} /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card size="small" title="Issue image">
            {issueImageUrl ? (
              <Image src={issueImageUrl} alt="Issue image" style={{ width: "100%", borderRadius: 8 }} />
            ) : (
              <TextField value="-" />
            )}
          </Card>
          <Card size="small" title="Status and timeline" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space>
                <Select
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS}
                  style={{ width: 160 }}
                />
                <Button
                  type="primary"
                  onClick={handleUpdateStatus}
                  loading={updating}
                >
                  Update
                </Button>
              </Space>
              <div>
                <Title level={5} style={{ marginBottom: 4 }}>Created at</Title>
                <DateField value={record?.createdAt} />
              </div>
              <div>
                <Title level={5} style={{ marginBottom: 4 }}>Updated at</Title>
                <DateField value={record?.updatedAt} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Show>
  );
};
