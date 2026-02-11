import { Edit, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import {
  Card,
  Col,
  Descriptions,
  Form,
  Image,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import type { BaseRecord } from "@refinedev/core";
import { API_URL } from "../../providers/constants";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancel" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  // Legacy value kept visible so old rows can be saved.
  { value: "done", label: "Completed (legacy)" },
];

function resolveIssueImageUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const base = API_URL.replace(/\/$/, "");
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

export const RequestEdit = () => {
  const { formProps, saveButtonProps, query, formLoading } = useForm({});
  const record = query?.data?.data as BaseRecord | undefined;
  const issueImageUrl = resolveIssueImageUrl(record?.issueImageUrl);

  const { result: requestTypesResult, query: requestTypesQuery } = useList({
    resource: "request-types",
    sorters: [{ field: "displayOrder", order: "asc" }],
  });
  const { result: subSectorsResult, query: subSectorsQuery } = useList({
    resource: "sub-sectors",
    sorters: [{ field: "name", order: "asc" }],
  });

  const requestTypeOptions = (requestTypesResult?.data ?? []).map((item) => ({
    value: Number(item.id),
    label: String(item.name ?? `Type #${item.id}`),
  }));
  const subSectorOptions = (subSectorsResult?.data ?? []).map((item) => ({
    value: Number(item.id),
    label: String(item.name ?? `Sub-sector #${item.id}`),
  }));

  return (
    <Edit saveButtonProps={saveButtonProps} isLoading={formLoading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card size="small" title="Request details">
            <Descriptions
              column={1}
              size="small"
              items={[
                { key: "id", label: "ID", children: record?.id ?? "-" },
                {
                  key: "requestNumber",
                  label: "Request no",
                  children: String(record?.requestNumber ?? "-"),
                },
                {
                  key: "user",
                  label: "Applicant",
                  children: (
                    <Space direction="vertical" size={0}>
                      <Typography.Text>
                        {String(record?.user?.fullName ?? "-")}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {String(record?.user?.email ?? record?.userId ?? "-")}
                      </Typography.Text>
                    </Space>
                  ),
                },
                {
                  key: "createdAt",
                  label: "Created",
                  children: record?.createdAt
                    ? new Date(String(record.createdAt)).toLocaleString()
                    : "-",
                },
                {
                  key: "updatedAt",
                  label: "Updated",
                  children: record?.updatedAt
                    ? new Date(String(record.updatedAt)).toLocaleString()
                    : "-",
                },
              ]}
            />
          </Card>

          <Card size="small" title="Issue image" style={{ marginTop: 16 }}>
            {issueImageUrl ? (
              <Image
                src={issueImageUrl}
                alt="Issue image"
                style={{ width: "100%", borderRadius: 8, maxHeight: 260, objectFit: "contain" }}
              />
            ) : (
              <Typography.Text type="secondary">No image uploaded</Typography.Text>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card size="small" title="Edit request">
            <Form {...formProps} layout="vertical">
              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="requestTypeId"
                    label="Request type"
                    rules={[{ required: true, message: "Please select request type" }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={requestTypeOptions}
                      loading={requestTypesQuery?.isLoading}
                      placeholder="Select request type"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: "Please select status" }]}
                  >
                    <Select options={STATUS_OPTIONS} placeholder="Select status" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="houseNo"
                    label="House no"
                    rules={[{ required: true, message: "House number is required" }]}
                  >
                    <Input placeholder="Enter house number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="streetNo"
                    label="Street no"
                    rules={[{ required: true, message: "Street number is required" }]}
                  >
                    <Input placeholder="Enter street number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="subSectorId"
                    label="Sub-sector"
                    rules={[{ required: true, message: "Please select sub-sector" }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={subSectorOptions}
                      loading={subSectorsQuery?.isLoading}
                      placeholder="Select sub-sector"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[
                      {
                        validator: async (_, value: string | undefined) => {
                          const text = String(value ?? "").trim();
                          if (!text || text.length >= 10) return;
                          throw new Error("Description must be at least 10 characters");
                        },
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={5}
                      showCount
                      placeholder="Write request details for the support team"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </Edit>
  );
};
