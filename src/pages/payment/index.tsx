import { useNavigate } from "zmp-ui";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { generateSepayQR } from "@/lib/payment/sepayqr";
import { useSearchParams } from "react-router-dom"; // ZMP uses standard router hooks often or ZMPRouter equivalent
// Actually ZMP router logic: 
// In ZMP, getting query params is often done via standard location.search or a specific hook provided by router lib.
// zmp-ui uses react-router-dom under the hood usually, but let's check standard usage.
// Standard safe way:
const usePayment = () => {
    // In Mini App, window.location.search might be available if using standard browser routing,
    // but better to rely on what works in the framework usually.
    // Let's safe-parse from window.location first.

    // NOTE: In ZMP, usually pages are rendered and we can use URLSearchParams on location.search
    const [bookingId, setBookingId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("bookingId");
        if (id) setBookingId(id);
    }, []);

    return { bookingId };
};

type BookingResponse = {
    id: string;
    status: "pending" | "paid" | "expired";
    amount: number;
};

const PAYMENT_TIMEOUT_SECONDS = 300;

// Main Component
import { Page, Text, Button } from "zmp-ui";
import { Loader2, Clock } from "lucide-react";

export default function PaymentPage() {
    const { bookingId } = usePayment();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [countdown, setCountdown] = useState<number>(PAYMENT_TIMEOUT_SECONDS);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch booking data
    useEffect(() => {
        if (!bookingId) return;

        api.get(`/api/bookings/${bookingId}`)
            .then((res) => {
                if (res.data?.id) {
                    setBooking(res.data);
                }
            })
            .catch(() => { });
    }, [bookingId]);

    // Countdown timer
    useEffect(() => {
        if (!bookingId || !booking) return;

        // Start countdown
        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // Time's up - navigate to expired result
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                    }
                    navigate(`/result?bookingId=${bookingId}&status=expired`, { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [bookingId, booking, navigate]);

    // Poll for payment status
    useEffect(() => {
        if (!bookingId) return;

        const timer = setInterval(async () => {
            try {
                const res = await api.get(`/api/bookings/${bookingId}`);
                const data = res.data;

                if (!data?.status) return;

                setBooking(data);

                // ZMP navigate often replaces
                if (data.status === "paid") {
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                    }
                    navigate(`/result?bookingId=${bookingId}&status=paid`, { replace: true });
                }
                if (data.status === "expired") {
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                    }
                    navigate(`/result?bookingId=${bookingId}&status=expired`, { replace: true });
                }

            } catch (e) { }
        }, 3000);

        return () => clearInterval(timer);
    }, [bookingId, navigate]);

    // Format countdown to MM:SS
    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!booking) {
        return (
            <Page className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                    <Text>Đang tạo mã thanh toán...</Text>
                </div>
            </Page>
        );
    }

    const qrUrl = generateSepayQR({
        bankCode: "TPB",
        accountNo: "10002981957",
        amount: booking.amount,
        description: `DATLICH_${booking.id}`,
    });

    return (
        <Page className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-6 rounded-xl text-center space-y-4 shadow-lg mx-4 w-full max-w-sm">
                <h1 className="text-lg font-semibold text-slate-900">Thanh toán giữ lịch</h1>

                {/* Countdown Timer */}
                <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${countdown <= 30 ? 'bg-red-50' : 'bg-orange-50'}`}>
                    <Clock className={`w-5 h-5 ${countdown <= 30 ? 'text-red-500' : 'text-orange-500'}`} />
                    <span className={`font-mono text-xl font-bold ${countdown <= 30 ? 'text-red-600' : 'text-orange-600'}`}>
                        {formatCountdown(countdown)}
                    </span>
                    <span className={`text-sm ${countdown <= 30 ? 'text-red-500' : 'text-orange-500'}`}>
                        còn lại
                    </span>
                </div>

                <div className="flex justify-center">
                    <img src={qrUrl} className="w-64 h-64 object-contain" alt="QR Code" />
                </div>

                <p className="text-sm text-slate-600">
                    Nội dung chuyển khoản:
                    <br />
                    <b className="text-lg select-all">DATLICH_{booking.id}</b>
                </p>

                <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium
          ${booking.status === "pending" && "bg-orange-100 text-orange-600"}
          ${booking.status === "paid" && "bg-green-100 text-green-600"}
          ${booking.status === "expired" && "bg-red-100 text-red-600"}
        `}
                >
                    {booking.status === "pending" && "Chờ thanh toán"}
                    {booking.status === "paid" && "Đã thanh toán"}
                    {booking.status === "expired" && "Hết hạn"}
                </span>

                <div className="pt-4">
                    <Button variant="secondary" onClick={() => navigate("/")} fullWidth>
                        Trở về trang chủ
                    </Button>
                </div>
            </div>
        </Page>
    );
}
