import { Alert, Card, Col, Divider, List, Row, Space, Tag, Typography } from "antd";
import { useEffect } from "react";

const { Title, Paragraph, Text } = Typography;

export const PrivacyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | FGEHA Admin";
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
            <Tag color="blue" style={{ width: "fit-content" }}>
              FGEHA APP & ADMIN
            </Tag>
            <Title level={2} style={{ margin: 0 }}>
              Privacy Policy
            </Title>
            <Text type="secondary">Last updated: February 16, 2026</Text>
            <Paragraph style={{ marginBottom: 0 }}>
              This policy describes what data we collect, why we collect it, and
              how user privacy is protected when using the FGEHA mobile app and
              admin system.
            </Paragraph>
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Information We Collect">
              <List
                size="small"
                dataSource={[
                  "Account details (name, email, phone, address, sub-sector).",
                  "Profile details (profile photo and submitted request content).",
                  "Service request metadata (timestamps, status, request number).",
                  "Security and operational logs required for system reliability.",
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="How We Use Data">
              <List
                size="small"
                dataSource={[
                  "Authenticate users and secure account access.",
                  "Process and route service requests to relevant teams.",
                  "Generate request tracking identifiers and status updates.",
                  "Maintain audit trails, fraud prevention, and legal compliance.",
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Data Sharing">
              <Paragraph style={{ marginBottom: 8 }}>
                Data is shared only with authorized internal departments and
                service operators on a need-to-know basis for service delivery.
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                We do not share personal data publicly.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Retention & User Controls">
              <List
                size="small"
                dataSource={[
                  "Data is retained only as long as operational and legal requirements demand.",
                  "Users can update profile details from the mobile app profile page.",
                  "Users can deactivate their account from profile settings.",
                  "Deletion requests can be made through the account deletion policy process.",
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
            message="Contact for Privacy Questions"
            description="For privacy inquiries, complaints, or data-access requests, please contact the system administrator through official FGEHA support channels."
          />
          <Divider />
          <Text type="secondary">
            This policy may be updated periodically to reflect product, legal,
            or operational changes.
          </Text>
        </Card>
      </div>
    </div>
  );
};
