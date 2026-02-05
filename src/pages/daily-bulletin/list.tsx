import { useState, useEffect, useCallback } from "react";
import { List } from "@refinedev/antd";
import { Table, Form, Input, DatePicker, Button, Space, message, Modal } from "antd";
import { API_URL, TOKEN_KEY } from "../../providers/constants";

type BulletinRecord = {
  id: number;
  date: string;
  title: string;
  description: string | null;
  filePath: string;
  fileType: string;
};

export const DailyBulletinList = () => {
  const [bulletins, setBulletins] = useState<BulletinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadList = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setBulletins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/daily-bulletin`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setBulletins([]);
        return;
      }
      const json = await res.json();
      const data = json?.data ?? (Array.isArray(json) ? json : []);
      setBulletins(Array.isArray(data) ? data : []);
    } catch {
      setBulletins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleUpload = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    const values = form.getFieldsValue();
    const date = values.date?.format?.("YYYY-MM-DD") ?? values.date;
    if (!date || !values.title?.trim()) {
      message.error("Date and title are required.");
      return;
    }
    if (!fileList) {
      message.error("Please select a PDF, CSV, or Excel file.");
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      message.error("Not authenticated.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileList);
      formData.append("date", date);
      formData.append("title", values.title.trim());
      if (values.description?.trim()) formData.append("description", values.description.trim());
      const res = await fetch(`${API_URL}/daily-bulletin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Upload failed");
      }
      message.success("Water tanker list saved for " + date);
      form.resetFields();
      setFileList(null);
      setModalOpen(false);
      loadList();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (date: string) => {
    Modal.confirm({
      title: "Delete bulletin?",
      content: `Remove the water tanker list for ${date}?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/daily-bulletin/${date}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Delete failed");
          message.success("Deleted");
          loadList();
        } catch {
          message.error("Delete failed");
        }
      },
    });
  };

  const fileUrl = (path: string) => (API_URL ? `${API_URL.replace(/\/$/, "")}/${path}` : path);

  return (
    <>
      <List
        title="Water tanker list (daily)"
        createButtonProps={{
          children: "Set list for a date",
          onClick: () => setModalOpen(true),
        }}
      >
        <Table
          dataSource={bulletins}
          loading={loading}
          rowKey="id"
          pagination={false}
          columns={[
            { dataIndex: "date", title: "Date", width: 120, render: (d: string) => d },
            { dataIndex: "title", title: "Title", ellipsis: true },
            {
              dataIndex: "fileType",
              title: "File",
              width: 80,
              render: (type: string, r: BulletinRecord) => (
                <Space>
                  <span style={{ textTransform: "uppercase" }}>{type}</span>
                  <a href={fileUrl(r.filePath)} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                </Space>
              ),
            },
            {
              title: "Actions",
              width: 100,
              render: (_: unknown, r: BulletinRecord) => (
                <Button type="link" danger size="small" onClick={() => handleDelete(r.date)}>
                  Delete
                </Button>
              ),
            },
          ]}
        />
      </List>

      <Modal
        title="Set water tanker list for a date"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setFileList(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Select date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="e.g. Water tanker schedule for today" />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea rows={2} placeholder="Short description for the app" />
          </Form.Item>
          <Form.Item
            label="File (PDF, CSV, or Excel)"
            required
            help="Upload the daily list as PDF, CSV, or Excel (.xls, .xlsx)"
          >
            <input
              type="file"
              accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFileList(e.target.files?.[0] ?? null)}
            />
            {fileList && (
              <div style={{ marginTop: 8, color: "#666" }}>{fileList.name}</div>
            )}
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={uploading}>
                Save
              </Button>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                  setFileList(null);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
