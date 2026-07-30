import React, { useEffect, useState } from "react";
import { DollarSign, Plus, X, Check, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../../lib/auth/AuthProvider";
import { logAudit } from "../../../lib/audit/logAction";
import { PriceChangeRequestRow, ServiceRow } from "../../../types/catalog.types";

// S5.8 — Đề xuất đổi giá. Bất kỳ ai đọc được catalog đều tự đề xuất được
// (RLS bespoke policy — không dùng gate 'create' theo module như các bảng
// khác, xem migration 0004). Chỉ ai có quyền 'update' catalog (Master Admin)
// mới duyệt/từ chối được, qua RPC decide_price_change_request().
type RequestWithService = PriceChangeRequestRow & {
  services: Pick<ServiceRow, "code" | "name" | "price"> | null;
  requester: { name: string } | null;
  decider: { name: string } | null;
};

const formatVnd = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function PriceChangeRequests() {
  const { can, staff } = useAuth();
  const canDecide = can("catalog", "update");

  const [requests, setRequests] = useState<RequestWithService[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [proposeServiceId, setProposeServiceId] = useState("");
  const [proposePrice, setProposePrice] = useState("");
  const [proposeReason, setProposeReason] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (kind: "success" | "error", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    void loadAll();
    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("open-price-request-modal", handleOpenModal);
    return () => window.removeEventListener("open-price-request-modal", handleOpenModal);
  }, []);

  async function loadAll() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: reqData, error: reqErr }, { data: svcData }] = await Promise.all([
      supabase
        .from("price_change_requests")
        .select(
          "*, services(code, name, price), requester:staff!price_change_requests_requested_by_fkey(name), decider:staff!price_change_requests_decided_by_fkey(name)"
        )
        .order("created_at", { ascending: false }),
      supabase.from("services").select("*").order("code"),
    ]);
    if (reqErr) showToast("error", reqErr.message);
    setRequests((reqData as unknown as RequestWithService[]) ?? []);
    setServices((svcData as ServiceRow[]) ?? []);
    setLoading(false);
  }

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !staff || !proposeServiceId || !proposePrice.trim() || !proposeReason.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("price_change_requests").insert({
      service_id: proposeServiceId,
      proposed_price: Number(proposePrice),
      reason: proposeReason.trim(),
      requested_by: staff.id,
    });
    setSaving(false);
    if (error) {
      showToast("error", error.message);
      return;
    }
    const svc = services.find((s) => s.id === proposeServiceId);
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: "propose_price_change",
      entity: "price_change_requests",
      entityId: proposeServiceId,
      after: { service: svc?.code, proposedPrice: Number(proposePrice), reason: proposeReason.trim() },
    });
    setShowModal(false);
    setProposeServiceId("");
    setProposePrice("");
    setProposeReason("");
    await loadAll();
    showToast("success", "Đã gửi đề xuất đổi giá lên Master Admin xét duyệt.");
  }

  async function handleDecide(req: RequestWithService, approve: boolean) {
    if (!supabase || !staff) return;
    if (!window.confirm(approve ? `Duyệt giá mới ${formatVnd(req.proposed_price)} cho ${req.services?.code}?` : "Từ chối đề xuất này?")) return;
    const { error } = await supabase.rpc("decide_price_change_request", { p_request_id: req.id, p_approve: approve });
    if (error) {
      showToast("error", error.message);
      return;
    }
    await logAudit({
      actorId: staff.id,
      module: "catalog",
      action: approve ? "approve_price_change" : "reject_price_change",
      entity: "price_change_requests",
      entityId: req.id,
      before: { status: req.status },
      after: { status: approve ? "approved" : "rejected" },
    });
    await loadAll();
    showToast("success", approve ? "Đã duyệt đề xuất giá mới." : "Đã từ chối đề xuất.");
  }

  if (loading) return <p className="text-mid-gray font-sans text-sm">Đang tải...</p>;

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-3 font-sans text-xs font-bold ${
            toast.kind === "success" ? "bg-matte-black text-brand-green border-brand-green/30" : "bg-red-600 text-white border-red-500"
          }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
        <h2 className="text-sm font-extrabold font-display tracking-wider text-matte-black uppercase flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-forest-green" />
          Đề xuất đổi giá
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-green hover:bg-brand-green-hover text-matte-black text-[10px] font-black uppercase tracking-wider transition cursor-pointer border-0"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Đề xuất giá mới
        </button>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Chờ duyệt ({pending.length})
          </h3>
          {pending.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl gap-3 text-xs">
              <div>
                <span className="font-extrabold text-matte-black">
                  {r.services?.code} — {r.services?.name}
                </span>
                <div className="text-[10px] text-mid-gray mt-0.5">
                  Đề xuất bởi <strong>{r.requester?.name ?? "—"}</strong> · Lý do: {r.reason}
                </div>
                <div className="text-[10px] text-mid-gray mt-0.5">
                  Giá hiện tại: <span className="line-through">{formatVnd(r.services?.price ?? 0)}</span> → Đề xuất:{" "}
                  <span className="font-mono text-forest-green font-black">{formatVnd(r.proposed_price)}</span>
                </div>
              </div>
              {canDecide && (
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => void handleDecide(r, true)} className="px-3 py-1.5 rounded-lg bg-forest-green text-white text-[10px] font-black uppercase font-display cursor-pointer flex items-center gap-1">
                    <Check className="h-3 w-3 stroke-[3]" /> Duyệt
                  </button>
                  <button onClick={() => void handleDecide(r, false)} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase font-display cursor-pointer flex items-center gap-1">
                    <X className="h-3 w-3 stroke-[3]" /> Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        <h3 className="text-[10px] font-extrabold text-mid-gray uppercase tracking-wider">Lịch sử ({decided.length})</h3>
        {decided.length === 0 ? (
          <p className="text-xs text-mid-gray font-sans">Chưa có đề xuất nào được xử lý.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                  <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Dịch vụ</th>
                  <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Đề xuất bởi</th>
                  <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold text-right">Giá đề xuất</th>
                  <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold">Xử lý bởi</th>
                  <th className="p-3 uppercase tracking-wider text-[10px] font-extrabold text-center">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {decided.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-bold text-matte-black">{r.services?.code} — {r.services?.name}</td>
                    <td className="p-3 text-mid-gray">{r.requester?.name ?? "—"}</td>
                    <td className="p-3 text-right font-mono">{formatVnd(r.proposed_price)}</td>
                    <td className="p-3 text-mid-gray">{r.decider?.name ?? "—"}</td>
                    <td className="p-3 text-center">
                      {r.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-full bg-gray-100 text-mid-gray uppercase">
                          <XCircle className="h-3 w-3" /> Từ chối
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-mid-gray hover:text-matte-black cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-black font-display uppercase mb-4 flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
              <DollarSign className="h-5 w-5 text-forest-green" /> Đề xuất giá mới
            </h3>
            <form onSubmit={handlePropose} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">Dịch vụ</label>
                <select
                  required
                  value={proposeServiceId}
                  onChange={(e) => setProposeServiceId(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-forest-green"
                >
                  <option value="">Chọn dịch vụ...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} (hiện tại {formatVnd(s.price)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">Giá đề xuất (VND)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={proposePrice}
                  onChange={(e) => setProposePrice(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-forest-green"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">Lý do đề xuất</label>
                <textarea
                  required
                  rows={3}
                  value={proposeReason}
                  onChange={(e) => setProposeReason(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-forest-green"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold uppercase cursor-pointer">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-matte-black hover:bg-gray-900 text-white font-extrabold transition text-xs uppercase shadow-sm cursor-pointer disabled:opacity-60">
                  {saving ? "Đang gửi..." : "Gửi đề xuất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
