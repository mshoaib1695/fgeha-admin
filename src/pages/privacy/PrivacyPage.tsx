import { Card, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

export const PrivacyPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f5f7fa",
      }}
    >
      <Card style={{ width: "100%", maxWidth: 900 }}>
        <Title level={2} style={{ marginTop: 0 }}>
          Privacy Policy
        </Title>
        <Text type="secondary">Last updated: February 14, 2026</Text>

        <Paragraph style={{ marginTop: 16 }}>
          This page explains how the FGEHA Admin system handles personal data.
          It is publicly accessible for transparency.
        </Paragraph>

        <Title level={4}>Information we collect</Title>
        <Paragraph>
          We may collect account details, profile information, request details,
          and operational logs required to provide municipal services.
        </Paragraph>

        <Title level={4}>How we use information</Title>
        <Paragraph>
          Information is used to authenticate users, process service requests,
          improve operations, and support audits and security monitoring.
        </Paragraph>

        <Title level={4}>Data sharing</Title>
        <Paragraph>
          Data is shared only with authorized departments and service teams as
          needed to process requests and deliver services.
        </Paragraph>

        <Title level={4}>Data retention</Title>
        <Paragraph>
          Data is retained only for as long as required by operational and legal
          obligations.
        </Paragraph>

        <Title level={4}>Contact</Title>
        <Paragraph>
          For privacy inquiries, please contact the system administrator.
        </Paragraph>
      </Card>
    </div>
  );
};
