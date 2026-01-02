import { useNavigate } from "zmp-ui";
import { useState } from "react";
import { BookingConfirmData } from "@/pages/confirm-booking/index";

export interface BookingFormState {
    name: string;
    phone: string;
    clinic?: string;
    clinicName?: string;
    service?: string;
    serviceName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    // Optional fields for full booking (can be added later if needed)
    gender?: boolean;
    age?: number;
    symptoms?: string;
}

// Booking amount constant
const BOOKING_AMOUNT = 2000;

export function useBookingForm() {
    const navigate = useNavigate();

    const [form, setForm] = useState<BookingFormState>({
        name: "",
        phone: "",
        clinic: "",
        clinicName: "",
        service: "",
        serviceName: "",
        appointmentDate: "",
        appointmentTime: "",
        gender: undefined, // User must select
        age: undefined,
        symptoms: "",
    });

    // Error state - only string values for error messages
    type FormErrors = Partial<Record<keyof BookingFormState, string>>;
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    function update<K extends keyof BookingFormState>(
        key: K,
        value: BookingFormState[K]
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    function validateForm(): boolean {
        const e: FormErrors = {};

        if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
        if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
        if (form.gender === undefined) e.gender = "Chọn giới tính";
        if (!form.age || form.age <= 0) e.age = "Nhập tuổi hợp lệ";
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
            const bookingTime = `${form.appointmentDate} ${form.appointmentTime}:00`;

            // Prepare booking data for confirmation page
            const bookingConfirmData: BookingConfirmData = {
                name: form.name,
                phone: form.phone,
                gender: form.gender ?? true,
                age: form.age || 0,
                symptoms: form.symptoms || "Không có",
                clinicId: form.clinic || "",
                clinicName: form.clinicName || "",
                serviceId: form.service || "",
                serviceName: form.serviceName || "",
                bookingTime: bookingTime,
                displayDate: form.appointmentDate || "",
                displayTime: form.appointmentTime || "",
                amount: BOOKING_AMOUNT,
                sourceRoute: "/booking", // Track source for back navigation
            };

            // Navigate to confirmation page instead of creating booking directly
            navigate("/confirm-booking", {
                state: { bookingData: bookingConfirmData }
            });

        } catch (err: any) {
            console.error(err);
            alert("Có lỗi xảy ra. Vui lòng thử lại.");
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

