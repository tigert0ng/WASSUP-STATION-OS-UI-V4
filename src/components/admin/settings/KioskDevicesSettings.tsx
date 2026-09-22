import React, { useState, useEffect } from "react";
import { simActions } from "../../../lib/supabase/client";
import { 
  Tablet, 
  QrCode, 
  KeyRound, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ShieldCheck,
  Smartphone,
  Copy,
  Check
} from "lucide-react";

interface KioskDevicesSettingsProps {
  currentStationId?: string;
}

export default function KioskDevicesSettings({ currentStationId = "st-001" }: KioskDevicesSettingsProps) {
  const [pairedDevices, setPairedDevices] = useState<any[]>(() => simActions.getPairedKioskDevices(currentStationId));
  const [pairingCodes, setPairingCodes] = useState<any[]>(() => simActions.getKioskPairingCodes(currentStationId));
  const [newCodeModal, setNewCodeModal] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const refreshData = () => {
    setPairedDevices(simActions.getPairedKioskDevices(currentStationId));
    setPairingCodes(simActions.getKioskPairingCodes(currentStationId));
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener("wassup_kiosk_pairing_codes_updated", handleUpdate);
    window.addEventListener("wassup_paired_kiosk_devices_updated", handleUpdate);
    return () => {
      window.removeEventListener("wassup_kiosk_pairing_codes_updated", handleUpdate);
      window.removeEventListener("wassup_paired_kiosk_devices_updated", handleUpdate);
    };
  }, [currentStationId]);

  const handleGenerateCode = () => {
    const codeObj = simActions.generateKioskPairingCode(currentStationId, "WASSUP Trạm Pilot - Quận 7");
    setNewCodeModal(codeObj);
    refreshData();
    setSuccessToast("Đã tạo mã ghép đôi 6 số mới có hiệu lực 15 phút!");
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const handleRevokeDevice = (deviceId: string, deviceName: string) => {
    if (confirm(`Bạn có chắc chắn muốn thu hồi thiết bị "${deviceName}"? Thiết bị này sẽ bị ngắt kết nối và phải ghép đôi lại từ đầu.`)) {
      simActions.revokeKioskDevice(deviceId);
      refreshData();
      setSuccessToast(`Đã thu hồi thiết bị ${deviceName}.`);
      setTimeout(() => setSuccessToast(""), 4000);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-lime-100 text-[#A2C62C] flex items-center justify-center font-black">
              <Tablet className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
                QUẢN LÝ THIẾT BỊ KIOSK TỰ PHỤC VỤ (PRD v3.1)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Quản lý ghép đôi (Device Pairing) các tablet Kiosk đặt tại sảnh. Đơn hàng từ Kiosk được gắn bảo mật theo trạm.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateCode}
          className="px-5 py-2.5 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer border-0 shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          TẠO MÃ GHÉP ĐÔI MỚI (15 PHÚT)
        </button>
      </div>

      {/* Section 1: Active Paired Kiosks */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-slate-700" />
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wide">
              DANH SÁCH THIẾT BỊ KIOSK ĐANG KẾT NỐI ({pairedDevices.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Trạm hiện tại: {currentStationId}
          </span>
        </div>

        {pairedDevices.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Tablet className="h-10 w-10 text-stone-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Chưa có thiết bị Kiosk nào được ghép đôi với trạm này.</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Bấm nút "Tạo mã ghép đôi mới", sau đó mở tablet Kiosk tại trạm để nhập mã kích hoạt 6 số.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pairedDevices.map((dev) => (
              <div 
                key={dev.deviceId}
                className="border border-stone-200 rounded-2xl p-4.5 bg-stone-50 hover:bg-white hover:border-[#A2C62C] transition space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-slate-900 text-[#A2C62C] flex items-center justify-center font-black">
                      <Tablet className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xs text-slate-900 uppercase">
                        {dev.deviceName || "Kiosk Sảnh 01"}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        ID: {dev.deviceId}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hoạt động
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-stone-200/80 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trạm gán:</span>
                    <strong className="text-slate-800">{dev.stationName || "Trạm Pilot Q7"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian ghép:</span>
                    <span>{new Date(dev.pairedAt).toLocaleDateString("vi-VN")} {new Date(dev.pairedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quyền hạn:</span>
                    <span className="font-mono text-[10px] text-slate-500">intake:create</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(dev.deviceId, dev.deviceName)}
                    className="text-red-500 hover:text-red-700 text-[11px] font-bold flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-red-50 transition border-0 cursor-pointer bg-transparent"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Thu hồi thiết bị
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Recent Pairing Codes Log */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-slate-700" />
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wide">
              LỊCH SỬ MÃ GHÉP ĐÔI GẦN ĐÂY (FRK-0.1)
            </h3>
          </div>
        </div>

        {pairingCodes.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Chưa có mã ghép đôi nào được tạo gần đây.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-slate-500 uppercase font-display font-black text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Mã PIN 6 số</th>
                  <th className="py-2.5 px-4">Trạm áp dụng</th>
                  <th className="py-2.5 px-4">Thời gian tạo</th>
                  <th className="py-2.5 px-4">Hết hạn sau</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {pairingCodes.slice(0, 5).map((c) => {
                  const isExpired = new Date(c.expiresAt).getTime() < Date.now();
                  return (
                    <tr key={c.id} className="hover:bg-stone-50">
                      <td className="py-2.5 px-4 font-mono font-black text-sm text-slate-900 tracking-wider">
                        {c.code.slice(0, 3)}-{c.code.slice(3)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {c.stationName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(c.expiresAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-4">
                        {c.usedAt ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Đã sử dụng
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                            Hết hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-lime-100 text-slate-950 font-bold">
                            Chờ nhập (Sẵn sàng)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Modal */}
      {newCodeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-6 text-center animate-scaleIn">
            <div className="h-14 w-14 bg-lime-100 rounded-2xl mx-auto flex items-center justify-center text-slate-950">
              <KeyRound className="h-7 w-7 text-[#A2C62C]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
                MÃ GHÉP ĐÔI THIẾT BỊ KIOSK
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Mang tablet Kiosk tại trạm ra và nhập mã 6 số này trên màn hình K0 để hoàn tất ghép đôi.
              </p>
            </div>

            {/* Big Code Display */}
            <div className="bg-slate-900 text-[#A2C62C] p-6 rounded-2xl space-y-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">
                MÃ PIN GHÉP ĐÔI (6 SỐ)
              </span>
              <div className="text-4xl font-mono font-black tracking-widest text-white flex items-center justify-center gap-3">
                <span>{newCodeModal.code.slice(0, 3)}</span>
                <span className="text-[#A2C62C]">-</span>
                <span>{newCodeModal.code.slice(3)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Trạm: {newCodeModal.stationName} • Hiệu lực 15 phút
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(newCodeModal.code)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border-0"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "Đã sao chép" : "Sao chép mã"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setNewCodeModal(null)}
              className="w-full py-3 bg-[#A2C62C] hover:bg-[#8fb124] text-slate-950 font-display font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-0"
            >
              ĐÃ HIỂU &amp; ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
