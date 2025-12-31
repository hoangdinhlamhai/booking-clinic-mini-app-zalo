import { useNavigate, Page } from "zmp-ui";
import React, { useEffect } from "react";
import BookingForm from "@/components/booking/BookingForm";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function BookingsPage() {
    const { isLoading, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !user) {
            // Redirect strictly if not authenticated
            // Save current path to redirect back could be done via query params, 
            // but simple redirect is fine for now.
            navigate("/login");
        }
    }, [isLoading, user, navigate]);

    if (isLoading) {
        return (
            <Page className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </Page>
        );
    }

    // Double check to avoid flash of content
    if (!user) return null;

    return (
        <Page className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 py-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Đặt lịch khám bệnh
                    </h1>
                    <p className="text-base text-slate-600 mt-2">
                        Hoàn tất thông tin bên dưới để giữ lịch
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 -z-10 bg-blue-200/30 blur-3xl rounded-3xl" />
                    <BookingForm />
                </div>
            </div>
        </Page>
    );
}
