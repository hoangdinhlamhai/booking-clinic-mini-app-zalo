import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import { AuthProvider } from "@/hooks/useAuth";
import Header from "./header";
import HomePage from "@/pages/index";
import LoginPage from "@/pages/login/index";
import RegisterPage from "@/pages/register/index";
import BookingsPage from "@/pages/booking/index";
import ChatPage from "@/pages/chat/index";
import ConfirmBookingPage from "@/pages/confirm-booking/index";
import PaymentPage from "@/pages/payment/index";
import ResultPage from "@/pages/result/index";
import HistoryPage from "@/pages/history/index";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <AuthProvider>
          <ZMPRouter>
            <Header />
            <AnimationRoutes>
              <Route path="/" element={<HomePage />}></Route>
              <Route path="/login" element={<LoginPage />}></Route>
              <Route path="/register" element={<RegisterPage />}></Route>
              <Route path="/booking" element={<BookingsPage />}></Route>
              <Route path="/chat" element={<ChatPage />}></Route>
              <Route path="/confirm-booking" element={<ConfirmBookingPage />}></Route>
              <Route path="/payment" element={<PaymentPage />}></Route>
              <Route path="/result" element={<ResultPage />}></Route>
              <Route path="/history" element={<HistoryPage />}></Route>
            </AnimationRoutes>
          </ZMPRouter>
        </AuthProvider>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
