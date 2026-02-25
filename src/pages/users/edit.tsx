import { useState } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Card, Image, Row, Col, Space, Typography, Button, message, Modal } from "antd";
import { ReloadOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useCustom, useCustomMutation, useInvalidate } from "@refinedev/core";
import { useParams } from "react-router";
import { API_URL } from "../../providers/constants";

const { Title, Text } = Typography;

const approvalOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const accountStatusOptions = [
  { value: "active", label: "Active" },
  { value: "deactivated", label: "Deactivated" },
];

const roleOptions = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

type SubSector = { id: number; name: string; code: string };

function idCardImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const base = (API_URL || "").replace(/\/$/, "");
  return base ? `${base}/${path.trim()}` : null;
}

/** Generate a strong 12-character password with upper, lower, digits, symbols. */
function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const invalidate = useInvalidate();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm<{ password: string }>();
  const { formProps, saveButtonProps, query, formLoading } = useForm({
    resource: "users",
    id: id ? parseInt(id, 10) : undefined,
  });
  const record = query?.data?.data as
    | { id?: number; emailVerified?: boolean; idCardFront?: string; idCardBack?: string }
    | undefined;
  const frontUrl = idCardImageUrl(record?.idCardFront);
  const backUrl = idCardImageUrl(record?.idCardBack);
  const hasAnyIdCard = frontUrl || backUrl;
  const emailNotVerified = record?.emailVerified === false;

  const verifyEmailMutation = useCustomMutation();
  const resetPasswordMutation = useCustomMutation();

  const { result: subSectorsResult } = useCustom<{ data?: SubSector[] }>({
    url: `${API_URL}/users/sub-sectors`,
    method: "get",
  });
  const subSectors = Array.isArray(subSectorsResult?.data) ? subSectorsResult.data : [];
  const subSectorOptions = subSectors.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  const handleGeneratePassword = () => {
    passwordForm.setFieldValue("password", generateStrongPassword());
  };

  const handleOpenPasswordModal = () => {
    passwordForm.setFieldsValue({ password: generateStrongPassword() });
    setPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = () => {
    passwordForm.validateFields().then((values) => {
      const pwd = values.password?.trim();
      if (!pwd || pwd.length < 6) {
        message.error("Password must be at least 6 characters");
        return;
      }
      if (!id) return;
      resetPasswordMutation.mutate(
        {
          url: `${API_URL}/users/${id}`,
          method: "patch",
          values: { password: pwd },
        },
        {
          onSuccess: () => {
            message.success("Password reset successfully");
            setPasswordModalOpen(false);
            passwordForm.resetFields();
            invalidate({ resource: "users", invalidates: ["detail", "list"] });
          },
          onError: (err: unknown) => {
            message.error((err as { message?: string })?.message ?? "Failed to reset password");
          },
        }
      );
    });
  };

  const handleVerifyEmail = () => {
    if (!id) return;
    verifyEmailMutation.mutate(
      {
        url: `${API_URL}/users/${id}/verify-email`,
        method: "patch",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Email verified successfully");
          invalidate({ resource: "users", invalidates: ["detail", "list"] });
        },
        onError: (err: unknown) => {
          message.error((err as { message?: string })?.message ?? "Failed to verify email");
        },
      }
    );
  };

  const imageFallback =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='180' viewBox='0 0 280 180'%3E%3Crect fill='%23f5f5f5' width='280' height='180'/%3E%3Ctext fill='%23bfbfbf' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E";

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      {/* Change password — dedicated card */}
      <Card
        size="small"
        style={{
          marginBottom: 24,
          border: "1px solid #d9d9d9",
          borderRadius: 8,
        }}
        styles={{
          body: { padding: "20px 24px" },
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenPasswordModal}
          onKeyDown={(e) => e.key === "Enter" && handleOpenPasswordModal()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#e6f4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LockOutlined style={{ fontSize: 24, color: "#1677ff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 15, display: "block" }}>
              Change password
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Set a new password for this user. Opens in a dialog — separate from Save.
            </Text>
          </div>
          <Button type="primary" size="large">
            Change password
          </Button>
        </div>
      </Card>

      {emailNotVerified && (
        <Card
          size="small"
          style={{ marginBottom: 24 }}
          styles={{ body: { padding: "16px 24px" } }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MailOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
              <div>
                <Text strong>Email not verified</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  User didn&apos;t receive the verification email
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              icon={<MailOutlined />}
              loading={verifyEmailMutation.mutation?.isPending}
              onClick={handleVerifyEmail}
            >
              Verify email now
            </Button>
          </div>
        </Card>
      )}

      <Modal
        title={
          <Space size={12}>
            <LockOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            <span>Change password</span>
          </Space>
        }
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={420}
        styles={{ body: { paddingTop: 24 } }}
      >
        <Form form={passwordForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="password"
            label="New password"
            rules={[
              { required: true, message: "Enter a password" },
              { min: 6, message: "At least 6 characters" },
            ]}
          >
            <Input.Password
              placeholder="Min 6 characters"
              size="large"
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleGeneratePassword}
                  style={{ padding: "0 8px" }}
                >
                  Generate
                </Button>
              }
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={handleResetPasswordSubmit}
                loading={resetPasswordMutation.mutation?.isPending}
              >
                Change password
              </Button>
              <Button
                onClick={() => {
                  setPasswordModalOpen(false);
                  passwordForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Form {...formProps} layout="vertical" requiredMark="optional">
        {hasAnyIdCard && (
          <Card
            title="ID card"
            size="small"
            style={{ marginBottom: 24 }}
            styles={{ body: { padding: "16px 0" } }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                  Front
                </Text>
                {frontUrl ? (
                  <Image
                    src={frontUrl}
                    alt="ID front"
                    style={{
                      width: "100%",
                      maxWidth: 280,
                      height: 180,
                      objectFit: "contain",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                    }}
                    fallback={imageFallback}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 280,
                      height: 180,
                      background: "#fafafa",
                      borderRadius: 8,
                      border: "1px dashed #d9d9d9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#bfbfbf",
                      fontSize: 13,
                    }}
                  >
                    Not uploaded
                  </div>
                )}
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                  Back
                </Text>
                {backUrl ? (
                  <Image
                    src={backUrl}
                    alt="ID back"
                    style={{
                      width: "100%",
                      maxWidth: 280,
                      height: 180,
                      objectFit: "contain",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                    }}
                    fallback={imageFallback}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 280,
                      height: 180,
                      background: "#fafafa",
                      borderRadius: 8,
                      border: "1px dashed #d9d9d9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#bfbfbf",
                      fontSize: 13,
                    }}
                  >
                    Not uploaded
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        )}

        <Card title="Profile" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Full name" name="fullName" rules={[{ required: true }]}>
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true }, { type: "email" }]}>
                <Input disabled placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Country code" name="phoneCountryCode" rules={[{ required: true }]}>
                <Input placeholder="+92" />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item label="Phone number" name="phoneNumber" rules={[{ required: true }]}>
                <Input placeholder="3001234567" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Address" size="small" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="House no" name="houseNo" rules={[{ required: true }]}>
                <Input placeholder="House number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Street no" name="streetNo" rules={[{ required: true }]}>
                <Input placeholder="Street number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Sub-sector" name="subSectorId" rules={[{ required: true }]}>
                <Select
                  options={subSectorOptions}
                  placeholder="Select sub-sector"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Status & role" size="small">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="Approval" name="approvalStatus">
                <Select options={approvalOptions} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Account" name="accountStatus">
                <Select options={accountStatusOptions} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Role" name="role">
                <Select options={roleOptions} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Edit>
  );
};
