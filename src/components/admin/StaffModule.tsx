import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Plus,
  ShieldAlert,
  UserCheck,
  UserX,
  UserMinus,
  Edit,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Award,
  Search,
  Key,
  Shield,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Briefcase,
  Layers,
  Settings,
  MoreVertical,
  Activity
} from "lucide-react";
import { simActions } from "../../lib/supabase/client";

interface StaffModuleProps {
  staff: any[];
  orders: any[];
}

interface NewStaffForm {
  name: string;
  phone: string;
  role: "master_admin" | "manager" | "technician" | "accountant";
  pin: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action?: string;
  type?: string;
  targetName?: string;
  details: string;
}

export default function StaffModule({ staff, orders }: StaffModuleProps) {
  // UI filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "admin" | "accountant">("all");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<any | null>(null);
  
  // Custom Confirmation Dialog states
  const [confirmBlockStaff, setConfirmBlockStaff] = useState<any | null>(null);
  
  // Forms state
  const [addForm, setAddForm] = useState<NewStaffForm>({
    name: "",
    phone: "",
    role: "manager",
    pin: "123456"
  });
  const [editForm, setEditForm] = useState<NewStaffForm>({
    name: "",
    phone: "",
    role: "manager",
    pin: ""
  });

  // Success message state (toast replacement)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Audit Logs (stored in local storage)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("wassup_rbac_audit_logs");
    if (stored) {
      try {
        setAuditLogs(JSON.parse(stored));
      } catch (e) {
        setAuditLogs([]);
      }
    } else {
      // Seed initial mock logs
      const initialLogs: AuditLog[] = [
        {
          id: "log_1",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          actor: "Trần Minh Quân (Master)",
          action: "INITIALIZE",
          targetName: "Hệ thống RBAC",
          details: "Khởi tạo ma trận phân quyền mặc định thành công."
        },
        {
          id: "log_2",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          actor: "Trần Minh Quân (Master)",
          action: "UPDATE_ROLE",
          targetName: "Nguyễn Văn Hùng",
          details: "Thay đổi vai trò từ Kỹ thuật viên thành Quản Lý Trạm."
        }
      ];
      setAuditLogs(initialLogs);
      localStorage.setItem("wassup_rbac_audit_logs", JSON.stringify(initialLogs));
    }
  }, []);

  const addAuditLog = (action: string, targetName: string, details: string) => {
    const newLog: AuditLog = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Trần Minh Quân (Master Admin)", // Log as current master admin
      action,
      targetName,
      details
    };
    const updated = [newLog, ...auditLogs].slice(0, 50); // limit to 50 logs
    setAuditLogs(updated);
    localStorage.setItem("wassup_rbac_audit_logs", JSON.stringify(updated));
  };

  // Filter staff based on search query and selected tab (exluding KTVs as they don't login to Station OS)
  const filteredStaff = staff.filter((s) => {
    if (s.role === "technician") return false;
    
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;

    if (activeTab === "admin") return s.role === "master_admin" || s.role === "manager";
    if (activeTab === "accountant") return s.role === "accountant";
    return true;
  });

  // Calculate active workload of technicians
  const getTechnicianActiveOrders = (techId: string) => {
    return orders.filter(o => o.technicianId === techId && o.status !== "done");
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin nhân sự!");
      return;
    }

    const newS = simActions.addStaff({
      name: addForm.name.trim(),
      phone: addForm.phone.trim(),
      role: addForm.role,
      pin: addForm.pin || "123456"
    });

    addAuditLog("CREATE_STAFF", newS.name, `Thêm nhân sự mới với vai trò ${getRoleLabel(newS.role)}`);
    showToast(`Đã thêm thành công nhân sự: ${newS.name}!`);
    
    // Reset form
    setAddForm({ name: "", phone: "", role: "manager", pin: "123456" });
    setShowAddModal(false);
  };

  const handleOpenEditModal = (s: any) => {
    setSelectedStaffForEdit(s);
    setEditForm({
      name: s.name,
      phone: s.phone,
      role: s.role,
      pin: s.pin || "123456"
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForEdit) return;
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      showToast("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const previousRole = selectedStaffForEdit.role;
    const updated = simActions.updateStaff(selectedStaffForEdit.id, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      role: editForm.role,
      pin: editForm.pin || "123456"
    });

    if (updated) {
      let details = `Cập nhật thông tin.`;
      if (previousRole !== editForm.role) {
        details += ` Thay đổi vai trò từ ${getRoleLabel(previousRole)} sang ${getRoleLabel(editForm.role)}.`;
      }
      addAuditLog("UPDATE_STAFF", updated.name, details);
      showToast(`Đã cập nhật thông tin của ${updated.name}!`);
    }

    setShowEditModal(false);
    setSelectedStaffForEdit(null);
  };

  // Perform blocking of staff with custom dialog to handle technician de-dispatch rule
  const handleRequestToggleBlock = (s: any) => {
    if (s.status === "blocked") {
      // Just unblock immediately
      const updated = simActions.updateStaff(s.id, { status: "active" });
      if (updated) {
        addAuditLog("UNBLOCK_STAFF", updated.name, "Mở khóa tài khoản nhân sự.");
        showToast(`Đã mở khóa tài khoản cho ${updated.name}!`);
      }
    } else {
      // Locking an active account
      if (s.role === "technician") {
        const activeOrders = getTechnicianActiveOrders(s.id);
        if (activeOrders.length > 0) {
          // Open custom warning confirmation dialog
          setConfirmBlockStaff({ staff: s, activeOrders });
          return;
        }
      }
      
      // Standard block
      const updated = simActions.updateStaff(s.id, { status: "blocked" });
      if (updated) {
        addAuditLog("BLOCK_STAFF", updated.name, "Khóa tài khoản nhân sự.");
        showToast(`Đã khóa tài khoản của ${updated.name}!`);
      }
    }
  };

  const confirmBlockWithDeDispatch = () => {
    if (!confirmBlockStaff) return;
    const { staff: s, activeOrders } = confirmBlockStaff;

    // Apply de-dispatch logic (Return active orders back to waiting queue)
    activeOrders.forEach((wo: any) => {
      simActions.updateWorkOrderStatus(wo.id, "queued"); // Return to waiting queue
      // Reset assignment keys
      wo.technicianId = null;
      wo.technicianName = undefined;
    });

    // Block the staff
    const updated = simActions.updateStaff(s.id, { status: "blocked" });
    if (updated) {
      addAuditLog(
        "BLOCK_STAFF_DEDISPATCH",
        updated.name,
        `Khóa tài khoản KTV và tự động hoàn trả ${activeOrders.length} đơn hàng đang làm về hàng đợi chung.`
      );
      showToast(`Đã khóa tài khoản và thu hồi ${activeOrders.length} đơn hàng của ${updated.name}!`);
    }

    setConfirmBlockStaff(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "master_admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "technician":
        return "bg-green-100 text-green-800 border-green-200";
      case "accountant":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "master_admin":
        return "Master Admin";
      case "manager":
        return "Quản Lý Trạm";
      case "technician":
        return "Kỹ Thuật Viên";
      case "accountant":
        return "Kế Toán";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION BANNER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-6 z-50 bg-matte-black text-brand-green px-5 py-3.5 rounded-xl border border-brand-green/30 shadow-2xl flex items-center gap-3 font-sans text-xs font-bold"
          >
            <CheckCircle2 className="h-4 w-4 animate-bounce text-brand-green" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div>

          <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">
            Nhân sự & Phân quyền truy cập
          </h1>
          <p className="text-mid-gray text-xs mt-1 font-sans max-w-2xl">
            Quản trị viên tối cao (Master Admin) có quyền điều phối vị trí, thay đổi vai trò (Role), đình chỉ hoặc kích hoạt tài khoản cán bộ nhân viên trạm.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-matte-black hover:bg-gray-900 text-white hover:text-brand-green text-xs font-extrabold font-display uppercase transition shadow-md cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          THÊM NHÂN SỰ MỚI
        </button>
      </div>

      {/* SYSTEM OVERVIEW: VISUAL RBAC MATRIX CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RBAC Visual Map Cheat sheet */}
        <div className="lg:col-span-2 bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider flex items-center gap-2 border-b border-[#e5e5e5] pb-3">
            <Key className="h-4 w-4 text-purple-600" />
            BẢNG PHÂN QUYỀN CHỨC NĂNG (RBAC PERMISSIONS MATRIX)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-purple-900">
                <ShieldCheck className="h-4 w-4" />
                Master Admin
              </div>
              <p className="text-[10px] text-purple-700 font-sans leading-relaxed">
                Toàn quyền tối cao. Quản lý toàn diện nhân sự, cài đặt hệ thống trạm, và doanh thu.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-blue-900">
                <Briefcase className="h-4 w-4" />
                Quản Lý Trạm
              </div>
              <p className="text-[10px] text-blue-700 font-sans leading-relaxed">
                Điều phối xe tại quầy, gán kỹ thuật viên vào buồng rửa, giám sát chất lượng dịch vụ.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-green-100 bg-green-50/30 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-green-900">
                <Activity className="h-4 w-4" />
                Kỹ Thuật Viên
              </div>
              <p className="text-[10px] text-green-700 font-sans leading-relaxed">
                Xem danh sách đơn hàng được phân bổ, cập nhật tiến độ thi công, báo cáo sự cố (Rework).
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                <FileText className="h-4 w-4" />
                Kế Toán
              </div>
              <p className="text-[10px] text-amber-700 font-sans leading-relaxed">
                Giám sát dòng tiền doanh thu dịch vụ, rà soát hóa đơn thanh toán tại POS, lập báo cáo tài chính.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Widget */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-forest-green" />
            CƠ CẤU NHÂN SỰ TRẠM
          </h3>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-0.5">
              <span className="text-[10px] text-mid-gray font-extrabold uppercase font-sans">Tổng nhân sự</span>
              <p className="text-2xl font-black font-display text-matte-black">{staff.length}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-mid-gray font-extrabold uppercase font-sans">Đang hoạt động</span>
              <p className="text-2xl font-black font-display text-forest-green">
                {staff.filter(s => s.status !== "blocked").length}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-mid-gray font-extrabold uppercase font-sans">Kỹ thuật viên</span>
              <p className="text-2xl font-black font-display text-blue-600">
                {staff.filter(s => s.role === "technician").length}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-mid-gray font-extrabold uppercase font-sans">Đã khóa</span>
              <p className="text-2xl font-black font-display text-red-500">
                {staff.filter(s => s.status === "blocked").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#e5e5e5] shadow-sm font-sans">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mid-gray" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nhân viên, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-warm-white/50 border border-[#e5e5e5] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-matte-black focus:outline-none focus:border-purple-500 focus:bg-white transition"
          />
        </div>

        {/* Tab Filter */}
        <div className="flex p-1 bg-warm-white rounded-lg border border-[#e5e5e5] text-xs font-sans self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-md font-bold transition ${
              activeTab === "all" ? "bg-matte-black text-white" : "text-mid-gray hover:text-matte-black"
            }`}
          >
            Tất cả ({staff.filter(s => s.role !== "technician").length})
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-1.5 rounded-md font-bold transition ${
              activeTab === "admin" ? "bg-matte-black text-white" : "text-mid-gray hover:text-matte-black"
            }`}
          >
            Quản trị ({staff.filter(s => s.role === "master_admin" || s.role === "manager").length})
          </button>
          <button
            onClick={() => setActiveTab("accountant")}
            className={`px-4 py-1.5 rounded-md font-bold transition ${
              activeTab === "accountant" ? "bg-matte-black text-white" : "text-mid-gray hover:text-matte-black"
            }`}
          >
            Kế toán ({staff.filter(s => s.role === "accountant").length})
          </button>
        </div>
      </div>

      {/* MAIN STAFF DIRECTORY TABLE */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-warm-white text-mid-gray border-b border-[#e5e5e5]">
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Họ Tên Nhân Viên</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Số Điện Thoại</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Mã PIN</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Quyền Hạn (Role)</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Trạng Thái</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold">Tải Công Việc (KTV)</th>
                <th className="p-4 uppercase tracking-wider text-[10px] font-extrabold text-right">Hành động bảo mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-mid-gray font-sans text-xs">
                    <UserMinus className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    Không tìm thấy nhân viên nào khớp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => {
                  const isTech = s.role === "technician";
                  const activeWos = isTech ? getTechnicianActiveOrders(s.id) : [];

                  return (
                    <tr key={s.id} className="hover:bg-warm-white/30 transition">
                      {/* Name with initials avatar */}
                      <td className="p-4">
                        <div className="font-extrabold text-matte-black text-sm flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black uppercase text-white shadow-sm ${
                            s.role === "master_admin" ? "bg-purple-600" :
                            s.role === "manager" ? "bg-blue-600" :
                            s.role === "technician" ? "bg-green-600" : "bg-amber-600"
                          }`}>
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-matte-black">{s.name}</p>
                            <span className="text-[9px] text-mid-gray font-sans block uppercase">ID: {s.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4 font-sans font-bold text-mid-gray text-sm">{s.phone}</td>

                      {/* PIN Code */}
                      <td className="p-4 font-sans font-bold text-purple-600 text-sm">
                        {s.pin || "123456"}
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${getRoleBadge(s.role)}`}>
                          {getRoleLabel(s.role)}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td className="p-4">
                        {s.status === "blocked" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-extrabold text-[9px] uppercase tracking-wider">
                            <Lock className="h-3 w-3" /> Đã Khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 font-extrabold text-[9px] uppercase tracking-wider">
                            <Unlock className="h-3 w-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      {/* Task Load (Technician specific) */}
                      <td className="p-4">
                        {isTech ? (
                          activeWos.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 font-sans">
                              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              Đang làm: {activeWos.length} đơn xe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-mid-gray font-sans">
                              Sẵn sàng nhận xe
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300 font-sans font-medium">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-2 text-mid-gray hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer border border-transparent hover:border-purple-100"
                            title="Sửa thông tin"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleRequestToggleBlock(s)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase font-display transition cursor-pointer shadow-sm border ${
                              s.status === "blocked"
                                ? "bg-white text-green-700 border-[#e5e5e5] hover:bg-green-50 hover:border-green-200"
                                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {s.status === "blocked" ? "MỞ KHÓA" : "ĐÌNH CHỈ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECURITY AUDIT LOGS SECTION */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
          <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-purple-600" />
            SỔ NHẬT KÝ BẢO MẬT & KIỂM TOÁN (AUDIT TRAIL LOGS)
          </h3>
          <span className="text-[10px] font-sans text-mid-gray uppercase font-semibold">
            Thời gian thực hành vi quản trị
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2">
          {auditLogs.map((log) => {
            const act = log.action || log.type || "SYSTEM";
            return (
              <div
                key={log.id}
                className="p-3 bg-warm-white/40 border border-[#e5e5e5] rounded-xl text-[11px] font-sans flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`px-1.5 py-0.5 rounded font-black text-[8px] uppercase ${
                      act.startsWith("BLOCK") ? "bg-red-100 text-red-700" :
                      act.startsWith("CREATE") ? "bg-blue-100 text-blue-700" :
                      act.startsWith("UPDATE") ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {act}
                    </span>
                    <span className="font-extrabold text-matte-black">{log.actor}</span>
                    {log.targetName && (
                      <>
                        <span className="text-mid-gray">đối với</span>
                        <span className="font-black text-matte-black">{log.targetName}</span>
                      </>
                    )}
                  </div>
                  <p className="text-mid-gray leading-relaxed">{log.details}</p>
                </div>
                <span className="font-sans text-[9px] text-mid-gray shrink-0 self-end sm:self-center">
                  {new Date(log.timestamp).toLocaleTimeString("vi-VN")} - {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DRAWER: ADD STAFF */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  THÊM NHÂN SỰ MỚI
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Họ và tên nhân viên
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0922222222"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Quyền hạn & Vai trò (Role)
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="manager">Quản Lý Trạm</option>
                    <option value="accountant">Kế Toán</option>
                    <option value="master_admin">Master Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Mã PIN bảo mật
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Mặc định: 123456"
                    value={addForm.pin}
                    onChange={(e) => setAddForm({ ...addForm, pin: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans font-bold tracking-widest text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    THÊM MỚI
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER: EDIT STAFF */}
      <AnimatePresence>
        {showEditModal && selectedStaffForEdit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false);
                setSelectedStaffForEdit(null);
              }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9999] transition-opacity"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[9999] flex flex-col border-l border-stone-200 text-slate-800"
            >
              <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-extrabold font-display tracking-wider text-white uppercase flex items-center gap-2">
                  <Edit className="h-5 w-5 text-purple-400" />
                  SỬA THÔNG TIN NHÂN SỰ
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStaffForEdit(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer border-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStaff} className="p-6 flex-1 overflow-y-auto space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Họ và tên nhân viên
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0922222222"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Quyền hạn & Vai trò (Role)
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-matte-black focus:outline-none focus:border-purple-500"
                  >
                    <option value="manager">Quản Lý Trạm</option>
                    <option value="accountant">Kế Toán</option>
                    <option value="master_admin">Master Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-mid-gray uppercase font-extrabold block">
                    Mã PIN bảo mật
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="Ví dụ: 123456"
                    value={editForm.pin}
                    onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-sans font-bold tracking-widest text-matte-black focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-4 flex gap-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStaffForEdit(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-mid-gray hover:bg-stone-100 transition text-xs font-extrabold font-display uppercase cursor-pointer"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
                  >
                    LƯU THAY ĐỔI
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM BLOCK KTV DIALOG */}
      {confirmBlockStaff && (
        <div className="fixed inset-0 bg-matte-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e5e5e5] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setConfirmBlockStaff(null)}
              className="absolute top-4 right-4 text-mid-gray hover:text-matte-black transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-red-600 border-b border-[#e5e5e5] pb-3 mb-4">
              <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
              <h3 className="text-base font-black font-display uppercase tracking-wide">
                CẢNH BÁO: KTV ĐANG LÀM NHIỆM VỤ!
              </h3>
            </div>

            <div className="space-y-3 font-sans text-xs text-matte-black">
              <p className="leading-relaxed font-bold">
                Cảnh báo an ninh: Kỹ thuật viên <span className="text-purple-600 underline font-black">{confirmBlockStaff.staff.name}</span> hiện đang được phân công gánh vác <span className="text-red-600 font-extrabold">{confirmBlockStaff.activeOrders.length} đơn hàng rửa xe</span> đang thực hiện trực tiếp!
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-black uppercase text-red-700 block tracking-wider">
                  Quy trình nghiệp vụ cưỡng chế:
                </span>
                <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                  Nếu bạn tiếp tục khóa tài khoản này, toàn bộ <span className="font-extrabold">{confirmBlockStaff.activeOrders.length} đơn rửa xe</span> trên sẽ bị cưỡng chế thu hồi, hủy liên kết kỹ thuật viên, và tự động hoàn trả về trạng thái <span className="font-black bg-white px-1.5 py-0.5 rounded border border-red-300">"HÀNG CHỜ ĐIỀU PHỐI CHUNG"</span> để quản lý gán cho nhân sự khác.
                </p>
              </div>

              <div className="pt-2 font-medium text-mid-gray">
                Bạn có chắc chắn muốn tiến hành quy trình cưỡng chế khóa tài khoản này không?
              </div>
            </div>

            <div className="pt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmBlockStaff(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e5e5e5] text-mid-gray hover:bg-warm-white transition text-xs font-extrabold font-display uppercase cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={confirmBlockWithDeDispatch}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition text-xs font-display uppercase shadow-sm cursor-pointer"
              >
                XÁC NHẬN KHÓA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
