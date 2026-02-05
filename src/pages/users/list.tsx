import { useState } from "react";
import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useCustom, useCustomMutation, useInvalidate } from "@refinedev/core";
import { Space, Table, Tag, Button, Tabs, message } from "antd";
import type { BaseRecord } from "@refinedev/core";
import { API_URL } from "../../providers/constants";

type UserRecord = BaseRecord & {
  email: string;
  fullName: string;
  houseNo?: string;
  streetNo?: string;
  subSector?: { id: number; name: string; code: string };
  subSectorId?: number;
  approvalStatus: string;
  role: string;
  createdAt: string;
};

export const UserList = () => {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const invalidate = useInvalidate();

  const { tableProps: allTableProps } = useTable({
    resource: "users",
    syncWithLocation: false,
    queryOptions: { enabled: activeTab === "all" },
  });

  const { result: pendingResult, query: pendingQuery } = useCustom<{
    data: UserRecord[];
  }>({
    url: `${API_URL}/users/pending`,
    method: "get",
    queryOptions: { enabled: activeTab === "pending" },
  });
  const pendingData = pendingResult?.data;
  const pendingLoading = pendingQuery?.isLoading;

  const approveMutation = useCustomMutation();
  const rejectMutation = useCustomMutation();

  const handleApprove = (id: number) => {
    approveMutation.mutate(
      {
        url: `${API_URL}/users/${id}/approve`,
        method: "patch",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("User approved");
          invalidate({ resource: "users", invalidates: ["list"] });
        },
        onError: (err: any) => {
          message.error(err?.message ?? "Failed to approve");
        },
      }
    );
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(
      {
        url: `${API_URL}/users/${id}/reject`,
        method: "patch",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("User rejected");
          invalidate({ resource: "users", invalidates: ["list"] });
        },
        onError: (err: any) => {
          message.error(err?.message ?? "Failed to reject");
        },
      }
    );
  };

  const pendingList = Array.isArray(pendingData) ? pendingData : [];
  const allTablePropsResolved =
    activeTab === "all"
      ? allTableProps
      : { dataSource: pendingList, total: pendingList.length, loading: pendingLoading };

  return (
    <List>
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as "all" | "pending")}
        items={[
          { key: "all", label: "All users" },
          { key: "pending", label: "Pending approval" },
        ]}
      />
      <Table {...allTablePropsResolved} rowKey="id" style={{ marginTop: 16 }}>
        <Table.Column dataIndex="id" title="ID" width={70} />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="fullName" title="Full name" />
        <Table.Column dataIndex="houseNo" title="House no" width={90} />
        <Table.Column dataIndex="streetNo" title="Street no" width={90} />
        <Table.Column
          dataIndex={["subSector", "name"]}
          title="Sub-sector"
          width={110}
          render={(_, record: UserRecord) => record?.subSector?.name ?? record?.subSectorId ?? "-"}
        />
        <Table.Column
          dataIndex="approvalStatus"
          title="Status"
          render={(value: string) => (
            <Tag color={value === "approved" ? "green" : value === "rejected" ? "red" : "orange"}>
              {value}
            </Tag>
          )}
        />
        <Table.Column dataIndex="role" title="Role" width={80} />
        <Table.Column
          dataIndex={["createdAt"]}
          title="Created"
          render={(value: string) => <DateField value={value} />}
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          fixed="right"
          width={220}
          render={(_, record: UserRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              {(record.approvalStatus as string) === "pending" && (
                <>
                  <Button
                    type="link"
                    size="small"
                    color="green"
                    onClick={() => handleApprove(record.id as number)}
                    loading={
                      approveMutation.mutation.isPending &&
                      approveMutation.mutation.variables?.url === `${API_URL}/users/${record.id}/approve`
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => handleReject(record.id as number)}
                    loading={
                      rejectMutation.mutation.isPending &&
                      rejectMutation.mutation.variables?.url === `${API_URL}/users/${record.id}/reject`
                    }
                  >
                    Reject
                  </Button>
                </>
              )}
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
