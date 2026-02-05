import { useSearchParams } from "react-router";
import {
  DateField,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Table, Tag, Space, Typography } from "antd";
import type { BaseRecord } from "@refinedev/core";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  in_progress: "blue",
  done: "green",
};

export const RequestList = () => {
  const [searchParams] = useSearchParams();
  const filterUserId = searchParams.get("userId");
  const { tableProps } = useTable({
    resource: "requests",
    syncWithLocation: true,
  });

  const dataSource = filterUserId
    ? (tableProps.dataSource ?? []).filter(
        (r: BaseRecord) => String(r.userId) === filterUserId
      )
    : tableProps.dataSource;

  return (
    <List>
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
