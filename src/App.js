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
  const [page, setPage] = useState("home");

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

  // Tournament state
  const [tournamentName, setTournamentName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [tournamentPlayers, setTournamentPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [champion, setChampion] = useState("");

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

  // Tournament logic
  const addTournamentPlayer = () => {
    const cleanName = playerName.trim();

    if (!cleanName) return;
    if (tournamentPlayers.includes(cleanName)) {
      alert("Player already added.");
      return;
    }

    setTournamentPlayers([...tournamentPlayers, cleanName]);
    setPlayerName("");
  };

  const removeTournamentPlayer = (name) => {
    setTournamentPlayers(tournamentPlayers.filter((p) => p !== name));
  };

  const makeRound = (players) => {
    const list = [...players];

    if (list.length % 2 !== 0) {
      list.push("BYE");
    }

    const newRound = [];

    for (let i = 0; i < list.length; i += 2) {
      const p1 = list[i];
      const p2 = list[i + 1];

      newRound.push({
        p1,
        p2,
        winner: p2 === "BYE" ? p1 : "",
      });
    }

    return newRound;
  };

  const startTournament = () => {
    if (tournamentPlayers.length < 2) {
      alert("Add at least 2 players.");
      return;
    }

    const firstRound = makeRound(tournamentPlayers);

    setRounds([firstRound]);
    setChampion("");
  };

  const pickMatchWinner = (roundIndex, matchIndex, player) => {
    if (player === "BYE") return;

    const copy = rounds.map((round) => round.map((match) => ({ ...match })));
    copy[roundIndex][matchIndex].winner = player;
    setRounds(copy);
  };

  const nextRound = () => {
    if (rounds.length === 0) return;

    const currentRound = rounds[rounds.length - 1];

    if (currentRound.some((match) => !match.winner)) {
      alert("Pick winners for all matches first.");
      return;
    }

    const winners = currentRound.map((match) => match.winner);

    if (winners.length === 1) {
      setChampion(winners[0]);
      return;
    }

    const newRound = makeRound(winners);
    setRounds([...rounds, newRound]);
  };

  const resetTournament = () => {
    setTournamentName("");
    setPlayerName("");
    setTournamentPlayers([]);
    setRounds([]);
    setChampion("");
  };

  const goToPage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
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
            <button onClick={() => goToPage("home")}>Home</button>
            <button onClick={() => goToPage("dashboard")}>Dashboard</button>
            <button onClick={() => goToPage("tournaments")}>Tournaments</button>
            <button onClick={() => goToPage("ranking")}>Ranking</button>
            <button onClick={() => goToPage("players")}>Players</button>
          </div>
        )}
      </div>

      {page === "home" && (
        <section className="homeHero">
          <h1>Global Cue Sports Ranking Platform</h1>
          <p>Rankings, tournaments and player profiles for cue sports clubs.</p>
        </section>
      )}

      {page === "dashboard" && user && profile && (
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

      {page === "dashboard" && !user && (
        <section className="dashboard">
          <h1>Please log in to view your dashboard.</h1>
        </section>
      )}

      {page === "tournaments" && (
        <section className="tournamentPage">
          <h1>Tournaments</h1>

          <div className="tournamentPanel">
            <input
              type="text"
              placeholder="Tournament name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />

            <div className="addPlayerRow">
              <input
                type="text"
                placeholder="Player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <button onClick={addTournamentPlayer}>Add player</button>
            </div>

            <div className="playerList">
              {tournamentPlayers.map((player) => (
                <div key={player} className="playerPill">
                  {player}
                  <button onClick={() => removeTournamentPlayer(player)}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="tournamentActions">
              <button onClick={startTournament}>Start Winner Tournament</button>
              <button onClick={nextRound} disabled={rounds.length === 0 || champion}>
                Next round
              </button>
              <button onClick={resetTournament}>Reset</button>
            </div>
          </div>

          {tournamentName && <h2>{tournamentName}</h2>}

          <div className="bracketArea">
            {rounds.map((round, roundIndex) => (
              <div key={roundIndex} className="roundColumn">
                <h3>Round {roundIndex + 1}</h3>

                {round.map((match, matchIndex) => (
                  <div key={matchIndex} className="matchCard">
                    <div className="matchPlayers">
                      <button
                        onClick={() =>
                          pickMatchWinner(roundIndex, matchIndex, match.p1)
                        }
                        className={match.winner === match.p1 ? "selectedWinner" : ""}
                      >
                        {match.p1}
                      </button>

                      <span>vs</span>

                      <button
                        onClick={() =>
                          pickMatchWinner(roundIndex, matchIndex, match.p2)
                        }
                        disabled={match.p2 === "BYE"}
                        className={match.winner === match.p2 ? "selectedWinner" : ""}
                      >
                        {match.p2}
                      </button>
                    </div>

                    {match.winner && (
                      <div className="winnerText">Winner: {match.winner}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {champion && (
            <div className="championBox">
              🏆 Tournament Champion: {champion}
            </div>
          )}
        </section>
      )}

      {page === "ranking" && (
        <section className="dashboard">
          <h1>Ranking page coming next.</h1>
        </section>
      )}

      {page === "players" && (
        <section className="dashboard">
          <h1>Players page coming next.</h1>
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