import { useCustom } from "@refinedev/core";
import { Card, Table, Typography, Button } from "antd";
import { useNavigate } from "react-router";
import { API_URL } from "../../providers/constants";

interface UserWithRequestCount {
  id: number;
  email: string;
  fullName: string;
  requestCount: number;
}

export const UsersWithRequestsPage = () => {
  const navigate = useNavigate();
  const { result, query } = useCustom<UserWithRequestCount[]>({
    url: `${API_URL}/users/with-request-count`,
    method: "get",
  });

  const data = Array.isArray(result?.data) ? result.data : [];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Users and their requests</Typography.Title>
      <Card loading={query?.isLoading}>
        <Table
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            { dataIndex: "id", title: "ID", width: 70 },
            { dataIndex: "fullName", title: "Full name" },
            { dataIndex: "email", title: "Email" },
            {
              dataIndex: "requestCount",
              title: "Request count",
              render: (count: number, record: UserWithRequestCount) => (
                <Button
                  type="link"
                  onClick={() => navigate(`/requests?userId=${record.id}`)}
                >
                  {count} request{count !== 1 ? "s" : ""}
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
