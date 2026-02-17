import { Alert, Card, Col, List, Row, Space, Tag, Typography } from "antd";
import { useEffect } from "react";

const { Title, Paragraph, Text } = Typography;

export const AccountDeletionPage = () => {
  useEffect(() => {
    document.title = "Account Deactivation & Deletion | FGEHA Admin";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#131313",
      }}
    >
      <div style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Tag color="orange" style={{ width: "fit-content" }}>
              ACCOUNT POLICY
            </Tag>
            <Title level={2} style={{ margin: 0 }}>
              Account Deactivation & Deletion
            </Title>
            <Text type="secondary">Last updated: February 16, 2026</Text>
            <Paragraph style={{ marginBottom: 0 }}>
              Users can deactivate accounts directly in the mobile app profile.
              Deactivation disables access without deleting historical records.
            </Paragraph>
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Option 1: Deactivate in App (Immediate)">
              <List
                size="small"
                dataSource={[
                  "Open mobile app > Profile.",
                  "Tap Deactivate profile and confirm.",
                  "Account status becomes deactivated (not deleted).",
                  "User is signed out and login is blocked while deactivated.",
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Option 2: Request Permanent Deletion">
              <Paragraph style={{ marginBottom: 8 }}>
                Send deletion request with registered details (name + phone/email)
                through official support/admin channel.
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                Identity verification may be required before deletion is processed.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="What Happens on Deactivation">
              <List
                size="small"
                dataSource={[
                  "User account remains in system with status deactivated.",
                  "Login and token-based access are blocked.",
                  "No service requests are deleted automatically.",
                  "Admin can review and manage deactivated accounts internally.",
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Deletion Retention Notes">
              <List
                size="small"
                dataSource={[
                  "Personal profile data may be deleted or anonymized.",
                  "Operational/audit records may be retained when required by law or policy.",
                  "Retention is limited to minimum necessary duration.",
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
        </Row>

        <Card style={{ marginTop: 16 }}>
          <Alert
            type="info"
            showIcon
            message="Support Contact"
            description="For account deletion, reactivation requests, or account-status concerns, contact the system administrator through official FGEHA support channels."
          />
        </Card>
      </div>
    </div>
  );
};
