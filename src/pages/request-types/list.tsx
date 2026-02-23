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
        <Table.Column dataIndex="displayOrder" title="Order" width={80} />
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
