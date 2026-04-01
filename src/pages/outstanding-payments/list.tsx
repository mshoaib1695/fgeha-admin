import { useEffect, useMemo, useState } from "react";
import { List } from "@refinedev/antd";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, message } from "antd";
import { API_URL, TOKEN_KEY } from "../../providers/constants";
import { getVToken } from "../../lib/v";
import * as XLSX from "xlsx";

type HouseDueRow = {
  id: number;
  subSectorId: number;
  houseNo: string;
  streetNo: string;
  totalOutstanding: number;
  graceDays: number;
  noticeMessage: string | null;
  isActive: boolean;
  dueDate?: string | null;
};

type InvoiceFormValues = {
  subSectorId: number;
  houseNo: string;
  streetNo: string;
  category: string;
  amount: number;
  reference?: string;
  note?: string;
};

type PaymentFormValues = {
  subSectorId: number;
  houseNo: string;
  streetNo: string;
  amount: number;
  category: string;
  reference?: string;
  note?: string;
};

type CategoryFormValues = {
  name: string;
  usage: "charge" | "payment" | "both";
};
type DuesSupportSettingsValues = {
  duesSupportEmail?: string;
  duesSupportPhone?: string;
};
type BulkUploadResult = {
  importId: string;
  createdAt: string;
  dryRun: boolean;
  stopOnError: boolean;
  totalRows: number;
  successCount: number;
  failCount: number;
  results: Array<{ rowNumber: number; status: "ok" | "error"; message: string }>;
};

type SubSector = {
  id: number;
  name: string;
  code: string;
};

type HouseDueCategory = {
  id: number;
  name: string;
  usage: "charge" | "payment" | "both";
  isActive: boolean;
};

function formatSubSectorLabel(s: SubSector): string {
  const name = String(s.name ?? "").trim();
  const code = String(s.code ?? "").trim();
  if (!name && !code) return `#${s.id}`;
  if (!name) return code;
  if (!code) return name;
  if (name.toLowerCase() === code.toLowerCase()) return name;
  return `${name} (${code})`;
}

type LedgerEntry = {
  id: number;
  entryType: "charge" | "payment" | "adjustment";
  category: string | null;
  amount: number | string;
  signedAmount: number | string;
  runningOutstanding: number | string;
  reference: string | null;
  note: string | null;
  createdAt: string;
};

function defaultNoticeMessage(graceDays: number): string {
  const days = Number.isFinite(graceDays) && graceDays >= 0 ? Math.floor(graceDays) : 30;
  if (days === 0) return "Please clear your outstanding payment immediately to continue receiving services.";
  return `Please clear your outstanding payment within ${days} days to continue receiving services.`;
}

export const OutstandingPaymentsList = () => {
  const [rows, setRows] = useState<HouseDueRow[]>([]);
  const [subSectors, setSubSectors] = useState<SubSector[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceForm] = Form.useForm<InvoiceFormValues>();
  const [paymentForm] = Form.useForm<PaymentFormValues>();
  const [settingsForm] = Form.useForm<{ graceDays: number; isActive: boolean; noticeMessage?: string }>();
  const [selectedAccount, setSelectedAccount] = useState<HouseDueRow | null>(null);
  const [ledgerRows, setLedgerRows] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "charge" | "payment">("all");
  const [showInvoiceAdvanced, setShowInvoiceAdvanced] = useState(false);
  const [showPaymentAdvanced, setShowPaymentAdvanced] = useState(false);
  const [paymentOutstanding, setPaymentOutstanding] = useState<number | null>(null);
  const [categories, setCategories] = useState<HouseDueCategory[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryForm] = Form.useForm<CategoryFormValues>();
  const [supportSettingsOpen, setSupportSettingsOpen] = useState(false);
  const [supportSettingsSaving, setSupportSettingsSaving] = useState(false);
  const [supportSettingsForm] = Form.useForm<DuesSupportSettingsValues>();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkDryRun, setBulkDryRun] = useState(true);
  const [bulkStopOnError, setBulkStopOnError] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterSubSectorId, setFilterSubSectorId] = useState<number | "all">("all");
  const [filterState, setFilterState] = useState<"all" | "active" | "inactive">("all");
  const [filterOutstanding, setFilterOutstanding] = useState<"all" | "due" | "clear">("all");
  const [sortBy, setSortBy] = useState<
    "updatedDesc" | "updatedAsc" | "outstandingDesc" | "outstandingAsc" | "dueDateAsc" | "dueDateDesc" | "houseAsc"
  >("updatedDesc");

  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const v = getVToken();
    if (v) headers["X-V"] = v;
    return headers;
  };

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/house-dues/admin/list`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load outstanding payments");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      message.error((e as Error).message ?? "Failed to load outstanding payments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubSectors = async () => {
    try {
      const res = await fetch(`${API_URL}/users/sub-sectors`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load sub-sectors");
      const data = await res.json();
      setSubSectors(Array.isArray(data) ? data : []);
    } catch {
      setSubSectors([]);
    }
  };

  const loadCategories = async (includeInactive = false) => {
    try {
      const res = await fetch(`${API_URL}/house-dues/admin/categories?includeInactive=${includeInactive ? "true" : "false"}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    void loadRows();
    void loadSubSectors();
    void loadCategories(false);
  }, []);

  const subSectorOptions = subSectors.map((s) => ({
    value: s.id,
    label: formatSubSectorLabel(s),
  }));
  const subSectorLabelById = new Map<number, string>(
    subSectors.map((s) => [s.id, formatSubSectorLabel(s)]),
  );
  const chargeCategoryOptions = categories
    .filter((c) => c.isActive && (c.usage === "charge" || c.usage === "both"))
    .map((c) => ({ value: c.name, label: c.name }));
  const paymentCategoryOptions = categories
    .filter((c) => c.isActive && (c.usage === "payment" || c.usage === "both"))
    .map((c) => ({ value: c.name, label: c.name }));
  const filteredRows = useMemo(() => {
    const getUpdatedTime = (row: HouseDueRow): number => {
      const updatedAt = (row as unknown as { updatedAt?: string }).updatedAt;
      return new Date(updatedAt ?? row.dueDate ?? 0).getTime();
    };
    const q = searchText.trim().toLowerCase();
    const data = rows.filter((r) => {
      if (filterSubSectorId !== "all" && Number(r.subSectorId) !== Number(filterSubSectorId)) return false;
      if (filterState === "active" && r.isActive !== true) return false;
      if (filterState === "inactive" && r.isActive !== false) return false;
      const outstanding = Number(r.totalOutstanding || 0);
      if (filterOutstanding === "due" && outstanding <= 0) return false;
      if (filterOutstanding === "clear" && outstanding > 0) return false;
      if (!q) return true;
      const subSectorLabel = String(subSectorLabelById.get(r.subSectorId) ?? `#${r.subSectorId}`).toLowerCase();
      return (
        String(r.houseNo ?? "").toLowerCase().includes(q) ||
        String(r.streetNo ?? "").toLowerCase().includes(q) ||
        subSectorLabel.includes(q) ||
        String(outstanding.toFixed(2)).includes(q)
      );
    });
    const sorted = [...data];
    sorted.sort((a, b) => {
      if (sortBy === "outstandingDesc") return Number(b.totalOutstanding || 0) - Number(a.totalOutstanding || 0);
      if (sortBy === "outstandingAsc") return Number(a.totalOutstanding || 0) - Number(b.totalOutstanding || 0);
      if (sortBy === "dueDateAsc") return new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime();
      if (sortBy === "dueDateDesc") return new Date(b.dueDate ?? 0).getTime() - new Date(a.dueDate ?? 0).getTime();
      if (sortBy === "houseAsc") {
        const houseCmp = String(a.houseNo ?? "").localeCompare(String(b.houseNo ?? ""));
        if (houseCmp !== 0) return houseCmp;
        return String(a.streetNo ?? "").localeCompare(String(b.streetNo ?? ""));
      }
      if (sortBy === "updatedAsc") return getUpdatedTime(a) - getUpdatedTime(b);
      return getUpdatedTime(b) - getUpdatedTime(a);
    });
    return sorted;
  }, [rows, searchText, filterSubSectorId, filterState, filterOutstanding, sortBy, subSectorLabelById]);

  const setHouseDefaults = (house?: Partial<HouseDueRow>) => {
    const subSectorId = house?.subSectorId ?? subSectors[0]?.id ?? 1;
    const houseNo = house?.houseNo ?? "";
    const streetNo = house?.streetNo ?? "";
    return { subSectorId, houseNo, streetNo };
  };

  const openCreateInvoice = (house?: HouseDueRow) => {
    const defaults = setHouseDefaults(house);
    invoiceForm.setFieldsValue({
      ...defaults,
      category: chargeCategoryOptions[0]?.value ?? "",
      amount: 0,
      reference: "",
      note: "",
    });
    setShowInvoiceAdvanced(false);
    setInvoiceOpen(true);
  };

  const openRecordPayment = (house?: HouseDueRow) => {
    const defaults = setHouseDefaults(house);
    paymentForm.setFieldsValue({
      ...defaults,
      amount: 0,
      category: paymentCategoryOptions[0]?.value ?? "",
      reference: "",
      note: "",
    });
    setShowPaymentAdvanced(false);
    setPaymentOutstanding(house ? Number(house.totalOutstanding ?? 0) : null);
    setPaymentOpen(true);
  };

  const resolveOutstandingForPayment = async (
    subSectorId: number,
    houseNo: string,
    streetNo: string,
  ): Promise<number> => {
    const qs = new URLSearchParams({
      subSectorId: String(Number(subSectorId)),
      houseNo: String(houseNo).trim(),
      streetNo: String(streetNo).trim(),
    });
    const byHouseRes = await fetch(`${API_URL}/house-dues/admin/by-house?${qs.toString()}`, {
      headers: authHeaders(),
    });
    if (!byHouseRes.ok) throw new Error("Failed to validate outstanding balance");
    const byHouse = await byHouseRes.json();
    return Number(byHouse?.totalOutstanding ?? 0);
  };

  const submitEntry = async (payload: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/house-dues/admin/entries`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Failed to save entry" }));
      const m = Array.isArray(err?.message) ? err.message.join(", ") : (err?.message ?? "Failed to save entry");
      throw new Error(m);
    }
  };

  const submitInvoice = async () => {
    const values = await invoiceForm.validateFields();
    setSaving(true);
    try {
      await submitEntry({
        subSectorId: Number(values.subSectorId),
        houseNo: String(values.houseNo).trim(),
        streetNo: String(values.streetNo).trim(),
        entryType: "charge",
        category: String(values.category).trim(),
        amount: Number(values.amount),
        reference: String(values.reference ?? "").trim(),
        note: String(values.note ?? "").trim(),
      });
      setInvoiceOpen(false);
      message.success("Invoice created");
      await loadRows();
      if (selectedAccount) await openHistory(selectedAccount);
    } catch (err) {
      message.error((err as Error).message ?? "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async () => {
    const values = await paymentForm.validateFields();
    setSaving(true);
    try {
      const outstanding = await resolveOutstandingForPayment(
        Number(values.subSectorId),
        String(values.houseNo).trim(),
        String(values.streetNo).trim(),
      );
      setPaymentOutstanding(outstanding);
      const payAmount = Number(values.amount ?? 0);
      if (outstanding <= 0) {
        throw new Error("No outstanding balance found for this house.");
      }
      if (payAmount > outstanding) {
        throw new Error(`Amount received cannot exceed outstanding balance (${outstanding.toFixed(2)}).`);
      }

      await submitEntry({
        subSectorId: Number(values.subSectorId),
        houseNo: String(values.houseNo).trim(),
        streetNo: String(values.streetNo).trim(),
        entryType: "payment",
        category: String(values.category || "Payment").trim(),
        amount: Number(values.amount),
        reference: String(values.reference ?? "").trim(),
        note: String(values.note ?? "").trim(),
      });
      setPaymentOpen(false);
      message.success("Payment recorded");
      await loadRows();
      if (selectedAccount) await openHistory(selectedAccount);
    } catch (err) {
      message.error((err as Error).message ?? "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (row: HouseDueRow) => {
    setSelectedAccount(row);
    setHistoryOpen(true);
    setHistoryFilter("all");
    setLedgerLoading(true);
    setLedgerRows([]);
    try {
      const qs = new URLSearchParams({
        subSectorId: String(row.subSectorId),
        houseNo: row.houseNo,
        streetNo: row.streetNo,
      });
      const res = await fetch(`${API_URL}/house-dues/admin/ledger?${qs.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load account history");
      const data = await res.json();
      setLedgerRows(Array.isArray(data?.entries) ? data.entries : []);
    } catch (e) {
      message.error((e as Error).message ?? "Failed to load account history");
    } finally {
      setLedgerLoading(false);
    }
  };

  const filteredHistory =
    historyFilter === "all" ? ledgerRows : ledgerRows.filter((e) => e.entryType === historyFilter);

  const openCreate = () => {
    const defaults = setHouseDefaults(undefined);
    invoiceForm.setFieldsValue({
      ...defaults,
      subSectorId: 1,
      category: chargeCategoryOptions[0]?.value ?? "",
      amount: 0,
    });
    setInvoiceOpen(true);
  };

  const openCategoryManager = async () => {
    setCategoriesOpen(true);
    categoryForm.setFieldsValue({ name: "", usage: "charge" });
    await loadCategories(true);
  };

  const submitCategory = async () => {
    const values = await categoryForm.validateFields();
    setCategorySaving(true);
    try {
      const res = await fetch(`${API_URL}/house-dues/admin/categories`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: String(values.name).trim(),
          usage: values.usage,
        }),
      });
      if (!res.ok) throw new Error("Failed to save category");
      message.success("Category saved");
      categoryForm.setFieldsValue({ name: "", usage: values.usage });
      await loadCategories(true);
      await loadCategories(false);
    } catch (e) {
      message.error((e as Error).message ?? "Failed to save category");
    } finally {
      setCategorySaving(false);
    }
  };

  const toggleCategoryActive = async (category: HouseDueCategory, isActive: boolean) => {
    setCategorySaving(true);
    try {
      const res = await fetch(`${API_URL}/house-dues/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update category");
      await loadCategories(true);
      await loadCategories(false);
    } catch (e) {
      message.error((e as Error).message ?? "Failed to update category");
    } finally {
      setCategorySaving(false);
    }
  };

  const openSettings = (row: HouseDueRow) => {
    setSelectedAccount(row);
    settingsForm.setFieldsValue({
      graceDays: Number(row.graceDays ?? 30),
      isActive: row.isActive !== false,
      noticeMessage:
        String(row.noticeMessage ?? "").trim() || defaultNoticeMessage(Number(row.graceDays ?? 30)),
    });
    setSettingsOpen(true);
  };

  const submitSettings = async () => {
    if (!selectedAccount) return;
    const values = await settingsForm.validateFields();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/house-dues/admin/settings`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          subSectorId: selectedAccount.subSectorId,
          houseNo: selectedAccount.houseNo,
          streetNo: selectedAccount.streetNo,
          graceDays: Number(values.graceDays ?? 30),
          isActive: values.isActive !== false,
          noticeMessage: String(values.noticeMessage ?? "").trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update settings" }));
        const m = Array.isArray(err?.message) ? err.message.join(", ") : (err?.message ?? "Failed to update settings");
        throw new Error(m);
      }
      message.success("Account settings updated");
      setSettingsOpen(false);
      await loadRows();
    } catch (err) {
      message.error((err as Error).message ?? "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const openSupportSettings = async () => {
    setSupportSettingsOpen(true);
    setSupportSettingsSaving(true);
    try {
      const res = await fetch(`${API_URL}/app-settings`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load support settings");
      const data = await res.json();
      supportSettingsForm.setFieldsValue({
        duesSupportEmail: String(data?.duesSupportEmail ?? "").trim(),
        duesSupportPhone: String(data?.duesSupportPhone ?? "").trim(),
      });
    } catch (e) {
      message.error((e as Error).message ?? "Failed to load support settings");
    } finally {
      setSupportSettingsSaving(false);
    }
  };

  const submitSupportSettings = async () => {
    const values = await supportSettingsForm.validateFields();
    setSupportSettingsSaving(true);
    try {
      const res = await fetch(`${API_URL}/app-settings`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          duesSupportEmail: String(values.duesSupportEmail ?? "").trim(),
          duesSupportPhone: String(values.duesSupportPhone ?? "").trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to save support settings" }));
        const m = Array.isArray(err?.message) ? err.message.join(", ") : (err?.message ?? "Failed to save support settings");
        throw new Error(m);
      }
      message.success("Support contact settings updated");
      setSupportSettingsOpen(false);
    } catch (e) {
      message.error((e as Error).message ?? "Failed to save support settings");
    } finally {
      setSupportSettingsSaving(false);
    }
  };

  const openBulkUpload = () => {
    setBulkFile(null);
    setBulkResult(null);
    setBulkDryRun(true);
    setBulkStopOnError(false);
    setBulkUploadOpen(true);
  };

  const downloadSampleExcel = () => {
    const chargeCat = categories.find((c) => c.isActive && (c.usage === "charge" || c.usage === "both"));
    const paymentCat = categories.find((c) => c.isActive && (c.usage === "payment" || c.usage === "both"));
    const sampleRows = [
      {
        subSectorId: 1,
        houseNo: "14",
        streetNo: "17",
        entryType: "charge",
        categoryId: chargeCat?.id ?? 1,
        amount: 5000,
        graceDays: 30,
        reference: "INV-2026-001",
        note: "Monthly charge",
      },
      {
        subSectorId: 1,
        houseNo: "14",
        streetNo: "17",
        entryType: "payment",
        categoryId: paymentCat?.id ?? (chargeCat?.id ?? 1),
        amount: 2000,
        graceDays: 30,
        reference: "REC-2026-001",
        note: "Partial payment",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "dues-upload");
    XLSX.writeFile(wb, "house-dues-bulk-sample.xlsx");
  };

  const onUploadExcelFile = async (file?: File | null) => {
    setBulkFile(file ?? null);
    setBulkResult(null);
    if (file) message.success(`Selected: ${file.name}`);
  };

  const submitBulkUpload = async (forceDryRun?: boolean) => {
    if (!bulkFile) {
      message.warning("Please choose an Excel file first.");
      return;
    }
    setBulkUploading(true);
    try {
      const isDryRun = forceDryRun ?? bulkDryRun;
      const token = localStorage.getItem(TOKEN_KEY);
      const fd = new FormData();
      fd.append("file", bulkFile);
      fd.append("dryRun", String(isDryRun));
      fd.append("stopOnError", String(bulkStopOnError));
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const v = getVToken();
      if (v) (headers as Record<string, string>)["X-V"] = v;
      const res = await fetch(`${API_URL}/house-dues/admin/entries/bulk-upload`, {
        method: "POST",
        headers,
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const m = Array.isArray(data?.message) ? data.message.join(", ") : (data?.message ?? "Bulk upload failed");
        throw new Error(m);
      }
      const result = data as BulkUploadResult;
      setBulkResult(result);
      if (result.successCount > 0 && !isDryRun) {
        await loadRows();
      }
      if (result.failCount > 0) {
        setBulkDryRun(true);
        message.warning(`Processed with ${result.failCount} error(s). Import ID: ${result.importId}`);
      } else {
        if (isDryRun) {
          setBulkDryRun(false);
          message.success(`Good enough to be uploaded. Import ID: ${result.importId}`);
        } else {
          setBulkDryRun(true);
          message.success(`Import complete. Import ID: ${result.importId}`);
        }
      }
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadBulkResultReport = () => {
    if (!bulkResult) return;
    const ws = XLSX.utils.json_to_sheet(
      bulkResult.results.map((r) => ({ importId: bulkResult.importId, rowNumber: r.rowNumber, status: r.status, message: r.message })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "bulk-upload-report");
    XLSX.writeFile(wb, `house-dues-bulk-report-${bulkResult.importId}.xlsx`);
  };

  return (
    <List
      title="House Outstanding Payments"
      headerButtons={() => (
        <Space>
          <Button onClick={() => void openSupportSettings()}>Support Settings</Button>
          <Button onClick={openBulkUpload}>Bulk Upload (Excel)</Button>
          <Button onClick={() => void openCategoryManager()}>Manage Categories</Button>
          <Button onClick={() => openRecordPayment(undefined)}>Receive Payment</Button>
          <Button type="primary" onClick={openCreate}>
            Add Charge
          </Button>
        </Space>
      )}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            allowClear
            placeholder="Search house, street, sub-sector, amount"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            value={filterSubSectorId}
            onChange={(v) => setFilterSubSectorId(v)}
            style={{ width: 180 }}
            options={[{ value: "all", label: "All sub-sectors" }, ...subSectorOptions]}
          />
          <Select
            value={filterState}
            onChange={(v) => setFilterState(v)}
            style={{ width: 140 }}
            options={[
              { value: "all", label: "All states" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <Select
            value={filterOutstanding}
            onChange={(v) => setFilterOutstanding(v)}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "All balances" },
              { value: "due", label: "With due" },
              { value: "clear", label: "Clear (0)" },
            ]}
          />
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            style={{ width: 200 }}
            options={[
              { value: "updatedDesc", label: "Sort: Latest first" },
              { value: "updatedAsc", label: "Sort: Oldest first" },
              { value: "outstandingDesc", label: "Sort: Outstanding high-low" },
              { value: "outstandingAsc", label: "Sort: Outstanding low-high" },
              { value: "dueDateAsc", label: "Sort: Due date nearest" },
              { value: "dueDateDesc", label: "Sort: Due date farthest" },
              { value: "houseAsc", label: "Sort: House A-Z" },
            ]}
          />
          <Button
            onClick={() => {
              setSearchText("");
              setFilterSubSectorId("all");
              setFilterState("all");
              setFilterOutstanding("all");
              setSortBy("updatedDesc");
            }}
          >
            Clear filters
          </Button>
          <Button onClick={() => void loadRows()} loading={loading}>
            Refresh
          </Button>
        </Space>
      </Card>
      <Table<HouseDueRow> rowKey="id" dataSource={filteredRows} loading={loading} pagination={{ pageSize: 15 }}>
        <Table.Column
          title="Sub-sector"
          width={160}
          render={(_, r) => subSectorLabelById.get(r.subSectorId) ?? `#${r.subSectorId}`}
        />
        <Table.Column dataIndex="houseNo" title="House no" width={100} />
        <Table.Column dataIndex="streetNo" title="Street no" width={100} />
        <Table.Column
          title="Total Outstanding"
          width={150}
          render={(_, r) => (
            <Tag color={Number(r.totalOutstanding || 0) > 0 ? "red" : "green"}>
              {Number(r.totalOutstanding || 0).toFixed(2)}
            </Tag>
          )}
        />
        <Table.Column dataIndex="graceDays" title="Grace days" width={100} />
        <Table.Column title="State" width={100} render={(_, r) => (r.isActive ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>)} />
        <Table.Column
          title="Actions"
          width={290}
          render={(_, r: HouseDueRow) => (
            <Space>
              <Button type="link" onClick={() => openCreateInvoice(r)}>
                Add charge
              </Button>
              <Button type="link" onClick={() => openRecordPayment(r)}>
                Receive payment
              </Button>
              <Button type="link" onClick={() => void openHistory(r)}>
                History
              </Button>
              <Button type="link" onClick={() => openSettings(r)}>
                Settings
              </Button>
            </Space>
          )}
        />
      </Table>

      <Modal
        open={invoiceOpen}
        title="Add Charge"
        onCancel={() => setInvoiceOpen(false)}
        onOk={submitInvoice}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={invoiceForm} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name="subSectorId" label="Sub-sector" rules={[{ required: true, message: "Please select sub-sector" }]}>
                <Select
                  options={subSectorOptions}
                  placeholder="Select sub-sector"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="houseNo" label="House no" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="streetNo" label="Street no" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select
                  options={chargeCategoryOptions}
                  placeholder="Select charge category"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Button type="link" onClick={() => setShowInvoiceAdvanced((v) => !v)}>
                {showInvoiceAdvanced ? "Hide additional details" : "More details"}
              </Button>
            </Col>
            {showInvoiceAdvanced ? (
              <>
                <Col span={12}>
                  <Form.Item name="reference" label="Reference">
                    <Input placeholder="Reference no" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="note" label="Note">
                    <Input placeholder="Optional note" />
                  </Form.Item>
                </Col>
              </>
            ) : null}
          </Row>
        </Form>
      </Modal>

      <Modal
        open={paymentOpen}
        title="Receive Payment"
        onCancel={() => setPaymentOpen(false)}
        onOk={submitPayment}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={paymentForm} layout="vertical" requiredMark={false}>
          {paymentOutstanding != null ? (
            <Tag color={paymentOutstanding > 0 ? "red" : "green"} style={{ marginBottom: 8 }}>
              Outstanding Balance: {Number(paymentOutstanding).toFixed(2)}
            </Tag>
          ) : null}
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name="subSectorId" label="Sub-sector" rules={[{ required: true, message: "Please select sub-sector" }]}>
                <Select
                  options={subSectorOptions}
                  placeholder="Select sub-sector"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="houseNo" label="House no" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="streetNo" label="Street no" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount Received"
                rules={[
                  { required: true },
                  {
                    validator: async (_, value) => {
                      const amount = Number(value ?? 0);
                      if (!Number.isFinite(amount) || amount <= 0) {
                        throw new Error("Enter a valid amount greater than 0.");
                      }
                      const formValues = paymentForm.getFieldsValue();
                      const outstanding = await resolveOutstandingForPayment(
                        Number(formValues.subSectorId),
                        String(formValues.houseNo ?? "").trim(),
                        String(formValues.streetNo ?? "").trim(),
                      );
                      setPaymentOutstanding(outstanding);
                      if (outstanding <= 0) {
                        throw new Error("No outstanding balance found for this house.");
                      }
                      if (amount > outstanding) {
                        throw new Error(`Amount cannot exceed outstanding balance (${outstanding.toFixed(2)}).`);
                      }
                    },
                  },
                ]}
              >
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Payment Method / Category" rules={[{ required: true }]}>
                <Select
                  options={paymentCategoryOptions}
                  placeholder="Select payment category"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Button type="link" onClick={() => setShowPaymentAdvanced((v) => !v)}>
                {showPaymentAdvanced ? "Hide additional details" : "More details"}
              </Button>
            </Col>
            {showPaymentAdvanced ? (
              <>
                <Col span={12}>
                  <Form.Item name="reference" label="Receipt / Transaction No">
                    <Input placeholder="e.g. REC-2026-0001" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="note" label="Note">
                    <Input placeholder="Optional note" />
                  </Form.Item>
                </Col>
              </>
            ) : null}
          </Row>
        </Form>
      </Modal>

      <Modal
        open={settingsOpen}
        title={
          selectedAccount
            ? `Account Settings: ${selectedAccount.houseNo}/${selectedAccount.streetNo}`
            : "Account Settings"
        }
        onCancel={() => setSettingsOpen(false)}
        onOk={submitSettings}
        okText="Save"
        confirmLoading={saving}
      >
        <Form form={settingsForm} layout="vertical" requiredMark={false}>
          <Form.Item name="graceDays" label="Grace days" rules={[{ required: true }]}>
            <InputNumber min={0} max={365} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isActive" label="State" rules={[{ required: true }]}>
            <Select
              options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ]}
            />
          </Form.Item>
          <Form.Item name="noticeMessage" label="House message">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={bulkUploadOpen}
        title="Bulk Upload Charges / Payments (Excel)"
        onCancel={() => setBulkUploadOpen(false)}
        onOk={() => void submitBulkUpload()}
        okText={bulkDryRun ? "Validate File" : "Upload Rows"}
        cancelText="Close"
        confirmLoading={bulkUploading}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            File columns required: <b>subSectorId, houseNo, streetNo, entryType, categoryId, amount</b>
            <br />
            Optional: <b>graceDays, reference, note</b>
          </div>
          <Space wrap>
            <Button onClick={downloadSampleExcel}>Download Sample Excel</Button>
            <Button onClick={() => document.getElementById("dues-bulk-file-input")?.click()} disabled={bulkUploading}>
              Choose Excel File
            </Button>
            <input
              id="dues-bulk-file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => void onUploadExcelFile(e.target.files?.[0] ?? null)}
              disabled={bulkUploading}
              style={{ display: "none" }}
            />
            {bulkResult ? <Button onClick={downloadBulkResultReport}>Download Result Report</Button> : null}
          </Space>
          {bulkFile ? <Tag color="blue">Selected file: {bulkFile.name}</Tag> : <Tag>No file selected yet.</Tag>}
          {bulkResult ? (
            bulkResult.failCount > 0 ? (
            <Table<{ rowNumber: number; status: "ok" | "error"; message: string }>
              rowKey={(r) => String(r.rowNumber)}
              size="small"
              dataSource={bulkResult.results.filter((r) => r.status === "error")}
              pagination={{ pageSize: 5 }}
              columns={[
                { title: "Error Row", dataIndex: "rowNumber", width: 90 },
                { title: "Issue", dataIndex: "message" },
              ]}
            />
            ) : (
              <Tag color="green">{bulkResult.dryRun ? "Good enough to be uploaded." : "Upload completed successfully."}</Tag>
            )
          ) : null}
        </Space>
      </Modal>

      <Modal
        open={supportSettingsOpen}
        title="Outstanding Dues Contact Settings"
        onCancel={() => setSupportSettingsOpen(false)}
        onOk={submitSupportSettings}
        okText="Save"
        confirmLoading={supportSettingsSaving}
      >
        <Form form={supportSettingsForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="duesSupportEmail"
            label="Support email"
            extra="Shown to app users in outstanding dues alert."
          >
            <Input placeholder="e.g. support@fgeha.online" />
          </Form.Item>
          <Form.Item
            name="duesSupportPhone"
            label="Support phone"
            extra="Shown to app users in outstanding dues alert."
          >
            <Input placeholder="e.g. +92 300 0000000" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={categoriesOpen}
        title="Manage Charge / Payment Categories"
        onCancel={() => setCategoriesOpen(false)}
        footer={null}
      >
        <Form form={categoryForm} layout="vertical" requiredMark={false} onFinish={() => void submitCategory()}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="Category Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Water & Conservancy" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="usage" label="Usage" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "charge", label: "Charge only" },
                    { value: "payment", label: "Payment only" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={4} style={{ display: "flex", alignItems: "end" }}>
              <Button type="primary" htmlType="submit" loading={categorySaving} block>
                Save
              </Button>
            </Col>
          </Row>
        </Form>
        <Table<HouseDueCategory>
          rowKey="id"
          size="small"
          dataSource={categories}
          pagination={{ pageSize: 8 }}
          loading={categorySaving}
        >
          <Table.Column dataIndex="id" title="ID" width={80} />
          <Table.Column dataIndex="name" title="Category" />
          <Table.Column
            dataIndex="usage"
            title="Usage"
            render={(v: HouseDueCategory["usage"]) =>
              v === "charge" ? "Charge" : v === "payment" ? "Payment" : "Both"
            }
          />
          <Table.Column
            title="Status"
            render={(_, record: HouseDueCategory) => (
              <Select
                value={record.isActive ? "active" : "inactive"}
                style={{ width: 110 }}
                onChange={(value) => void toggleCategoryActive(record, value === "active")}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            )}
          />
        </Table>
      </Modal>

      <Modal
        open={historyOpen}
        title={
          selectedAccount
            ? `History: House ${selectedAccount.houseNo} / Street ${selectedAccount.streetNo}`
            : "History"
        }
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={900}
      >
        <Space style={{ marginBottom: 12 }}>
          <Tag color={selectedAccount && selectedAccount.totalOutstanding > 0 ? "red" : "green"}>
            Current Outstanding: {selectedAccount ? Number(selectedAccount.totalOutstanding || 0).toFixed(2) : "0.00"}
          </Tag>
          <Select
            value={historyFilter}
            onChange={(v) => setHistoryFilter(v)}
            style={{ width: 170 }}
            options={[
              { value: "all", label: "All entries" },
              { value: "charge", label: "Charges only" },
              { value: "payment", label: "Payments only" },
            ]}
          />
        </Space>
        <Table<LedgerEntry>
          rowKey="id"
          loading={ledgerLoading}
          dataSource={filteredHistory}
          pagination={{ pageSize: 10 }}
          size="small"
          expandable={{
            expandedRowRender: (record) => (
              <div>
                <div><strong>Reference:</strong> {record.reference || "-"}</div>
                <div><strong>Note:</strong> {record.note || "-"}</div>
              </div>
            ),
          }}
        >
          <Table.Column
            dataIndex="createdAt"
            title="Date"
            render={(v: string) => new Date(v).toLocaleString()}
          />
          <Table.Column
            dataIndex="entryType"
            title="Type"
            render={(v: LedgerEntry["entryType"]) =>
              v === "charge" ? "Charge" : v === "payment" ? "Payment" : "Adjustment"
            }
          />
          <Table.Column dataIndex="category" title="Category" />
          <Table.Column title="Amount" render={(_, r) => Number(r.amount || 0).toFixed(2)} />
          <Table.Column title="Balance" render={(_, r) => Number(r.runningOutstanding || 0).toFixed(2)} />
        </Table>
      </Modal>
    </List>
  );
};
