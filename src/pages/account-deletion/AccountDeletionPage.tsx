import { Card, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

export const AccountDeletionPage = () => {
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
          Account Deletion Request
        </Title>
        <Text type="secondary">Last updated: February 14, 2026</Text>

        <Paragraph style={{ marginTop: 16 }}>
          If you want to delete your account and associated profile data, you can
          request deletion using the contact method below.
        </Paragraph>

        <Title level={4}>How to request deletion</Title>
        <Paragraph>
          Please send your registered account details (such as full name and
          phone number/email) to the system administrator and clearly mention
          that you are requesting account deletion.
        </Paragraph>

        <Title level={4}>What will be deleted</Title>
        <Paragraph>
          We will delete or anonymize your account profile and personal
          information associated with your login, subject to legal and
          operational requirements.
        </Paragraph>

        <Title level={4}>What may be retained</Title>
        <Paragraph>
          Certain records (for example service request logs required for audit,
          fraud prevention, or legal compliance) may be retained for the minimum
          period required by policy or law.
        </Paragraph>

        <Title level={4}>Processing time</Title>
        <Paragraph>
          Deletion requests are typically processed within a reasonable period
          after identity verification.
        </Paragraph>

        <Title level={4}>Contact</Title>
        <Paragraph>
          For account deletion requests, please contact the system administrator.
        </Paragraph>
      </Card>
    </div>
  );
};
