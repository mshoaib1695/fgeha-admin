import { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Checkbox, Select } from "antd";
import { AllowedDaysField } from "./AllowedDaysField";

const duplicatePeriodOptions = [
  { value: "none", label: "None" },
  { value: "day", label: "Once per calendar day" },
  { value: "week", label: "Once per calendar week" },
  { value: "month", label: "Once per calendar month" },
];

export const RequestTypeEdit = () => {
  const [windowEnabled, setWindowEnabled] = useState(false);
  const { formProps, saveButtonProps } = useForm({
    resource: "request-types",
  });

  useEffect(() => {
    const v = formProps.initialValues;
    if (v?.restrictionStartTime || v?.restrictionEndTime || v?.restrictionDays) {
      setWindowEnabled(true);
    }
  }, [formProps.initialValues?.restrictionStartTime, formProps.initialValues?.restrictionEndTime, formProps.initialValues?.restrictionDays]);

  const handleFinish = (values: Record<string, unknown>) => {
    const next = !windowEnabled
      ? { ...values, restrictionStartTime: null, restrictionEndTime: null, restrictionDays: null }
      : values;
    formProps.onFinish?.(next);
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Slug"
          name="slug"
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Display order" name="displayOrder">
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item
          name="duplicateRestrictionPeriod"
          label="Duplicate request restriction"
          extra="Limit to one request per calendar day / week / month (same house, street and sector)"
        >
          <Select options={duplicatePeriodOptions} style={{ width: 220 }} />
        </Form.Item>
        <Form.Item>
          <Checkbox
            checked={windowEnabled}
            onChange={(e) => setWindowEnabled(e.target.checked)}
          >
            Set request open window (limit when users can submit)
          </Checkbox>
          <div style={{ color: "rgba(0,0,0,0.45)", fontSize: 12, marginTop: 4 }}>
            By default, users can submit anytime. Check to allow only in a time window.
          </div>
        </Form.Item>
        {windowEnabled && (
          <>
            <Form.Item
              label="Window start time"
              name="restrictionStartTime"
              rules={[{ required: true, message: "Required when window is set" }]}
              extra="e.g. 13:00"
            >
              <Input placeholder="13:00" style={{ width: 100 }} />
            </Form.Item>
            <Form.Item
              label="Window end time"
              name="restrictionEndTime"
              rules={[{ required: true, message: "Required when window is set" }]}
              extra="e.g. 14:00"
            >
              <Input placeholder="14:00" style={{ width: 100 }} />
            </Form.Item>
            <Form.Item
              label="Allowed days"
              name="restrictionDays"
              rules={[{ required: true, message: "Select at least one day" }]}
              extra="Pick days when users can submit, or use presets"
            >
              <AllowedDaysField />
            </Form.Item>
          </>
        )}
      </Form>
    </Edit>
  );
};
