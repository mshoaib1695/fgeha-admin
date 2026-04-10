import { Show, TextField, DateField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography, Card, Image, Space } from "antd";
import { useEffect, useState } from "react";
import { API_URL } from "../../providers/constants";
import { TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";

const { Title } = Typography;

function idCardImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const base = (API_URL || "").replace(/\/$/, "");
  return base ? `${base}/${path.trim()}` : null;
}

export const UserShow = () => {
  const { query } = useShow();
  const record = query?.data?.data;
  const [outstanding, setOutstanding] = useState<number>(0);
  const [dueMessage, setDueMessage] = useState<string>("-");
  const frontUrl = idCardImageUrl(record?.idCardFront);
  const backUrl = idCardImageUrl(record?.idCardBack);
  const hasAnyIdCard = frontUrl || backUrl;

  useEffect(() => {
    const load = async () => {
      if (!record?.subSectorId || !record?.houseNo || !record?.streetNo) return;
      const token = localStorage.getItem(TOKEN_KEY);
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const v = getVToken();
      if (v) headers["X-V"] = v;
      const params = new URLSearchParams({
        subSectorId: String(record.subSectorId),
        houseNo: String(record.houseNo),
        streetNo: String(record.streetNo),
      });
      try {
        const res = await fetch(`${API_URL}/house-dues/admin/by-house?${params.toString()}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        setOutstanding(Number(data?.totalOutstanding ?? 0));
        setDueMessage(String(data?.message ?? data?.noticeMessage ?? "-"));
      } catch {
        setOutstanding(0);
      }
    };
    void load();
  }, [record?.subSectorId, record?.houseNo, record?.streetNo]);

  return (
    <Show isLoading={query?.isLoading}>
      <Title level={5}>ID</Title>
      <TextField value={record?.id} />
      <Title level={5}>Email</Title>
      <TextField value={record?.email} />
      <Title level={5}>Full name</Title>
      <TextField value={record?.fullName} />
      <Title level={5}>Phone</Title>
      <TextField value={record?.phoneCountryCode && record?.phoneNumber ? `${record.phoneCountryCode} ${record.phoneNumber}` : "-"} />
      <Title level={5}>House no</Title>
      <TextField value={record?.houseNo ?? "-"} />
      <Title level={5}>Street no</Title>
      <TextField value={record?.streetNo ?? "-"} />
      <Title level={5}>Sub-sector</Title>
      <TextField value={record?.subSector?.name ?? record?.subSectorId ?? "-"} />
      <Title level={5}>Role</Title>
      <TextField value={record?.role} />
      <Title level={5}>Approval status</Title>
      <TextField value={record?.approvalStatus} />
      <Title level={5}>Account status</Title>
      <TextField value={record?.accountStatus ?? "active"} />
      <Title level={5}>Outstanding payment</Title>
      <TextField value={outstanding > 0 ? String(Math.round(outstanding)) : "Clear"} />
      <Title level={5}>Outstanding message</Title>
      <TextField value={dueMessage} />
      {hasAnyIdCard && (
        <>
          <Title level={5} style={{ marginTop: 24 }}>ID card photos</Title>
          <Card size="small" style={{ marginBottom: 16 }}>
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
        </>
      )}
      <Title level={5}>Created at</Title>
      <DateField value={record?.createdAt} />
    </Show>
  );
};
