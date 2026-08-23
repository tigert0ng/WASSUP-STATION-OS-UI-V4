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

  const formatNumberWithSeparator = (val: number): string => {
    if (val === undefined || val === null || isNaN(val)) return "";
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const parseFormattedNumber = (val: string): number => {
    const clean = val.replace(/\D/g, "");
    return clean ? parseInt(clean, 10) : 0;
  };

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

      {/* CONFIGURATION CARD (FULL WIDTH WITH 2 COLUMNS) */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-xs space-y-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Tỷ lệ quy đổi điểm sang tiền (Redemption Rate) */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-forest-green"></span>
                <label className="text-xs font-sans text-stone-600 uppercase font-black tracking-wider block">
                  1. Tỷ lệ khấu trừ (Điểm SUP ➔ VNĐ)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-32">
                  <span className="text-[11px] text-stone-400 font-bold block mb-1">Số điểm SUP</span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!isMasterAdmin}
                      value={formatNumberWithSeparator(pointsRate)}
                      onChange={(e) => setPointsRate(parseFormattedNumber(e.target.value))}
                      className="w-full bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 focus:border-forest-green rounded-xl py-2.5 px-3 text-xl sm:text-2xl font-black font-display text-matte-black text-center disabled:bg-stone-100 transition shadow-3xs outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 pointer-events-none">
                      SUP
                    </span>
                  </div>
                </div>

                <span className="text-xl sm:text-2xl font-black text-stone-300 self-end pb-2.5">=</span>

                <div className="flex-1">
                  <span className="text-[11px] text-stone-400 font-bold block mb-1">Quy đổi thành (VNĐ)</span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!isMasterAdmin}
                      value={formatNumberWithSeparator(vndRate)}
                      onChange={(e) => setVndRate(parseFormattedNumber(e.target.value))}
                      className="w-full bg-emerald-50/40 hover:bg-emerald-50/70 focus:bg-white border border-emerald-200 focus:border-forest-green rounded-xl py-2.5 px-3 pr-10 text-xl sm:text-2xl font-black font-display text-forest-green disabled:bg-stone-100 transition shadow-3xs outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-forest-green pointer-events-none">
                      VNĐ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Tỷ giá hiện tại:</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-forest-green border border-emerald-200/80 font-black text-xs font-display tracking-wide">
                1 SUP = {formatVnd(vndRate / (pointsRate || 1))}
              </span>
            </div>
          </div>

          {/* Right Column: Tỷ lệ tích điểm từ đơn hàng (Accrual Rate) */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <label className="text-xs font-sans text-stone-600 uppercase font-black tracking-wider block">
                  2. Tỷ lệ tích lũy tự động (Chi tiêu ➔ SUP)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <span className="text-[11px] text-stone-400 font-bold block mb-1">Mức chi tiêu đơn hàng</span>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!isMasterAdmin}
                      value={formatNumberWithSeparator(earnVndPerPoint)}
                      onChange={(e) => setEarnVndPerPoint(parseFormattedNumber(e.target.value))}
                      className="w-full bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 focus:border-forest-green rounded-xl py-2.5 px-3 pr-10 text-xl sm:text-2xl font-black font-display text-matte-black disabled:bg-stone-100 transition shadow-3xs outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 pointer-events-none">
                      VNĐ
                    </span>
                  </div>
                </div>

                <span className="text-xl sm:text-2xl font-black text-stone-300 self-end pb-2.5">➔</span>

                <div className="w-32">
                  <span className="text-[11px] text-stone-400 font-bold block mb-1">Tích lũy</span>
                  <div className="bg-purple-50 border border-purple-200/80 rounded-xl py-2.5 px-3 text-xl sm:text-2xl font-black font-display text-purple-700 text-center shadow-3xs">
                    +1 <span className="text-xs font-extrabold text-purple-700">SUP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Quy tắc tích lũy:</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/80 font-bold text-xs font-display">
                Mỗi {formatVnd(earnVndPerPoint)} chi tiêu = +1 SUP
              </span>
            </div>
          </div>
        </div>

        {/* Lý do thay đổi & Lưu */}
        {isMasterAdmin && (
          <div className="pt-2 border-t border-stone-150 space-y-3">
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

            <button
              type="button"
              onClick={handleSaveConfig}
              className="w-full py-3 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white font-extrabold text-xs font-display uppercase tracking-wider transition cursor-pointer shadow-xs flex items-center justify-center gap-2 border-0"
            >
              <Save className="h-4 w-4" />
              LƯU & ÁP DỤNG TỶ LỆ QUY ĐỔI MỚI
            </button>
          </div>
        )}
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
