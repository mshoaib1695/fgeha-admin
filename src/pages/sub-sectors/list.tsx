import {
  List,
  useTable,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { Table, Space } from "antd";

export const SubSectorList = () => {
  const { tableProps } = useTable({
    resource: "sub-sectors",
    syncWithLocation: true,
  });

  return (
    <List title="Sub-sectors" createButtonProps={{ children: "Add sub-sector" }}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" width={80} />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="code" title="Code" width={120} />
        <Table.Column dataIndex="displayOrder" title="Order" width={80} />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          width={120}
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
