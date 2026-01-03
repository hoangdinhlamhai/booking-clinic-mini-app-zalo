import React, { useEffect, useState } from "react";
import { useBookingForm } from "./useBookingForm";
import {
    User,
    Phone,
    Building2,
    Stethoscope,
    Clock,
    Loader2,
    Users,
    Calendar,
    FileText,
} from "lucide-react";
import api from "@/lib/api";

interface Option {
    id: string;
    name: string;
}

interface TimeSlot {
    time: string;
    capacity: number;
    booked: number;
    available: number;
}

interface InputProps {
    label: string;
    value?: string;
    type?: string;
    icon?: React.ReactNode;
    error?: string;
    min?: string;
    onChange: (value: string) => void;
}

interface SelectOption {
    id: string;
    name: string;
}

interface SelectProps {
    label: string;
    value?: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
    icon?: React.ReactNode;
}

interface TextareaProps {
    label: string;
    value?: string;
    icon?: React.ReactNode;
    error?: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

export default function BookingForm() {
    const { form, update, submit, errors, isSubmitting } = useBookingForm();
    const [clinics, setClinics] = useState<Option[]>([]);
    const [services, setServices] = useState<Option[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // date input requires yyyy-mm-dd format
    const minDate = today.toLocaleDateString("en-CA");

    useEffect(() => {
        Promise.all([
            api.get("/api/clinics").then((r) => r.data),
            api.get("/api/services").then((r) => r.data),
        ]).then(([c, s]) => {
            setClinics(c);
            setServices(s);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!form.clinic || !form.service || !form.appointmentDate) return;

        api.get(
            `/api/available-slots?clinic_id=${form.clinic}&service_id=${form.service}&date=${form.appointmentDate}`
        )
            .then((r) => r.data)
            .then((d: TimeSlot[]) => setTimeSlots(d));
    }, [form.clinic, form.service, form.appointmentDate]);

    if (loading) {
        return (
            <div className="p-16 flex justify-center">
                <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-10 space-y-6">
            <Input
                label="Họ và tên"
                icon={<User className="w-5 h-5 text-slate-400" />}
                value={form.name}
                error={errors.name}
                onChange={(v) => update("name", v)}
            />

            <Input
                label="Số điện thoại"
                icon={<Phone className="w-5 h-5 text-slate-400" />}
                value={form.phone}
                error={errors.phone}
                onChange={(v) => update("phone", v)}
            />

            {/* Gender and Age Row */}
            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Giới tính"
                    icon={<Users className="w-5 h-5 text-slate-400" />}
                    value={form.gender === true ? "male" : form.gender === false ? "female" : ""}
                    options={[
                        { id: "male", name: "Nam" },
                        { id: "female", name: "Nữ" },
                    ]}
                    error={errors.gender}
                    onChange={(v) => update("gender", v === "male")}
                />

                <Input
                    label="Tuổi"
                    type="number"
                    icon={<Calendar className="w-5 h-5 text-slate-400" />}
                    value={form.age?.toString() || ""}
                    error={errors.age}
                    onChange={(v) => update("age", v ? parseInt(v, 10) : undefined)}
                />
            </div>

            {/* Symptoms */}
            <Textarea
                label="Triệu chứng"
                icon={<FileText className="w-5 h-5 text-slate-400" />}
                value={form.symptoms || ""}
                error={errors.symptoms}
                placeholder="Mô tả triệu chứng của bạn..."
                onChange={(v) => update("symptoms", v)}
            />

            <Select
                label="Phòng khám"
                icon={<Building2 className="w-5 h-5 text-slate-400" />}
                value={form.clinic}
                options={clinics}
                error={errors.clinic}
                onChange={(v) => {
                    const selectedClinic = clinics.find(c => c.id === v);
                    update("clinic", v);
                    update("clinicName", selectedClinic?.name || "");
                    update("service", "");
                    update("serviceName", "");
                    update("appointmentDate", "");
                    update("appointmentTime", "");
                    setTimeSlots([]);
                }}
            />

            <Select
                label="Dịch vụ"
                icon={<Stethoscope className="w-5 h-5 text-slate-400" />}
                value={form.service}
                options={services}
                disabled={!form.clinic}
                error={errors.service}
                onChange={(v) => {
                    const selectedService = services.find(s => s.id === v);
                    update("service", v);
                    update("serviceName", selectedService?.name || "");
                    update("appointmentDate", "");
                    update("appointmentTime", "");
                    setTimeSlots([]);
                }}
            />

            <Input
                label="Ngày khám"
                type="date"
                icon={<Clock className="w-5 h-5 text-slate-400" />}
                value={form.appointmentDate}
                error={errors.appointmentDate}
                min={minDate}
                onChange={(v) => {
                    update("appointmentDate", v);
                    update("appointmentTime", "");
                    setTimeSlots([]);
                }}
            />

            <Select
                label="Giờ khám"
                value={form.appointmentTime}
                disabled={timeSlots.length === 0}
                options={timeSlots.map((s) => ({
                    id: s.time,
                    name: `${s.time} (còn ${s.available} chỗ)`,
                }))}
                error={errors.appointmentTime}
                onChange={(v) => update("appointmentTime", v)}
            />

            <button
                onClick={submit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:bg-slate-400 transition-colors"
            >
                {isSubmitting ? "Đang xử lý..." : "Xác nhận & thanh toán"}
            </button>
        </div>
    );
}

function Input({
    label,
    value,
    type = "text",
    icon,
    error,
    min,
    onChange,
}: InputProps) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 inset-y-0 flex items-center pointer-events-none">{icon}</span>}
                <input
                    type={type}
                    value={value ?? ""}
                    min={min}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full py-3 min-h-[48px] rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all ${icon ? "pl-10" : "pl-4"
                        } ${error ? "border-red-500" : "border-slate-300"}`}
                />
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
}

function Textarea({
    label,
    value,
    icon,
    error,
    placeholder,
    onChange,
}: TextareaProps) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-3 pointer-events-none">{icon}</span>}
                <textarea
                    value={value ?? ""}
                    placeholder={placeholder}
                    rows={3}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full py-3 pl-4 rounded-xl border resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-all ${error ? "border-red-500" : "border-slate-300"}`}
                />
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
}

function Select({
    label,
    value,
    options,
    onChange,
    disabled,
    error,
    icon,
}: SelectProps) {
    return (
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-3 pointer-events-none">{icon}</span>}
                <select
                    value={value ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full py-3 rounded-xl border appearance-none outline-none focus:ring-2 focus:ring-blue-500 transition-all ${icon ? "pl-10" : "pl-4"
                        } ${error ? "border-red-500" : "border-slate-300"
                        } disabled:bg-slate-100 disabled:text-slate-500`}
                >
                    <option value="">Chọn</option>
                    {options.map((o) => (
                        <option key={o.id} value={o.id}>
                            {o.name}
                        </option>
                    ))}
                </select>
                {/* Triangle icon hack for select to look good on all devices since default arrow is ugly */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
    );
}
