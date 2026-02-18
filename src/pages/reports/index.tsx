import { Card, Typography } from "antd";
import { ReportsPanel } from "../dashboard/ReportsPanel";

export const ReportsPage = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Reports Center
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Generate, analyze, and export all operational and analytics reports from one dedicated page.
        </Typography.Paragraph>
      </Card>
      <ReportsPanel showReportTableSection showAdvancedAnalyticsSection={false} />
    </div>
  );
};
