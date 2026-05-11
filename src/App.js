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
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
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

const gameTypes = [
  { id: "8ball", name: "8-Ball" },
  { id: "9ball", name: "9-Ball" },
  { id: "10ball", name: "10-Ball" },
  { id: "snooker", name: "Snooker" },
];

const raceOptions = [1, 2, 3, 5, 7, 9, 11];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState("home");

  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [phoneCode, setPhoneCode] = useState("+47");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [clubs, setClubs] = useState([]);
  const [clubChoice, setClubChoice] = useState("");
  const [newClubName, setNewClubName] = useState("");
  const [clubMembers, setClubMembers] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    nationality: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [tournamentName, setTournamentName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [tournamentPlayers, setTournamentPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [champion, setChampion] = useState("");
  const [byeHistory, setByeHistory] = useState([]);
  const [selectedGame, setSelectedGame] = useState("8ball");
  const [selectedRace, setSelectedRace] = useState(3);
  const [currentTournamentId, setCurrentTournamentId] = useState(null);

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

  useEffect(() => {
    const loadClubs = async () => {
      const snapshot = await getDocs(collection(db, "clubs"));
      const clubList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      clubList.sort((a, b) => a.name.localeCompare(b.name));
      setClubs(clubList);
    };

    loadClubs();
  }, []);

  const loadClubMembers = async () => {
    if (!profile?.club) return;

    const q = query(collection(db, "users"), where("club", "==", profile.club));
    const snapshot = await getDocs(q);

    const members = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    members.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    setClubMembers(members);
  };

  useEffect(() => {
    if ((page === "club" || page === "manageMembers") && profile?.club) {
      loadClubMembers();
    }
    // eslint-disable-next-line
  }, [page, profile]);

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
    if (form.password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return alert("Passwords do not match.");
    }

    let finalClub = clubChoice;

    if (clubChoice === "__new__") {
      if (!newClubName.trim()) {
        return alert("Please enter new club name.");
      }

      finalClub = newClubName.trim();
    }

    if (!finalClub) {
      return alert("Please select a club.");
    }

    try {
      setLoading(true);

      let clubId = null;

      if (clubChoice === "__new__") {
        const clubRef = await addDoc(collection(db, "clubs"), {
          name: finalClub,
          createdAt: serverTimestamp(),
        });

        clubId = clubRef.id;

        setClubs((prev) =>
          [...prev, { id: clubRef.id, name: finalClub }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
      } else {
        const selectedClub = clubs.find((club) => club.name === finalClub);
        clubId = selectedClub?.id || null;
      }

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
        club: finalClub,
        clubId,
        role: "player",
        rating: 1000,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        createdAt: serverTimestamp(),
      });

      setForm({
        fullName: "",
        nationality: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
      });

      setPhoneCode("+47");
      setClubChoice("");
      setNewClubName("");
      setShowCreateAccount(false);

      alert("Account created successfully!");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already in use.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email.");
      } else if (error.code === "auth/weak-password") {
        alert("Password is too weak.");
      } else {
        alert("Could not create account.");
      }
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

  const getCurrentGame = () => {
    return gameTypes.find((game) => game.id === selectedGame) || gameTypes[0];
  };

  const saveTournamentUpdate = async (updatedData) => {
    if (!currentTournamentId) return;

    await updateDoc(doc(db, "tournaments", currentTournamentId), {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
  };

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

  const makeRound = (players, currentByeHistory = []) => {
    let list = [...players];
    let newByePlayer = null;
    const currentGame = getCurrentGame();

    if (list.length % 2 !== 0) {
      const playerWithoutBye = list.find(
        (player) => !currentByeHistory.includes(player)
      );

      newByePlayer = playerWithoutBye || list[list.length - 1];

      list = list.filter((player) => player !== newByePlayer);
      list.push(newByePlayer);
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
        byePlayer: p2 === "BYE" ? p1 : null,
        gameType: currentGame.name,
        gameId: selectedGame,
        targetLabel: `Best of ${selectedRace}`,
        bestOf: selectedRace,
        target: Math.ceil(selectedRace / 2),
        score: {
          p1: 0,
          p2: 0,
        },
      });
    }

    return {
      round: newRound,
      byePlayer: newByePlayer,
    };
  };

  const startTournament = async () => {
    if (!user || !profile) {
      alert("Please log in before creating a tournament.");
      return;
    }

    if (tournamentPlayers.length < 2) {
      alert("Add at least 2 players.");
      return;
    }

    if (!tournamentName.trim()) {
      alert("Please enter tournament name.");
      return;
    }

    const result = makeRound(tournamentPlayers, []);
    const currentGame = getCurrentGame();
    const newByeHistory = result.byePlayer ? [result.byePlayer] : [];

    const tournamentRef = await addDoc(collection(db, "tournaments"), {
      name: tournamentName.trim(),
      club: profile.club,
      clubId: profile.clubId || null,
      gameType: currentGame.name,
      gameId: selectedGame,
      bestOf: selectedRace,
      target: Math.ceil(selectedRace / 2),
      players: tournamentPlayers,
      rounds: [result.round],
      champion: "",
      byeHistory: newByeHistory,
      createdBy: user.uid,
      createdByName: profile.fullName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setCurrentTournamentId(tournamentRef.id);
    setRounds([result.round]);
    setByeHistory(newByeHistory);
    setChampion("");
  };

  const pickMatchWinner = async (roundIndex, matchIndex, player) => {
    if (player === "BYE") return;

    const copy = rounds.map((round) =>
      round.map((match) => ({
        ...match,
        score: { ...(match.score || { p1: 0, p2: 0 }) },
      }))
    );

    copy[roundIndex][matchIndex].winner = player;
    setRounds(copy);

    await saveTournamentUpdate({
      rounds: copy,
    });
  };

  const updateScore = async (roundIndex, matchIndex, playerKey) => {
    const copy = rounds.map((round) =>
      round.map((match) => ({
        ...match,
        score: { ...(match.score || { p1: 0, p2: 0 }) },
      }))
    );

    const match = copy[roundIndex][matchIndex];

    if (match.winner || match.p2 === "BYE") return;

    match.score[playerKey] += 1;

    if (match.score[playerKey] >= match.target) {
      match.winner = playerKey === "p1" ? match.p1 : match.p2;
    }

    setRounds(copy);

    await saveTournamentUpdate({
      rounds: copy,
    });
  };

  const nextRound = async () => {
    if (rounds.length === 0) return;

    const currentRound = rounds[rounds.length - 1];

    if (currentRound.some((match) => !match.winner)) {
      alert("Pick winners for all matches first.");
      return;
    }

    const winners = currentRound.map((match) => match.winner);

    if (winners.length === 1) {
      setChampion(winners[0]);

      await saveTournamentUpdate({
        champion: winners[0],
      });

      return;
    }

    const result = makeRound(winners, byeHistory);

    const updatedRounds = [...rounds, result.round];
    const updatedByeHistory = result.byePlayer
      ? [...byeHistory, result.byePlayer]
      : byeHistory;

    setRounds(updatedRounds);
    setByeHistory(updatedByeHistory);

    await saveTournamentUpdate({
      rounds: updatedRounds,
      byeHistory: updatedByeHistory,
    });
  };

  const resetTournament = () => {
    setTournamentName("");
    setPlayerName("");
    setTournamentPlayers([]);
    setRounds([]);
    setChampion("");
    setByeHistory([]);
    setSelectedGame("8ball");
    setSelectedRace(3);
    setCurrentTournamentId(null);
  };

  const goToPage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
  };

  const makeMemberAdmin = async (memberId) => {
    if (profile?.role !== "admin") {
      alert("Only admins can change member roles.");
      return;
    }

    await updateDoc(doc(db, "users", memberId), {
      role: "admin",
    });

    alert("Member is now admin.");
    loadClubMembers();
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
            <button onClick={() => goToPage("club")}>Club</button>
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

      {page === "club" && user && profile && (
        <section className="clubPage">
          <h1>{profile.club}</h1>
          <p className="clubSubtitle">Club dashboard</p>

          <div className="dashboardGrid">
            <div className="dashboardCard">
              <h3>Members</h3>
              <p>{clubMembers.length}</p>
            </div>

            <div className="dashboardCard">
              <h3>Your role</h3>
              <p>{profile.role}</p>
            </div>

            <div className="dashboardCard">
              <h3>Your rating</h3>
              <p>{profile.rating}</p>
            </div>

            <div className="dashboardCard">
              <h3>Country</h3>
              <p>{profile.nationality}</p>
            </div>
          </div>

          {profile.role === "admin" && (
            <div className="adminBox">
              <h2>Admin panel</h2>
              <p>You are club admin for {profile.club}.</p>

              <div className="adminActions">
                <button>Create club tournament</button>
                <button onClick={() => goToPage("manageMembers")}>
                  Manage members
                </button>
                <button>Edit club profile</button>
              </div>
            </div>
          )}

          <h2>Club members</h2>

          <div className="memberTable">
            <div className="memberHeader">
              <span>Player</span>
              <span>Rating</span>
              <span>Wins</span>
              <span>Losses</span>
              <span>Role</span>
            </div>

            {clubMembers.map((member) => (
              <div key={member.id} className="memberRow">
                <span>{member.fullName}</span>
                <span>{member.rating || 1000}</span>
                <span>{member.wins || 0}</span>
                <span>{member.losses || 0}</span>
                <span>{member.role || "player"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {page === "manageMembers" && user && profile?.role === "admin" && (
        <section className="clubPage">
          <h1>Manage Members</h1>
          <p className="clubSubtitle">{profile.club}</p>

          <div className="memberTable">
            <div className="memberHeader">
              <span>Player</span>
              <span>Email</span>
              <span>Rating</span>
              <span>Role</span>
              <span>Action</span>
            </div>

            {clubMembers.map((member) => (
              <div key={member.id} className="memberRow">
                <span>{member.fullName}</span>
                <span>{member.email}</span>
                <span>{member.rating || 1000}</span>
                <span>{member.role || "player"}</span>
                <span>
                  {(member.role || "player") === "admin" ? (
                    "Admin"
                  ) : (
                    <button
                      className="smallActionButton"
                      onClick={() => makeMemberAdmin(member.id)}
                    >
                      Make admin
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {page === "club" && !user && (
        <section className="dashboard">
          <h1>Please log in to view your club.</h1>
        </section>
      )}

      {page === "tournaments" && (
        <section className="tournamentPage">
          <h1>Tournaments</h1>

          <div className="tournamentPanel">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              {gameTypes.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>

            <select
              value={selectedRace}
              onChange={(e) => setSelectedRace(Number(e.target.value))}
            >
              {raceOptions.map((race) => (
                <option key={race} value={race}>
                  Best of {race}
                </option>
              ))}
            </select>

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
              <button
                onClick={nextRound}
                disabled={rounds.length === 0 || champion}
              >
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
                    <div className="matchTopRow">
                      <div className="matchFormat">{match.gameType}</div>
                      <div className="raceColumn">{match.targetLabel}</div>
                    </div>

                    <div className="matchPlayers">
                      <button
                        onClick={() =>
                          pickMatchWinner(roundIndex, matchIndex, match.p1)
                        }
                        className={
                          match.winner === match.p1 ? "selectedWinner" : ""
                        }
                      >
                        {match.p1}
                      </button>

                      <span>vs</span>

                      <button
                        onClick={() =>
                          pickMatchWinner(roundIndex, matchIndex, match.p2)
                        }
                        disabled={match.p2 === "BYE"}
                        className={
                          match.winner === match.p2 ? "selectedWinner" : ""
                        }
                      >
                        {match.p2}
                      </button>
                    </div>

                    {match.p2 !== "BYE" && (
                      <div className="scoreBox">
                        <button
                          onClick={() =>
                            updateScore(roundIndex, matchIndex, "p1")
                          }
                        >
                          + {match.p1}
                        </button>

                        <strong>
                          {match.score?.p1 || 0} - {match.score?.p2 || 0}
                        </strong>

                        <button
                          onClick={() =>
                            updateScore(roundIndex, matchIndex, "p2")
                          }
                        >
                          + {match.p2}
                        </button>
                      </div>
                    )}

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
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
              />

              <select
                value={clubChoice}
                onChange={(e) => setClubChoice(e.target.value)}
              >
                <option value="">Select club</option>

                {clubs.map((club) => (
                  <option key={club.id} value={club.name}>
                    {club.name}
                  </option>
                ))}

                <option value="__new__">+ Add new club</option>
              </select>

              {clubChoice === "__new__" && (
                <input
                  type="text"
                  placeholder="New club name"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                />
              )}

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