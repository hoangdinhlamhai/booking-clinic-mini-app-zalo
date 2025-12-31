import { useNavigate } from "zmp-ui";
import { useState } from "react";
import api from "@/lib/api";

export interface BookingFormState {
    name: string;
    phone: string;
    clinic?: string;
    service?: string;
    appointmentDate?: string;
    appointmentTime?: string;
}

export function useBookingForm() {
    const navigate = useNavigate();

    const [form, setForm] = useState<BookingFormState>({
        name: "",
        phone: "",
        clinic: "",
        service: "",
        appointmentDate: "",
        appointmentTime: "",
    });

    const [errors, setErrors] = useState<Partial<BookingFormState>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    function update<K extends keyof BookingFormState>(
        key: K,
        value: BookingFormState[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    function validateForm(): boolean {
        const e: Partial<BookingFormState> = {};

        if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
        if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
        if (!form.clinic) e.clinic = "Chọn phòng khám";
        if (!form.service) e.service = "Chọn dịch vụ";
        if (!form.appointmentDate) e.appointmentDate = "Chọn ngày";
        if (!form.appointmentTime) e.appointmentTime = "Chọn giờ";

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function submit() {

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const booking_time = `${form.appointmentDate}T${form.appointmentTime}:00`;

            // Debug
            console.log("Submitting booking:", { ...form, booking_time, amount: 2000 });

            const res = await api.post("/api/bookings", {
                name: form.name,
                phone: form.phone,
                clinic: form.clinic,
                service: form.service,
                booking_time,
                amount: 2000,
            });

            console.log("Booking result:", res.data);

            const data = res.data;
            if (data && data.bookingId) {
                navigate(`/payment?bookingId=${data.bookingId}`);
            } else {
                alert("Lỗi: Không nhận được mã booking.");
            }

        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.error || err.message || "Có lỗi xảy ra";
            alert(`Đặt lịch thất bại: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return {
        form,
        update,
        submit,
        errors,
        isSubmitting,
    };
}
