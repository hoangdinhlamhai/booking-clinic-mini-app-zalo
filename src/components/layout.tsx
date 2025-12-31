import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import Header from "./header";
import HomePage from "@/pages/index";
import LoginPage from "@/pages/login/index";
import RegisterPage from "@/pages/register/index";
import BookingsPage from "@/pages/booking/index";
import ChatPage from "@/pages/chat/index";
import PaymentPage from "@/pages/payment/index";
import ResultPage from "@/pages/result/index";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <ZMPRouter>
          <Header />
          <AnimationRoutes>
            <Route path="/" element={<HomePage />}></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/register" element={<RegisterPage />}></Route>
            <Route path="/booking" element={<BookingsPage />}></Route>
            <Route path="/chat" element={<ChatPage />}></Route>
            <Route path="/payment" element={<PaymentPage />}></Route>
            <Route path="/result" element={<ResultPage />}></Route>
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
