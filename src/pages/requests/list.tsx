import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  DateField,
  List,
  ShowButton,
  DeleteButton,
  useTable,
} from "@refinedev/antd";
import { useInvalidate, useList } from "@refinedev/core";
import { Table, Tag, Space, Typography, Button, Modal, Form, Select, DatePicker, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { BaseRecord } from "@refinedev/core";
import * as XLSX from "xlsx";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  cancelled: "red",
  in_progress: "blue",
  completed: "green",
  done: "green",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancel" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  cancelled: "Cancel",
  in_progress: "In progress",
  completed: "Completed",
  done: "Completed",
};

function buildQuery(params: {
  requestTypeId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): string {
  const q = new URLSearchParams();
  if (params.requestTypeId != null) q.set("requestTypeId", String(params.requestTypeId));
  if (params.status) q.set("status", params.status);
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const RequestList = () => {
  const [searchParams] = useSearchParams();
  const filterUserId = searchParams.get("userId");
  const { tableProps } = useTable({
    resource: "requests",
    syncWithLocation: true,
  });
  const { result: requestTypesResult } = useList({
    resource: "request-types",
    sorters: [{ field: "displayOrder", order: "asc" }],
  });
  const requestTypes = (requestTypesResult?.data ?? []) as BaseRecord[];
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const invalidate = useInvalidate();

  const dataSource = filterUserId
    ? (tableProps.dataSource ?? []).filter(
        (r: BaseRecord) => String(r.userId) === filterUserId
      )
    : tableProps.dataSource;

  const handleExport = async () => {
    const values = await form.validateFields().catch(() => null);
    if (values == null) return;
    const requestTypeId = values.requestType as number | undefined;
    const status = values.status as string | undefined;
    const dateRange = values.dateRange as Array<{ format: (s: string) => string }> | undefined;
    const dateFrom = dateRange?.[0]?.format("YYYY-MM-DD");
    const dateTo = dateRange?.[1]?.format("YYYY-MM-DD");

    setExporting(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const vToken = getVToken();
      const query = buildQuery({
        requestTypeId: requestTypeId ?? undefined,
        status: status ?? undefined,
        dateFrom,
        dateTo,
      });
      const res = await fetch(`${API_URL}/requests${query}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(vToken ? { "X-V": vToken } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = (await res.json()) as BaseRecord[];
      const rows = Array.isArray(data) ? data : [];

      const sheetData = rows.map((r: BaseRecord, index: number) => {
        const phoneCode = String(r?.user?.phoneCountryCode ?? "").trim();
        const phoneNumber = String(r?.user?.phoneNumber ?? "").trim();
        const mobile = `${phoneCode}${phoneCode && phoneNumber ? " " : ""}${phoneNumber}`.trim();
        return {
          "S.No": index + 1,
          "Request Id": r?.requestNumber ?? "",
          "Request Time": r?.createdAt ? new Date(r.createdAt as string).toLocaleString() : "",
          Name: r?.user?.fullName ?? "-",
          "Mobile No": mobile || "-",
          "H. No": r?.houseNo ?? "",
          "S. No": r?.streetNo ?? "",
          "Sub-Sec": r?.subSectorId ?? "",
        };
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Requests");
      const filename = `requests_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      message.success(`Exported ${rows.length} request(s) to ${filename}`);
      setExportModalOpen(false);
      form.resetFields();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleInlineStatusUpdate = async (requestId: number, status: string) => {
    setUpdatingStatusId(requestId);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const vToken = getVToken();
      const res = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(vToken ? { "X-V": vToken } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Failed to update status");
      }
      message.success("Status updated");
      invalidate({ resource: "requests", invalidates: ["list", "detail"] });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => setExportModalOpen(true)}
          >
            Download Excel
          </Button>
        </>
      )}
    >
      <Modal
        title="Export requests to Excel"
        open={exportModalOpen}
        onCancel={() => {
          setExportModalOpen(false);
          form.resetFields();
        }}
        onOk={handleExport}
        confirmLoading={exporting}
        okText="Download"
        destroyOnClose
        width={420}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="requestType" label="Request type">
            <Select
              allowClear
              placeholder="All types"
              options={requestTypes.map((t) => ({
                value: t.id,
                label: t.name ?? `Type #${t.id}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              allowClear
              placeholder="All statuses"
              options={STATUS_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="Date range">
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
      {filterUserId && (
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Filtered by user ID: {filterUserId}
        </Typography.Text>
      )}
      <Table {...tableProps} dataSource={dataSource} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={70} />
        <Table.Column dataIndex="requestNumber" title="Request no" width={130} />
        <Table.Column
          title="Applicant"
          width={180}
          render={(_, record: BaseRecord) => (
            <>
              <div>{record?.user?.fullName ?? "-"}</div>
              <Typography.Text type="secondary">
                {record?.user?.email ?? "-"}
              </Typography.Text>
            </>
          )}
        />
        <Table.Column
          dataIndex={["requestType", "name"]}
          title="Type"
          render={(_, record: BaseRecord) =>
            record?.requestType?.name ?? record?.requestTypeId ?? "-"
          }
        />
        <Table.Column
          dataIndex="description"
          title="Description"
          ellipsis
          width={260}
          render={(value: string) => (value?.length > 100 ? `${value.slice(0, 100)}…` : value)}
        />
        <Table.Column dataIndex="houseNo" title="House no" width={110} />
        <Table.Column dataIndex="streetNo" title="Street no" width={110} />
        <Table.Column dataIndex="subSectorId" title="Sub-sector" width={100} />
        <Table.Column
          dataIndex="status"
          title="Status"
          width={190}
          render={(value: string, record: BaseRecord) => (
            <Space>
              <Tag color={STATUS_COLORS[value] ?? "default"}>{STATUS_LABELS[value] ?? value}</Tag>
              <Select
                value={value === "done" ? "completed" : value}
                options={STATUS_OPTIONS}
                style={{ width: 130 }}
                loading={updatingStatusId === Number(record.id)}
                disabled={updatingStatusId === Number(record.id)}
                onChange={(next) => {
                  if (next !== value) {
                    handleInlineStatusUpdate(Number(record.id), next);
                  }
                }}
              />
            </Space>
          )}
        />
        <Table.Column
          dataIndex={["createdAt"]}
          title="Created"
          width={160}
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          fixed="right"
          width={120}
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
