import { useCustom } from "@refinedev/core";
import { Card, Row, Col, Statistic, Table, Typography } from "antd";
import { API_URL } from "../../providers/constants";

interface StatsByType {
  requestTypeId: number;
  name: string;
  slug: string;
  count: number;
}

interface StatsResponse {
  total: number;
  byType: StatsByType[];
}

export const DashboardPage = () => {
  const { result, query } = useCustom<StatsResponse>({
    url: `${API_URL}/requests/stats/summary`,
    method: "get",
  });

  const data = result?.data as StatsResponse | undefined;
  const total = data?.total ?? 0;
  const byType = data?.byType ?? [];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Request overview</Typography.Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total requests"
              value={total}
              loading={query?.isLoading}
            />
          </Card>
        </Col>
      </Row>
      <Card title="Requests by type" loading={query?.isLoading}>
        <Table
          dataSource={byType}
          rowKey="requestTypeId"
          pagination={false}
          columns={[
            { dataIndex: "name", title: "Type" },
            { dataIndex: "slug", title: "Slug" },
            {
              dataIndex: "count",
              title: "Count",
              render: (count: number) => <strong>{count}</strong>,
            },
          ]}
        />
      </Card>
    </div>
  );
};
