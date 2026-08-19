import React, { useState, useEffect } from "react";
import Drawer, { DrawerFooterButtons } from "../../common/Drawer";
import { Car, AlertCircle, Info } from "lucide-react";
import { Customer, Order } from "../../../types/order.types";
import { toast } from "../../../lib/toast";

const COMMON_BRANDS = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Mazda",
  "Kia",
  "VinFast",
  "Ford",
  "Mitsubishi",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Porsche",
  "Lexus",
  "Subaru",
  "Nissan",
  "Peugeot",
  "Volvo",
  "Land Rover"
];

const COMMON_MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ["Vios", "Camry", "Corolla Cross", "Fortuner", "Innova", "Raize", "Yaris Cross", "Veloz Cross"],
  Honda: ["City", "Civic", "CR-V", "HR-V", "BR-V", "Accord"],
  Hyundai: ["Accent", "Creta", "Santa Fe", "Tucson", "Grand i10", "Custin", "Palisade", "Elantra"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-8", "BT-50"],
  Kia: ["Morning", "K3", "K5", "Sonet", "Seltos", "Sportage", "Sorento", "Carnival"],
  VinFast: ["VF 3", "VF 5 Plus", "VF e34", "VF 6", "VF 7", "VF 8", "VF 9", "Fadil", "Lux A2.0", "Lux SA2.0"],
  Ford: ["Ranger", "Everest", "Territory", "Explorer", "Ranger Raptor", "Transit"],
  Mitsubishi: ["Xpander", "Xforce", "Outlander", "Attrage", "Triton", "Pajero Sport"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "C200", "C300", "E300"],
  BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7"],
  Porsche: ["Macan", "Cayenne", "Panamera", "911", "Taycan"]
};

interface CrmVehicleModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  vehicle: { plate: string; vehicleClass: "sedan" | "suv" | "truck"; car_brand?: string; car_model?: string } | null;
  orders: Order[];
  onSaveVehicle: (updatedVehicles: { plate: string; vehicleClass: "sedan" | "suv" | "truck"; car_brand?: string; car_model?: string }[]) => void;
}

export default function CrmVehicleModal({
  open,
  onClose,
  customer,
  vehicle,
  orders,
  onSaveVehicle
}: CrmVehicleModalProps) {
  const isEdit = !!vehicle;
  const initialPlate = vehicle ? vehicle.plate : "";

  const [plate, setPlate] = useState("");
  const [vehicleClass, setVehicleClass] = useState<"sedan" | "suv" | "truck">("sedan");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");

  // Check if this vehicle plate has order/care history in the system
  const hasCareHistory = isEdit && orders.some(o => o.licensePlate && o.licensePlate.toUpperCase() === initialPlate.toUpperCase());

  useEffect(() => {
    if (vehicle) {
      setPlate(vehicle.plate);
      setVehicleClass(vehicle.vehicleClass || "sedan");
      setCarBrand(vehicle.car_brand || "");
      setCarModel(vehicle.car_model || "");
    } else {
      setPlate("");
      setVehicleClass("sedan");
      setCarBrand("");
      setCarModel("");
    }
  }, [vehicle, open]);

  // Model suggestions based on selected brand
  const modelSuggestions = COMMON_MODELS_BY_BRAND[carBrand] || [];

  const handleSave = () => {
    if (!customer) return;
    const cleanPlate = plate.toUpperCase().trim();
    if (!cleanPlate) {
      toast.error("THIẾU BIỂN SỐ ❌", "Vui lòng nhập biển số xe hợp lệ.");
      return;
    }

    const currentVehicles = customer.vehicles || (customer.licensePlates || (customer.licensePlate ? [customer.licensePlate] : [])).map(p => ({
      plate: p,
      vehicleClass: "sedan" as const
    }));

    if (!isEdit) {
      // Check duplicate plate in customer account
      if (currentVehicles.some(v => v.plate.toUpperCase() === cleanPlate)) {
        toast.error("BIỂN SỐ ĐÃ TỒN TẠI 🚗", `Biển số ${cleanPlate} đã thuộc danh sách xe của hội viên này.`);
        return;
      }

      const updated = [
        ...currentVehicles,
        {
          plate: cleanPlate,
          vehicleClass,
          car_brand: carBrand.trim() || undefined,
          car_model: carModel.trim() || undefined
        }
      ];
      onSaveVehicle(updated);
      toast.success("ĐĂNG KÝ XE THÀNH CÔNG 🚙", `Đã gán xe ${cleanPlate} (${vehicleClass.toUpperCase()}) vào tài khoản.`);
    } else {
      // Edit vehicle
      const updated = currentVehicles.map(v => {
        if (v.plate.toUpperCase() === initialPlate.toUpperCase()) {
          return {
            plate: hasCareHistory ? initialPlate : cleanPlate,
            vehicleClass,
            car_brand: carBrand.trim() || undefined,
            car_model: carModel.trim() || undefined
          };
        }
        return v;
      });
      onSaveVehicle(updated);
      toast.success("CẬP NHẬT XE THÀNH CÔNG 🚙", `Thông tin phương tiện ${cleanPlate} đã được lưu.`);
    }
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? `SỬA THÔNG TIN XE: ${initialPlate}` : "ĐĂNG KÝ PHƯƠNG TIỆN MỚI"}
      subtitle={customer ? `Hội viên sở hữu: ${customer.name} (${customer.phone})` : undefined}
      icon={Car}
      widthClass="max-w-lg"
      footer={
        <DrawerFooterButtons
          onCancel={onClose}
          cancelLabel="Hủy"
          onSubmit={handleSave}
          submitLabel={isEdit ? "LƯU THAY ĐỔI XE" : "XÁC NHẬN THÊM XE"}
          submitVariant="primary"
        />
      }
    >
      <div className="space-y-4 text-left font-sans">
        {/* Notice for plate modification restriction if history exists */}
        {hasCareHistory && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-xs text-amber-900" id="plate-lock-notice">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">BIỂN SỐ XE ĐÃ ĐƯỢC KHÓA BẢO MẬT</span>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                Biển số <strong>{initialPlate}</strong> này đã có lịch sử chăm sóc trong hệ thống. Để đổi biển số thực tế, vui lòng thêm xe mới và giữ nguyên lịch sử xe cũ. Bạn vẫn có thể tự do cập nhật phân hạng xe, hãng xe và dòng xe.
              </p>
            </div>
          </div>
        )}

        {/* Biển số */}
        <div className="space-y-1.5" id="field-vehicle-plate">
          <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
            Biển số xe *
          </label>
          <input
            type="text"
            required
            disabled={hasCareHistory}
            placeholder="Ví dụ: 30A-999.99, 51K-123.45..."
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed uppercase"
          />
        </div>

        {/* Phân hạng xe */}
        <div className="space-y-1.5" id="field-vehicle-class">
          <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
            Phân hạng dòng xe (Vehicle Class) *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "sedan", label: "Sedan / Hatchback", desc: "4 - 5 chỗ nhỏ" },
              { id: "suv", label: "SUV / CUV / MPV", desc: "5 - 7 chỗ vừa & lớn" },
              { id: "truck", label: "Bán tải / Xe tải", desc: "Pickup / Van / Tải" }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVehicleClass(item.id as any)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  vehicleClass === item.id
                    ? "bg-brand-green/15 border-forest-green text-forest-green shadow-xs"
                    : "bg-white border-[#e5e5e5] text-slate-700 hover:bg-stone-50"
                }`}
              >
                <span className="text-xs font-extrabold block">{item.label}</span>
                <span className="text-[10px] text-mid-gray font-normal block mt-0.5">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hãng xe (Car Brand) */}
        <div className="space-y-1.5" id="field-vehicle-brand">
          <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block flex items-center justify-between">
            <span>Hãng xe (Car Brand)</span>
            <span className="text-[10px] text-stone-400 font-normal normal-case">Gõ tự do hoặc chọn nhanh</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Toyota, Honda, Hyundai, VinFast, Mercedes..."
            value={carBrand}
            onChange={(e) => setCarBrand(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
          />
          {/* Quick-suggest chips for Brand */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_BRANDS.slice(0, 10).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setCarBrand(b)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                  carBrand.toLowerCase() === b.toLowerCase()
                    ? "bg-matte-black text-white border-matte-black"
                    : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Dòng xe (Car Model) */}
        <div className="space-y-1.5" id="field-vehicle-model">
          <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block flex items-center justify-between">
            <span>Dòng xe / Đời xe (Car Model)</span>
            <span className="text-[10px] text-stone-400 font-normal normal-case">Gõ tự do hoặc chọn nhanh</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Vios, Camry, CR-V, Santa Fe, VF 8, Ranger..."
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs font-bold text-matte-black focus:outline-none focus:border-forest-green"
          />
          {/* Quick-suggest chips for Model */}
          {modelSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {modelSuggestions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCarModel(m)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                    carModel.toLowerCase() === m.toLowerCase()
                      ? "bg-forest-green text-white border-forest-green"
                      : "bg-lime-50 text-forest-green border-lime-200 hover:bg-lime-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-2 text-[11px] text-stone-600">
          <Info className="h-4 w-4 text-forest-green shrink-0 mt-0.5" />
          <span>
            Thông tin phương tiện được liên kết với danh mục dịch vụ để tự động áp bảng giá theo phân hạng xe (Sedan/SUV/Bán tải) tại quầy tiếp nhận và tính toán hao phí định mức (Auto-BOM).
          </span>
        </div>
      </div>
    </Drawer>
  );
}
