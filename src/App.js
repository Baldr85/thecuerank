import { useState } from "react";
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

  return (
    <main className="page">
      <header className="topbar">
        <div className="logoContainer">
          <img src="/TheCueRank.svg" alt="TheCueRank.com logo" className="logo" />
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
            >
              ×
            </button>

            <h2>Create account</h2>

            <form className="accountForm">
              <input type="text" placeholder="Full name" />

              <select>
                <option value="">Select nationality</option>
                {europeanCountries.map((item) => (
                  <option key={item.country} value={item.country}>
                    {item.country}
                  </option>
                ))}
              </select>

              <input type="email" placeholder="Email" />

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

                <input type="tel" placeholder="Phone number" />
              </div>

              <input type="password" placeholder="Password" />
              <input type="password" placeholder="Confirm password" />
              <input type="text" placeholder="Club" />

              <button type="submit" className="submitButton">
                Create account
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}