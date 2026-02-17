import { useMemo, useState } from "react";
import { useCustom } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  theme,
} from "antd";
import * as XLSX from "xlsx";
import { DownloadOutlined } from "@ant-design/icons";
import { API_URL } from "../../providers/constants";

type ReportsPeriod = "today" | "week" | "month" | "custom";
type ReportKey =
  | "usersBySubSectorHouse"
  | "requestsPerHouseDateStatus"
  | "usersSummaryBySubSector"
  | "requestsSummaryBySubSector"
  | "tankerSummaryBySubSector";

interface DashboardReportsResponse {
  filter: { period: ReportsPeriod; from: string; to: string };
  usersBySubSectorHouse: Array<{
    subSectorId: number;
    subSectorName: string;
    houseNo: string;
    userName: string;
    mobileNo: string;
    usersInHouse: number;
  }>;
  requestsPerHouseDateStatus: Array<{
    subSectorId: number;
    subSectorName: string;
    houseNo: string;
    streetNo: string;
    date: string;
    status: string;
    requestCount: number;
  }>;
  usersSummary: {
    totalUsers: number;
    bySubSector: Array<{ subSectorId: number; subSectorName: string; usersCount: number }>;
  };
  requestsSummary: {
    totalRequests: number;
    bySubSector: Array<{ subSectorId: number; subSectorName: string; requestsCount: number }>;
    byStatus: Array<{ status: string; requestsCount: number }>;
  };
  tankerSummary: {
    requested: number;
    delivered: number;
    pending: number;
    cancelled: number;
    bySubSector: Array<{
      subSectorId: number;
      subSectorName: string;
      requested: number;
      delivered: number;
      pending: number;
    }>;
  };
  insights: {
    completionRate: number;
    cancellationRate: number;
    backlogCount: number;
    avgResolutionHours: number;
    requestsGrowthPercent: number;
    usersGrowthPercent: number;
    topSubSectorByRequests: { subSectorId: number; subSectorName: string; requestsCount: number } | null;
    topSubSectorByUsers: { subSectorId: number; subSectorName: string; usersCount: number } | null;
  };
  analytics: {
    dailyTrend: Array<{ date: string; total: number; completed: number; pending: number }>;
    topRequestTypes: Array<{ requestTypeName: string; requestTypeSlug: string; requestsCount: number }>;
    topServiceOptions: Array<{ serviceOptionLabel: string; requestsCount: number }>;
    topHouses: Array<{
      subSectorName: string;
      houseNo: string;
      streetNo: string;
      totalRequests: number;
      pendingRequests: number;
    }>;
    subSectorPerformance: Array<{
      subSectorId: number;
      subSectorName: string;
      usersCount: number;
      requestsCount: number;
      completedCount: number;
      completionRate: number;
    }>;
    statusMixBySubSector: Array<{
      subSectorId: number;
      subSectorName: string;
      totalRequests: number;
      pendingCount: number;
      inProgressCount: number;
      completedCount: number;
      cancelledCount: number;
      completionRate: number;
    }>;
    agingBuckets: Array<{ bucket: string; count: number }>;
    repeatDemandHouses: Array<{
      subSectorName: string;
      houseNo: string;
      streetNo: string;
      totalRequests: number;
    }>;
    hourlyDemand: Array<{ hour: number; count: number }>;
  };
}

const EMPTY_REPORT: DashboardReportsResponse = {
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

function normalizeReportPayload(raw: unknown): DashboardReportsResponse | undefined {
  const payload =
    raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)
      ? (raw as { data?: unknown }).data
      : raw;

  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Partial<DashboardReportsResponse>;

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
      subSectorPerformance: Array.isArray(p.analytics?.subSectorPerformance)
        ? p.analytics.subSectorPerformance
        : [],
      statusMixBySubSector: Array.isArray(p.analytics?.statusMixBySubSector)
        ? p.analytics.statusMixBySubSector
        : [],
      agingBuckets: Array.isArray(p.analytics?.agingBuckets) ? p.analytics.agingBuckets : [],
      repeatDemandHouses: Array.isArray(p.analytics?.repeatDemandHouses)
        ? p.analytics.repeatDemandHouses
        : [],
      hourlyDemand: Array.isArray(p.analytics?.hourlyDemand) ? p.analytics.hourlyDemand : [],
    },
  };
}

export function ReportsPanel() {
  const { token } = theme.useToken();
  const [period, setPeriod] = useState<ReportsPeriod>("month");
  const [selectedReport, setSelectedReport] = useState<ReportKey>("usersBySubSectorHouse");
  const [customRange, setCustomRange] = useState<[string | null, string | null]>([null, null]);
  const [exporting, setExporting] = useState(false);
  const [from, to] = customRange;
  const canFetch = period !== "custom" || (Boolean(from) && Boolean(to));

  const reportUrl = useMemo(() => {
    const query = new URLSearchParams();
    query.set("period", period);
    if (period === "custom" && from && to) {
      query.set("from", from);
      query.set("to", to);
    }
    return `${API_URL}/requests/stats/reports?${query.toString()}`;
  }, [period, from, to]);

  const { result, query } = useCustom<DashboardReportsResponse>({
    url: reportUrl,
    method: "get",
    queryOptions: { enabled: canFetch },
  });
  const report = normalizeReportPayload(result?.data);

  const tableConfig = useMemo(() => {
    if (!report) return { dataSource: [] as Record<string, unknown>[], columns: [] as Record<string, unknown>[] };

    if (selectedReport === "usersBySubSectorHouse") {
      return {
        dataSource: report.usersBySubSectorHouse.map((item, index) => ({ key: index + 1, ...item })),
        columns: [
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "House No", dataIndex: "houseNo" },
          { title: "No. of users in house", dataIndex: "usersInHouse" },
          { title: "Name", dataIndex: "userName" },
          { title: "Mobile", dataIndex: "mobileNo" },
        ],
      };
    }

    if (selectedReport === "requestsPerHouseDateStatus") {
      return {
        dataSource: report.requestsPerHouseDateStatus.map((item, index) => ({ key: index + 1, ...item })),
        columns: [
          { title: "Date", dataIndex: "date" },
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "House No", dataIndex: "houseNo" },
          { title: "Street No", dataIndex: "streetNo" },
          { title: "Status", dataIndex: "status" },
          { title: "No. of requests", dataIndex: "requestCount" },
        ],
      };
    }

    if (selectedReport === "usersSummaryBySubSector") {
      return {
        dataSource: report.usersSummary.bySubSector.map((item, index) => ({ key: index + 1, ...item })),
        columns: [
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "Users registered", dataIndex: "usersCount" },
        ],
      };
    }

    if (selectedReport === "requestsSummaryBySubSector") {
      return {
        dataSource: report.requestsSummary.bySubSector.map((item, index) => ({ key: index + 1, ...item })),
        columns: [
          { title: "Sub-sector", dataIndex: "subSectorName" },
          { title: "Requests/complaints", dataIndex: "requestsCount" },
        ],
      };
    }

    return {
      dataSource: report.tankerSummary.bySubSector.map((item, index) => ({ key: index + 1, ...item })),
      columns: [
        { title: "Sub-sector", dataIndex: "subSectorName" },
        { title: "Requested", dataIndex: "requested" },
        { title: "Delivered", dataIndex: "delivered" },
        { title: "Pending", dataIndex: "pending" },
      ],
    };
  }, [report, selectedReport]);

  const reportTabs = [
    { key: "usersBySubSectorHouse", label: "Resident Register" },
    { key: "requestsPerHouseDateStatus", label: "Complaints by House" },
    { key: "usersSummaryBySubSector", label: "Registration Summary" },
    { key: "requestsSummaryBySubSector", label: "Requests Summary" },
    { key: "tankerSummaryBySubSector", label: "Water Tanker Summary" },
  ] as const;

  const exportAllReports = () => {
    if (!report) {
      message.warning("No report data available to export yet.");
      return;
    }

    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.usersBySubSectorHouse.map((row) => ({
            "Sub-sector": row.subSectorName,
            "House No": row.houseNo,
            "Users in house": row.usersInHouse,
            Name: row.userName,
            Mobile: row.mobileNo,
          })),
        ),
        "Resident Register",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.requestsPerHouseDateStatus.map((row) => ({
            Date: row.date,
            "Sub-sector": row.subSectorName,
            "House No": row.houseNo,
            "Street No": row.streetNo,
            Status: row.status,
            "Request count": row.requestCount,
          })),
        ),
        "Complaints by House",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.usersSummary.bySubSector.map((row) => ({
            "Sub-sector": row.subSectorName,
            "Users registered": row.usersCount,
          })),
        ),
        "Registration Summary",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.requestsSummary.bySubSector.map((row) => ({
            "Sub-sector": row.subSectorName,
            "Requests/complaints": row.requestsCount,
          })),
        ),
        "Requests Summary",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.requestsSummary.byStatus.map((row) => ({
            Status: row.status,
            "Requests/complaints": row.requestsCount,
          })),
        ),
        "Requests by Status",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.tankerSummary.bySubSector.map((row) => ({
            "Sub-sector": row.subSectorName,
            Requested: row.requested,
            Delivered: row.delivered,
            Pending: row.pending,
          })),
        ),
        "Water Tanker Summary",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet([
          {
            Period: report.filter.period,
            From: report.filter.from,
            To: report.filter.to,
            "Total users": report.usersSummary.totalUsers,
            "Total requests": report.requestsSummary.totalRequests,
            "Completion rate %": report.insights.completionRate,
            "Cancellation rate %": report.insights.cancellationRate,
            "Backlog count": report.insights.backlogCount,
            "Avg resolution hours": report.insights.avgResolutionHours,
            "Requests growth %": report.insights.requestsGrowthPercent,
            "Registrations growth %": report.insights.usersGrowthPercent,
            "Tanker requested": report.tankerSummary.requested,
            "Tanker delivered": report.tankerSummary.delivered,
            "Tanker pending": report.tankerSummary.pending,
            "Tanker cancelled": report.tankerSummary.cancelled,
            "Top request sector": report.insights.topSubSectorByRequests?.subSectorName ?? "N/A",
            "Top registration sector": report.insights.topSubSectorByUsers?.subSectorName ?? "N/A",
          },
        ]),
        "Overview KPIs",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.dailyTrend.map((row) => ({
            Date: row.date,
            "Total requests": row.total,
            Completed: row.completed,
            Pending: row.pending,
          })),
        ),
        "Daily Trend",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.topRequestTypes.map((row) => ({
            "Request type": row.requestTypeName,
            Slug: row.requestTypeSlug,
            "Total requests": row.requestsCount,
          })),
        ),
        "Top Request Types",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.topServiceOptions.map((row) => ({
            "Service option": row.serviceOptionLabel,
            "Total requests": row.requestsCount,
          })),
        ),
        "Top Service Options",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.topHouses.map((row) => ({
            "Sub-sector": row.subSectorName,
            "House no": row.houseNo,
            "Street no": row.streetNo,
            "Total complaints": row.totalRequests,
            "Pending complaints": row.pendingRequests,
          })),
        ),
        "High Volume Houses",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.subSectorPerformance.map((row) => ({
            "Sub-sector": row.subSectorName,
            Users: row.usersCount,
            Requests: row.requestsCount,
            Completed: row.completedCount,
            "Completion rate %": row.completionRate,
          })),
        ),
        "Sector Performance",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.statusMixBySubSector.map((row) => ({
            "Sub-sector": row.subSectorName,
            "Total requests": row.totalRequests,
            Pending: row.pendingCount,
            "In progress": row.inProgressCount,
            Completed: row.completedCount,
            Cancelled: row.cancelledCount,
            "Completion rate %": row.completionRate,
          })),
        ),
        "Status Mix by Sector",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.agingBuckets.map((row) => ({
            Bucket: row.bucket,
            Count: row.count,
          })),
        ),
        "Pending Aging",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.repeatDemandHouses.map((row) => ({
            "Sub-sector": row.subSectorName,
            "House no": row.houseNo,
            "Street no": row.streetNo,
            "Total requests": row.totalRequests,
          })),
        ),
        "Repeat Houses",
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          report.analytics.hourlyDemand
            .filter((row) => row.count > 0)
            .map((row) => ({
            Hour: `${String(row.hour).padStart(2, "0")}:00`,
            Requests: row.count,
            })),
        ),
        "Hourly Demand",
      );

      const fileDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `dashboard_reports_${fileDate}.xlsx`);
      message.success("Reports exported successfully.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card
      title={null}
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
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
                  const start = dates?.[0]?.format("YYYY-MM-DD") ?? null;
                  const end = dates?.[1]?.format("YYYY-MM-DD") ?? null;
                  setCustomRange([start, end]);
                }}
              />
            ) : null}
          </Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportAllReports}
            loading={exporting}
            disabled={!report}
          >
            Download Excel
          </Button>
        </Flex>

        {!canFetch ? (
          <Alert
            type="info"
            showIcon
            message="Select both start and end date to generate custom date reports."
          />
        ) : null}

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 10, background: token.colorFillAlter }}>
              <Statistic title="Users Registered" value={report?.usersSummary.totalUsers ?? 0} loading={query.isLoading} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 10, background: token.colorFillAlter }}>
              <Statistic title="Total Complaints" value={report?.requestsSummary.totalRequests ?? 0} loading={query.isLoading} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 10, background: token.colorFillAlter }}>
              <Statistic title="Tanker Requested" value={report?.tankerSummary.requested ?? 0} loading={query.isLoading} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderRadius: 10, background: token.colorFillAlter }}>
              <Statistic title="Tanker Delivered" value={report?.tankerSummary.delivered ?? 0} loading={query.isLoading} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Completion Rate" value={report?.insights.completionRate ?? 0} suffix="%" />
              <Progress percent={report?.insights.completionRate ?? 0} showInfo={false} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Backlog (Pending + In Progress)" value={report?.insights.backlogCount ?? 0} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Avg Resolution Time" value={report?.insights.avgResolutionHours ?? 0} suffix="hrs" />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title="Requests Growth vs Previous Period"
                value={report?.insights.requestsGrowthPercent ?? 0}
                suffix="%"
                valueStyle={{ color: (report?.insights.requestsGrowthPercent ?? 0) >= 0 ? token.colorSuccess : token.colorError }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title="Registrations Growth vs Previous Period"
                value={report?.insights.usersGrowthPercent ?? 0}
                suffix="%"
                valueStyle={{ color: (report?.insights.usersGrowthPercent ?? 0) >= 0 ? token.colorSuccess : token.colorError }}
              />
            </Card>
          </Col>
        </Row>

        <Space wrap size={8}>
          <Tag color="blue">
            Top request sector: {report?.insights.topSubSectorByRequests?.subSectorName ?? "N/A"}
          </Tag>
          <Tag color="purple">
            Top registration sector: {report?.insights.topSubSectorByUsers?.subSectorName ?? "N/A"}
          </Tag>
          <Tag color="red">Cancellation rate: {report?.insights.cancellationRate ?? 0}%</Tag>
        </Space>

        <Tabs
          activeKey={selectedReport}
          onChange={(key) => setSelectedReport(key as ReportKey)}
          items={reportTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
          size="small"
        />

        <Table
          loading={query.isLoading}
          dataSource={tableConfig.dataSource}
          columns={tableConfig.columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 980 }}
        />

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={12}>
            <Card title="Top Request Types" size="small">
              <Table
                size="small"
                rowKey={(row) => `${row.requestTypeSlug}-${row.requestTypeName}`}
                pagination={false}
                dataSource={report?.analytics.topRequestTypes ?? []}
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
                dataSource={report?.analytics.topServiceOptions ?? []}
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
                rowKey={(row) => row.subSectorId}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={report?.analytics.subSectorPerformance ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "Users", dataIndex: "usersCount" },
                  { title: "Requests", dataIndex: "requestsCount" },
                  { title: "Completed", dataIndex: "completedCount" },
                  {
                    title: "Completion %",
                    dataIndex: "completionRate",
                    render: (value: number) => `${value}%`,
                  },
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
                dataSource={report?.analytics.topHouses ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "House", dataIndex: "houseNo" },
                  { title: "Street", dataIndex: "streetNo" },
                  { title: "Total Complaints", dataIndex: "totalRequests" },
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
                dataSource={report?.analytics.agingBuckets ?? []}
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
                dataSource={(report?.analytics.hourlyDemand ?? []).filter((row) => row.count > 0)}
                columns={[
                  {
                    title: "Hour",
                    dataIndex: "hour",
                    render: (hour: number) => `${String(hour).padStart(2, "0")}:00`,
                  },
                  { title: "Requests", dataIndex: "count" },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Status Mix by Sub-sector" size="small">
              <Table
                size="small"
                rowKey={(row) => row.subSectorId}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                dataSource={report?.analytics.statusMixBySubSector ?? []}
                columns={[
                  { title: "Sub-sector", dataIndex: "subSectorName" },
                  { title: "Total", dataIndex: "totalRequests" },
                  { title: "Pending", dataIndex: "pendingCount" },
                  { title: "In Progress", dataIndex: "inProgressCount" },
                  { title: "Completed", dataIndex: "completedCount" },
                  { title: "Cancelled", dataIndex: "cancelledCount" },
                  {
                    title: "Completion %",
                    dataIndex: "completionRate",
                    render: (value: number) => `${value}%`,
                  },
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
                dataSource={report?.analytics.repeatDemandHouses ?? []}
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
      </Space>
    </Card>
  );
}
