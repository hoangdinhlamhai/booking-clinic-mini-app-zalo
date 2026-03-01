import React, { useState, useEffect } from "react";
import { Page, useNavigate } from "zmp-ui";
import {
    Calendar,
    Clock,
    MapPin,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Hourglass,
    Search,
    ChevronRight,
    Stethoscope,
    CreditCard,
    Phone,
    Loader2,
    RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ──────────────────────────────────────────
type BookingStatus = "paid" | "pending" | "cancelled" | "expired" | "completed";

interface BookingFromAPI {
    id: string;
    patientName: string;
    patientPhone: string;
    gender?: string;
    age?: number;
    symptoms?: string;
    bookingTime: string;
    status: string;
    createdAt: string;
    clinic?: {
        id: string;
        name: string;
        address?: string;
    };
    service?: {
        id: string;
        name: string;
        price: number;
        durationMinutes?: number;
    };
    doctor?: {
        id: string;
        specialty: string;
        user?: {
            name: string;
        };
    };
    payment?: {
        amount: number;
        status?: string;
        method?: string;
        paymentDate?: string;
    };
}

// ─── Status Config ──────────────────────────────────
const STATUS_CONFIG: Record<
    BookingStatus,
    { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }
> = {
    paid: {
        label: "Đã thanh toán",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: CheckCircle2,
    },
    completed: {
        label: "Hoàn thành",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: CheckCircle2,
    },
    pending: {
        label: "Chờ thanh toán",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: Hourglass,
    },
    cancelled: {
        label: "Đã hủy",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: XCircle,
    },
    expired: {
        label: "Hết hạn",
        color: "text-slate-600",
        bgColor: "bg-slate-100",
        borderColor: "border-slate-200",
        icon: AlertCircle,
    },
};

const FILTER_TABS: { key: BookingStatus | "all"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "paid", label: "Đã TT" },
    { key: "completed", label: "Hoàn thành" },
    { key: "pending", label: "Chờ TT" },
    { key: "cancelled", label: "Đã hủy" },
    { key: "expired", label: "Hết hạn" },
];

// ─── Helpers ────────────────────────────────────────
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatTime(dateStr: string, durationMinutes?: number): string {
    const d = new Date(dateStr);
    const startTime = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    if (durationMinutes) {
        const endDate = new Date(d.getTime() + durationMinutes * 60 * 1000);
        const endTime = endDate.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        return `${startTime} - ${endTime}`;
    }
    return startTime;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

function getRelativeTime(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
}

function getStatusKey(status: string): BookingStatus {
    if (status in STATUS_CONFIG) return status as BookingStatus;
    return "pending";
}

// ─── Component ──────────────────────────────────────
export default function HistoryPage() {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<BookingFromAPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<BookingStatus | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Auth guard: redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [authLoading, user, navigate]);

    // Fetch bookings from API
    const fetchBookings = async () => {
        try {
            setError(null);
            const res = await api.get("/api/bookings/user/me");
            setBookings(res.data);
        } catch (err: any) {
            console.error("Fetch bookings error:", err);
            if (err.response?.status === 401) {
                navigate("/login");
                return;
            }
            setError(err.response?.data?.error || "Không thể tải lịch sử đặt khám");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchBookings();
        }
    }, [authLoading, user]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    // Loading / Auth guard
    if (authLoading || (!user && !authLoading)) {
        return (
            <Page className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </Page>
        );
    }

    const filteredBookings = bookings.filter((b) => {
        const status = getStatusKey(b.status);
        const matchesFilter = activeFilter === "all" || status === activeFilter;
        const matchesSearch =
            searchQuery === "" ||
            b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.doctor?.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.doctor?.specialty || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.service?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.patientName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statusCounts = bookings.reduce(
        (acc, b) => {
            const s = getStatusKey(b.status);
            acc[s] = (acc[s] || 0) + 1;
            acc.all++;
            return acc;
        },
        { all: 0 } as Record<string, number>
    );

    return (
        <Page className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-6 pb-10">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                </div>

                <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                        <h1 className="text-2xl font-bold text-white">Lịch sử đặt khám</h1>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition disabled:opacity-50"
                            aria-label="Làm mới"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                    <p className="text-blue-100 text-sm">
                        Theo dõi và quản lý các lịch hẹn của bạn
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-5">
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                            <div className="text-2xl font-bold text-white">{statusCounts.all || 0}</div>
                            <div className="text-xs text-blue-100 mt-0.5">Tổng lịch hẹn</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                            <div className="text-2xl font-bold text-emerald-300">
                                {(statusCounts.completed || 0) + (statusCounts.paid || 0)}
                            </div>
                            <div className="text-xs text-blue-100 mt-0.5">Thành công</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
                            <div className="text-2xl font-bold text-amber-300">
                                {statusCounts.pending || 0}
                            </div>
                            <div className="text-xs text-blue-100 mt-0.5">Đang chờ</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="px-4 -mt-5 relative z-10">
                <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-4 space-y-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã, bác sĩ, dịch vụ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                        {FILTER_TABS.map((tab) => {
                            const count = statusCounts[tab.key] || 0;
                            const isActive = activeFilter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveFilter(tab.key)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {tab.label}
                                    <span
                                        className={`ml-1 ${isActive ? "text-blue-200" : "text-slate-400"
                                            }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Booking List */}
            <div className="px-4 py-5 space-y-3 pb-32">
                {/* Loading state */}
                {loading && (
                    <div className="text-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Đang tải lịch sử...</p>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                            <AlertCircle className="w-7 h-7 text-red-400" />
                        </div>
                        <p className="text-red-500 font-medium">{error}</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && filteredBookings.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                            <Calendar className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">
                            {bookings.length === 0
                                ? "Bạn chưa có lịch hẹn nào"
                                : "Không tìm thấy lịch hẹn phù hợp"}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {bookings.length === 0
                                ? "Đặt lịch khám ngay để bắt đầu"
                                : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                        </p>
                        {bookings.length === 0 && (
                            <button
                                onClick={() => navigate("/booking")}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
                            >
                                Đặt lịch khám
                            </button>
                        )}
                    </div>
                )}

                {/* Booking cards */}
                {!loading &&
                    !error &&
                    filteredBookings.map((booking) => {
                        const statusKey = getStatusKey(booking.status);
                        const statusConfig = STATUS_CONFIG[statusKey];
                        const StatusIcon = statusConfig.icon;
                        const isExpanded = expandedId === booking.id;

                        const doctorName = booking.doctor?.user?.name
                            ? `BS. ${booking.doctor.user.name}`
                            : null;
                        const specialty = booking.doctor?.specialty || booking.service?.name || "Khám tổng quát";
                        const amount = booking.payment?.amount || booking.service?.price || 0;
                        const location = booking.clinic?.name || "Phòng khám";
                        const clinicAddress = booking.clinic?.address;

                        return (
                            <div
                                key={booking.id}
                                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded
                                        ? "shadow-lg border-blue-200"
                                        : "border-slate-100 hover:shadow-md hover:border-slate-200"
                                    }`}
                            >
                                {/* Card Header - Always Visible */}
                                <button
                                    onClick={() =>
                                        setExpandedId(isExpanded ? null : booking.id)
                                    }
                                    className="w-full text-left p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Status Badge */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {getRelativeTime(booking.createdAt)}
                                                </span>
                                            </div>

                                            {/* Doctor / Service */}
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Stethoscope className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-slate-800 truncate">
                                                    {doctorName || specialty}
                                                </span>
                                                {doctorName && (
                                                    <>
                                                        <span className="text-xs text-slate-400">•</span>
                                                        <span className="text-xs text-blue-600 font-medium flex-shrink-0">
                                                            {specialty}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Date & Time */}
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(booking.bookingTime)}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatTime(booking.bookingTime, booking.service?.durationMinutes)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expand Arrow */}
                                        <ChevronRight
                                            className={`w-5 h-5 text-slate-400 flex-shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""
                                                }`}
                                        />
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                <div
                                    className={`transition-all duration-300 ease-in-out ${isExpanded
                                            ? "max-h-[500px] opacity-100"
                                            : "max-h-0 opacity-0"
                                        } overflow-hidden`}
                                >
                                    <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                                        <div className="pt-3 space-y-2.5">
                                            {/* Location */}
                                            <div className="flex items-start gap-2 text-sm text-slate-600">
                                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <span>{location}</span>
                                                    {clinicAddress && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{clinicAddress}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Patient */}
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span>
                                                    {booking.patientName}
                                                    {booking.gender && <span className="text-slate-400"> • {booking.gender}</span>}
                                                    {booking.age && <span className="text-slate-400"> • {booking.age} tuổi</span>}
                                                </span>
                                            </div>

                                            {/* Phone */}
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span>{booking.patientPhone}</span>
                                            </div>

                                            {/* Amount */}
                                            {amount > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    <span className="font-semibold text-slate-800">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                    {booking.payment?.method && (
                                                        <span className="text-xs text-slate-400">
                                                            ({booking.payment.method})
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Symptoms */}
                                            {booking.symptoms && (
                                                <div className="bg-slate-50 rounded-xl p-3 mt-2">
                                                    <p className="text-xs text-slate-500 mb-0.5 font-medium">
                                                        Triệu chứng
                                                    </p>
                                                    <p className="text-sm text-slate-700">{booking.symptoms}</p>
                                                </div>
                                            )}

                                            {/* Booking ID */}
                                            <p className="text-xs text-slate-400 pt-1 font-mono">
                                                ID: {booking.id.substring(0, 8)}...
                                            </p>

                                            {/* Action Buttons */}
                                            {statusKey === "pending" && (
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => navigate(`/payment?bookingId=${booking.id}`)}
                                                        className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
                                                    >
                                                        Thanh toán ngay
                                                    </button>
                                                </div>
                                            )}

                                            {(statusKey === "paid" || statusKey === "completed") && (
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => navigate("/booking")}
                                                        className="flex-1 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition"
                                                    >
                                                        Đặt lại
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </Page>
    );
}
