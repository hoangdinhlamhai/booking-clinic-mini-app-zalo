import React, { useState } from "react";
import { Page, useNavigate, Spinner } from "zmp-ui";
import { ShieldCheck, Mail, Lock, ArrowLeft } from "lucide-react";
import { getAccessToken, authorize, getSetting } from "zmp-sdk";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isZaloLoading, setIsZaloLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // Email validation regex
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleCredentialsLogin = async () => {
        // Validate email format
        if (!formData.email || !isValidEmail(formData.email)) {
            setEmailError("Vui lòng nhập email hợp lệ");
            return;
        }
        if (!formData.password) {
            setLoginError("Vui lòng nhập mật khẩu");
            return;
        }

        // Clear previous errors
        setLoginError(null);

        setIsLoading(true);
        try {
            const res = await api.post("/api/auth/login", formData);
            const { token, user } = res.data;

            login(token, user);

            if (user.role === "admin") {
                // Assuming validation happens on server too/admin route exists
                // For now just navigate home or to a specific admin page if exists
                navigate("/");
            } else {
                navigate("/");
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
            setLoginError(msg);
            setIsLoading(false);
        }
    };

    const handleZaloLogin = async () => {
        setIsZaloLoading(true);
        try {
            // 1. Check if user has granted permission
            const settings = await getSetting({});
            console.log("[ZaloLogin] Settings:", settings);

            if (!settings.authSetting["scope.userInfo"]) {
                // Request permission if not granted
                console.log("[ZaloLogin] Requesting userInfo permission...");
                await authorize({
                    scopes: ["scope.userInfo"],
                });
            }

            // 2. Get Zalo access token from the Mini App
            console.log("[ZaloLogin] Getting access token...");
            const tokenResult = await getAccessToken({});
            console.log("[ZaloLogin] Token result:", tokenResult);

            // getAccessToken returns the token string directly
            const zaloAccessToken = typeof tokenResult === 'string'
                ? tokenResult
                : (tokenResult as any)?.accessToken || tokenResult;

            if (!zaloAccessToken) {
                // Check if we're likely in development mode
                const isDev = window.location.hostname === 'localhost'
                    || window.location.hostname.includes('127.0.0.1')
                    || window.location.port !== '';

                if (isDev) {
                    throw new Error("Đăng nhập Zalo chỉ hoạt động trên ứng dụng Zalo thực. Trong môi trường phát triển, vui lòng sử dụng đăng nhập bằng Email/Mật khẩu.");
                }
                throw new Error("Không thể lấy access token từ Zalo. Vui lòng thử lại.");
            }

            console.log("[ZaloLogin] Got Zalo access token:", zaloAccessToken.substring(0, 20) + "...");

            // 3. Send to our backend for verification and JWT generation
            const response = await api.post("/api/auth/zalo", {
                accessToken: zaloAccessToken,
            });

            const { accessToken } = response.data;

            if (!accessToken) {
                throw new Error("Không nhận được token từ server");
            }

            // 4. Fetch user info from our backend
            localStorage.setItem("accessToken", accessToken);

            const meResponse = await api.get("/api/auth/me");
            const userData = meResponse.data?.user;

            if (userData) {
                login(accessToken, userData);
            } else {
                login(accessToken, { name: "Người dùng Zalo" });
            }

            console.log("[ZaloLogin] Login successful");
            navigate("/");

        } catch (err: any) {
            console.error("[ZaloLogin] Error:", err);
            const msg = err.response?.data?.error || err.message || "Đăng nhập Zalo thất bại";
            alert(msg);
        } finally {
            setIsZaloLoading(false);
        }
    };

    return (
        <Page className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative overflow-hidden">
            {/* DECORATION */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-40" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-40" />

            <div className="relative w-full max-w-lg px-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/")}
                    className="absolute top-0 left-4 p-2 rounded-full bg-white shadow-md hover:bg-slate-50 transition text-slate-600 z-10"
                    aria-label="Quay lại"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="bg-white rounded-3xl shadow-xl p-10 space-y-8">
                    {/* HEADER */}
                    <div className="space-y-3 text-center">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <ShieldCheck className="w-7 h-7 text-blue-600" />
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900">Đăng nhập</h1>

                        <p className="text-slate-600">
                            Đăng nhập để đặt lịch khám nhanh chóng và an tâm hơn
                        </p>
                    </div>

                    {/* FORM */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 z-10" />
                                <input
                                    type="email"
                                    required
                                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${emailError ? 'border-red-500' : ''}`}
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        const email = e.target.value;
                                        setFormData({ ...formData, email });
                                        // Validate email on change
                                        if (email && !isValidEmail(email)) {
                                            setEmailError("Email không hợp lệ");
                                        } else {
                                            setEmailError(null);
                                        }
                                    }}
                                />
                            </div>
                            {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 z-10" />
                                <input
                                    type="password"
                                    required
                                    className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${loginError ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (loginError) setLoginError(null);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Login Error Message */}
                        {loginError && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600 text-center">{loginError}</p>
                            </div>
                        )}

                        <button
                            onClick={handleCredentialsLogin}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </div>

                    {/* DIVIDER */}
                    {/* <div className="flex items-center gap-4 text-slate-400 text-xs">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span>Hoặc đăng nhập với</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div> */}

                    {/* REGISTER LINK */}
                    <div className="text-center text-sm text-slate-600">
                        Chưa có tài khoản?{" "}
                        <span
                            onClick={() => navigate("/register")}
                            className="text-blue-600 font-bold hover:underline cursor-pointer">
                            Đăng ký ngay
                        </span>
                    </div>
                </div>
            </div>
        </Page>
    );
}
