import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/admin/AuthContext";
import { GlobalErrorProvider } from "./context/admin/GlobalErrorContext";

import AuthenticatedRoute from "./context/admin/AuthenticatedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/admin/Login";
import Employees from "./pages/admin/Employees";
import Categories from "./pages/admin/Categories";
import Foods from "./pages/admin/Foods";
import RestaurantAreas from "./pages/admin/RestaurantAreas";
import Tables from "./pages/admin/Tables";
import Amenities from "./pages/admin/Amenities";
import RoomClass from "./pages/admin/RoomClass";
import RoomType from "./pages/admin/RoomType";
import Room from "./pages/admin/Rooms";
import Coupons from "./pages/admin/Coupons";

import ClientLayout from "./layouts/ClientLayout";
import LandingPage from "./pages/client/LandingPage";
import RestaurantPage from "./pages/client/RestaurantPage";
import HomestayPage from "./pages/client/HomestayPage";
import BookingPage from "./pages/client/BookingPage";
import BookingInfoPage from "./pages/client/BookingInfoPage";
import BookingMenuPage from "./pages/client/BookingMenuPage";
import BookingCheckoutPage from "./pages/client/BookingCheckoutPage";
import BookingFailedPage from "./pages/client/BookingFailedPage";
import BookingSuccessPage from "./pages/client/BookingSuccessPage";
import BookingTrackingPage from "./pages/client/BookingTrackingPage";
import ProfilePage from "./pages/client/ProfilePage";
import ResetPasswordPage from "./pages/client/ResetPasswordPage";
import BookingHistoryPage from "./pages/client/BookingHistoryPage";
import ClientPrivateRoute from "./context/client/ClientPrivateRoute";
import BookingList from "./pages/admin/BookingList";
import BookingDetail from "./pages/admin/BookingDetail";
import RestaurantOverview from "./pages/admin/RestaurantOverview";
import { ToastContainer } from "react-toastify";
import RevenueStatisticPage from "./pages/admin/RevenueStatisticPage";
import HomestayBookingPage from "./pages/client/HomestayBookingPage";
import RoomDetailPage from "./pages/client/RoomDetailPage";
import HomestayCheckoutPage from "./pages/client/HomestayCheckoutPage";
import HomestayHistoryPage from "./pages/client/HomestayHistoryPage";
import HomestayTrackingPage from "./pages/client/HomestayTrackingPage";
import HomestayBookingList from "./pages/admin/HomestayBookingList";
import HomestayBookingDetail from "./pages/admin/HomestayBookingDetail";
import HomestayPosPage from "./pages/admin/HomestayPosPage";
import SupportDashboard from "./pages/admin/SupportDashboard";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";

function App() {
  return (
    <AuthProvider>
      <GlobalErrorProvider>
        <Routes>
          <Route element={<ClientLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/restaurant" element={<RestaurantPage />} />
            <Route path="/homestay" element={<HomestayPage />} />

            <Route path="/restaurant/booking" element={<BookingPage />} />
            <Route
              path="/restaurant/booking/info"
              element={<BookingInfoPage />}
            />
            <Route
              path="/restaurant/booking/menu"
              element={<BookingMenuPage />}
            />
            <Route
              path="/restaurant/booking/checkout"
              element={<BookingCheckoutPage />}
            />
            <Route
              path="/restaurant/booking/success"
              element={<BookingSuccessPage />}
            />
            <Route
              path="/restaurant/booking/failed"
              element={<BookingFailedPage />}
            />
            <Route
              path="/restaurant/booking/tracking"
              element={<BookingTrackingPage />}
            />

            <Route path="/homestay/booking" element={<HomestayBookingPage />} />
            <Route path="/homestay/room/:id" element={<RoomDetailPage />} />
            <Route
              path="/homestay/checkout"
              element={<HomestayCheckoutPage />}
            />
            <Route
              path="/homestay/booking/success"
              element={<BookingSuccessPage />}
            />
            <Route
              path="/homestay/booking/failed"
              element={<BookingFailedPage />}
            />

            <Route
              path="/homestay/booking/tracking"
              element={<HomestayTrackingPage />}
            />
            <Route element={<ClientPrivateRoute />}>
              <Route
                path="/restaurant/booking-history"
                element={<BookingHistoryPage />}
              />
              <Route
                path="/homestay/booking-history"
                element={<HomestayHistoryPage />}
              />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="/admin/login" element={<Login />} />

          <Route path="/admin" element={<AuthenticatedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<RevenueStatisticPage />} />

              <Route path="employees" element={<Employees />} />
              <Route path="users" element={<Users />} />
              <Route path="categories" element={<Categories />} />
              <Route path="foods" element={<Foods />} />
              <Route path="areas" element={<RestaurantAreas />} />
              <Route path="tables" element={<Tables />} />
              <Route path="booking" element={<BookingList />} />
              <Route path="booking/:id" element={<BookingDetail />} />
              <Route path="restaurant-pos" element={<RestaurantOverview />} />
              <Route path="amenities" element={<Amenities />} />
              <Route path="room-classes" element={<RoomClass />} />
              <Route path="room-types" element={<RoomType />} />
              <Route path="rooms" element={<Room />} />
              <Route path="homestay-booking" element={<HomestayBookingList />} />
              <Route path="homestay-booking/:id" element={<HomestayBookingDetail />} />
              <Route path="homestay-pos" element={<HomestayPosPage />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="support" element={<SupportDashboard />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800">404</h1>
                  <p className="text-gray-600">Không tìm thấy trang</p>
                  <a
                    href="/"
                    className="mt-4 inline-block text-blue-600 hover:underline"
                  >
                    Về trang chủ
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </GlobalErrorProvider>
    </AuthProvider>
  );
}

export default App;
