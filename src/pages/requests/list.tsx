import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  DateField,
  EditButton,
  List,
  ShowButton,
  DeleteButton,
  useTable,
} from "@refinedev/antd";
import { useInvalidate, useList } from "@refinedev/core";
import { Table, Tag, Space, Typography, Button, Modal, Form, Select, DatePicker, message, Card } from "antd";
import { DownloadOutlined, FilterOutlined } from "@ant-design/icons";
import type { TableRowSelection } from "antd/es/table/interface";
import type { BaseRecord } from "@refinedev/core";
import type { CrudFilter } from "@refinedev/core";
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
  requestTypeOptionId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): string {
  const q = new URLSearchParams();
  if (params.requestTypeId != null) q.set("requestTypeId", String(params.requestTypeId));
  if (params.requestTypeOptionId != null) q.set("requestTypeOptionId", String(params.requestTypeOptionId));
  if (params.status) q.set("status", params.status);
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const RequestList = () => {
  const [searchParams] = useSearchParams();
  const filterUserId = searchParams.get("userId");
  const { tableProps, setFilters } = useTable({
    resource: "requests",
    syncWithLocation: true,
  });
  const { result: requestTypesResult } = useList({
    resource: "request-types",
    sorters: [{ field: "displayOrder", order: "asc" }],
  });
  const { result: serviceOptionsResult } = useList({
    resource: "request-type-options",
    pagination: { mode: "off" },
    sorters: [{ field: "displayOrder", order: "asc" }],
  });
  const { result: subSectorsResult } = useList({
    resource: "sub-sectors",
    sorters: [{ field: "name", order: "asc" }],
  });
  const requestTypes = (requestTypesResult?.data ?? []) as BaseRecord[];
  const serviceOptions = (serviceOptionsResult?.data ?? []) as BaseRecord[];
  /** Only form-type options for filter and export dropdowns (requests are created from form options). */
  const formServiceOptions = serviceOptions.filter(
    (o: BaseRecord) => String((o as { optionType?: string }).optionType ?? "").toLowerCase() === "form",
  );
  const serviceOptionLabelById = new Map<number, string>(
    serviceOptions
      .map((o) => [Number(o.id), String(o.label ?? "").trim()] as const)
      .filter(([id, label]) => !Number.isNaN(id) && !!label),
  );
  const subSectors = (subSectorsResult?.data ?? []) as BaseRecord[];
  const subSectorNameById = new Map<number, string>(
    subSectors
      .map((s) => [Number(s.id), String(s.name ?? "").trim()] as const)
      .filter(([id, name]) => !Number.isNaN(id) && !!name),
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [selectedServiceOptionId, setSelectedServiceOptionId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [form] = Form.useForm();
  const invalidate = useInvalidate();

  const applyFilters = (optionId: number | null, status: string | null) => {
    const filters: CrudFilter[] = [];
    if (optionId != null) filters.push({ field: "requestTypeOptionId", operator: "eq", value: optionId });
    if (status) filters.push({ field: "status", operator: "eq", value: status });
    setFilters(filters, "replace");
  };

  const dataSource = (tableProps.dataSource ?? []).filter((r: BaseRecord) => {
    if (filterUserId && String(r.userId) !== filterUserId) return false;
    return true;
  });

  const handleExport = async () => {
    const values = await form.validateFields().catch(() => null);
    if (values == null) return;
    const requestTypeId = values.requestType as number | undefined;
    const requestTypeOptionId = values.requestTypeOption as number | undefined;
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
        requestTypeOptionId: requestTypeOptionId ?? undefined,
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
        const subSectorId = Number(r?.subSectorId);
        const subSectorName = subSectorNameById.get(subSectorId);
        return {
          "S.No": index + 1,
          "Request Id": r?.requestNumber ?? "",
          "Request Time": r?.createdAt ? new Date(r.createdAt as string).toLocaleString() : "",
          "Service Option": serviceOptionLabelById.get(Number(r?.requestTypeOptionId)) ?? "-",
          Name: r?.user?.fullName ?? "-",
          "Mobile No": mobile || "-",
          "H. No": r?.houseNo ?? "",
          "S. No": r?.streetNo ?? "",
          "Sub-Sec": subSectorName ?? (r?.subSectorId ?? ""),
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

  const rowSelection: TableRowSelection<BaseRecord> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  const handleBulkStatusChange = async (newStatus: string, keysToUpdate: React.Key[]) => {
    if (keysToUpdate.length === 0) return;
    const token = localStorage.getItem(TOKEN_KEY);
    const vToken = getVToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(vToken ? { "X-V": vToken } : {}),
    };
    setBulkUpdating(true);
    let ok = 0;
    let errCount = 0;
    for (const key of keysToUpdate) {
      const id = typeof key === "string" ? parseInt(key, 10) : Number(key);
      if (!Number.isFinite(id)) continue;
      try {
        const res = await fetch(`${API_URL}/requests/${id}/status`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) ok += 1;
        else errCount += 1;
      } catch {
        errCount += 1;
      }
    }
    setBulkUpdating(false);
    setSelectedRowKeys([]);
    setBulkTargetStatus(null);
    invalidate({ resource: "requests", invalidates: ["list", "detail"] });
    if (errCount === 0) message.success(`Status updated for ${ok} request(s).`);
    else message.warning(`Updated ${ok} request(s); ${errCount} failed.`);
  };

  const handleBulkStatusConfirm = () => {
    if (!bulkTargetStatus) {
      message.warning("Please select a status first.");
      return;
    }
    if (selectedRowKeys.length === 0) {
      message.warning("No requests selected.");
      return;
    }
    const keysToUpdate = [...selectedRowKeys];
    const label = STATUS_LABELS[bulkTargetStatus] ?? bulkTargetStatus;
    Modal.confirm({
      title: "Confirm bulk update",
      content: `Update ${keysToUpdate.length} request(s) to "${label}"?`,
      okText: "Update",
      cancelText: "Cancel",
      onOk: () => handleBulkStatusChange(bulkTargetStatus, keysToUpdate),
    });
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
          <Form.Item name="requestTypeOption" label="Service option">
            <Select
              allowClear
              placeholder="All service options (form)"
              options={formServiceOptions.map((o) => ({
                value: o.id,
                label: o.label ?? `Option #${o.id}`,
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
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Filtered by user ID: {filterUserId}
        </Typography.Text>
      )}

      <Card size="small" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 24px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginRight: 8 }}>
            <FilterOutlined />
            Filters
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Text type="secondary" style={{ whiteSpace: "nowrap" }}>Service option</Typography.Text>
            <Select
              allowClear
              placeholder="All options (form)"
              value={selectedServiceOptionId ?? undefined}
              style={{ width: 220 }}
              options={formServiceOptions.map((o) => ({
                value: Number(o.id),
                label: String(o.label ?? `Option #${o.id}`),
              }))}
              onChange={(v) => {
                const optionId = v == null ? null : Number(v);
                setSelectedServiceOptionId(optionId);
                applyFilters(optionId, selectedStatus);
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Text type="secondary" style={{ whiteSpace: "nowrap" }}>Status</Typography.Text>
            <Select
              allowClear
              placeholder="All statuses"
              value={selectedStatus ?? undefined}
              style={{ width: 130 }}
              options={STATUS_OPTIONS}
              onChange={(v) => {
                const status = v == null ? null : String(v);
                setSelectedStatus(status);
                applyFilters(selectedServiceOptionId, status);
              }}
            />
          </div>
        </div>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card
          size="small"
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            background: "var(--ant-color-primary-bg)",
            borderColor: "var(--ant-color-primary-border)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 20px" }}>
            <Typography.Text strong style={{ marginRight: 4 }}>
              {selectedRowKeys.length} selected
            </Typography.Text>
            <Select
              size="small"
              placeholder="New status…"
              value={bulkTargetStatus}
              onChange={(v) => setBulkTargetStatus(v ?? null)}
              style={{ width: 140 }}
              options={STATUS_OPTIONS}
              disabled={bulkUpdating}
            />
            <Button
              type="primary"
              size="small"
              loading={bulkUpdating}
              disabled={!bulkTargetStatus || bulkUpdating}
              onClick={handleBulkStatusConfirm}
            >
              Update status
            </Button>
          </div>
        </Card>
      )}

      <Table
        {...tableProps}
        dataSource={dataSource}
        rowKey="id"
        rowSelection={rowSelection}
        scroll={{ x: 1480 }}
      >
        <Table.Column dataIndex="id" title="ID" width={70} responsive={["md"]} />
        <Table.Column dataIndex="requestNumber" title="Request no" width={130} />
        <Table.Column
          title="Applicant"
          width={180}
          responsive={["md"]}
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
          width={150}
          render={(_, record: BaseRecord) =>
            record?.requestType?.name ?? record?.requestTypeId ?? "-"
          }
        />
        <Table.Column
          dataIndex={["requestTypeOption", "label"]}
          title="Service option"
          width={170}
          render={(_, record: BaseRecord) =>
            record?.requestTypeOption?.label ??
            serviceOptionLabelById.get(Number(record?.requestTypeOptionId)) ??
            "-"
          }
        />
        <Table.Column dataIndex="houseNo" title="House no" width={110} responsive={["md"]} />
        <Table.Column dataIndex="streetNo" title="Street no" width={110} responsive={["md"]} />
        <Table.Column
          dataIndex="subSectorId"
          title="Sub-sector"
          width={140}
          responsive={["md"]}
          render={(value: unknown) => {
            const id = Number(value);
            return subSectorNameById.get(id) ?? value ?? "-";
          }}
        />
        <Table.Column
          dataIndex="status"
          title="Status"
          width={120}
          render={(value: string) => (
            <Tag color={STATUS_COLORS[value] ?? "default"}>
              {STATUS_LABELS[value] ?? value}
            </Tag>
          )}
        />
        <Table.Column
          title="Customer cancel reason"
          width={200}
          responsive={["lg"]}
          ellipsis={{ showTitle: true }}
          render={(_, record: BaseRecord) => {
            if (record?.status !== "cancelled" || !record?.customerCancellationReason) return "—";
            return record.customerCancellationReason;
          }}
        />
        <Table.Column
          dataIndex={["createdAt"]}
          title="Created"
          width={160}
          responsive={["lg"]}
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column
          dataIndex="description"
          title="Description"
          ellipsis
          width={260}
          responsive={["lg"]}
          render={(value: string) => (value?.length > 100 ? `${value.slice(0, 100)}…` : value)}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          fixed="right"
          width={310}
          render={(_, record: BaseRecord) => (
            <Space wrap>
              <Select
                size="small"
                value={record?.status === "done" ? "completed" : record?.status}
                options={STATUS_OPTIONS}
                style={{ width: 130 }}
                loading={updatingStatusId === Number(record.id)}
                disabled={updatingStatusId === Number(record.id)}
                onChange={(next) => {
                  if (next !== record?.status) {
                    handleInlineStatusUpdate(Number(record.id), next);
                  }
                }}
              />
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
