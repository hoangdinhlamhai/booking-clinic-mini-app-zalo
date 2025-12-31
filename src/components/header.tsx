import React from "react";
import { useNavigate } from "zmp-ui";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
    const { user, isLoading, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div onClick={() => navigate("/")} className="text-xl font-semibold text-blue-600 cursor-pointer">
                    Health<span className="text-slate-800">Booking</span>
                </div>

                <div className="flex items-center gap-6">
                    {/* <div
                        onClick={() => navigate("/")}
                        className="text-sm text-slate-700 hover:text-blue-600 cursor-pointer"
                    >
                        Hướng dẫn đặt lịch
                    </div> */}

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
                            <span className="text-sm font-medium text-slate-700">
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
            </div>
        </header>
    );
}
