import React, { useEffect, useState } from "react";
import { Page, useNavigate, Button } from "zmp-ui";
import { Loader2, CheckCircle, ArrowLeft, CreditCard } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// Type for booking data passed from ChatPage or BookingPage
export interface BookingConfirmData {
    name: string;
    phone: string;
    gender: boolean; // true = male, false = female
    age: number;
    symptoms: string;
    clinicId: string;
    clinicName: string;
    serviceId: string;
    serviceName: string;
    bookingTime: string; // Full datetime string: "YYYY-MM-DD HH:mm:ss"
    displayDate: string; // Display format: "YYYY-MM-DD"
    displayTime: string; // Display format: "HH:mm"
    amount: number;
    sourceRoute?: string; // Track where user came from: "/chat" or "/booking"
}

export default function ConfirmBookingPage() {
    const { isLoading: authLoading, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [bookingData, setBookingData] = useState<BookingConfirmData | null>(null);
    const [sourceRoute, setSourceRoute] = useState<string>("/chat"); // Default to chat
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get booking data from navigation state
    useEffect(() => {
        const state = location.state as { bookingData?: BookingConfirmData } | null;
        if (state?.bookingData) {
            setBookingData(state.bookingData);
            // Set source route from booking data or default to chat
            setSourceRoute(state.bookingData.sourceRoute || "/chat");
        } else {
            // No data passed, redirect back to chat
            navigate("/chat", { replace: true });
        }
    }, [location.state, navigate]);

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login", { replace: true });
        }
    }, [authLoading, user, navigate]);

    const handleConfirmAndPay = async () => {
        if (!bookingData) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await api.post("/api/bookings", {
                name: bookingData.name,
                phone: bookingData.phone,
                gender: bookingData.gender ? "male" : "female",
                age: bookingData.age,
                symptoms: bookingData.symptoms,
                clinic: bookingData.clinicId,
                service: bookingData.serviceId,
                booking_time: bookingData.bookingTime,
                amount: bookingData.amount,
            });

            const bookingId = res.data?.bookingId;

            if (bookingId) {
                navigate(`/payment?bookingId=${bookingId}`, { replace: true });
            } else {
                setError("Không thể tạo lịch hẹn. Vui lòng thử lại.");
            }
        } catch (e: any) {
            console.error("Failed to create booking:", e);
            setError(e.response?.data?.message || "Đặt lịch thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        // Navigate back to the source page with booking data so user can continue editing
        if (sourceRoute === "/booking") {
            // For booking page, just go back (form will be reset)
            navigate("/booking");
        } else {
            // For chat page, pass booking data to restore state
            navigate("/chat", {
                state: {
                    returnFromConfirm: true,
                    bookingData: bookingData
                }
            });
        }
    };

    // Loading states
    if (authLoading) {
        return (
            <Page className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
            </Page>
        );
    }

    if (!user) return null;

    if (!bookingData) {
        return (
            <Page className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
            </Page>
        );
    }

    return (
        <Page className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {/* Header */}
            {/* <div className="bg-blue-600 text-white px-6 py-4 fixed top-0 w-full z-10 shadow-md">
                <h2 className="text-lg font-semibold">Xác nhận đặt lịch</h2>
            </div> */}

            {/* Content */}
            <div className="pt-10 pb-32 px-4">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                </div>

                <h3 className="text-center text-xl font-bold text-slate-800 mb-6">
                    Xác nhận thông tin đặt lịch
                </h3>

                {/* Booking Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-5 space-y-4">
                    {/* Personal Info Section */}
                    <div className="border-b border-gray-100 pb-4">
                        <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                            Thông tin cá nhân
                        </h4>

                        <InfoRow label="Họ và tên" value={bookingData.name} />
                        <InfoRow label="Số điện thoại" value={bookingData.phone} />
                        <InfoRow label="Giới tính" value={bookingData.gender ? "Nam" : "Nữ"} />
                        <InfoRow label="Tuổi" value={`${bookingData.age} tuổi`} />
                        <InfoRow label="Triệu chứng" value={bookingData.symptoms} />
                    </div>

                    {/* Appointment Info Section */}
                    <div className="border-b border-gray-100 pb-4">
                        <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                            Thông tin lịch hẹn
                        </h4>

                        <InfoRow label="Phòng khám" value={bookingData.clinicName} />
                        <InfoRow label="Dịch vụ" value={bookingData.serviceName} />
                        <InfoRow label="Ngày khám" value={formatDate(bookingData.displayDate)} />
                        <InfoRow label="Giờ khám" value={bookingData.displayTime} />
                    </div>

                    {/* Payment Info Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                            Thanh toán
                        </h4>

                        <div className="flex justify-between items-center bg-blue-50 rounded-xl p-4">
                            <span className="text-slate-700 font-medium">Số tiền giữ chỗ</span>
                            <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(bookingData.amount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 w-full bg-white border-t shadow-lg p-4 pb-8 z-20">
                <div className="flex gap-3">
                    <button
                        onClick={handleGoBack}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Chọn lại
                    </button>

                    <button
                        onClick={handleConfirmAndPay}
                        disabled={isSubmitting}
                        className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Xác nhận & Thanh toán
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Page>
    );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start py-2">
            <span className="text-slate-500 text-sm">{label}</span>
            <span className="text-slate-800 font-medium text-sm text-right max-w-[60%]">
                {value}
            </span>
        </div>
    );
}

// Helper Functions
function formatDate(dateStr: string): string {
    try {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}
