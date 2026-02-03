import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  // ✅ Send OTP API Call
  const sendOtp = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8080/api/user/forgot-password",
        { email }
      );

      if (response.data.success) {
        toast.success("OTP Sent Successfully!", {
          position: "top-center",
          autoClose: 1500,
        });

        // Redirect to Reset Page
        setTimeout(() => {
          navigate("/reset-password", { state: { email } });
        }, 1500);
      } else {
        toast.error(response.data.responseMessage, {
          position: "top-center",
        });
      }
    } catch (error) {
      toast.error("Server Error or Email Not Found!", {
        position: "top-center",
      });
    }
  };

  return (
    <div className="mt-5 d-flex justify-content-center">
      <div className="card p-4 shadow" style={{ width: "25rem" }}>
        <h3 className="text-center mb-3">Forgot Password</h3>

        <form onSubmit={sendOtp}>
          <div className="mb-3">
            <label>
              <b>Enter Registered Email</b>
            </label>

            <input
              type="email"
              className="form-control"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Send OTP
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
};

export default ForgotPassword;
