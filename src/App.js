import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

const europeanCountries = [
  { country: "Norway", code: "+47" },
  { country: "Sweden", code: "+46" },
  { country: "Denmark", code: "+45" },
  { country: "Finland", code: "+358" },
  { country: "United Kingdom", code: "+44" },
  { country: "Germany", code: "+49" },
  { country: "France", code: "+33" },
  { country: "Spain", code: "+34" },
  { country: "Italy", code: "+39" },
  { country: "Netherlands", code: "+31" },
  { country: "Belgium", code: "+32" },
  { country: "Poland", code: "+48" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [phoneCode, setPhoneCode] = useState("+47");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    nationality: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    club: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const profileRef = doc(db, "users", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLoginForm = (field, value) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) return alert("Please enter full name.");
    if (!form.nationality) return alert("Please select nationality.");
    if (!form.email.trim()) return alert("Please enter email.");
    if (!form.phoneNumber.trim()) return alert("Please enter phone number.");
    if (!form.club.trim()) return alert("Please enter club.");
    if (form.password.length < 6) return alert("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return alert("Passwords do not match.");

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
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

      setShowCreateAccount(false);
      alert("Account created successfully!");
    } catch (error) {
      console.error(error);
      alert("Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginForm.email.trim()) return alert("Please enter email.");
    if (!loginForm.password) return alert("Please enter password.");

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        loginForm.email,
        loginForm.password
      );

      setShowLogin(false);
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      console.error(error);
      alert("Wrong email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <main className="page">
      <header className="topbar">
        <div className="logoContainer">
          <img src="/logo.svg" alt="TheCueRank.com logo" className="logo" />
        </div>

        <div className="authButtons">
          {user ? (
            <>
              <button className="loginButton">
                {profile?.fullName || user.email}
              </button>
              <button className="createButton" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button className="loginButton" onClick={() => setShowLogin(true)}>
                Log in
              </button>
              <button
                className="createButton"
                onClick={() => setShowCreateAccount(true)}
              >
                Create account
              </button>
            </>
          )}
        </div>
      </header>

      <div className="menuSection">
        <button className="menuButton" onClick={() => setMenuOpen(!menuOpen)}>
          Menu ▾
        </button>

        {menuOpen && (
          <div className="dropdown">
            <a href="#home">Home</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#ranking">Ranking</a>
            <a href="#tournaments">Tournaments</a>
            <a href="#players">Players</a>
          </div>
        )}
      </div>

      {user && profile && (
        <section id="dashboard" className="dashboard">
          <h1>Welcome, {profile.fullName}</h1>

          <div className="dashboardGrid">
            <div className="dashboardCard">
              <h3>Club</h3>
              <p>{profile.club}</p>
            </div>

            <div className="dashboardCard">
              <h3>Rating</h3>
              <p>{profile.rating}</p>
            </div>

            <div className="dashboardCard">
              <h3>Wins</h3>
              <p>{profile.wins}</p>
            </div>

            <div className="dashboardCard">
              <h3>Losses</h3>
              <p>{profile.losses}</p>
            </div>
          </div>
        </section>
      )}

      {showLogin && (
        <div className="modalOverlay">
          <div className="modal">
            <button className="closeButton" onClick={() => setShowLogin(false)}>
              ×
            </button>

            <h2>Log in</h2>

            <form className="accountForm" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => updateLoginForm("email", e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => updateLoginForm("password", e.target.value)}
              />

              <button type="submit" className="submitButton" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCreateAccount && (
        <div className="modalOverlay">
          <div className="modal">
            <button
              className="closeButton"
              onClick={() => setShowCreateAccount(false)}
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
                <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)}>
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
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
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