import React from "react";
import { useNavigate, useLocation } from "zmp-ui";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function Header() {
    const { user, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide header on these pages
    if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/payment" || location.pathname === "/confirm-booking" || location.pathname === "/result") {
        return null;
    }

    // Check if we're on homepage
    const isHomePage = location.pathname === "/";

    // Handle back navigation
    const handleBack = () => {
        // Try to go back in history, fallback to homepage
        if (window.history.length > 1) {
            window.history.back();
        } else {
            navigate("/");
        }
    };

    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Left side: Back button + User info */}
                <div className="flex items-center gap-2">
                    {/* Back button - show on all pages except homepage */}
                    {!isHomePage && (
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition text-slate-600"
                            aria-label="Quay lại"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}

                    {/* User info / Login button */}
                    {isLoading && (
                        <div className="text-sm text-slate-400">...</div>
                    )}
                    {!isLoading && !user && (
                        <div
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 rounded-xl border border-blue-100 text-blue-600 hover:bg-blue-50 transition text-sm cursor-pointer"
                        >
                            Đăng nhập
                        </div>
                    )}
                    {!isLoading && user && (
                        <div className="flex items-center gap-3">
                            {user.image && (
                                <img
                                    src={user.image}
                                    alt="avatar"
                                    className="w-9 h-9 rounded-full"
                                />
                            )}
                            <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">
                                {user.name}
                            </span>
                            <button
                                onClick={logout}
                                className="text-sm text-slate-500 hover:text-red-500"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>

                {/* Right side: Logo */}
                <div onClick={() => navigate("/")} className="text-xl font-semibold text-blue-600 cursor-pointer">
                    Health<span className="text-slate-800">Booking</span>
                </div>
            </div>
        </header>
    );
}
