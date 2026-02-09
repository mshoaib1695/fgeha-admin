import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  DateField,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Table, Tag, Space, Typography, Button, Modal, Form, Select, DatePicker, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { BaseRecord } from "@refinedev/core";
import * as XLSX from "xlsx";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  in_progress: "blue",
  done: "green",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

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
  const [form] = Form.useForm();

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

      const sheetData = rows.map((r: BaseRecord) => ({
        ID: r.id,
        "Applicant name": r?.user?.fullName ?? "-",
        "Request type": r?.requestType?.name ?? r?.requestTypeId ?? "-",
        Description: r?.description ?? "",
        Status: r?.status ?? "",
        "User email": r?.user?.email ?? r?.userId ?? "-",
        "House no": r?.houseNo ?? "",
        "Street no": r?.streetNo ?? "",
        "Created at": r?.createdAt ? new Date(r.createdAt as string).toLocaleString() : "",
        "Updated at": r?.updatedAt ? new Date(r.updatedAt as string).toLocaleString() : "",
      }));
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
          render={(value: string) => (value?.length > 60 ? `${value.slice(0, 60)}…` : value)}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: string) => (
            <Tag color={STATUS_COLORS[value] ?? "default"}>{value}</Tag>
          )}
        />
        <Table.Column
          dataIndex={["user", "email"]}
          title="User"
          render={(_, record: BaseRecord) => record?.user?.email ?? record?.userId ?? "-"}
        />
        <Table.Column
          dataIndex={["createdAt"]}
          title="Created"
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          fixed="right"
          width={80}
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
