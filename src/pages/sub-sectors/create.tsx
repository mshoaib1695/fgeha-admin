import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export const SubSectorCreate = () => {
  const { formProps, saveButtonProps } = useForm({
    resource: "sub-sectors",
  });

  return (
    <Create title="Add sub-sector" saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="e.g. Sector A" maxLength={50} />
        </Form.Item>
        <Form.Item
          label="Code"
          name="code"
          rules={[{ required: true, message: "Code is required" }]}
          extra="Unique short code (e.g. SEC-A)"
        >
          <Input placeholder="e.g. SEC-A" maxLength={20} />
        </Form.Item>
        <Form.Item
          label="Display order"
          name="displayOrder"
          initialValue={0}
          extra="Lower numbers appear first in dropdowns"
        >
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
      </Form>
    </Create>
  );
};
