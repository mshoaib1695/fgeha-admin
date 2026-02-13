import {
  List,
  useTable,
  EditButton,
  DeleteButton,
  ShowButton,
} from "@refinedev/antd";
import { Table, Space } from "antd";

export const RequestTypeList = () => {
  const { tableProps } = useTable({
    resource: "request-types",
    syncWithLocation: true,
  });

  return (
    <List title="Request types" createButtonProps={{ children: "Create type" }}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={70} />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="slug" title="Slug" />
        <Table.Column
          dataIndex="requestNumberPrefix"
          title="Request ID prefix"
          width={150}
          render={(v: string | null) => (v && v.trim() ? v : "Auto")}
        />
        <Table.Column dataIndex="displayOrder" title="Order" width={80} />
        <Table.Column
          title="Open window"
          key="restriction"
          width={220}
          render={(_, record: { restrictionStartTime?: string; restrictionEndTime?: string; restrictionDays?: string }) => {
            if (!record.restrictionStartTime || !record.restrictionEndTime || !record.restrictionDays)
              return "Any time";
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const days = record.restrictionDays
              .split(",")
              .map((d) => dayNames[parseInt(d.trim(), 10)])
              .filter(Boolean)
              .join(", ");
            return `${record.restrictionStartTime}–${record.restrictionEndTime} (${days})`;
          }}
        />
        <Table.Column
          title="Duplicate limit"
          dataIndex="duplicateRestrictionPeriod"
          width={120}
          render={(v: string) => (v && v !== "none" ? `1 per calendar ${v}` : "—")}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          width={150}
          render={(_, record: { id: number }) => (
            <Space>
              <EditButton size="small" recordItemId={record.id} />
              <DeleteButton size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
