import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  Filter,
  Award,
  AlertTriangle,
  History,
  CheckCircle,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Sparkles,
  Phone,
  User,
  MapPin,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  PlusCircle,
  FileText,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ChevronRight,
  Info,
  CheckSquare,
  HelpCircle,
  Activity,
  ThumbsUp,
  FileSpreadsheet,
  ChevronLeft,
  Briefcase,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
  Bot,
  Send
} from "lucide-react";
import { simActions } from "../../lib/supabase/client";
import { MarkdownTextarea, MarkdownRenderer } from "./shared/Markdown";

// STATION CONFIGURATION
const STATIONS = [
  { id: "WASSUP_TÂN_BÌNH_01", name: "WASSUP Station - Tân Bình (CN1)" },
  { id: "WASSUP_QUAN_1_02", name: "WASSUP Station - Quận 1 (CN2)" },
  { id: "WASSUP_THU_DUC_03", name: "WASSUP Station - Thủ Đức (CN3)" }
];

// TYPES FOR MODULE 8 (HR)
interface HrProfile {
  staffId: string;
  name?: string;
  phone?: string;
  pin?: string;
  rank: "apprentice" | "junior" | "senior" | "team_lead" | "manager";
  wageType: "hourly" | "fixed";
  hourlyRate?: number;
  baseSalary?: number;
  permanentAddress: string;
  temporaryAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  probationStartDate: string;
  officialStartDate: string;
  employmentStatus: "probation" | "active" | "suspended" | "terminated";
  portraitPhotoUrl?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  selectedSkills: string[]; // skill IDs
  stationId: string; // STATION ASSIGNMENT
  telegramChatId?: string;
  zaloChatId?: string;
}

interface Skill {
  id: string;
  name: string;
  active: boolean;
}

interface Certification {
  id: string;
  staffId: string;
  name: string;
  issuer: string;
  issuedDate: string;
  expiryDate?: string;
  status: "valid" | "expiring_soon" | "expired";
  fileUrl?: string;
  createdAt: string;
}

interface DisciplineLog {
  id: string;
  staffId: string;
  type: "violation" | "commendation";
  category: "safety" | "technical_process" | "other";
  description: string;
  evidenceFileUrl?: string;
  recordedBy: string;
  at: string;
}

interface WorkAllocation {
  id: string;
  date: string;
  licensePlate: string;
  serviceName: string;
  role: "primary" | "secondary";
  startTime: string;
  endTime: string;
  slaMin: number;
  slaMax: number;
  status: "done" | "in_progress" | "rework";
}

interface HrModuleProps {
  staff: any[];
  orders: any[];
  currentUser?: any;
}

export default function HrModule({ staff, orders, currentUser }: HrModuleProps) {
  // Master state lists
  const [profiles, setProfiles] = useState<HrProfile[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [disciplineLogs, setDisciplineLogs] = useState<DisciplineLog[]>([]);

  // Active top-level sub-menu tab: "performance" | "directory" | "catalog" | "bots"
  const [activeM8Tab, setActiveM8Tab] = useState<"performance" | "directory" | "catalog" | "bots">("performance");

  // Bot Integrations state
  const [telegramToken, setTelegramToken] = useState(() => localStorage.getItem("wassup_telegram_token") || "7128392182:AAH9238dj92hG-92_Hsd8291hd923h");
  const [telegramGroupChatId, setTelegramGroupChatId] = useState(() => localStorage.getItem("wassup_telegram_group_id") || "-10028392182");
  const [telegramConnected, setTelegramConnected] = useState(false);

  const [zaloToken, setZaloToken] = useState(() => localStorage.getItem("wassup_zalo_token") || "zalo_oa_access_token_mock_982392183921382910");
  const [zaloOaId, setZaloOaId] = useState(() => localStorage.getItem("wassup_zalo_oa_id") || "293028391823910283");
  const [zaloConnected, setZaloConnected] = useState(false);

  const handleSaveBotsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("wassup_telegram_token", telegramToken);
    localStorage.setItem("wassup_telegram_group_id", telegramGroupChatId);
    localStorage.setItem("wassup_zalo_token", zaloToken);
    localStorage.setItem("wassup_zalo_oa_id", zaloOaId);
    showToastMsg("✅ Đã lưu cấu hình Bots & Kênh liên lạc!");
  };

  const handleTestTelegramConnection = () => {
    showToastMsg("⚡ Đang gửi tín hiệu Ping tới Telegram Bot Server...");
    setTimeout(() => {
      setTelegramConnected(true);
      showToastMsg("✅ Kết nối Telegram Bot thành công! Đã gửi tin nhắn test đến Group.");
    }, 1200);
  };

  const handleTestZaloConnection = () => {
    showToastMsg("⚡ Đang gửi gói tin kiểm tra tới Zalo OA Portal...");
    setTimeout(() => {
      setZaloConnected(true);
      showToastMsg("✅ Webhook Zalo OA đồng bộ thành công! Trạng thái: SẴN SÀNG.");
    }, 1200);
  };

  // Selection state for opening a detailed page ("trang mới")
  const [selectedDetailedStaffId, setSelectedDetailedStaffId] = useState<string | null>(null);

  // Left menu within the detail view: "info_perf" | "skills" | "work_history" | "discipline"
  const [activeDetailTab, setActiveDetailTab] = useState<"info_perf" | "skills" | "work_history" | "discipline">("info_perf");

  // Current session config & role-based station lock
  const loggedInUser = currentUser || JSON.parse(localStorage.getItem("wassup_current_user") || "null");
  const isAccountMaster = loggedInUser?.role === "master_admin";
  const localStationId = localStorage.getItem("wassup_station_id") || "WASSUP_TÂN_BÌNH_01";

  // Station Filter state (defaults to "all" for Account Master, or locks to localStationId for normal manager)
  const [selectedStationId, setSelectedStationId] = useState<string>(() => {
    return loggedInUser?.role === "master_admin" ? "all" : localStationId;
  });

  // Filtering & searching within Directory
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRank, setFilterRank] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSkill, setFilterSkill] = useState<string>("all");

  // View toggles
  const [showIdFront, setShowIdFront] = useState(false);
  const [showIdBack, setShowIdBack] = useState(false);

  // Modal display toggles
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddKtvModal, setShowAddKtvModal] = useState(false);

  // Form Inputs
  const [newKtv, setNewKtv] = useState({
    name: "",
    phone: "",
    pin: "123456",
    stationId: "WASSUP_TÂN_BÌNH_01",
    rank: "junior" as HrProfile["rank"]
  });
  const [newCert, setNewCert] = useState({
    name: "",
    issuer: "",
    issuedDate: "",
    expiryDate: "",
    fileUrl: ""
  });
  const [newLog, setNewLog] = useState({
    type: "violation" as "violation" | "commendation",
    category: "technical_process" as "safety" | "technical_process" | "other",
    description: "",
    evidenceFileUrl: ""
  });
  const [newSkillName, setNewSkillName] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "danger" } | null>(null);

  const showToastMsg = (message: string, type: "success" | "warning" | "danger" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN");
  };

  const formatNumberWithDot = (num: number | string | undefined | null) => {
    if (num === undefined || num === null || num === "") return "";
    const clean = String(num).replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("vi-VN");
  };

  const parseNumberFromDot = (val: string) => {
    const clean = val.replace(/\D/g, "");
    return Number(clean) || 0;
  };

  // Seed default items on mount
  useEffect(() => {
    // 1. Seed Skills Catalog
    const storedSkills = localStorage.getItem("wassup_hr_skills_catalog");
    let activeCatalog: Skill[] = [];
    if (storedSkills) {
      activeCatalog = JSON.parse(storedSkills);
    } else {
      activeCatalog = [
        { id: "sk_1", name: "Rửa xe chi tiết (Detailing Wash)", active: true },
        { id: "sk_2", name: "Đánh bóng & Hiệu chỉnh sơn", active: true },
        { id: "sk_3", name: "Dán phim cách nhiệt (Classis)", active: true },
        { id: "sk_4", name: "Cách âm & Tiêu âm xe hơi", active: true },
        { id: "sk_5", name: "Dán PPF / Wrap Decal bảo vệ", active: true },
        { id: "sk_6", name: "Lắp đặt phụ kiện & Đồ chơi điện", active: true }
      ];
      localStorage.setItem("wassup_hr_skills_catalog", JSON.stringify(activeCatalog));
    }
    setSkillsCatalog(activeCatalog);

    // Ensure the 3 standard Technicians exist in staff list
    const existingKhoa = staff.find(s => s.phone === "0938112233" || s.name === "Nguyễn Minh Khoa");
    const existingHa = staff.find(s => s.phone === "0912445667" || s.name === "Trần Thị Ngọc Hà");
    const existingPhuc = staff.find(s => s.phone === "0977889900" || s.name === "Lê Hoàng Phúc");

    let sIdKhoa = existingKhoa?.id || "";
    let sIdHa = existingHa?.id || "";
    let sIdPhuc = existingPhuc?.id || "";

    if (!existingKhoa) {
      const news = simActions.addStaff({ name: "Nguyễn Minh Khoa", phone: "0938112233", role: "technician", pin: "123456" });
      sIdKhoa = news.id;
    }
    if (!existingHa) {
      const news = simActions.addStaff({ name: "Trần Thị Ngọc Hà", phone: "0912445667", role: "technician", pin: "123456" });
      sIdHa = news.id;
    }
    if (!existingPhuc) {
      const news = simActions.addStaff({ name: "Lê Hoàng Phúc", phone: "0977889900", role: "technician", pin: "123456" });
      sIdPhuc = news.id;
    }

    // 2. Seed HR Profiles
    const storedProfiles = localStorage.getItem("wassup_hr_profiles");
    let activeProfiles: HrProfile[] = [];
    if (storedProfiles) {
      activeProfiles = JSON.parse(storedProfiles);
      // Ensure all active profiles have a stationId. If not, assign one.
      let migrated = false;
      activeProfiles = activeProfiles.map(p => {
        if (!p.stationId) {
          migrated = true;
          if (p.staffId === sIdHa) p.stationId = "WASSUP_QUAN_1_02";
          else if (p.staffId === sIdPhuc) p.stationId = "WASSUP_TÂN_BÌNH_01";
          else if (p.staffId === sIdKhoa) p.stationId = "WASSUP_TÂN_BÌNH_01";
          else p.stationId = "WASSUP_TÂN_BÌNH_01";
        }
        return p;
      });
      if (migrated) {
        localStorage.setItem("wassup_hr_profiles", JSON.stringify(activeProfiles));
      }
    } else {
      activeProfiles = [
        {
          staffId: sIdKhoa,
          name: "Nguyễn Minh Khoa",
          phone: "0938112233",
          pin: "123456",
          rank: "junior",
          wageType: "hourly",
          hourlyRate: 55000,
          permanentAddress: "Q. Bình Tân, TP.HCM",
          temporaryAddress: "Q. Bình Tân, TP.HCM",
          emergencyContactName: "Nguyễn Văn Hùng (cha)",
          emergencyContactPhone: "0908112233",
          probationStartDate: "2026-09-01",
          officialStartDate: "2026-12-01",
          employmentStatus: "active",
          portraitPhotoUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150",
          nationalIdFrontUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
          nationalIdBackUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
          selectedSkills: ["sk_1"],
          stationId: "WASSUP_TÂN_BÌNH_01"
        },
        {
          staffId: sIdHa,
          name: "Trần Thị Ngọc Hà",
          phone: "0912445667",
          pin: "123456",
          rank: "senior",
          wageType: "fixed",
          baseSalary: 11000000,
          permanentAddress: "H. Hóc Môn, TP.HCM",
          temporaryAddress: "Q. 12, TP.HCM",
          emergencyContactName: "Trần Văn Long (anh trai)",
          emergencyContactPhone: "0912000111",
          probationStartDate: "2026-07-15",
          officialStartDate: "2026-10-15",
          employmentStatus: "active",
          portraitPhotoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
          nationalIdFrontUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
          nationalIdBackUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
          selectedSkills: ["sk_1", "sk_2", "sk_3"],
          stationId: "WASSUP_QUAN_1_02"
        },
        {
          staffId: sIdPhuc,
          name: "Lê Hoàng Phúc",
          phone: "0977889900",
          pin: "123456",
          rank: "team_lead",
          wageType: "fixed",
          baseSalary: 13000000,
          permanentAddress: "Q. Tân Phú, TP.HCM",
          temporaryAddress: "Q. Tân Phú, TP.HCM",
          emergencyContactName: "Lê Thị Mai (vợ)",
          emergencyContactPhone: "0977000222",
          probationStartDate: "2026-06-01",
          officialStartDate: "2026-09-01",
          employmentStatus: "active",
          portraitPhotoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
          nationalIdFrontUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
          nationalIdBackUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400",
          selectedSkills: ["sk_1", "sk_2", "sk_3", "sk_4", "sk_5", "sk_6"],
          stationId: "WASSUP_TÂN_BÌNH_01"
        }
      ];
      localStorage.setItem("wassup_hr_profiles", JSON.stringify(activeProfiles));
    }

    // Auto-create a profile with a default station for any other technician in the staff list
    let updatedProfiles = [...activeProfiles];
    let profilesChanged = false;
    staff.forEach(s => {
      const isTechOrHr = s.role === "technician";
      if (isTechOrHr && !updatedProfiles.some(p => p.staffId === s.id)) {
        let assignedStation = "WASSUP_TÂN_BÌNH_01";
        if (s.id === "s4" || s.name.includes("B")) {
          assignedStation = "WASSUP_QUAN_1_02";
        } else if (s.id === "s5" || s.name.includes("C")) {
          assignedStation = "WASSUP_THU_DUC_03";
        }
        updatedProfiles.push({
          staffId: s.id,
          name: s.name,
          phone: s.phone,
          pin: s.pin || "123456",
          rank: "junior",
          wageType: "hourly",
          hourlyRate: 50000,
          permanentAddress: "TP. Hồ Chí Minh",
          temporaryAddress: "TP. Hồ Chí Minh",
          emergencyContactName: "Người thân",
          emergencyContactPhone: s.phone,
          probationStartDate: "2026-01-01",
          officialStartDate: "2026-03-01",
          employmentStatus: "active",
          portraitPhotoUrl: "",
          selectedSkills: ["sk_1"],
          stationId: assignedStation
        });
        profilesChanged = true;
      }
    });

    if (profilesChanged) {
      localStorage.setItem("wassup_hr_profiles", JSON.stringify(updatedProfiles));
    }
    setProfiles(updatedProfiles);

    // 3. Seed Certifications
    const storedCerts = localStorage.getItem("wassup_hr_certs");
    if (storedCerts) {
      setCertifications(JSON.parse(storedCerts));
    } else {
      const defaultCerts: Certification[] = [
        {
          id: "cert_ha_1",
          staffId: sIdHa,
          name: "Gyeon Detailing Certified",
          issuer: "Gyeon Detailing HQ",
          issuedDate: "2026-10-15",
          expiryDate: "2028-10-15",
          status: "valid",
          fileUrl: "https://example.com/cert-gyeon.pdf",
          createdAt: new Date().toISOString()
        },
        {
          id: "cert_phuc_1",
          staffId: sIdPhuc,
          name: "3M PPF Certified Installer",
          issuer: "3M Vietnam Corp",
          issuedDate: "2024-08-05",
          expiryDate: "2026-08-05",
          status: "expiring_soon",
          fileUrl: "https://example.com/cert-3m.pdf",
          createdAt: new Date().toISOString()
        }
      ];
      setCertifications(defaultCerts);
      localStorage.setItem("wassup_hr_certs", JSON.stringify(defaultCerts));
    }

    // 4. Seed Discipline Logs
    const storedLogs = localStorage.getItem("wassup_hr_discipline_logs");
    if (storedLogs) {
      setDisciplineLogs(JSON.parse(storedLogs));
    } else {
      const defaultLogs: DisciplineLog[] = [
        {
          id: "log_ha_1",
          staffId: sIdHa,
          type: "commendation",
          category: "other",
          description: "Khách hàng feedback tốt liên tục 2 tháng qua cổng Telegram",
          recordedBy: "Quản Lý Nguyễn Văn Hùng",
          at: "2026-07-10T14:30:00Z"
        },
        {
          id: "log_phuc_1",
          staffId: sIdPhuc,
          type: "violation",
          category: "technical_process",
          description: "Dán phim cách nhiệt thiếu bước vệ sinh khử mùi trước khi thực hiện bàn giao xe",
          recordedBy: "Quản Lý Nguyễn Văn Hùng",
          at: "2026-07-08T09:15:00Z"
        }
      ];
      setDisciplineLogs(defaultLogs);
      localStorage.setItem("wassup_hr_discipline_logs", JSON.stringify(defaultLogs));
    }
  }, [staff]);

  // Certifications cron check
  useEffect(() => {
    if (certifications.length === 0) return;
    const now = new Date("2026-07-17");
    let changed = false;
    const checkedCerts = certifications.map(c => {
      if (!c.expiryDate) return c;
      const exp = new Date(c.expiryDate);
      const diffTime = exp.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStatus: "valid" | "expiring_soon" | "expired" = "valid";
      if (diffDays <= 0) {
        newStatus = "expired";
      } else if (diffDays <= 30) {
        newStatus = "expiring_soon";
      }

      if (c.status !== newStatus) {
        changed = true;
        return { ...c, status: newStatus };
      }
      return c;
    });

    if (changed) {
      setCertifications(checkedCerts);
      localStorage.setItem("wassup_hr_certs", JSON.stringify(checkedCerts));
    }
  }, [certifications]);

  // Core Actions
  const handleUpdateProfileFieldEx = (staffId: string, field: keyof HrProfile, value: any) => {
    const updated = profiles.map(p => {
      if (p.staffId === staffId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem("wassup_hr_profiles", JSON.stringify(updated));
    showToastMsg("Đã lưu cập nhật thành công!");
  };

  const handleToggleSkillForSelected = (staffId: string, skillId: string) => {
    const updated = profiles.map(p => {
      if (p.staffId === staffId) {
        const skills = p.selectedSkills.includes(skillId)
          ? p.selectedSkills.filter(id => id !== skillId)
          : [...p.selectedSkills, skillId];
        return { ...p, selectedSkills: skills };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem("wassup_hr_profiles", JSON.stringify(updated));
    showToastMsg("Cập nhật ma trạng kỹ năng thành công!");
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailedStaffId) return;
    if (!newCert.name || !newCert.issuer || !newCert.issuedDate) {
      showToastMsg("Vui lòng nhập đủ các trường bắt buộc!", "warning");
      return;
    }

    const expDate = newCert.expiryDate || undefined;
    let computedStatus: "valid" | "expiring_soon" | "expired" = "valid";

    if (expDate) {
      const now = new Date("2026-07-17");
      const exp = new Date(expDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) computedStatus = "expired";
      else if (diffDays <= 30) computedStatus = "expiring_soon";
    }

    const item: Certification = {
      id: "cert_" + Date.now(),
      staffId: selectedDetailedStaffId,
      name: newCert.name,
      issuer: newCert.issuer,
      issuedDate: newCert.issuedDate,
      expiryDate: expDate,
      status: computedStatus,
      fileUrl: newCert.fileUrl || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [...certifications, item];
    setCertifications(updated);
    localStorage.setItem("wassup_hr_certs", JSON.stringify(updated));
    setShowAddCertModal(false);
    setNewCert({ name: "", issuer: "", issuedDate: "", expiryDate: "", fileUrl: "" });
    showToastMsg("Đã cấp thêm chứng chỉ mới thành công!");
  };

  const handleAddDisciplineLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailedStaffId) return;
    if (!newLog.description) {
      showToastMsg("Mô tả vi phạm/khen thưởng là bắt buộc!", "warning");
      return;
    }

    const item: DisciplineLog = {
      id: "log_" + Date.now(),
      staffId: selectedDetailedStaffId,
      type: newLog.type,
      category: newLog.category,
      description: newLog.description,
      evidenceFileUrl: newLog.evidenceFileUrl || undefined,
      recordedBy: loggedInUser?.name || "Quản trị viên",
      at: new Date().toISOString()
    };

    const updated = [...disciplineLogs, item];
    setDisciplineLogs(updated);
    localStorage.setItem("wassup_hr_discipline_logs", JSON.stringify(updated));

    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    const monthlyViolations = updated.filter(l => {
      if (l.staffId !== selectedDetailedStaffId || l.type !== "violation") return false;
      const d = new Date(l.at);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    if (monthlyViolations.length >= 3) {
      showToastMsg(`CẢNH BÁO BÁO ĐỘNG: Nhân sự đã vi phạm ${monthlyViolations.length} lần trong tháng! (Đã đẩy Telegram)`, "danger");
    } else {
      showToastMsg("Đã lưu sự kiện thành công!");
    }

    setShowAddLogModal(false);
    setNewLog({ type: "violation", category: "technical_process", description: "", evidenceFileUrl: "" });
  };

  const handleCreateNewSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const item: Skill = {
      id: "sk_" + Date.now(),
      name: newSkillName.trim(),
      active: true
    };
    const updated = [...skillsCatalog, item];
    setSkillsCatalog(updated);
    localStorage.setItem("wassup_hr_skills_catalog", JSON.stringify(updated));
    setNewSkillName("");
    setShowAddSkillModal(false);
    showToastMsg("Thêm kỹ năng mới vào danh mục thành công!");
  };

  const handleDeleteSkill = (skillId: string) => {
    if (confirm("Xóa kỹ năng này khỏi danh mục chung?")) {
      const updated = skillsCatalog.filter(s => s.id !== skillId);
      setSkillsCatalog(updated);
      localStorage.setItem("wassup_hr_skills_catalog", JSON.stringify(updated));
      showToastMsg("Đã xóa kỹ năng.");
    }
  };

  const handleCreateKtv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKtv.name || !newKtv.phone) {
      showToastMsg("Vui lòng nhập họ tên và số điện thoại!", "warning");
      return;
    }

    const newKtvId = "s_ktv_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);

    const profile: HrProfile = {
      staffId: newKtvId,
      name: newKtv.name,
      phone: newKtv.phone,
      pin: newKtv.pin || "123456",
      rank: newKtv.rank,
      wageType: "hourly",
      hourlyRate: 50000,
      permanentAddress: "TP. Hồ Chí Minh",
      temporaryAddress: "TP. Hồ Chí Minh",
      emergencyContactName: "Người thân",
      emergencyContactPhone: newKtv.phone,
      probationStartDate: new Date().toISOString().split("T")[0],
      officialStartDate: new Date().toISOString().split("T")[0],
      employmentStatus: "active",
      portraitPhotoUrl: "",
      selectedSkills: ["sk_1"],
      stationId: newKtv.stationId
    };

    const updatedProfiles = [...profiles, profile];
    setProfiles(updatedProfiles);
    localStorage.setItem("wassup_hr_profiles", JSON.stringify(updatedProfiles));
    setShowAddKtvModal(false);
    setNewKtv({ name: "", phone: "", pin: "123456", stationId: "WASSUP_TÂN_BÌNH_01", rank: "junior" });
    showToastMsg("Thêm Kỹ thuật viên trạm thành công!");
  };

  // CSV Export for work records
  const handleExportCsv = (staffName: string, records: WorkAllocation[]) => {
    const headers = ["Ngày", "Biển số", "Gói Dịch Vụ", "Vai Trò", "Giờ Bắt Đầu", "Giờ Kết Thúc", "SLA Định Mức (Phút)", "Chênh Lệch"];
    const rows = records.map(r => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const actualDiff = Math.round((end.getTime() - start.getTime()) / 60000);
      const diffVal = actualDiff - r.slaMax;
      const diffStr = diffVal > 0 ? `Trễ ${diffVal}p` : diffVal === 0 ? "Đúng hạn" : `Sớm ${Math.abs(diffVal)}p`;

      return [
        new Date(r.date).toLocaleDateString("vi-VN"),
        r.licensePlate,
        r.serviceName,
        r.role === "primary" ? "Thợ chính" : "Thợ phụ",
        start.toLocaleTimeString("vi-VN"),
        end.toLocaleTimeString("vi-VN"),
        `${r.slaMin}-${r.slaMax} phút`,
        diffStr
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wassup_ktv_productivity_${staffName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper computations
  const getPerformanceMetrics = (sId: string) => {
    const p = profiles.find(pr => pr.staffId === sId);
    if (!p) {
      return { reworkRate: "0%", avgKtvRating: 5.0, avgVehicleRating: 5.0, pendingComplaints: 0, totalWo: 0, reworkCount: 0 };
    }
    const name = p.name || staff.find(s => s.id === sId)?.name || "";
    if (name.includes("Khoa")) {
      return { reworkRate: "3.1%", avgKtvRating: 4.7, avgVehicleRating: 4.6, pendingComplaints: 0, totalWo: 32, reworkCount: 1 };
    } else if (name.includes("Hà")) {
      return { reworkRate: "0%", avgKtvRating: 4.8, avgVehicleRating: 4.9, pendingComplaints: 0, totalWo: 28, reworkCount: 0 };
    } else if (name.includes("Phúc")) {
      return { reworkRate: "8%", avgKtvRating: 4.3, avgVehicleRating: 4.5, pendingComplaints: 1, totalWo: 25, reworkCount: 2 };
    }
    return { reworkRate: "0%", avgKtvRating: 4.8, avgVehicleRating: 4.7, pendingComplaints: 0, totalWo: 15, reworkCount: 0 };
  };

  const getWorkAllocations = (sId: string): WorkAllocation[] => {
    const p = profiles.find(pr => pr.staffId === sId);
    const name = p?.name || staff.find(s => s.id === sId)?.name || "";
    if (!name) return [];
    const isPhuc = name.includes("Phúc");
    const isHa = name.includes("Hà");

    return [
      {
        id: "wa_1",
        date: "2026-07-16",
        licensePlate: "30A-123.45",
        serviceName: "Dán Phim Cách Nhiệt Classis SUV",
        role: "primary",
        startTime: "2026-07-16T09:00:00Z",
        endTime: isPhuc ? "2026-07-16T10:45:00Z" : "2026-07-16T10:15:00Z",
        slaMin: 75,
        slaMax: 90,
        status: isPhuc ? "rework" : "done"
      },
      {
        id: "wa_2",
        date: "2026-07-15",
        licensePlate: "51G-999.99",
        serviceName: "Rửa Chi Tiết & Dưỡng Nhựa Wax Gyeon",
        role: "primary",
        startTime: "2026-07-15T14:00:00Z",
        endTime: "2026-07-15T14:35:00Z",
        slaMin: 35,
        slaMax: 45,
        status: "done"
      },
      {
        id: "wa_3",
        date: "2026-07-14",
        licensePlate: "29H-888.88",
        serviceName: "Đánh bóng sơn & phủ bảo vệ Ceramic",
        role: isHa ? "primary" : "secondary",
        startTime: "2026-07-14T08:30:00Z",
        endTime: "2026-07-14T11:45:00Z",
        slaMin: 180,
        slaMax: 210,
        status: "done"
      }
    ];
  };

  // Filter KTV staff list based on Station Access Control Logic
  const stationTechnicians = profiles
    .map(p => {
      const s = staff.find(x => x.id === p.staffId);
      return {
        id: p.staffId,
        name: p.name || s?.name || "Kỹ thuật viên",
        phone: p.phone || s?.phone || "",
        pin: p.pin || s?.pin || "123456",
        role: "technician",
        status: p.employmentStatus || s?.status || "active"
      };
    })
    .filter(t => {
      const p = profiles.find(pr => pr.staffId === t.id);
      const stationId = p?.stationId || "WASSUP_TÂN_BÌNH_01";

      // Station check
      if (selectedStationId !== "all" && stationId !== selectedStationId) {
        return false;
      }
      return true;
    });

  // Apply Search, Rank, Status and Skill Filters on Directory
  const filteredTechnicians = stationTechnicians.filter(s => {
    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone.includes(searchQuery);

    const profile = profiles.find(p => p.staffId === s.id);
    const matchRank = filterRank === "all" || (profile && profile.rank === filterRank);
    const matchStatus = filterStatus === "all" || (profile && profile.employmentStatus === filterStatus);
    const matchSkill = filterSkill === "all" || (profile && profile.selectedSkills.includes(filterSkill));

    return matchQuery && matchRank && matchStatus && matchSkill;
  });

  // Detailed view staff information lookup
  const detailedStaffObj = selectedDetailedStaffId 
    ? (staff.find(s => s.id === selectedDetailedStaffId) || (() => {
        const p = profiles.find(pr => pr.staffId === selectedDetailedStaffId);
        if (!p) return null;
        return {
          id: p.staffId,
          name: p.name || "Kỹ thuật viên",
          phone: p.phone || "",
          pin: p.pin || "123456",
          role: "technician",
          status: p.employmentStatus || "active"
        };
      })())
    : null;
  const detailedProfile = selectedDetailedStaffId ? profiles.find(p => p.staffId === selectedDetailedStaffId) : null;
  const detailedCerts = selectedDetailedStaffId ? certifications.filter(c => c.staffId === selectedDetailedStaffId) : [];
  const detailedLogs = selectedDetailedStaffId ? disciplineLogs.filter(l => l.staffId === selectedDetailedStaffId) : [];
  const detailedMetrics = selectedDetailedStaffId ? getPerformanceMetrics(selectedDetailedStaffId) : null;
  const detailedWorkHistory = selectedDetailedStaffId ? getWorkAllocations(selectedDetailedStaffId) : [];

  return (
    <div className="space-y-6">
      {/* GLOBAL TOAST BANNER */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 font-sans text-xs font-bold ${
              toast.type === "success" ? "bg-matte-black text-brand-green border-brand-green/20" :
              toast.type === "danger" ? "bg-red-50 text-red-700 border-red-200" :
              "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <Info className="h-4 w-4 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL VIEW OVERLAY / DETAILED PAGE */}
      {selectedDetailedStaffId && detailedStaffObj && detailedProfile ? (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden min-h-[550px] flex flex-col">
          {/* Detail View Header */}
          <div className="bg-stone-50 border-b border-stone-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDetailedStaffId(null)}
                className="p-2 hover:bg-stone-200/70 rounded-xl transition text-stone-600 border border-stone-200 bg-white shadow-3xs flex items-center gap-1.5 text-xs font-extrabold font-sans cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Quay lại
              </button>
              <div className="h-px w-4 bg-stone-300 hidden sm:block" />
              <div>
                <span className="text-[10px] font-black tracking-widest text-forest-green uppercase block font-sans">HỒ SƠ CHI TIẾT KTV</span>
                <h2 className="text-lg font-black font-display text-matte-black uppercase mt-0.5">{detailedStaffObj.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="text-stone-500 font-bold">Trạm:</span>
              <span className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-1 font-extrabold text-stone-800">
                {STATIONS.find(s => s.id === detailedProfile.stationId)?.name || "Chi nhánh khác"}
              </span>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${
                detailedProfile.employmentStatus === "active" ? "bg-green-50 text-green-700 border-green-200" :
                detailedProfile.employmentStatus === "probation" ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-red-50 text-red-700 border-red-200"
              }`}>
                {detailedProfile.employmentStatus === "active" ? "Chính thức" :
                 detailedProfile.employmentStatus === "probation" ? "Thử việc" : "Tạm hoãn/Nghỉ"}
              </span>
            </div>
          </div>

          {/* LEFT MENU, RIGHT CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 items-stretch">
            {/* LEFT MENU/SIDEBAR (Col-span-3) */}
            <div className="lg:col-span-3 bg-stone-50/50 border-r border-stone-200 p-4 space-y-4">
              {/* Mini Portrait profile card */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 text-center space-y-2.5 shadow-3xs">
                <div className="relative mx-auto h-20 w-20 rounded-2xl overflow-hidden border-2 border-stone-100 bg-stone-50 flex items-center justify-center">
                  {detailedProfile.portraitPhotoUrl ? (
                    <img
                      src={detailedProfile.portraitPhotoUrl}
                      alt={detailedStaffObj.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-10 w-10 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-stone-900">{detailedStaffObj.name}</div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">
                    {detailedProfile.rank === "senior" ? "Thợ chính (Senior)" :
                     detailedProfile.rank === "team_lead" ? "Tổ trưởng (Lead)" :
                     detailedProfile.rank === "junior" ? "Thợ phụ (Junior)" : "Học việc"}
                  </div>
                </div>
              </div>

              {/* Vertical Navigation Items */}
              <div className="space-y-1 text-xs font-sans">
                {[
                  { id: "info_perf", label: "Thông tin & Hiệu suất", icon: User },
                  { id: "skills", label: "Kỹ năng & Chứng chỉ", icon: Award },
                  { id: "work_history", label: "Lịch sử công việc & SLA", icon: Briefcase },
                  { id: "discipline", label: "Kỷ luật & Khen thưởng", icon: History }
                ].map(item => {
                  const isActive = activeDetailTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveDetailTab(item.id as any)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition text-left cursor-pointer ${
                        isActive
                          ? "bg-stone-950 text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT DETAIL CONTENT (Col-span-9) */}
            <div className="lg:col-span-9 p-6 overflow-y-auto max-h-[600px]">
              {/* Tab 1: Thông tin & Hiệu suất */}
              {activeDetailTab === "info_perf" && (
                <div className="space-y-8">
                  {/* Section 1: Hồ sơ kỹ thuật viên */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-forest-green" />
                        Section 1: Hồ sơ kỹ thuật viên
                      </h3>
                      <span className="text-[10px] text-mid-gray font-bold">Mã số: {detailedStaffObj.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Họ và tên:</span>
                           <input
                             type="text"
                             value={detailedProfile.name || detailedStaffObj.name}
                             onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "name", e.target.value)}
                             className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950 bg-stone-50"
                           />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Số điện thoại:</span>
                           <input
                             type="text"
                             value={detailedProfile.phone || detailedStaffObj.phone}
                             onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "phone", e.target.value)}
                             className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950 bg-stone-50"
                           />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Thường trú:</span>
                          <input
                            type="text"
                            value={detailedProfile.permanentAddress}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "permanentAddress", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                          />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Tạm trú:</span>
                          <input
                            type="text"
                            value={detailedProfile.temporaryAddress}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "temporaryAddress", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                          />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Người LH khẩn:</span>
                          <input
                            type="text"
                            value={detailedProfile.emergencyContactName}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "emergencyContactName", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                          />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">SĐT khẩn cấp:</span>
                          <input
                            type="text"
                            value={detailedProfile.emergencyContactPhone}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "emergencyContactPhone", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                          />
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Ngày thử việc:</span>
                          <input
                            type="date"
                            value={detailedProfile.probationStartDate}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "probationStartDate", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                          />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Ngày chính thức:</span>
                          <input
                            type="date"
                            value={detailedProfile.officialStartDate}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "officialStartDate", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                          />
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Trạm làm việc:</span>
                          <select
                            disabled={!isAccountMaster}
                            value={detailedProfile.stationId}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "stationId", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2 py-1 text-xs font-extrabold focus:outline-none bg-stone-50 disabled:bg-stone-100 disabled:opacity-75 cursor-pointer"
                          >
                            {STATIONS.map(st => (
                              <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Lương cơ bản:</span>
                          <div className="col-span-2 relative">
                            <input
                              type="text"
                              value={formatNumberWithDot(detailedProfile.baseSalary || detailedProfile.hourlyRate || 0)}
                              onChange={(e) => {
                                const parsed = parseNumberFromDot(e.target.value);
                                handleUpdateProfileFieldEx(
                                  detailedStaffObj.id,
                                  detailedProfile.wageType === "hourly" ? "hourlyRate" : "baseSalary",
                                  parsed
                                );
                              }}
                              className="w-full border border-stone-200 rounded pl-2.5 pr-8 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950"
                            />
                            <span className="absolute right-2 top-1 text-[10px] text-stone-400 font-bold">đ</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bot Integration Details */}
                    <div className="pt-4 border-t border-stone-100">
                      <div className="text-[10px] text-stone-500 font-black uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5 text-blue-500" /> LIÊN KẾT NHẬN LỆNH BOTS (TELEGRAM / ZALO)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Telegram Chat ID:</span>
                          <input
                            type="text"
                            placeholder="Nhập Chat ID hoặc để trống"
                            value={detailedProfile.telegramChatId || ""}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "telegramChatId", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950 font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-2">
                          <span className="text-stone-500 font-bold">Zalo User ID:</span>
                          <input
                            type="text"
                            placeholder="Nhập ID Zalo OA hoặc để trống"
                            value={detailedProfile.zaloChatId || ""}
                            onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "zaloChatId", e.target.value)}
                            className="col-span-2 border border-stone-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-stone-950 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ID Documents view */}
                    <div className="pt-3">
                      <div className="text-[10px] text-stone-500 font-black uppercase tracking-wider mb-2 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> CCCD Hồ Sơ Pháp Lý (Đã che mặc định)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-600">CCCD Mặt trước</span>
                          <button
                            type="button"
                            onClick={() => setShowIdFront(!showIdFront)}
                            className="p-1 hover:bg-white border rounded text-stone-500 hover:text-stone-900 transition flex items-center gap-1 text-[10px] font-bold font-sans cursor-pointer"
                          >
                            {showIdFront ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Chi tiết
                          </button>
                        </div>
                        <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-600">CCCD Mặt sau</span>
                          <button
                            type="button"
                            onClick={() => setShowIdBack(!showIdBack)}
                            className="p-1 hover:bg-white border rounded text-stone-500 hover:text-stone-900 transition flex items-center gap-1 text-[10px] font-bold font-sans cursor-pointer"
                          >
                            {showIdBack ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Hiệu suất làm việc */}
                  {detailedMetrics && (
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-forest-green" />
                        Section 2: Hiệu suất làm việc
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sans">
                        <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl">
                          <span className="text-[9px] font-black text-stone-500 uppercase block">Tỉ lệ Rework</span>
                          <span className={`text-lg font-black block mt-1 ${parseFloat(detailedMetrics.reworkRate) > 5 ? "text-red-600" : "text-green-700"}`}>
                            {detailedMetrics.reworkRate}
                          </span>
                          <span className="text-[9px] text-stone-400 font-medium">Tháng này ({detailedMetrics.reworkCount}/{detailedMetrics.totalWo} ca)</span>
                        </div>

                        <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl">
                          <span className="text-[9px] font-black text-stone-500 uppercase block">Đánh giá KTV</span>
                          <span className="text-lg font-black text-stone-800 block mt-1">⭐ {detailedMetrics.avgKtvRating}/5</span>
                          <span className="text-[9px] text-stone-400 font-medium">Mục tiêu trạm: 4.5</span>
                        </div>

                        <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl">
                          <span className="text-[9px] font-black text-stone-500 uppercase block">Đánh giá Xe</span>
                          <span className="text-lg font-black text-stone-800 block mt-1">⭐ {detailedMetrics.avgVehicleRating}/5</span>
                          <span className="text-[9px] text-stone-400 font-medium">Đầu ra kỹ thuật</span>
                        </div>

                        <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl">
                          <span className="text-[9px] font-black text-stone-500 uppercase block">Khiếu nại</span>
                          <span className={`text-lg font-black block mt-1 ${detailedMetrics.pendingComplaints > 0 ? "text-red-600" : "text-stone-700"}`}>
                            {detailedMetrics.pendingComplaints}
                          </span>
                          <span className="text-[9px] text-stone-400 font-medium">Chờ giải quyết</span>
                        </div>
                      </div>

                      {/* Warning box */}
                      {(detailedMetrics.avgKtvRating < 4.5 || detailedMetrics.pendingComplaints > 0) && (
                        <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-start gap-2 text-[11px] text-red-900 leading-relaxed">
                          <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>CẢNH BÁO TÍCH HỢP HỆ THỐNG:</strong> Nhân sự không đạt tiêu chuẩn thưởng tháng do rating trung bình thấp hoặc có khiếu nại chưa xử lý.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Kỹ năng & Chứng chỉ */}
              {activeDetailTab === "skills" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-purple-600" />
                      Ma trận Kỹ năng & Chứng chỉ
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddCertModal(true)}
                      className="text-[10px] font-black uppercase text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5 shadow-2xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Thêm chứng chỉ
                    </button>
                  </div>

                  {/* Rank selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase">Phân bậc trình độ kỹ thuật viên</label>
                    <select
                      value={detailedProfile.rank}
                      onChange={(e) => handleUpdateProfileFieldEx(detailedStaffObj.id, "rank", e.target.value)}
                      className="bg-white border border-stone-200 rounded-lg p-2.5 text-xs font-extrabold text-stone-800 w-full focus:outline-none focus:border-stone-950 cursor-pointer"
                    >
                      <option value="apprentice">Học việc (Apprentice)</option>
                      <option value="junior">Thợ phụ (Junior)</option>
                      <option value="senior">Thợ chính (Senior)</option>
                      <option value="team_lead">Tổ trưởng (Team Lead)</option>
                    </select>
                  </div>

                  {/* Skills Checklist */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-stone-500 uppercase">Kỹ năng kỹ thuật đã kích hoạt</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {skillsCatalog.filter(s => s.active).map(sk => {
                        const isChecked = detailedProfile.selectedSkills.includes(sk.id);
                        return (
                          <label
                            key={sk.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? "bg-forest-green/5 border-forest-green/20 text-forest-green"
                                : "bg-white hover:bg-stone-50 border-stone-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSkillForSelected(detailedStaffObj.id, sk.id)}
                              className="rounded border-stone-300 text-forest-green focus:ring-forest-green h-4 w-4 cursor-pointer"
                            />
                            <span className="text-xs font-extrabold">{sk.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Certificates list */}
                  <div className="space-y-3 pt-4 border-t border-stone-100">
                    <div className="text-[10px] font-black text-stone-500 uppercase">Chứng chỉ chuyên môn ({detailedCerts.length})</div>
                    <div className="space-y-2">
                      {detailedCerts.length === 0 ? (
                        <div className="text-stone-400 text-xs italic py-4 text-center">Chưa có chứng chỉ được ghi nhận.</div>
                      ) : (
                        detailedCerts.map(cert => (
                          <div
                            key={cert.id}
                            className="flex items-center justify-between p-3 border border-stone-200 rounded-xl bg-stone-50/50"
                          >
                            <div>
                              <div className="font-extrabold text-xs text-stone-900">{cert.name}</div>
                              <div className="text-[10px] text-stone-500 mt-0.5">
                                Cấp bởi: <strong>{cert.issuer}</strong> | Ngày cấp: {formatDateString(cert.issuedDate)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                cert.status === "valid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {cert.status === "valid" ? "Còn hạn" : "Sắp hết hạn/Hết hạn"}
                              </span>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa chứng chỉ này?")) {
                                    const updated = certifications.filter(c => c.id !== cert.id);
                                    setCertifications(updated);
                                    localStorage.setItem("wassup_hr_certs", JSON.stringify(updated));
                                    showToastMsg("Đã xóa chứng chỉ.");
                                  }
                                }}
                                className="p-1 hover:bg-stone-200 hover:text-red-500 rounded text-stone-400 transition cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Lịch sử công việc & SLA */}
              {activeDetailTab === "work_history" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-forest-green" />
                      Lịch sử thi công & năng suất SLA
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleExportCsv(detailedStaffObj.name, detailedWorkHistory)}
                      className="text-[10px] font-black uppercase text-stone-700 hover:text-stone-950 flex items-center gap-1.5 cursor-pointer bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 shadow-2xs"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-forest-green" /> Xuất Excel CSV
                    </button>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 text-[10px] font-black uppercase">
                          <th className="p-3">Ngày</th>
                          <th className="p-3">Biển số</th>
                          <th className="p-3">Gói Dịch Vụ</th>
                          <th className="p-3">SLA</th>
                          <th className="p-3 text-right">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {detailedWorkHistory.map(wa => {
                          const start = new Date(wa.startTime);
                          const end = new Date(wa.endTime);
                          const diff = Math.round((end.getTime() - start.getTime()) / 60000);
                          const isLate = diff > wa.slaMax;
                          return (
                            <tr key={wa.id} className="hover:bg-stone-50/50">
                              <td className="p-3 text-stone-600 font-medium">{new Date(wa.date).toLocaleDateString("vi-VN")}</td>
                              <td className="p-3 font-sans font-bold text-stone-950">{wa.licensePlate}</td>
                              <td className="p-3 font-bold text-stone-700">{wa.serviceName}</td>
                              <td className="p-3 text-stone-500">{wa.slaMin}-{wa.slaMax}p</td>
                              <td className="p-3 text-right font-black">
                                {isLate ? (
                                  <span className="text-red-600">Trễ {diff - wa.slaMax} phút</span>
                                ) : (
                                  <span className="text-green-600">Sớm {Math.abs(diff - wa.slaMax)} phút</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Kỷ luật & Khen thưởng */}
              {activeDetailTab === "discipline" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display flex items-center gap-1.5">
                      <History className="h-4 w-4 text-stone-600" />
                      Nhật ký Kỷ luật & Khen thưởng
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddLogModal(true)}
                      className="text-[10px] font-black uppercase text-stone-700 hover:text-stone-950 flex items-center gap-1 cursor-pointer bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 shadow-2xs"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-stone-600" /> Ghi nhận sự kiện
                    </button>
                  </div>

                  <div className="space-y-3">
                    {detailedLogs.length === 0 ? (
                      <div className="text-stone-400 text-xs italic py-4 text-center">Chưa có bản ghi kỷ luật/khen thưởng nào.</div>
                    ) : (
                      detailedLogs.map(log => (
                        <div
                          key={log.id}
                          className={`p-4 border rounded-xl flex items-start justify-between gap-4 text-xs ${
                            log.type === "violation" ? "bg-red-50/50 border-red-100 text-red-950" : "bg-green-50/50 border-green-100 text-green-950"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                log.type === "violation" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                              }`}>
                                {log.type === "violation" ? "Vi phạm" : "Khen thưởng"}
                              </span>
                              <span className="text-[10px] text-stone-500 font-bold uppercase">
                                {log.category === "safety" ? "An toàn" : log.category === "technical_process" ? "Quy trình" : "Khác"}
                              </span>
                            </div>
                            <div className="mt-1.5 font-semibold text-stone-800">
                              <MarkdownRenderer text={log.description} />
                            </div>
                          </div>
                          <div className="text-right shrink-0 text-[10px] text-stone-400 font-medium">
                            <div>Bởi: {log.recordedBy}</div>
                            <div className="mt-0.5">{new Date(log.at).toLocaleDateString("vi-VN")}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MAIN VIEWS OF MODULE 8 */
        <div className="space-y-6">
          {/* HEADER DASHBOARD CARD */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2">
            <div className="px-4">
              <h1 className="text-2xl font-black font-display text-matte-black uppercase tracking-tight">
                Quản lý Người Chăm Sóc (Carer) & Hiệu Suất
              </h1>
              <p className="text-mid-gray text-xs mt-1 font-sans max-w-2xl">
                Kiểm tra trạng thái thi công trực tiếp của kỹ thuật viên tại trạm, chấm điểm hiệu suất hoạt động, ma trận kỹ năng chuyên môn và lưu trữ hồ sơ hành chính.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans shrink-0">
              <span className="text-stone-500 font-bold shrink-0">Lọc dữ liệu trạm:</span>
              {isAccountMaster ? (
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg p-2 font-extrabold text-stone-800 focus:outline-none focus:border-stone-950 cursor-pointer shadow-3xs"
                >
                  <option value="all">Toàn bộ hệ thống (Tất cả trạm)</option>
                  {STATIONS.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              ) : (
                <div className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 font-extrabold text-stone-800 flex items-center gap-1.5">
                  <span>{STATIONS.find(s => s.id === localStationId)?.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* MODULE TABS NAVIGATION */}
          <div className="flex border border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-sm gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveM8Tab("performance")}
              className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
                activeM8Tab === "performance"
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
              }`}
            >
              <TrendingUp className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeM8Tab === "performance" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
              HIỆU SUẤT KTV
            </button>
            <button
              onClick={() => setActiveM8Tab("directory")}
              className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
                activeM8Tab === "directory"
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
              }`}
            >
              <Users className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeM8Tab === "directory" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
              DANH SÁCH KTV TRẠM
            </button>
            <button
              onClick={() => setActiveM8Tab("catalog")}
              className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
                activeM8Tab === "catalog"
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
              }`}
            >
              <Layers className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeM8Tab === "catalog" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
              DANH MỤC KỸ NĂNG
            </button>
            <button
              onClick={() => setActiveM8Tab("bots")}
              className={`flex-1 min-w-[140px] py-3.5 px-4 text-center font-display font-black text-xs tracking-wider uppercase transition-all duration-200 rounded-xl cursor-pointer flex items-center justify-center gap-2.5 border-0 ${
                activeM8Tab === "bots"
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
              }`}
            >
              <Bot className={`h-4 w-4 shrink-0 transition-colors stroke-[2.2] ${activeM8Tab === "bots" ? "text-[#a2c62c]" : "text-[#64748b]"}`} />
              CÀI ĐẶT BOTS & KÊNH
            </button>
          </div>

          {/* VIEW: 1. Hiệu suất KTV (Giao diện đầu tiên: card 1 dòng, hiệu suất hoạt động) */}
          {activeM8Tab === "performance" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display">
                  TRẠNG THÁI & HIỆU SUẤT THI CÔNG TRỰC TIẾP ({stationTechnicians.length} KTV)
                </h3>
                <span className="text-[10px] text-stone-400 font-bold">Cập nhật thời gian thực</span>
              </div>

              <div className="space-y-3">
                {stationTechnicians.length === 0 ? (
                  <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400 text-xs italic font-sans shadow-3xs">
                    Chưa có kỹ thuật viên nào trực thuộc trạm này.
                  </div>
                ) : (
                  stationTechnicians.map(s => {
                    const p = profiles.find(pr => pr.staffId === s.id);
                    const perf = getPerformanceMetrics(s.id);
                    const isReworkHigh = parseFloat(perf.reworkRate) > 5;

                    // Compute active job from realtime orders
                    const activeJob = orders.find(o => o.technicianId === s.id && (o.status === "in_progress" || o.status === "quality_check"));

                    return (
                      <div
                        key={s.id}
                        className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-400 transition-all flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-3xs"
                      >
                        {/* Left: General KTV info & Active job status */}
                        <div className="flex items-center gap-3.5 min-w-[280px]">
                          <div className="relative shrink-0">
                            {p?.portraitPhotoUrl ? (
                              <img
                                src={p.portraitPhotoUrl}
                                alt={s.name}
                                className="h-12 w-12 rounded-2xl object-cover border border-stone-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black text-sm uppercase">
                                {s.name.charAt(0)}
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 bg-stone-950 border border-white text-[8px] text-white px-1.5 py-0.5 font-black uppercase rounded">
                              {p?.rank === "senior" ? "Senior" : p?.rank === "team_lead" ? "Lead" : "Junior"}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="font-extrabold text-sm text-stone-950 flex items-center gap-2">
                              <span>{s.name}</span>
                              <span className="text-[10px] font-sans text-stone-400 font-bold">({s.phone})</span>
                            </div>

                            {/* Live operation status indicator badge */}
                            <div className="flex items-center gap-1.5">
                              {activeJob ? (
                                <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Đang thi công: Gói {activeJob.packageCode} cho xe {activeJob.licensePlate} ({activeJob.boothName || "Bays"})
                                </span>
                              ) : (
                                <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  Đang sẵn sàng nhận việc
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Performance Metrics grid inside single row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-2xl font-sans text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-stone-400 uppercase block">Đánh giá chung</span>
                            <div className="font-extrabold text-stone-900">⭐ {perf.avgKtvRating} / 5.0</div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-stone-400 uppercase block">Tỷ lệ Rework</span>
                            <div className={`font-extrabold ${isReworkHigh ? "text-red-600 animate-pulse" : "text-green-700"}`}>
                              {perf.reworkRate} {isReworkHigh && "(Cảnh báo)"}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-stone-400 uppercase block">Độ lệch SLA</span>
                            <div className="font-extrabold text-stone-900">Sớm {isReworkHigh ? "2" : "15"} phút (TB)</div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black text-stone-400 uppercase block">Sản lượng ca</span>
                            <div className="font-extrabold text-stone-900">{perf.totalWo} ca hoàn tất</div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center justify-end shrink-0 pl-2">
                          <button
                            onClick={() => {
                              setSelectedDetailedStaffId(s.id);
                              setActiveDetailTab("info_perf");
                            }}
                            className="bg-stone-950 hover:bg-stone-800 text-white font-extrabold font-sans text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                          >
                            Xem Chi Tiết <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW: 2. Danh sách KTV trạm (Sub-menu of M8, station based list) */}
          {activeM8Tab === "directory" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-xs font-black tracking-wider text-stone-900 uppercase font-display flex items-center gap-1">
                    <Users className="h-4 w-4 text-forest-green" />
                    Danh sách nhân viên tại trạm
                  </h3>
                  <p className="text-[10px] text-stone-400 font-medium">Bản ghi hồ sơ nhân sự, lọc theo bậc thợ, trình độ và trạng thái lao động.</p>
                </div>

                <button
                  onClick={() => setShowAddKtvModal(true)}
                  className="bg-stone-950 hover:bg-stone-800 text-white font-black font-sans text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shadow-3xs text-center shrink-0"
                >
                  <Plus className="h-4 w-4" /> THÊM KỸ THUẬT VIÊN
                </button>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative col-span-1 md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm KTV theo tên hoặc SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-950 text-stone-800"
                  />
                </div>

                <select
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-bold text-stone-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">Mọi Bậc thợ</option>
                  <option value="apprentice">Học việc</option>
                  <option value="junior">Thợ phụ</option>
                  <option value="senior">Thợ chính</option>
                  <option value="team_lead">Tổ trưởng</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-bold text-stone-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">Mọi Trạng thái</option>
                  <option value="probation">Thử việc</option>
                  <option value="active">Đang làm việc</option>
                  <option value="suspended">Tạm hoãn</option>
                  <option value="terminated">Đã nghỉ</option>
                </select>
              </div>

              {/* DIRECTORY TABLE / LIST */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden font-sans text-xs bg-stone-50/10 shadow-3xs">
                {filteredTechnicians.length === 0 ? (
                  <div className="p-12 text-center text-stone-400 italic">Không tìm thấy KTV nào thỏa mãn bộ lọc.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 text-[10px] font-black uppercase">
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3">Số điện thoại</th>
                        <th className="p-3">Bậc thợ</th>
                        <th className="p-3">Chứng chỉ</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {filteredTechnicians.map(s => {
                        const p = profiles.find(pr => pr.staffId === s.id);
                        const cCount = certifications.filter(c => c.staffId === s.id).length;
                        return (
                          <tr key={s.id} className="hover:bg-stone-50/50">
                            <td className="p-3 font-extrabold text-stone-900 flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-black text-xs text-stone-800 shrink-0">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <div>{s.name}</div>
                                <span className="text-[9px] text-stone-400 font-bold block uppercase mt-0.5">
                                  {STATIONS.find(st => st.id === p?.stationId)?.name || "Chi nhánh"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-sans font-bold text-stone-600">{s.phone}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-black text-[9px] uppercase border">
                                {p?.rank === "senior" ? "Thợ chính" : p?.rank === "team_lead" ? "Tổ trưởng" : p?.rank === "junior" ? "Thợ phụ" : "Học việc"}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-stone-600">{cCount} chứng chỉ</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                p?.employmentStatus === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {p?.employmentStatus === "active" ? "Đang làm" : "Thử việc"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedDetailedStaffId(s.id)}
                                  className="px-2.5 py-1 bg-stone-950 text-white rounded font-extrabold text-[10px] hover:bg-stone-800 transition cursor-pointer"
                                >
                                  Hồ sơ chi tiết
                                </button>
                                {isAccountMaster && (
                                  <select
                                    value={p?.stationId || "WASSUP_TÂN_BÌNH_01"}
                                    onChange={(e) => handleUpdateProfileFieldEx(s.id, "stationId", e.target.value)}
                                    className="bg-stone-100 border border-stone-200 rounded px-1.5 py-1 text-[10px] font-bold text-stone-700 focus:outline-none cursor-pointer"
                                    title="Điều chuyển trạm làm việc"
                                  >
                                    {STATIONS.map(st => (
                                      <option key={st.id} value={st.id}>Chuyển: {st.name.replace("WASSUP Station - ", "")}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* VIEW: 3. Skills Catalog Tab */}
          {activeM8Tab === "catalog" && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-xs font-black tracking-wider text-matte-black uppercase font-display flex items-center gap-1.5">
                    <Layers className="h-4.5 w-4.5 text-forest-green" />
                    Quản Lý Danh Mục Kỹ Năng Hệ Thống (Master Catalog)
                  </h3>
                  <p className="text-[10px] text-stone-400 font-medium mt-0.5">Danh mục kỹ năng chuẩn chung dùng để tích hợp và kiểm soát ma trận trình độ của toàn bộ KTV trạm.</p>
                </div>

                <button
                  onClick={() => setShowAddSkillModal(true)}
                  className="text-[10px] font-black uppercase text-white bg-stone-950 hover:bg-stone-800 px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shadow-3xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" /> THÊM KỸ NĂNG MỚI
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
                {skillsCatalog.map(sk => (
                  <div
                    key={sk.id}
                    className="p-4 border border-stone-200 rounded-2xl bg-stone-50/50 flex items-center justify-between shadow-3xs"
                  >
                    <div>
                      <div className="font-extrabold text-stone-900">{sk.name}</div>
                      <div className="text-[9px] text-stone-400 font-bold mt-0.5">Mã định danh: {sk.id}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const updated = skillsCatalog.map(s => {
                            if (s.id === sk.id) return { ...s, active: !s.active };
                            return s;
                          });
                          setSkillsCatalog(updated);
                          localStorage.setItem("wassup_hr_skills_catalog", JSON.stringify(updated));
                          showToastMsg("Đã đổi trạng thái kỹ năng.");
                        }}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase border cursor-pointer ${
                          sk.active
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-stone-100 text-stone-600 border-stone-200"
                        }`}
                      >
                        {sk.active ? "Sử dụng" : "Khóa"}
                      </button>

                      <button
                        onClick={() => handleDeleteSkill(sk.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: 4. Bots & Kênh liên lạc Tab */}
          {activeM8Tab === "bots" && (
            <form onSubmit={handleSaveBotsConfig} className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-b border-stone-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-matte-black uppercase font-display flex items-center gap-2">
                      <Bot className="h-5 w-5 text-[#3b82f6]" />
                      CẤU HÌNH KÊNH TRUYỀN TIN & BOTS (TELEGRAM / ZALO)
                    </h3>
                    <p className="text-[10px] text-stone-400 font-medium mt-0.5">
                      Kỹ thuật viên trạm (KTV) nhận lệnh phân công và báo cáo kết quả thông qua tin nhắn Bot mà không cần tạo tài khoản đăng nhập Station OS.
                    </p>
                  </div>
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-sans font-extrabold border border-blue-100 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
                    Bots active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Telegram panel */}
                  <div className="space-y-4 bg-stone-50/50 p-5 rounded-2xl border border-stone-200">
                    <span className="font-extrabold text-stone-900 uppercase tracking-wider block border-b border-stone-200 pb-2 flex items-center gap-1.5">
                      <Send className="h-4 w-4 text-blue-500" />
                      Cổng kết nối Telegram Bot API
                    </span>

                    <div className="space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className="font-bold text-stone-500 text-[10px] uppercase">Telegram Bot Token</label>
                        <input
                          type="text"
                          required
                          value={telegramToken}
                          onChange={(e) => setTelegramToken(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-stone-500 text-[10px] uppercase">ID Nhóm báo động (Group Chat ID)</label>
                        <input
                          type="text"
                          required
                          value={telegramGroupChatId}
                          onChange={(e) => setTelegramGroupChatId(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:border-stone-900"
                        />
                      </div>

                      <div className="pt-2 bg-white/60 p-3 rounded-lg border border-stone-200/50 space-y-1">
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block">Webhook URL Đồng Bộ Realtime</span>
                        <code className="text-[10px] text-blue-600 font-mono bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100 select-all block break-all">
                          https://api.wassup-station.vn/api/telegram/webhook
                        </code>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-[9px] text-stone-400 font-medium">Báo động phân việc & cảnh báo trễ SLA</span>
                        <button
                          type="button"
                          onClick={handleTestTelegramConnection}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 font-black uppercase text-[9px] rounded-lg tracking-wider transition cursor-pointer"
                        >
                          {telegramConnected ? "✓ Đã kết nối" : "Kiểm tra kết nối"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Zalo panel */}
                  <div className="space-y-4 bg-stone-50/50 p-5 rounded-2xl border border-stone-200">
                    <span className="font-extrabold text-stone-900 uppercase tracking-wider block border-b border-stone-200 pb-2 flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-emerald-500" />
                      Cổng kết nối Zalo Official Account (OA)
                    </span>

                    <div className="space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className="font-bold text-stone-500 text-[10px] uppercase">Zalo OA ID</label>
                        <input
                          type="text"
                          required
                          value={zaloOaId}
                          onChange={(e) => setZaloOaId(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-stone-500 text-[10px] uppercase">Zalo Access Token / Secret Key</label>
                        <input
                          type="password"
                          required
                          value={zaloToken}
                          onChange={(e) => setZaloToken(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:border-stone-900"
                        />
                      </div>

                      <div className="pt-2 bg-white/60 p-3 rounded-lg border border-stone-200/50 space-y-1">
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-wider block">Webhook URL Đồng Bộ Realtime</span>
                        <code className="text-[10px] text-emerald-600 font-mono bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100 select-all block break-all">
                          https://api.wassup-station.vn/api/zalo/webhook
                        </code>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-[9px] text-stone-400 font-medium">Bơm tin nhắn tương tác, nạp liệu Zalo Chatbot</span>
                        <button
                          type="button"
                          onClick={handleTestZaloConnection}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 font-black uppercase text-[9px] rounded-lg tracking-wider transition cursor-pointer"
                        >
                          {zaloConnected ? "✓ Đã liên kết" : "Kiểm tra Zalo OA"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-sm transition cursor-pointer"
                  >
                    LƯU TOÀN BỘ CẤU HÌNH BOTS
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODAL: THÊM KỸ THUẬT VIÊN TRẠM (Tab 2) */}
      {showAddKtvModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-2xl p-6 shadow-2xl relative font-sans">
            <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
              Thêm Kỹ Thuật Viên Mới vào Trạm
            </h3>

            <form onSubmit={handleCreateKtv} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase">Họ và tên KTV *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hải"
                  value={newKtv.name}
                  onChange={(e) => setNewKtv({ ...newKtv, name: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 0912xxxxxx"
                  value={newKtv.phone}
                  onChange={(e) => setNewKtv({ ...newKtv, phone: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-500 uppercase">Trạm Phân công *</label>
                  <select
                    value={newKtv.stationId}
                    onChange={(e) => setNewKtv({ ...newKtv, stationId: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {STATIONS.map(st => (
                      <option key={st.id} value={st.id}>{st.name.replace("WASSUP Station - ", "")}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-500 uppercase">Bậc trình độ *</label>
                  <select
                    value={newKtv.rank}
                    onChange={(e) => setNewKtv({ ...newKtv, rank: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="junior">Thợ phụ (Junior)</option>
                    <option value="senior">Thợ chính (Senior)</option>
                    <option value="team_lead">Tổ trưởng (Lead)</option>
                    <option value="apprentice">Học việc</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 text-xs font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setShowAddKtvModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-white transition cursor-pointer"
                >
                  Thêm KTV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: ADD CERTIFICATE */}
      {showAddCertModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-sans">
            <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
              Form Thêm Chứng Chỉ Nhân Sự
            </h3>

            <form onSubmit={handleAddCert} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase">Tên chứng chỉ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Certified Gyeon Detailer"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase">Tổ chức cấp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Gyeon Vietnam"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-500 uppercase">Ngày cấp *</label>
                  <input
                    type="date"
                    required
                    value={newCert.issuedDate}
                    onChange={(e) => setNewCert({ ...newCert, issuedDate: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-500 uppercase">Ngày hết hạn</label>
                  <input
                    type="date"
                    value={newCert.expiryDate}
                    onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 text-xs font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(false)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-950 hover:bg-stone-800 text-white transition cursor-pointer"
                >
                  Cấp chứng chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: ADD DISCIPLINE LOG */}
      {showAddLogModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-sans">
            <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
              Ghi Sự Kiện Kỷ Luật / Khen Thưởng
            </h3>

            <form onSubmit={handleAddDisciplineLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-500 uppercase">Phân loại sự kiện</label>
                  <select
                    value={newLog.type}
                    onChange={(e) => setNewLog({ ...newLog, type: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 cursor-pointer font-semibold"
                  >
                    <option value="violation">Kỷ Luật / Vi Phạm</option>
                    <option value="commendation">Khen Thưởng</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-stone-500 uppercase">Danh mục</label>
                  <select
                    value={newLog.category}
                    onChange={(e) => setNewLog({ ...newLog, category: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 cursor-pointer font-semibold"
                  >
                    <option value="technical_process">Quy Trình Kỹ Thuật</option>
                    <option value="safety">An Toàn Lao Động</option>
                    <option value="other">Sự Kiện Khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase">Nội dung chi tiết *</label>
                <MarkdownTextarea
                  id="hr-log-desc"
                  placeholder="Mô tả cụ thể sự kiện vi phạm hoặc khen thưởng..."
                  value={newLog.description}
                  onChange={(val) => setNewLog({ ...newLog, description: val })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2 text-xs font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-950 hover:bg-stone-800 text-white transition cursor-pointer"
                >
                  Ghi nhận sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL: ADD SKILL TO CATALOG */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-matte-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-stone-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative font-sans">
            <h3 className="text-sm font-black font-display text-matte-black uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">
              Thêm Kỹ Năng Mới vào Hệ Thống
            </h3>

            <form onSubmit={handleCreateNewSkill} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase">Tên kỹ năng mới *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Vệ sinh khoang máy chi tiết"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2 text-xs font-bold uppercase">
                <button
                  type="button"
                  onClick={() => setShowAddSkillModal(false)}
                  className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-stone-950 hover:bg-stone-800 text-white transition cursor-pointer"
                >
                  Thêm Kỹ Năng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
