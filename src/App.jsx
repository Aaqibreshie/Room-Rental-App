import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, LandlordRoute } from "./Components/ProtectedRoute";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import RoomDetails from "./Pages/RoomDetails";
import CreateRoom from "./Pages/CreateRoom";
import About from "./Pages/About";
import HelpCenter from "./Pages/HelpCenter";
import Contact from "./Pages/Contact";
import SafetyInformation from "./Pages/SafetyInformation";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import MyBuildings from "./Pages/MyBuildings";
import CreateBuilding from "./Pages/CreateBuilding";
import MyRooms from "./Pages/MyRooms";
import BuildingRooms from "./Pages/BuildingRooms";
import EditBuilding from "./Pages/EditBuilding";
import EditRoom from "./Pages/EditRoom";
import Settings from "./Pages/Settings";
import DashboardLayout from "./Pages/DashboardLayout";
import DashboardHome from "./Pages/DashboardHome";
import RoomDetailsUser from "./Pages/RoomDetailsUser";
import UserSavedRooms from "./Pages/UserSavedRooms";
import ProfilePage from "./Pages/ProfilePage";
import Terms from "./Pages/Terms";
import ChangePassword from "./Pages/ChangePasswordUser";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import VerifyOtp from "./Pages/VerifyOtp";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/safety" element={<SafetyInformation />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/room-user/:id" element={<RoomDetailsUser />} />

      {/* Tenant/user routes (must be logged in) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/saved-rooms" element={<UserSavedRooms />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      {/* Landlord dashboard routes */}
      <Route element={<LandlordRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="my-buildings" element={<MyBuildings />} />
          <Route path="edit-building/:id" element={<EditBuilding />} />
          <Route path="create-building" element={<CreateBuilding />} />
          <Route path="building/:id/rooms" element={<BuildingRooms />} />
          <Route path="my-rooms" element={<MyRooms />} />
          <Route path="edit-room/:id" element={<EditRoom />} />
          <Route path="create-room" element={<CreateRoom />} />
          <Route path="room/:id" element={<RoomDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
