import React, { useState } from "react";
import { Page, useNavigate, Input, Button } from "zmp-ui";
import { User, Mail, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    // Email validation regex
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async () => {
        // Basic validation
        if (!formData.name || !formData.email || !formData.password) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }

        // Validate email format
        if (!isValidEmail(formData.email)) {
            setEmailError("Vui lòng nhập email hợp lệ");
            return;
        }

        setIsLoading(true);

        try {
            await api.post("/api/auth/register", formData);

            // Auto login after register
            const loginRes = await api.post("/api/auth/login", {
                email: formData.email,
                password: formData.password,
            });

            const { token, user } = loginRes.data;

            // Update global auth state
            login(token, user);

            // Redirect home
            navigate("/");
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message || "Đăng ký thất bại";
            alert(msg);
            setIsLoading(false);
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

                        <h1 className="text-3xl font-bold text-slate-900">Đăng ký tài khoản</h1>

                        <p className="text-slate-600">
                            Tạo tài khoản để đặt lịch khám và quản lý hồ sơ bệnh án
                        </p>
                    </div>

                    {/* FORM */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400 z-10" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Nguyễn Văn A"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

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
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isLoading ? "Đang xử lý..." : "Đăng ký"}
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-600">
                        Đã có tài khoản?{" "}
                        <span
                            onClick={() => navigate("/login")}
                            className="text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                            Đăng nhập ngay
                        </span>
                    </div>
                </div>
            </div>
        </Page>
    );
}
