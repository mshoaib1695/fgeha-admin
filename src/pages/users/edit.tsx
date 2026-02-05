import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Card, Image, Space, Typography } from "antd";
import { useCustom } from "@refinedev/core";
import { API_URL } from "../../providers/constants";

const { Title } = Typography;

const approvalOptions = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
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

export const UserEdit = () => {
  const { formProps, saveButtonProps, query, formLoading } = useForm({});
  const record = query?.data?.data;
  const frontUrl = idCardImageUrl(record?.idCardFront);
  const backUrl = idCardImageUrl(record?.idCardBack);
  const hasAnyIdCard = frontUrl || backUrl;

  const { result: subSectorsResult } = useCustom<{ data?: SubSector[] }>({
    url: `${API_URL}/users/sub-sectors`,
    method: "get",
  });
  const subSectors = Array.isArray(subSectorsResult?.data) ? subSectorsResult.data : [];
  const subSectorOptions = subSectors.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      {hasAnyIdCard && (
        <Card title="ID card photos" size="small" style={{ marginBottom: 24 }}>
          <Space size="large" wrap>
            <div>
              <Title level={5} style={{ marginBottom: 8, color: "#1890ff" }}>Front</Title>
              {frontUrl ? (
                <Image
                  src={frontUrl}
                  alt="ID card front"
                  style={{ maxWidth: 320, maxHeight: 240, objectFit: "contain", border: "1px solid #d9d9d9", borderRadius: 8 }}
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect fill='%23f0f0f0' width='320' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EImage not available%3C/text%3E%3C/svg%3E"
                />
              ) : (
                <div style={{ width: 320, height: 200, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>Not uploaded</div>
              )}
            </div>
            <div>
              <Title level={5} style={{ marginBottom: 8, color: "#1890ff" }}>Back</Title>
              {backUrl ? (
                <Image
                  src={backUrl}
                  alt="ID card back"
                  style={{ maxWidth: 320, maxHeight: 240, objectFit: "contain", border: "1px solid #d9d9d9", borderRadius: 8 }}
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'%3E%3Crect fill='%23f0f0f0' width='320' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EImage not available%3C/text%3E%3C/svg%3E"
                />
              ) : (
                <div style={{ width: 320, height: 200, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>Not uploaded</div>
              )}
            </div>
          </Space>
        </Card>
      )}
      <Form {...formProps} layout="vertical">
        <Form.Item label="Full name" name="fullName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true }, { type: "email" }]}>
          <Input disabled />
        </Form.Item>
        <Form.Item label="Phone country code" name="phoneCountryCode" rules={[{ required: true }]}>
          <Input placeholder="+92" style={{ maxWidth: 140 }} />
        </Form.Item>
        <Form.Item label="Phone number" name="phoneNumber" rules={[{ required: true }]}>
          <Input placeholder="3001234567" style={{ maxWidth: 200 }} />
        </Form.Item>
        <Form.Item label="House no" name="houseNo" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Street no" name="streetNo" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Sub-sector" name="subSectorId" rules={[{ required: true }]}>
          <Select options={subSectorOptions} placeholder="Select sub-sector" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item label="Approval status" name="approvalStatus">
          <Select options={approvalOptions} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item label="Role" name="role">
          <Select options={roleOptions} style={{ width: 120 }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
