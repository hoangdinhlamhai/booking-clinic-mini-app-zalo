
import React, { useEffect, useState } from "react";
import { Page, useNavigate, Button, Text } from "zmp-ui";
import api from "@/lib/api";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function ResultPage() {
    const navigate = useNavigate();
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("bookingId");
        setBookingId(id);
    }, []);

    useEffect(() => {
        if (!bookingId) {
            if (bookingId === null) return; // Wait for mount
            setLoading(false);
            return;
        }

        api.get(`/api/bookings/${bookingId}`)
            .then((res) => {
                setBooking(res.data);
                setLoading(false);
            })
            .catch(() => {
                setBooking(null);
                setLoading(false);
            });
    }, [bookingId]);

    if (loading) {
        return (
            <Page className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                <Text className="mt-2 text-slate-500">Đang tải kết quả...</Text>
            </Page>
        );
    }

    if (!bookingId) {
        return (
            <Page className="flex items-center justify-center min-h-screen p-4">
                <Text className="text-center">Thiếu thông tin kết quả</Text>
            </Page>
        );
    }

    if (!booking) {
        return (
            <Page className="flex items-center justify-center min-h-screen p-4">
                <Text className="text-center">Booking không tồn tại</Text>
            </Page>
        );
    }

    if (booking.status === "paid") {
        return (
            <Page className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full bg-white rounded-3xl shadow p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-semibold text-green-600">
                        Đặt lịch thành công
                    </h1>
                    <p className="text-slate-600">Lịch khám của bạn đã được xác nhận.</p>
                    <ul className="text-sm text-slate-500 text-left mt-4 space-y-2 bg-gray-50 p-4 rounded-xl">
                        <li>• Hệ thống đã ghi nhận thanh toán</li>
                        <li>• Phòng khám đang tiếp nhận hồ sơ</li>
                        <li>• Nhân viên sẽ liên hệ xác nhận</li>
                    </ul>
                    <Button onClick={() => navigate("/")} fullWidth>
                        Về trang chủ
                    </Button>
                </div>
            </Page>
        );
    }

    if (booking.status === "expired") {
        return (
            <Page className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full bg-white rounded-3xl shadow p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <XCircle className="w-16 h-16 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-semibold text-red-600">
                        Thanh toán quá hạn
                    </h1>
                    <p className="text-slate-600">
                        Phiên thanh toán đã hết hạn sau 5 phút.
                    </p>

                    <Button
                        onClick={() => navigate("/")}
                        fullWidth
                        variant="secondary"
                        className="mt-4"
                    >
                        Đăng ký lại
                    </Button>
                </div>
            </Page>
        );
    }

    return (
        <Page className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full bg-white rounded-3xl shadow p-8 text-center space-y-4">
                <div className="flex justify-center">
                    <AlertTriangle className="w-16 h-16 text-orange-500" />
                </div>
                <h1 className="text-2xl font-semibold text-orange-500">
                    Chưa thanh toán
                </h1>
                <p className="text-slate-600">
                    Chúng tôi chưa ghi nhận thanh toán cho lịch này.
                </p>
                <Button onClick={() => navigate("/")} fullWidth variant="tertiary">
                    Về trang chủ
                </Button>
            </div>
        </Page>
    );
}
