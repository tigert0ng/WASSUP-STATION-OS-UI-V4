import React, { useState, useEffect } from "react";
import {
  Award,
  Coins,
  Shield,
  Save,
  History,
  Calculator,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { toast } from "../../../lib/toast";

interface RateHistoryRecord {
  id: string;
  date: string;
  pointsRate: number; // e.g. 1
  vndRate: number;    // e.g. 1000
  earnVndPerPoint: number; // e.g. 1000
  changedBy: string;
  reason: string;
}

interface CrmSupConfigProps {
  isMasterAdmin: boolean;
}

const STORAGE_KEY_CONFIG = "wassup_crm_sup_config";
const STORAGE_KEY_HISTORY = "wassup_crm_sup_rate_history";

export default function CrmSupConfig({ isMasterAdmin }: CrmSupConfigProps) {
  // Config state
  const [pointsRate, setPointsRate] = useState<number>(1);
  const [vndRate, setVndRate] = useState<number>(1000);
  const [earnVndPerPoint, setEarnVndPerPoint] = useState<number>(1000);
  const [changeReason, setChangeReason] = useState<string>("");

  // History state
  const [history, setHistory] = useState<RateHistoryRecord[]>([]);

  // Simulator state
  const [simPoints, setSimPoints] = useState<number>(100);
  const [simSpendVnd, setSimSpendVnd] = useState<number>(500000);

  const formatVnd = (amt: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amt);

  // Load configuration and audit history
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.pointsRate) setPointsRate(parsed.pointsRate);
        if (parsed.vndRate) setVndRate(parsed.vndRate);
        if (parsed.earnVndPerPoint) setEarnVndPerPoint(parsed.earnVndPerPoint);
      }

      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      } else {
        // Initial seed record
        const initialRecord: RateHistoryRecord = {
          id: "hist-init",
          date: new Date().toISOString(),
          pointsRate: 1,
          vndRate: 1000,
          earnVndPerPoint: 1000,
          changedBy: "Master Admin (Hệ thống)",
          reason: "Khởi tạo tỷ lệ quy đổi mặc định S4.12: 1 SUP = 1,000 VNĐ."
        };
        setHistory([initialRecord]);
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([initialRecord]));
      }
    } catch (err) {
      console.error("Failed to load SUP config:", err);
    }
  }, []);

  const handleSaveConfig = () => {
    if (!isMasterAdmin) {
      toast.error("TỪ CHỐI TRUY CẬP 🔒", "Chỉ Master Admin mới có quyền điều chỉnh tỷ lệ quy đổi điểm SUP.");
      return;
    }

    if (pointsRate <= 0 || vndRate <= 0 || earnVndPerPoint <= 0) {
      toast.error("THÔNG SỐ KHÔNG HỢP LỆ ❌", "Các tỷ lệ quy đổi phải là số nguyên dương lớn hơn 0.");
      return;
    }

    if (!changeReason.trim()) {
      toast.error("THIẾU LÝ DO ĐIỀU CHỈNH ❌", "Vui lòng nhập lý do thay đổi tỷ lệ quy đổi để lưu vết kiểm toán.");
      return;
    }

    const newConfig = {
      pointsRate,
      vndRate,
      earnVndPerPoint,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));

    const newRecord: RateHistoryRecord = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
      pointsRate,
      vndRate,
      earnVndPerPoint,
      changedBy: "Master Admin (Tiger)",
      reason: changeReason.trim()
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));

    setChangeReason("");
    toast.success("LƯU CẤU HÌNH THÀNH CÔNG 🪙", `Tỷ lệ mới: ${pointsRate} SUP = ${formatVnd(vndRate)} đã được áp dụng toàn hệ thống.`);
  };

  // Calculated values for simulator
  const calculatedRedeemVnd = pointsRate > 0 ? (simPoints / pointsRate) * vndRate : 0;
  const calculatedEarnedPoints = earnVndPerPoint > 0 ? Math.floor(simSpendVnd / earnVndPerPoint) : 0;

  return (
    <div className="space-y-4 text-left font-sans" id="crm-sup-config-container">
      {/* ROLE NOTICE */}
      {!isMasterAdmin && (
        <div className="p-3.5 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-stone-500" />
            <span>
              Bạn đang xem ở quyền <strong>Quản lý vận hành (Read-only)</strong>. Chỉ Master Admin mới có quyền điều chỉnh tỷ lệ quy đổi điểm SUP.
            </span>
          </div>
        </div>
      )}

      {/* CONFIGURATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Form cấu hình quy đổi & tích điểm */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-green/15 text-forest-green rounded-xl">
                <Coins className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-black font-display uppercase tracking-wider text-matte-black">
                  TỶ LỆ QUY ĐỔI ĐIỂM SUP (S4.12)
                </h3>
                <span className="text-[10px] text-mid-gray">
                  Cấu hình giá trị tiền tệ khi khách hàng dùng điểm khấu trừ thanh toán
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tỷ lệ quy đổi điểm sang tiền (Redemption Rate) */}
            <div className="space-y-1.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <label className="text-xs font-sans text-mid-gray uppercase font-black block">
                1. Tỷ lệ khấu trừ: Điểm SUP sang VNĐ
              </label>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-28">
                  <span className="text-[10px] text-mid-gray block">Số điểm SUP</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!isMasterAdmin}
                    value={pointsRate}
                    onChange={(e) => setPointsRate(Number(e.target.value))}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-black text-matte-black text-center disabled:bg-stone-100"
                  />
                </div>

                <span className="text-sm font-black text-slate-400 self-end pb-2">=</span>

                <div className="flex-1">
                  <span className="text-[10px] text-mid-gray block">Giá trị quy đổi (VNĐ)</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!isMasterAdmin}
                    value={vndRate}
                    onChange={(e) => setVndRate(Number(e.target.value))}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-black text-forest-green disabled:bg-stone-100"
                  />
                </div>
              </div>
              <p className="text-[11px] text-forest-green font-bold pt-1">
                👉 Hiện tại: {pointsRate} SUP = {formatVnd(vndRate)} (1 SUP = {formatVnd(vndRate / (pointsRate || 1))})
              </p>
            </div>

            {/* Tỷ lệ tích điểm từ đơn hàng (Accrual Rate) */}
            <div className="space-y-1.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <label className="text-xs font-sans text-mid-gray uppercase font-black block">
                2. Tỷ lệ tích lũy tự động từ chi tiêu
              </label>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <span className="text-[10px] text-mid-gray block">Số tiền chi tiêu (VNĐ)</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!isMasterAdmin}
                    value={earnVndPerPoint}
                    onChange={(e) => setEarnVndPerPoint(Number(e.target.value))}
                    className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-black text-matte-black disabled:bg-stone-100"
                  />
                </div>

                <span className="text-sm font-black text-slate-400 self-end pb-2">=</span>

                <div className="w-28">
                  <span className="text-[10px] text-mid-gray block">Tích lũy</span>
                  <div className="bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-black text-forest-green text-center">
                    1 SUP
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 pt-1">
                👉 Cứ mỗi {formatVnd(earnVndPerPoint)} thanh toán thành công, hệ thống tự cộng 1 SUP vào tài khoản hội viên.
              </p>
            </div>

            {/* Lý do thay đổi */}
            {isMasterAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                  Lý do cập nhật tỷ lệ (Ghi nhận kiểm toán) *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điều chỉnh theo chính sách khuyến mãi Q3/2026..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-matte-black focus:outline-none focus:border-forest-green"
                />
              </div>
            )}

            {/* Save Button */}
            {isMasterAdmin && (
              <button
                type="button"
                onClick={handleSaveConfig}
                className="w-full py-3 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white font-extrabold text-xs font-display uppercase tracking-wider transition cursor-pointer shadow-xs flex items-center justify-center gap-2 border-0"
              >
                <Save className="h-4 w-4" />
                LƯU & ÁP DỤNG TỶ LỆ QUY ĐỔI MỚI
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Interactive Simulator */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
              <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <Calculator className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-black font-display uppercase tracking-wider text-matte-black">
                  CÔNG CỤ TÍNH THỬ NGHIỆM ĐIỂM SUP
                </h3>
                <span className="text-[10px] text-mid-gray">
                  Mô phỏng tức thì số tiền giảm giá và số điểm tích lũy của khách hàng
                </span>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {/* Sim 1: Redeem */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="text-[10px] font-black text-mid-gray uppercase block">
                  Mô phỏng Khấu trừ điểm khi thanh toán
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-1/2">
                    <label className="text-[10px] text-slate-600 block">Số điểm SUP khách muốn dùng:</label>
                    <input
                      type="number"
                      min="0"
                      value={simPoints}
                      onChange={(e) => setSimPoints(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-black text-matte-black"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-[10px] text-slate-600 block">Số tiền được giảm:</label>
                    <div className="bg-brand-green/15 text-forest-green border border-brand-green/30 rounded-xl px-3 py-2 text-xs font-black">
                      {formatVnd(calculatedRedeemVnd)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sim 2: Earn */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="text-[10px] font-black text-mid-gray uppercase block">
                  Mô phỏng Tích điểm khi khách chi tiêu
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-1/2">
                    <label className="text-[10px] text-slate-600 block">Tổng tiền hóa đơn (VNĐ):</label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={simSpendVnd}
                      onChange={(e) => setSimSpendVnd(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-black text-matte-black"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-[10px] text-slate-600 block">Số điểm SUP nhận được:</label>
                    <div className="bg-matte-black text-[#A2C62C] rounded-xl px-3 py-2 text-xs font-black">
                      +{calculatedEarnedPoints} SUP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2 text-xs text-mid-gray">
            <Info className="h-4 w-4 text-forest-green shrink-0" />
            <span>
              Công cụ tự động đồng bộ theo bảng giá thực tế tại module POS & Bán hàng.
            </span>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE OF RATE CHANGES */}
      <div className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white shadow-xs" id="sup-rate-history-table">
        <div className="px-4 py-3 bg-stone-50 border-b border-[#e5e5e5] flex items-center justify-between">
          <span className="text-xs font-black uppercase text-matte-black font-display tracking-wider flex items-center gap-2">
            <History className="h-4 w-4 text-forest-green" />
            LỊCH SỬ THAY ĐỔI TỶ LỆ QUY ĐỔI ĐIỂM SUP ({history.length} bản ghi)
          </span>
          <span className="text-[11px] text-mid-gray">Lưu vết kiểm toán toàn vẹn</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-stone-50/50 text-slate-500 font-extrabold text-[10px] uppercase border-b border-stone-200">
                <th className="p-3 pl-4">Thời gian</th>
                <th className="p-3">Tỷ lệ quy đổi khấu trừ</th>
                <th className="p-3">Tỷ lệ tích điểm</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3 pr-4">Lý do thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-stone-50/80 transition">
                  <td className="p-3 pl-4 text-slate-500 text-[11px] font-sans">
                    {new Date(rec.date).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3 font-extrabold text-forest-green">
                    {rec.pointsRate} SUP = {formatVnd(rec.vndRate)}
                  </td>
                  <td className="p-3 font-bold text-slate-700">
                    {formatVnd(rec.earnVndPerPoint)} = 1 SUP
                  </td>
                  <td className="p-3 font-medium text-slate-800">
                    {rec.changedBy}
                  </td>
                  <td className="p-3 pr-4 text-slate-600 font-normal max-w-sm">
                    {rec.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
