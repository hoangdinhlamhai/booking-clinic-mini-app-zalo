
import React, { useEffect, useState, useRef } from "react";
import { Page, useNavigate, Input, Button } from "zmp-ui";
import { Loader2, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { BookingConfirmData } from "@/pages/confirm-booking/index";

// Types
type Clinic = {
    id: string;
    name: string;
    address: string;
    email: string;
};

type Service = {
    id: string;
    name: string;
};

type SlotStat = {
    time: string;
    capacity: number;
    booked: number;
    available: number;
};

type ChatStep =
    | "name"
    | "phone"
    | "symptoms"
    | "gender"
    | "age"
    | "clinic"
    | "service"
    | "date"
    | "time";

interface BookingFormState {
    clinic?: string;
    clinicName?: string;
    service?: string;
    serviceName?: string;
    name: string;
    phone: string;
    time: string;
    symptoms: string;
    gender: boolean;
    age?: number;
}

interface Message {
    from: "bot" | "user";
    text: string;
}

export default function ChatPage() {
    const { isLoading: authLoading, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { from: "bot", text: "Xin chào! Bạn vui lòng cho biết Họ và tên?" },
    ]);
    const [step, setStep] = useState<ChatStep>("name");
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Data State
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [slots, setSlots] = useState<SlotStat[]>([]);

    // Selection State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDay, setTempDay] = useState("");
    const [form, setForm] = useState<BookingFormState>({
        name: "",
        phone: "",
        time: "",
        symptoms: "",
        gender: true,
    });

    // Handle return from ConfirmBookingPage
    useEffect(() => {
        const state = location.state as { returnFromConfirm?: boolean; bookingData?: BookingConfirmData } | null;
        if (state?.returnFromConfirm && state?.bookingData) {
            const data = state.bookingData;
            // Restore form data
            setForm({
                name: data.name,
                phone: data.phone,
                gender: data.gender,
                age: data.age,
                symptoms: data.symptoms,
                clinic: data.clinicId,
                clinicName: data.clinicName,
                service: data.serviceId,
                serviceName: data.serviceName,
                time: data.bookingTime,
            });

            // Reset date/time selection - user needs to choose again
            setTempDay(""); // Reset to force user to select new date
            setSlots([]); // Clear previous slots

            // Reset to date selection step so user can choose again
            setStep("date");
            setShowDatePicker(true);
            setMessages([
                { from: "bot", text: "Bạn đã quay lại để chọn lại thông tin." },
                {
                    from: "bot", text: `Thông tin đã lưu:
                                        - Họ tên: ${data.name}
                                        - SĐT: ${data.phone}
                                        - Giới tính: ${data.gender ? "Nam" : "Nữ"}
                                        - Tuổi: ${data.age}
                                        - Bệnh: ${data.symptoms}
                                        - Phòng khám: ${data.clinicName}
                                        - Dịch vụ: ${data.serviceName}`
                },
                { from: "bot", text: "Vui lòng chọn lại ngày khám:" },
            ]);

            // Clear navigation state to prevent re-triggering
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [authLoading, user, navigate]);

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cRes, sRes] = await Promise.all([
                    api.get("/api/clinics"),
                    api.get("/api/services")
                ]);
                setClinics(cRes.data || []);
                setServices(sRes.data || []);
            } catch (err) {
                console.error("Failed to load chat data", err);
            }
        };
        fetchData();
    }, []);

    const pushBot = (text: string) =>
        setMessages((prev) => [...prev, { from: "bot", text }]);

    const askNext = (current: ChatStep) => {
        switch (current) {
            case "name":
                setStep("phone");
                pushBot("Số điện thoại của bạn? (10 số)");
                break;

            case "phone":
                setStep("symptoms");
                pushBot("Bạn có triệu chứng gì cần khám?");
                break;

            case "symptoms":
                setStep("gender");
                pushBot("Giới tính của bạn?");
                pushBot("1. Nam\n2. Nữ");
                break;

            case "gender":
                setStep("age");
                pushBot("Tuổi của bạn?");
                break;

            case "age":
                setStep("clinic");
                pushBot("Bạn muốn đặt lịch tại phòng khám nào?");
                pushBot(clinics.map((c, i) => `${i + 1}. ${c.name}`).join("\n"));
                break;

            case "clinic":
                setStep("service");
                pushBot("Bạn muốn sử dụng dịch vụ nào?");
                pushBot(services.map((s, i) => `${i + 1}. ${s.name}`).join("\n"));
                break;

            case "service":
                setStep("date");
                setShowDatePicker(true);
                pushBot("Vui lòng chọn ngày khám:");
                break;

            default:
                break;
        }
    };

    // Booking amount constant
    const BOOKING_AMOUNT = 2000;

    const handleSend = async () => {
        if (!input.trim()) return;

        setMessages((prev) => [...prev, { from: "user", text: input }]);
        const currentInput = input; // Capture for use in async if needed
        setInput(""); // Clear immediately

        switch (step) {
            case "name":
                setForm(prev => ({ ...prev, name: currentInput }));
                askNext("name");
                break;

            case "phone": {
                if (!/^\d{10}$/.test(currentInput)) {
                    pushBot("Số điện thoại không hợp lệ (10 số).");
                    break;
                }
                setForm(prev => ({ ...prev, phone: currentInput }));
                askNext("phone");
                break;
            }

            case "symptoms":
                setForm(prev => ({ ...prev, symptoms: currentInput }));
                askNext("symptoms");
                break;

            case "gender":
                if (currentInput !== "1" && currentInput !== "2") {
                    pushBot("Vui lòng chọn 1 hoặc 2.");
                    break;
                }
                setForm(prev => ({ ...prev, gender: currentInput === "1" }));
                askNext("gender");
                break;

            case "age": {
                const age = Number(currentInput);
                if (!Number.isInteger(age) || age <= 0) {
                    pushBot("Tuổi không hợp lệ.");
                    break;
                }
                setForm(prev => ({ ...prev, age }));
                askNext("age");
                break;
            }

            case "clinic": {
                const idx = Number(currentInput) - 1;
                if (!clinics[idx]) {
                    pushBot("Vui lòng chọn số hợp lệ.");
                    break;
                }
                setForm(prev => ({
                    ...prev,
                    clinic: clinics[idx].id,
                    clinicName: clinics[idx].name
                }));
                askNext("clinic");
                break;
            }

            case "service": {
                const idx = Number(currentInput) - 1;
                if (!services[idx]) {
                    pushBot("Vui lòng chọn số hợp lệ.");
                    break;
                }
                setForm(prev => ({
                    ...prev,
                    service: services[idx].id,
                    serviceName: services[idx].name
                }));
                askNext("service");
                break;
            }

            case "time": {
                const idx = Number(currentInput) - 1;
                if (!slots[idx]) {
                    pushBot("Vui lòng chọn giờ hợp lệ.");
                    break;
                }

                const selectedTime = slots[idx].time;
                const bookingTime = `${tempDay} ${selectedTime}:00`;

                pushBot(`Bạn đã chọn: ${tempDay} lúc ${selectedTime}`);
                pushBot("Đang chuyển đến trang xác nhận...");

                // Prepare booking data for confirmation page
                const bookingConfirmData: BookingConfirmData = {
                    name: form.name,
                    phone: form.phone,
                    gender: form.gender,
                    age: form.age || 0,
                    symptoms: form.symptoms,
                    clinicId: form.clinic || "",
                    clinicName: form.clinicName || "",
                    serviceId: form.service || "",
                    serviceName: form.serviceName || "",
                    bookingTime: bookingTime,
                    displayDate: tempDay,
                    displayTime: selectedTime,
                    amount: BOOKING_AMOUNT,
                    sourceRoute: "/chat", // Track source for back navigation
                };

                // Navigate to confirmation page with booking data
                setTimeout(() => {
                    navigate("/confirm-booking", {
                        state: { bookingData: bookingConfirmData }
                    });
                }, 1000);
                break;
            }
        }
    };

    if (authLoading) return <Page className="flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></Page>;
    if (!user) return null;

    return (
        <Page className="flex flex-col h-screen bg-white">
            {/* Header - could reuse global header or custom simple one */}
            <div className="bg-blue-600 text-white px-6 py-4 fixed top-0 w-full z-10 shadow-md">
                <h2 className="text-lg font-semibold">Chat đặt lịch khám</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto pt-20 pb-20 px-4 space-y-4 bg-gray-50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`px-4 py-2 rounded-xl text-sm whitespace-pre-line max-w-[80%] shadow-sm ${m.from === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-slate-800 rounded-bl-none border border-gray-100"
                            }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 w-full bg-white border-t p-4 pb-8 shadow-lg z-20">
                {showDatePicker && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">Chọn ngày khám</p>
                        <div className="flex gap-2">
                            <input
                                placeholder="Nhấn vào đây để chọn ngày"
                                type="date"
                                className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                min={new Date().toISOString().split("T")[0]}
                                value={tempDay}
                                onChange={(e) => setTempDay(e.target.value)}
                            />
                            <button
                                onClick={async () => {
                                    if (!tempDay) {
                                        pushBot("Vui lòng chọn ngày trước.");
                                        return;
                                    }

                                    setShowDatePicker(false);
                                    pushBot(`Ngày khám: ${tempDay}`);
                                    pushBot("Đang kiểm tra giờ trống...");
                                    setSlots([]);

                                    try {
                                        const res = await api.get(`/api/available-slots?clinic_id=${form.clinic}&service_id=${form.service}&date=${tempDay}`);
                                        const data: SlotStat[] = res.data || [];

                                        if (!data.length) {
                                            pushBot("Ngày này đã kín lịch. Vui lòng chọn ngày khác.");
                                            setShowDatePicker(true);
                                            return;
                                        }

                                        setSlots(data);
                                        setStep("time");
                                        pushBot("Chọn giờ khám (nhập số thứ tự):");
                                        pushBot(data.map((s, i) => `${i + 1}. ${s.time}`).join("\n"));
                                    } catch (err) {
                                        pushBot("Lỗi kiểm tra lịch, vui lòng thử lại.");
                                        setShowDatePicker(true);
                                    }
                                }}
                                disabled={!tempDay}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-2 items-center">
                    <input
                        className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400"
                        placeholder="Nhập trả lời..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </Page>
    );
}
