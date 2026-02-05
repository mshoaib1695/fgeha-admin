import { useLogin } from "@refinedev/core";
import { Layout, Form, Input, Button, Card } from "antd";

export const LoginPage = () => {
  const { mutate: login, isPending } = useLogin();

  const onFinish = (values: { email: string; password: string }) => {
    login(values, { onSuccess: () => {} });
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
      }}
    >
      <Card title="Admin Login" style={{ width: 400 }}>
        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ email: "", password: "" }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input type="email" placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isPending}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};
