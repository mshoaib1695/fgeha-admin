import { useMemo, useState } from "react";
import { useCustom } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Flex,
  Row,
  Segmented,
  Space,
  Statistic,
  Tag,
  Table,
  Typography,
  message,
  theme,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { API_URL } from "../../providers/constants";

type ReportsPeriod = "today" | "week" | "month" | "custom";
type ReportKey =
  | "usersBySubSectorHouse"
  | "requestsPerHouseDateStatus"
  | "usersSummaryBySubSector"
  | "requestsSummaryBySubSector"
  | "tankerSummaryBySubSector";

const STATUS_COLOR: Record<string, string> = {
  pending: "orange",
  in_progress: "blue",
  completed: "green",
  done: "green",
  cancelled: "red",
};

type ReportsResponse = {
  filter: { period: ReportsPeriod; from: string; to: string };
  usersBySubSectorHouse: Array<{
    subSectorName: string;
    houseNo: string;
    userName: string;
    mobileNo: string;
    usersInHouse: number;
  }>;
  requestsPerHouseDateStatus: Array<{
    date: string;
    subSectorName: string;
    houseNo: string;
    streetNo: string;
    status: string;
    requestCount: number;
  }>;
  usersSummary: {
    totalUsers: number;
    bySubSector: Array<{ subSectorName: string; usersCount: number }>;
  };
  requestsSummary: {
    totalRequests: number;
    bySubSector: Array<{ subSectorName: string; requestsCount: number }>;
    byStatus: Array<{ status: string; requestsCount: number }>;
  };
  tankerSummary: {
    requested: number;
    delivered: number;
    pending: number;
    cancelled: number;
    bySubSector: Array<{
      subSectorName: string;
      requested: number;
      delivered: number;
      pending: number;
    }>;
  };
  insights?: {
    completionRate?: number;
    cancellationRate?: number;
    backlogCount?: number;
    avgResolutionHours?: number;
    requestsGrowthPercent?: number;
    usersGrowthPercent?: number;
    topSubSectorByRequests?: { subSectorName?: string } | null;
    topSubSectorByUsers?: { subSectorName?: string } | null;
  };
  analytics?: {
    dailyTrend?: Array<{ date: string; total: number; completed: number; pending: number }>;
    topRequestTypes?: Array<{ requestTypeName: string; requestTypeSlug: string; requestsCount: number }>;
    topServiceOptions?: Array<{ serviceOptionLabel: string; requestsCount: number }>;
    topHouses?: Array<{
      subSectorName: string;
      houseNo: string;
      streetNo: string;
      totalRequests: number;
      pendingRequests: number;
    }>;
    subSectorPerformance?: Array<{
      subSectorName: string;
      usersCount: number;
      requestsCount: number;
      completedCount: number;
      completionRate: number;
    }>;
    statusMixBySubSector?: Array<{
      subSectorName: string;
      totalRequests: number;
      pendingCount: number;
      inProgressCount: number;
      completedCount: number;
      cancelledCount: number;
      completionRate: number;
    }>;
    agingBuckets?: Array<{ bucket: string; count: number }>;
    repeatDemandHouses?: Array<{
      subSectorName: string;
      houseNo: string;
      streetNo: string;
      totalRequests: number;
    }>;
    hourlyDemand?: Array<{ hour: number; count: number }>;
  };
};

const EMPTY_REPORT: ReportsResponse = {
  filter: { period: "month", from: "", to: "" },
  usersBySubSectorHouse: [],
  requestsPerHouseDateStatus: [],
  usersSummary: { totalUsers: 0, bySubSector: [] },
  requestsSummary: { totalRequests: 0, bySubSector: [], byStatus: [] },
  tankerSummary: { requested: 0, delivered: 0, pending: 0, cancelled: 0, bySubSector: [] },
  insights: {
    completionRate: 0,
    cancellationRate: 0,
    backlogCount: 0,
    avgResolutionHours: 0,
    requestsGrowthPercent: 0,
    usersGrowthPercent: 0,
    topSubSectorByRequests: null,
    topSubSectorByUsers: null,
  },
  analytics: {
    dailyTrend: [],
    topRequestTypes: [],
    topServiceOptions: [],
    topHouses: [],
    subSectorPerformance: [],
    statusMixBySubSector: [],
    agingBuckets: [],
    repeatDemandHouses: [],
    hourlyDemand: [],
  },
};

function normalizeResponse(raw: unknown): ReportsResponse | undefined {
  const payload =
    raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)
      ? (raw as { data?: unknown }).data
      : raw;
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Partial<ReportsResponse>;
  return {
    filter:
      p.filter && typeof p.filter === "object"
        ? {
            period: (p.filter.period as ReportsPeriod) ?? "month",
            from: p.filter.from ?? "",
            to: p.filter.to ?? "",
          }
        : EMPTY_REPORT.filter,
    usersBySubSectorHouse: Array.isArray(p.usersBySubSectorHouse) ? p.usersBySubSectorHouse : [],
    requestsPerHouseDateStatus: Array.isArray(p.requestsPerHouseDateStatus)
      ? p.requestsPerHouseDateStatus
      : [],
    usersSummary: {
      totalUsers: p.usersSummary?.totalUsers ?? 0,
      bySubSector: Array.isArray(p.usersSummary?.bySubSector) ? p.usersSummary.bySubSector : [],
    },
    requestsSummary: {
      totalRequests: p.requestsSummary?.totalRequests ?? 0,
      bySubSector: Array.isArray(p.requestsSummary?.bySubSector) ? p.requestsSummary.bySubSector : [],
      byStatus: Array.isArray(p.requestsSummary?.byStatus) ? p.requestsSummary.byStatus : [],
    },
    tankerSummary: {
      requested: p.tankerSummary?.requested ?? 0,
      delivered: p.tankerSummary?.delivered ?? 0,
      pending: p.tankerSummary?.pending ?? 0,
      cancelled: p.tankerSummary?.cancelled ?? 0,
      bySubSector: Array.isArray(p.tankerSummary?.bySubSector) ? p.tankerSummary.bySubSector : [],
    },
    insights: {
      completionRate: p.insights?.completionRate ?? 0,
      cancellationRate: p.insights?.cancellationRate ?? 0,
      backlogCount: p.insights?.backlogCount ?? 0,
      avgResolutionHours: p.insights?.avgResolutionHours ?? 0,
      requestsGrowthPercent: p.insights?.requestsGrowthPercent ?? 0,
      usersGrowthPercent: p.insights?.usersGrowthPercent ?? 0,
      topSubSectorByRequests: p.insights?.topSubSectorByRequests ?? null,
      topSubSectorByUsers: p.insights?.topSubSectorByUsers ?? null,
    },
    analytics: {
      dailyTrend: Array.isArray(p.analytics?.dailyTrend) ? p.analytics.dailyTrend : [],
      topRequestTypes: Array.isArray(p.analytics?.topRequestTypes) ? p.analytics.topRequestTypes : [],
      topServiceOptions: Array.isArray(p.analytics?.topServiceOptions) ? p.analytics.topServiceOptions : [],
      topHouses: Array.isArray(p.analytics?.topHouses) ? p.analytics.topHouses : [],
      subSectorPerformance: Array.isArray(p.analytics?.subSectorPerformance) ? p.analytics.subSectorPerformance : [],
      statusMixBySubSector: Array.isArray(p.analytics?.statusMixBySubSector) ? p.analytics.statusMixBySubSector : [],
      agingBuckets: Array.isArray(p.analytics?.agingBuckets) ? p.analytics.agingBuckets : [],
      repeatDemandHouses: Array.isArray(p.analytics?.repeatDemandHouses) ? p.analytics.repeatDemandHouses : [],
      hourlyDemand: Array.isArray(p.analytics?.hourlyDemand) ? p.analytics.hourlyDemand : [],
    },
  };
}

type ReportsPanelProps = {
  showReportTableSection?: boolean;
  showAdvancedAnalyticsSection?: boolean;
};

export function ReportsPanel({
  showReportTableSection = true,
  showAdvancedAnalyticsSection = true,
}: ReportsPanelProps) {
  const { token } = theme.useToken();
  const [period, setPeriod] = useState<ReportsPeriod>("month");
  const [selectedReport, setSelectedReport] = useState<ReportKey>("usersBySubSectorHouse");
  const [customRange, setCustomRange] = useState<[string | null, string | null]>([null, null]);
  const [exporting, setExporting] = useState(false);
  const [from, to] = customRange;
  const canFetch = period !== "custom" || (!!from && !!to);

  const reportUrl = useMemo(() => {
    const q = new URLSearchParams();
    q.set("period", period);
    if (period === "custom" && from && to) {
      q.set("from", from);
      q.set("to", to);
    }
    return `${API_URL}/requests/stats/reports?${q.toString()}`;
  }, [period, from, to]);

  const { result, query } = useCustom<ReportsResponse>({
    url: reportUrl,
    method: "get",
    queryOptions: { enabled: canFetch },
  });
  const report = normalizeResponse(result?.data);

  const tableConfig = useMemo(() => {
    if (!report) return { dataSource: [] as Record<string, unknown>[], columns: [] as Record<string, unknown>[] };

    if (selectedReport === "usersBySubSectorHouse") {
      return {
        dataSource: report.usersBySubSectorHouse.map((r, i) => ({ key: i + 1, ...r })),
        columns: [
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "House", dataIndex: "houseNo" },
          { title: "Users in house", dataIndex: "usersInHouse" },
          { title: "Name", dataIndex: "userName" },
          { title: "Mobile", dataIndex: "mobileNo" },
        ],
      };
    }

    if (selectedReport === "requestsPerHouseDateStatus") {
      return {
        dataSource: report.requestsPerHouseDateStatus.map((r, i) => ({ key: i + 1, ...r })),
        columns: [
          { title: "Date", dataIndex: "date" },
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "House", dataIndex: "houseNo" },
          { title: "Street", dataIndex: "streetNo" },
          {
            title: "Status",
            dataIndex: "status",
            render: (status: string) => (
              <Tag color={STATUS_COLOR[status] ?? "default"}>
                {(status ?? "").replaceAll("_", " ").toUpperCase() || "N/A"}
              </Tag>
            ),
          },
          { title: "Count", dataIndex: "requestCount" },
        ],
      };
    }

    if (selectedReport === "usersSummaryBySubSector") {
      return {
        dataSource: report.usersSummary.bySubSector.map((r, i) => ({ key: i + 1, ...r })),
        columns: [
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "Users", dataIndex: "usersCount" },
        ],
      };
    }

    if (selectedReport === "requestsSummaryBySubSector") {
      return {
        dataSource: report.requestsSummary.bySubSector.map((r, i) => ({ key: i + 1, ...r })),
        columns: [
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "Requests", dataIndex: "requestsCount" },
        ],
      };
    }

    return {
      dataSource: report.tankerSummary.bySubSector.map((r, i) => ({ key: i + 1, ...r })),
      columns: [
        { title: "Sub-sector", dataIndex: "subSectorName" },
        {
          title: "Requested",
          dataIndex: "requested",
          render: (value: number) => <Tag color="gold">{value}</Tag>,
        },
        {
          title: "Delivered",
          dataIndex: "delivered",
          render: (value: number) => <Tag color="green">{value}</Tag>,
        },
        {
          title: "Pending",
          dataIndex: "pending",
          render: (value: number) => <Tag color={value > 0 ? "orange" : "default"}>{value}</Tag>,
        },
      ],
    };
  }, [report, selectedReport]);

  const selectedReportLabel = useMemo(() => {
    if (selectedReport === "usersBySubSectorHouse") return "Resident Register";
    if (selectedReport === "requestsPerHouseDateStatus") return "Complaints by House";
    if (selectedReport === "usersSummaryBySubSector") return "Registration Summary";
    if (selectedReport === "requestsSummaryBySubSector") return "Requests Summary";
    return "Water Tanker Summary";
  }, [selectedReport]);

  const exportSelectedReport = () => {
    if (!report) {
      message.warning("No report data available to export.");
      return;
    }
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const selectedSheet = (() => {
        if (selectedReport === "usersBySubSectorHouse") {
          return { name: "Resident Register", rows: report.usersBySubSectorHouse };
        }
        if (selectedReport === "requestsPerHouseDateStatus") {
          return { name: "Complaints by House", rows: report.requestsPerHouseDateStatus };
        }
        if (selectedReport === "usersSummaryBySubSector") {
          return { name: "Registration Summary", rows: report.usersSummary.bySubSector };
        }
        if (selectedReport === "requestsSummaryBySubSector") {
          return { name: "Requests Summary", rows: report.requestsSummary.bySubSector };
        }
        return { name: "Water Tanker Summary", rows: report.tankerSummary.bySubSector };
      })();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(selectedSheet.rows), selectedSheet.name);
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet([
          {
            Period: report.filter.period,
            From: report.filter.from,
            To: report.filter.to,
            "Completion rate %": report.insights?.completionRate ?? 0,
            "Cancellation rate %": report.insights?.cancellationRate ?? 0,
            "Backlog count": report.insights?.backlogCount ?? 0,
            "Avg resolution hours": report.insights?.avgResolutionHours ?? 0,
          },
        ]),
        "Overview",
      );
      XLSX.writeFile(wb, `dashboard_reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success(`Exported ${selectedSheet.name}.`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!showReportTableSection && !showAdvancedAnalyticsSection) {
    return null;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {showReportTableSection ? (
      <Card title={null} style={{ borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}` }}>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgElevated,
            padding: 12,
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Space wrap>
              <Typography.Text type="secondary">Period</Typography.Text>
              <Segmented
                value={period}
                options={[
                  { label: "Today", value: "today" },
                  { label: "Week", value: "week" },
                  { label: "Month", value: "month" },
                  { label: "Specific dates", value: "custom" },
                ]}
                onChange={(value) => setPeriod(value as ReportsPeriod)}
              />
              {period === "custom" ? (
                <DatePicker.RangePicker
                  onChange={(dates) => {
                    setCustomRange([
                      dates?.[0]?.format("YYYY-MM-DD") ?? null,
                      dates?.[1]?.format("YYYY-MM-DD") ?? null,
                    ]);
                  }}
                />
              ) : null}
            </Space>
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportSelectedReport} loading={exporting} disabled={!report}>
              Download Selected Excel
            </Button>
          </Flex>
        </div>

        {!canFetch ? (
          <Alert type="info" showIcon message="Select both start and end date to generate custom date reports." />
        ) : null}

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderColor: token.colorInfoBorder, background: token.colorInfoBg }}>
              <Statistic title="Users Registered" value={report?.usersSummary.totalUsers ?? 0} loading={query.isLoading} valueStyle={{ color: token.colorInfo }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderColor: token.colorWarningBorder, background: token.colorWarningBg }}>
              <Statistic title="Total Complaints" value={report?.requestsSummary.totalRequests ?? 0} loading={query.isLoading} valueStyle={{ color: token.colorWarning }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderColor: token.colorPrimaryBorder, background: token.colorPrimaryBg }}>
              <Statistic title="Tanker Requested" value={report?.tankerSummary.requested ?? 0} loading={query.isLoading} valueStyle={{ color: token.colorPrimary }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderColor: token.colorSuccessBorder, background: token.colorSuccessBg }}>
              <Statistic title="Tanker Delivered" value={report?.tankerSummary.delivered ?? 0} loading={query.isLoading} valueStyle={{ color: token.colorSuccess }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}><Card size="small"><Statistic title="Requests Growth vs Previous Period" value={report?.insights?.requestsGrowthPercent ?? 0} suffix="%" /></Card></Col>
          <Col xs={24} md={12}><Card size="small"><Statistic title="Registrations Growth vs Previous Period" value={report?.insights?.usersGrowthPercent ?? 0} suffix="%" /></Card></Col>
        </Row>

        <Space wrap>
          <Typography.Text type="secondary">Report type</Typography.Text>
          <Segmented
            value={selectedReport}
            options={[
              { label: "Resident Register", value: "usersBySubSectorHouse" },
              { label: "Complaints by House", value: "requestsPerHouseDateStatus" },
              { label: "Registration Summary", value: "usersSummaryBySubSector" },
              { label: "Requests Summary", value: "requestsSummaryBySubSector" },
              { label: "Water Tanker Summary", value: "tankerSummaryBySubSector" },
            ]}
            onChange={(value) => setSelectedReport(value as ReportKey)}
          />
        </Space>

        <Table
          key={selectedReport}
          loading={query.isLoading}
          dataSource={tableConfig.dataSource}
          columns={tableConfig.columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 980 }}
          title={() => (
            <Typography.Text strong>
              {selectedReportLabel}
            </Typography.Text>
          )}
        />

        </Space>
      </Card>
      ) : null}

      {showAdvancedAnalyticsSection ? (
      <Card
        title="Advanced analytics section"
        style={{
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0, marginBottom: 12 }}>
          This block is separate from the report table and shows independent analytics views.
        </Typography.Paragraph>
        <Divider style={{ margin: "0 0 12px 0" }} />

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={12}>
            <Card title="Top Request Types" size="small">
              <Table
                size="small"
                rowKey={(row) => `${row.requestTypeSlug}-${row.requestTypeName}`}
                pagination={false}
                dataSource={report?.analytics?.topRequestTypes ?? []}
                columns={[
                  { title: "Type", dataIndex: "requestTypeName" },
                  { title: "Slug", dataIndex: "requestTypeSlug" },
                  { title: "Requests", dataIndex: "requestsCount" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Top Service Options" size="small">
              <Table
                size="small"
                rowKey={(row) => row.serviceOptionLabel}
                pagination={false}
                dataSource={report?.analytics?.topServiceOptions ?? []}
                columns={[
                  { title: "Service Option", dataIndex: "serviceOptionLabel" },
                  { title: "Requests", dataIndex: "requestsCount" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Sub-sector Performance Matrix" size="small">
              <Table
                size="small"
                rowKey={(row) => `${row.subSectorName}-${row.requestsCount}`}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={report?.analytics?.subSectorPerformance ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "Users", dataIndex: "usersCount" },
                  { title: "Requests", dataIndex: "requestsCount" },
                  { title: "Completed", dataIndex: "completedCount" },
                  { title: "Completion %", dataIndex: "completionRate", render: (v: number) => `${v}%` },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="High Volume Houses (Hotspots)" size="small">
              <Table
                size="small"
                rowKey={(row) => `${row.subSectorName}-${row.houseNo}-${row.streetNo}`}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={report?.analytics?.topHouses ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "House", dataIndex: "houseNo" },
                  { title: "Street", dataIndex: "streetNo" },
                  { title: "Total", dataIndex: "totalRequests" },
                  { title: "Pending", dataIndex: "pendingRequests" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Pending Aging Buckets" size="small">
              <Table
                size="small"
                rowKey={(row) => row.bucket}
                pagination={false}
                dataSource={report?.analytics?.agingBuckets ?? []}
                columns={[
                  { title: "Aging Bucket", dataIndex: "bucket" },
                  { title: "Pending Requests", dataIndex: "count" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Hourly Demand Trend" size="small">
              <Table
                size="small"
                rowKey={(row) => row.hour}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={(report?.analytics?.hourlyDemand ?? []).filter((row) => row.count > 0)}
                columns={[
                  { title: "Hour", dataIndex: "hour", render: (h: number) => `${String(h).padStart(2, "0")}:00` },
                  { title: "Requests", dataIndex: "count" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Status Mix by Sub-sector" size="small">
              <Table
                size="small"
                rowKey={(row) => `${row.subSectorName}-${row.totalRequests}`}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={report?.analytics?.statusMixBySubSector ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "Total", dataIndex: "totalRequests" },
                  { title: "Pending", dataIndex: "pendingCount" },
                  { title: "In Progress", dataIndex: "inProgressCount" },
                  { title: "Completed", dataIndex: "completedCount" },
                  { title: "Cancelled", dataIndex: "cancelledCount" },
                  { title: "Completion %", dataIndex: "completionRate", render: (v: number) => `${v}%` },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Repeat Demand Houses (2+ Requests)" size="small">
              <Table
                size="small"
                rowKey={(row) => `${row.subSectorName}-${row.houseNo}-${row.streetNo}`}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={report?.analytics?.repeatDemandHouses ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "House", dataIndex: "houseNo" },
                  { title: "Street", dataIndex: "streetNo" },
                  { title: "Total Requests", dataIndex: "totalRequests" },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Card>
      ) : null}
    </Space>
  );
}
