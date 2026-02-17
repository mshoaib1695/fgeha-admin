import { useMemo, type CSSProperties } from "react";
import { useCustom } from "@refinedev/core";
import {
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  theme,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  ProfileOutlined,
  TagsOutlined,
} from "@ant-design/icons";
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

interface DailyStatsPoint {
  date: string;
  count: number;
}

export const DashboardPage = () => {
  const { token } = theme.useToken();
  const { result, query } = useCustom<StatsResponse>({
    url: `${API_URL}/requests/stats/summary`,
    method: "get",
  });
  const { result: dailyResult, query: dailyQuery } = useCustom<DailyStatsPoint[]>({
    url: `${API_URL}/requests/stats/daily?days=14`,
    method: "get",
  });

  const data = result?.data as StatsResponse | undefined;
  const total = data?.total ?? 0;
  const byType = data?.byType ?? [];
  const sortedByCount = useMemo(
    () => [...byType].sort((a, b) => b.count - a.count),
    [byType],
  );
  const topType = sortedByCount[0];
  const bottomType = sortedByCount[sortedByCount.length - 1];
  const avgPerType = byType.length ? Number((total / byType.length).toFixed(1)) : 0;
  const topTypeShare =
    total > 0 && topType ? Number(((topType.count / total) * 100).toFixed(1)) : 0;
  const totalByType = sortedByCount.reduce((acc, item) => acc + item.count, 0);
  const chartData = sortedByCount.map((item) => {
    const percent = totalByType > 0 ? (item.count / totalByType) * 100 : 0;
    return {
      ...item,
      percent,
    };
  });
  const dailyPayload = dailyResult?.data as
    | DailyStatsPoint[]
    | { data?: DailyStatsPoint[] }
    | undefined;
  const dailyData = Array.isArray(dailyPayload)
    ? dailyPayload
    : Array.isArray(dailyPayload?.data)
      ? dailyPayload.data
      : [];
  const maxDaily = Math.max(1, ...dailyData.map((item) => item.count));
  const avgDaily = dailyData.length
    ? Number(
        (
          dailyData.reduce((acc, item) => acc + item.count, 0) / dailyData.length
        ).toFixed(1),
      )
    : 0;
  const peakDay = dailyData.reduce<DailyStatsPoint | null>(
    (acc, item) => (acc == null || item.count > acc.count ? item : acc),
    null,
  );
  const cardStyle: CSSProperties = {
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowTertiary,
    borderRadius: 12,
    background: token.colorBgContainer,
  };

  return (
    <div style={{ padding: 24, background: token.colorBgLayout, minHeight: "100%" }}>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 16, gap: 12, flexWrap: "wrap" }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Request overview
        </Typography.Title>
        <Tag
          color="default"
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            background: token.colorFillTertiary,
            color: token.colorTextSecondary,
            borderColor: token.colorBorderSecondary,
          }}
        >
          Live summary
        </Tag>
      </Flex>

      <Typography.Paragraph
        type="secondary"
        style={{ marginTop: 0, marginBottom: 24 }}
      >
        Quick health check of request volume and distribution by request type.
      </Typography.Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Statistic
              title="Total requests"
              value={total}
              loading={query?.isLoading}
              prefix={<ProfileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Statistic
              title="Request types"
              value={byType.length}
              loading={query?.isLoading}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Statistic
              title="Average per type"
              value={avgPerType}
              loading={query?.isLoading}
              suffix="Req"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Statistic
              title="Top type share"
              value={topTypeShare}
              precision={1}
              suffix="%"
              loading={query?.isLoading}
              valueStyle={{
                color: topTypeShare > 40 ? token.colorPrimary : token.colorSuccess,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle}>
            <Statistic
              title="Daily average (14d)"
              value={avgDaily}
              loading={dailyQuery?.isLoading}
              prefix={<CalendarOutlined />}
              suffix="Req"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Requests per day (last 14 days)"
        style={{ ...cardStyle, marginBottom: 16 }}
        loading={dailyQuery?.isLoading}
      >
        {!dailyData.length ? (
          <Empty description="No daily request data yet" />
        ) : (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Flex
              align="end"
              justify="space-between"
              gap={8}
              style={{ minHeight: 180, width: "100%" }}
            >
              {dailyData.map((item) => {
                const height = Math.max(10, Math.round((item.count / maxDaily) * 140));
                const dateLabel = new Date(item.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={item.date}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <Typography.Text style={{ fontSize: 12 }}>
                      {item.count}
                    </Typography.Text>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 26,
                        height,
                        borderRadius: 8,
                        background: `linear-gradient(180deg, ${token.colorPrimaryBg} 0%, ${token.colorPrimary} 100%)`,
                        opacity: 0.9,
                      }}
                    />
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11, whiteSpace: "nowrap" }}
                    >
                      {dateLabel}
                    </Typography.Text>
                  </div>
                );
              })}
            </Flex>
            {peakDay ? (
              <Typography.Text type="secondary">
                Peak day:{" "}
                <Typography.Text strong>
                  {new Date(peakDay.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Typography.Text>{" "}
                with <Typography.Text strong>{peakDay.count}</Typography.Text> requests.
              </Typography.Text>
            ) : null}
          </Space>
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
        <Col xs={24} xl={16}>
          <Card
            title="Requests by type distribution"
            style={cardStyle}
            loading={query?.isLoading}
          >
            {!chartData.length ? (
              <Empty description="No request data yet" />
            ) : (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {chartData.map((item) => (
                  <div key={item.requestTypeId}>
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{ marginBottom: 6 }}
                    >
                      <Typography.Text>{item.name}</Typography.Text>
                      <Typography.Text strong>{item.count}</Typography.Text>
                    </Flex>
                    <Progress
                      percent={Number(item.percent.toFixed(1))}
                      showInfo={false}
                      strokeColor={{
                        "0%": token.colorPrimaryBg,
                        "100%": token.colorPrimary,
                      }}
                    />
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card
            title="Top performer"
            style={cardStyle}
            loading={query?.isLoading}
          >
            {topType ? (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <div style={{ display: "grid", placeItems: "center" }}>
                  <Progress
                    type="circle"
                    percent={Math.min(100, Math.round(topTypeShare))}
                    format={() => `${topTypeShare}%`}
                    strokeColor={token.colorPrimary}
                  />
                </div>
                <Divider style={{ margin: "6px 0" }} />
                <Typography.Text strong>{topType.name}</Typography.Text>
                <Typography.Text type="secondary">
                  {topType.count} requests
                </Typography.Text>
                <Typography.Text type="secondary">
                  This type carries the largest share of the workload.
                </Typography.Text>
              </Space>
            ) : (
              <Empty description="No top type yet" />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="Requests by type"
        style={cardStyle}
        loading={query?.isLoading}
      >
        <Table
          dataSource={sortedByCount}
          rowKey="requestTypeId"
          pagination={false}
          columns={[
            {
              dataIndex: "name",
              title: "Type",
              render: (name: string, record: StatsByType) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{name}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {record.slug}
                  </Typography.Text>
                </Space>
              ),
            },
            { dataIndex: "slug", title: "Slug" },
            {
              dataIndex: "count",
              title: "Count",
              sorter: (a: StatsByType, b: StatsByType) => a.count - b.count,
              defaultSortOrder: "descend",
              render: (count: number, record: StatsByType) => {
                if (!topType || !bottomType) return <strong>{count}</strong>;
                if (record.requestTypeId === topType.requestTypeId) {
                  return (
                    <Tag icon={<ArrowUpOutlined />} color="blue">
                      {count}
                    </Tag>
                  );
                }
                if (record.requestTypeId === bottomType.requestTypeId) {
                  return (
                    <Tag icon={<ArrowDownOutlined />} color="default">
                      {count}
                    </Tag>
                  );
                }
                return <strong>{count}</strong>;
              },
            },
          ]}
        />
      </Card>

      <Divider style={{ margin: "24px 0 16px 0" }} />
      <Card style={cardStyle}>
        <Flex justify="space-between" align="center" gap={12} wrap="wrap">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Reports
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: "6px 0 0 0" }}>
              Open full analytics and export-ready reports from the dedicated page.
            </Typography.Paragraph>
          </div>
          <a href="/reports">
            <Tag color="processing" style={{ cursor: "pointer" }}>
              Open Reports
            </Tag>
          </a>
        </Flex>
      </Card>
    </div>
  );
};
