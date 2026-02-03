import { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const UserRegister = () => {
  const navigate = useNavigate();

  // ============================
  // State
  // ============================
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    street: "",
    city: "",
    pincode: "",
    roles: "PASSENGER",
    age: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  // ============================
  // Input Handler
  // ============================
  const handleUserInput = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // ============================
  // Validation Function
  // ============================
  const validateForm = () => {
    let newErrors = {};

    // Name
    if (!user.name.trim()) {
      newErrors.name = "Passenger name is required!";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email.trim()) {
      newErrors.email = "Email is required!";
    } else if (!emailRegex.test(user.email)) {
      newErrors.email = "Enter a valid email!";
    }

    // Password
    if (!user.password.trim()) {
      newErrors.password = "Password is required!";
    } else if (user.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters!";
    }

    // Gender
    if (!user.gender.trim()) {
      newErrors.gender = "Please select gender!";
    }

    // Contact
    const contactRegex = /^[0-9]{10}$/;
    if (!user.contact.trim()) {
      newErrors.contact = "Contact number is required!";
    } else if (!contactRegex.test(user.contact)) {
      newErrors.contact = "Contact must be exactly 10 digits!";
    }

    // Age
    if (!user.age.trim()) {
      newErrors.age = "Age is required!";
    } else if (user.age <= 0 || user.age > 100) {
      newErrors.age = "Enter valid age (1 - 100)";
    }

    // Street
    if (!user.street.trim()) {
      newErrors.street = "Street address is required!";
    }

    // City
    if (!user.city.trim()) {
      newErrors.city = "City is required!";
    }

    // Pincode
    const pinRegex = /^[0-9]{6}$/;
    if (!user.pincode.trim()) {
      newErrors.pincode = "Pincode is required!";
    } else if (!pinRegex.test(user.pincode)) {
      newErrors.pincode = "Pincode must be exactly 6 digits!";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ============================
  // Save User
  // ============================
  const saveUser = (e) => {
    e.preventDefault();

    // Stop if validation fails
    if (!validateForm()) {
      toast.error("Please fix the validation errors!", {
        position: "top-center",
        autoClose: 1500,
      });
      return;
    }

    fetch("http://localhost:8080/api/user/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((result) => result.json())
      .then((res) => {
        if (res.success) {
          toast.success(res.responseMessage, {
            position: "top-center",
            autoClose: 1000,
          });

          setTimeout(() => {
            navigate("/user/login");
          }, 1000);
        } else {
          toast.error(res.responseMessage || "Registration Failed!", {
            position: "top-center",
          });
        }
      })
      .catch(() => {
        toast.error("Server Error! Try again later.", {
          position: "top-center",
        });
      });
  };

  // ============================
  // UI
  // ============================
  return (
    <div className="mt-2 d-flex justify-content-center">
      <div
        className="card form-card border-color text-color custom-bg"
        style={{ width: "50rem" }}
      >
        <div className="card-header bg-color custom-bg-text text-center">
          <h5>Register Passenger</h5>
        </div>

        <div className="card-body">
          <form className="row g-3" onSubmit={saveUser}>
            {/* Name */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Passenger Name</b>
              </label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={user.name}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.name}</small>
            </div>

            {/* Email */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Email Id</b>
              </label>
              <input
                type="text"
                className="form-control"
                name="email"
                value={user.email}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.email}</small>
            </div>

            {/* Password */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Password</b>
              </label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={user.password}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.password}</small>
            </div>

            {/* Gender */}
            <div className="col-md-6">
              <label className="form-label">
                <b>User Gender</b>
              </label>
              <select
                className="form-control"
                name="gender"
                value={user.gender}
                onChange={handleUserInput}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <small className="text-danger">{errors.gender}</small>
            </div>

            {/* Contact */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Contact No</b>
              </label>
              <input
                type="text"
                className="form-control"
                name="contact"
                value={user.contact}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.contact}</small>
            </div>

            {/* Age */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Age</b>
              </label>
              <input
                type="number"
                className="form-control"
                name="age"
                value={user.age}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.age}</small>
            </div>

            {/* Street */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Street</b>
              </label>
              <textarea
                className="form-control"
                name="street"
                value={user.street}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.street}</small>
            </div>

            {/* City */}
            <div className="col-md-6">
              <label className="form-label">
                <b>City</b>
              </label>
              <input
                type="text"
                className="form-control"
                name="city"
                value={user.city}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.city}</small>
            </div>

            {/* Pincode */}
            <div className="col-md-6">
              <label className="form-label">
                <b>Pincode</b>
              </label>
              <input
                type="text"
                className="form-control"
                name="pincode"
                value={user.pincode}
                onChange={handleUserInput}
              />
              <small className="text-danger">{errors.pincode}</small>
            </div>

            {/* Submit */}
            <div className="text-center mt-3">
              <button className="btn bg-color custom-bg-text">
                Register User
              </button>
            </div>

            <ToastContainer />
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;
