import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Email passed from ForgotPassword page
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ✅ Reset Password API Call
  const resetPasswordHandler = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8080/api/user/reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );

      if (response.data.success) {
        toast.success("Password Reset Successful!", {
          position: "top-center",
          autoClose: 1500,
        });

        // Redirect back to Login
        setTimeout(() => {
          navigate("/user/login");
        }, 1500);
      } else {
        toast.error(response.data.responseMessage, {
          position: "top-center",
        });
      }
    } catch (error) {
      toast.error("Server Error!", {
        position: "top-center",
      });
    }
  };

  return (
    <div className="mt-5 d-flex justify-content-center">
      <div className="card p-4 shadow" style={{ width: "25rem" }}>
        <h3 className="text-center mb-3">Reset Password</h3>

        <form onSubmit={resetPasswordHandler}>
          {/* OTP */}
          <div className="mb-3">
            <label>
              <b>Enter OTP</b>
            </label>
            <input
              type="text"
              className="form-control"
              value={otp}
              required
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          {/* New Password */}
          <div className="mb-3">
            <label>
              <b>Enter New Password</b>
            </label>
            <input
              type="password"
              className="form-control"
              value={newPassword}
              required
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-success w-100">
            Reset Password
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
};

export default ResetPassword;
