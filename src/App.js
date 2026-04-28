import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

const europeanCountries = [
  { country: "Norway", code: "+47" },
  { country: "Sweden", code: "+46" },
  { country: "Denmark", code: "+45" },
  { country: "Finland", code: "+358" },
  { country: "Iceland", code: "+354" },
  { country: "United Kingdom", code: "+44" },
  { country: "Ireland", code: "+353" },
  { country: "Germany", code: "+49" },
  { country: "France", code: "+33" },
  { country: "Spain", code: "+34" },
  { country: "Portugal", code: "+351" },
  { country: "Italy", code: "+39" },
  { country: "Netherlands", code: "+31" },
  { country: "Belgium", code: "+32" },
  { country: "Switzerland", code: "+41" },
  { country: "Austria", code: "+43" },
  { country: "Poland", code: "+48" },
  { country: "Czech Republic", code: "+420" },
  { country: "Slovakia", code: "+421" },
  { country: "Hungary", code: "+36" },
  { country: "Romania", code: "+40" },
  { country: "Bulgaria", code: "+359" },
  { country: "Greece", code: "+30" },
  { country: "Croatia", code: "+385" },
  { country: "Serbia", code: "+381" },
  { country: "Slovenia", code: "+386" },
  { country: "Estonia", code: "+372" },
  { country: "Latvia", code: "+371" },
  { country: "Lithuania", code: "+370" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [phoneCode, setPhoneCode] = useState("+47");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    nationality: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    club: "",
  });

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) return alert("Please enter full name.");
    if (!form.nationality) return alert("Please select nationality.");
    if (!form.email.trim()) return alert("Please enter email.");
    if (!form.phoneNumber.trim()) return alert("Please enter phone number.");
    if (!form.club.trim()) return alert("Please enter club.");
    if (form.password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return alert("Passwords do not match.");
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: form.fullName.trim(),
        nationality: form.nationality,
        email: form.email.trim().toLowerCase(),
        phoneCode,
        phoneNumber: form.phoneNumber.trim(),
        club: form.club.trim(),
        role: "player",
        rating: 1000,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully!");

      setForm({
        fullName: "",
        nationality: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        club: "",
      });
      setPhoneCode("+47");
      setShowCreateAccount(false);
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        alert("Password is too weak.");
      } else {
        alert("Could not create account. Check Firebase settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <header className="topbar">
        <div className="logoContainer">
          <img src="/logo.svg" alt="TheCueRank.com logo" className="logo" />
        </div>

        <div className="authButtons">
          <button className="loginButton">Log in</button>
          <button
            className="createButton"
            onClick={() => setShowCreateAccount(true)}
          >
            Create account
          </button>
        </div>
      </header>

      <div className="menuSection">
        <button className="menuButton" onClick={() => setMenuOpen(!menuOpen)}>
          Menu ▾
        </button>

        {menuOpen && (
          <div className="dropdown">
            <a href="#home">Home</a>
            <a href="#ranking">Ranking</a>
            <a href="#tournaments">Tournaments</a>
            <a href="#players">Players</a>
            <a href="#contact">Contact</a>
          </div>
        )}
      </div>

      {showCreateAccount && (
        <div className="modalOverlay">
          <div className="modal">
            <button
              className="closeButton"
              onClick={() => setShowCreateAccount(false)}
              disabled={loading}
            >
              ×
            </button>

            <h2>Create account</h2>

            <form className="accountForm" onSubmit={handleCreateAccount}>
              <input
                type="text"
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => updateForm("fullName", e.target.value)}
              />

              <select
                value={form.nationality}
                onChange={(e) => updateForm("nationality", e.target.value)}
              >
                <option value="">Select nationality</option>
                {europeanCountries.map((item) => (
                  <option key={item.country} value={item.country}>
                    {item.country}
                  </option>
                ))}
              </select>

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
              />

              <div className="phoneRow">
                <select
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                >
                  {europeanCountries.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.country} {item.code}
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  placeholder="Phone number"
                  value={form.phoneNumber}
                  onChange={(e) => updateForm("phoneNumber", e.target.value)}
                />
              </div>

              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e) =>
                  updateForm("confirmPassword", e.target.value)
                }
              />

              <input
                type="text"
                placeholder="Club"
                value={form.club}
                onChange={(e) => updateForm("club", e.target.value)}
              />

              <button type="submit" className="submitButton" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}