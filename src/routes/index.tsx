import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  FaVolumeUp,
  FaVolumeMute,
  FaWhatsapp,
  FaDownload,
  FaShareAlt,
  FaArrowRight,
  FaPlay,
  FaTimes,
} from "react-icons/fa";
import { GiSpiderWeb, GiSpiderMask } from "react-icons/gi";
import { Ambient, WebShooter, SwingingSpiderMan, WebTransition } from "@/components/ambient";
import { useQR, downloadNode, shareNode, useHydrated, useKonami } from "@/lib/spider-utils";
import heroImg from "@/assets/hero-spiderman.jpg";
import spiderCardArt from "@/assets/spider-card.png";
import { toPng } from "html-to-image";
import Footer from "@/components/Footer";

const THEATRE_NAME = "PSR Cinemas";
const THEATRE_LOCATION = "Rayagada, Odisha";
const HALL_NO = "Hall 3";
const SCREEN_NO = "Screen 2";
const SHOWTIMES = ["10:30 AM", "1:45 PM", "4:30 PM", "7:15 PM"];
// Working royalty-free cinematic loop (mixkit CDN)
const MUSIC_URL = "/music/SSBG.mp3";
// Placeholder trailer video (swap once official BND trailer is released)
const TRAILER_VIDEO_ID = "Ke90Tje7VS0";

const SUITS = [
  {
    id: "original",
    name: "Original Spider-Man",
    desc: "The original friendly neighborhood Spider-Man.",
    power: 90,
    colors: ["#dc2626", "#1e40af"],
    image: "/suits/OG.jpg",
  },
  {
    id: "black",
    name: "Black Spider-Man",
    desc: "Black suit with enhanced abilities.",
    power: 96,
    colors: ["#111111", "#dc2626"],
    image: "/suits/SB.jpg",
  },
  {
    id: "spiderverse",
    name: "Spider-Verse",
    desc: "Across the Spider-Verse style.",
    power: 94,
    colors: ["#ff1744", "#2979ff"],
    image: "/suits/SV.jpg",
  },
  {
    id: "spiderwoman",
    name: "Spider-Woman",
    desc: "Spider-Woman joins the mission.",
    power: 92,
    colors: ["#d32f2f", "#facc15"],
    image: "/suits/SW.jpeg",
  },
];
type Suit = (typeof SUITS)[number];

const UNLOCK_SUITS = ["Raimi Classic", "Amazing Stealth", "Stark Nano Suit", "Prowler Suit"];

type Stage =
  | "loading"
  | "mission"
  | "accepted"
  | "movie"
  | "theatre"
  | "identity"
  | "suit"
  | "cards"
  | "ticket"
  | "complete";
export const Route = createFileRoute("/")({
  component: App,
});
function App() {
  const hydrated = useHydrated();
  const [stage, setStage] = useState<Stage>("loading");
  const [muted, setMuted] = useState(true);
  const [showWebTransition, setShowWebTransition] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [name, setName] = useState("");
  const [suit, setSuit] = useState<Suit>(SUITS[0]);
  const [time, setTime] = useState(SHOWTIMES[2]);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const bookingId = useMemo(() => `SM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, []);

  // Persist mute preference
  useEffect(() => {
    const saved = localStorage.getItem("sm-muted");
    if (saved !== null) setMuted(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sm-muted", muted ? "1" : "0");
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (!muted) el.play().catch(() => {});
  }, [muted]);

  useKonami(() => {
    setUnlocked(UNLOCK_SUITS[Math.floor(Math.random() * UNLOCK_SUITS.length)]);
    setTimeout(() => setUnlocked(null), 4200);
  });

  const vibrate = (pattern: number | number[] = 30) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  };

  const goto = (s: Stage) => {
    vibrate(20);
    setShowWebTransition(true);
    setTimeout(() => {
      setStage(s);
      setShowWebTransition(false);
    }, 700);
  };

  if (!hydrated) return <div className="min-h-[100dvh] bg-[#05060d]" />;

  return (
    <div
      className="relative min-h-[100dvh] text-white overflow-x-hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <Ambient />
      <WebShooter />

      {/* Background music */}
      <audio ref={audioRef} src={MUSIC_URL} loop preload="auto" />

      {/* Music toggle */}
      <button
        onClick={() => {
          setMuted((m) => !m);
          vibrate(15);
        }}
        className="fixed top-5 right-5 z-[70] glass h-12 w-12 rounded-full grid place-items-center active:scale-95 transition"
        style={{ marginTop: "env(safe-area-inset-top)" }}
        aria-label="Toggle sound"
      >
        {muted ? <FaVolumeMute /> : <FaVolumeUp className="text-spider-red" />}
      </button>

      <AnimatePresence>{showWebTransition && <WebTransition />}</AnimatePresence>
      <AnimatePresence>
        {trailerOpen && <TrailerModal onClose={() => setTrailerOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === "loading" && (
          <Loading
            key="loading"
            onDone={() => setStage("mission")}
            muted={muted}
            setMuted={setMuted}
          />
        )}
        {stage === "mission" && (
          <Mission
            key="mission"
            onAccept={() => goto("accepted")}
            onTrailer={() => setTrailerOpen(true)}
          />
        )}
        {stage === "accepted" && <Accepted key="accepted" onNext={() => goto("movie")} />}
        {stage === "movie" && (
          <Movie
            key="movie"
            onNext={() => goto("theatre")}
            onTrailer={() => setTrailerOpen(true)}
          />
        )}
        {stage === "theatre" && (
          <Theatre key="theatre" time={time} setTime={setTime} onNext={() => goto("identity")} />
        )}
        {stage === "identity" && (
          <Identity key="identity" name={name} setName={setName} onNext={() => goto("suit")} />
        )}
        {stage === "suit" && (
          <SuitPick key="suit" suit={suit} setSuit={setSuit} onNext={() => goto("cards")} />
        )}
        {stage === "cards" && (
          <Cards key="cards" name={name} suit={suit} onNext={() => goto("ticket")} />
        )}
        {stage === "ticket" && (
          <Ticket
            key="ticket"
            name={name}
            suit={suit}
            time={time}
            bookingId={bookingId}
            onNext={() => goto("complete")}
          />
        )}
        {stage === "complete" && <Complete key="complete" onRestart={() => setStage("mission")} />}
      </AnimatePresence>

      <AnimatePresence>
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] grid place-items-center bg-black/80 backdrop-blur-xl px-6"
          >
            <div className="text-center">
              <div className="text-spider-red text-glow-red text-xs tracking-[0.6em]">
                SPIDER SOCIETY
              </div>
              <div className="mt-3 font-display text-4xl md:text-7xl text-white text-glow-blue">
                SUIT UNLOCKED
              </div>
              <div className="mt-6 text-xl md:text-2xl text-white/90">{unlocked}</div>
              <GiSpiderMask className="mx-auto mt-8 text-7xl md:text-8xl text-spider-red animate-pulse-glow" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- LOADING ---------- */
function Loading({
  onDone,
  muted,
  setMuted,
}: {
  onDone: () => void;
  muted: boolean;
  setMuted: (b: boolean) => void;
}) {
  const steps = [
    "S.H.I.E.L.D Secure Access...",
    "Scanning Identity...",
    "Looking for Peter Parker...",
    "Searching Multiverse...",
    "Preparing Mission...",
    "Mission Ready.",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length - 1) {
      const t = setTimeout(onDone, 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI(i + 1), 700);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] grid place-items-center px-5"
    >
      <div className="text-center w-full max-w-md">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto mb-6"
        >
          <GiSpiderWeb className="mx-auto text-7xl sm:text-8xl text-spider-red animate-pulse-glow" />
        </motion.div>
        <div className="font-display tracking-[0.4em] text-[10px] sm:text-xs text-white/50 mb-3">
          S.H.I.E.L.D // CLASSIFIED
        </div>
        <div className="glass rounded-2xl px-5 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-display text-base sm:text-xl text-glow-blue"
            >
              {steps[i]}
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-spider-red to-spider-blue"
              initial={{ width: 0 }}
              animate={{ width: `${((i + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setMuted(!muted)}
          className="mt-6 glass px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
        >
          {muted ? <FaVolumeMute /> : <FaVolumeUp />} {muted ? "Enable Sound" : "Mute"}
        </button>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- MISSION ---------- */
function Mission({ onAccept, onTrailer }: { onAccept: () => void; onTrailer: () => void }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [msg, setMsg] = useState("");
  const funnies = [
    "Nice Try 😂",
    "Mission Failed",
    "Spider-Man is waiting",
    "Catch me first",
    "Not today",
  ];
  const escape = () => {
    setPos({ x: (Math.random() - 0.5) * 260, y: (Math.random() - 0.5) * 180 });
    setMsg(funnies[Math.floor(Math.random() * funnies.length)]);
  };
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] overflow-hidden"
    >
      {/* Cinematic hero background */}
      <motion.img
        src={heroImg}
        alt="Spider-Man overlooking the city at night"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: "easeOut" }}
        className="absolute inset-0 h-full w-full object-cover -z-[1]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black -z-[1]" />

      <div className="relative min-h-[100dvh] grid place-items-end sm:place-items-center px-5 pb-16 pt-24">
        <div className="text-center max-w-2xl w-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[10px] sm:text-xs tracking-[0.5em] text-spider-red text-glow-red mb-3"
          >
            TRANSMISSION INCOMING
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs tracking-[0.4em] text-white/70"
          >
            WELCOME TO
          </motion.div>
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-4xl sm:text-6xl leading-tight mt-2"
          >
            SPIDER-MAN <span className="text-spider-red text-glow-red">MISSION</span>
          </motion.h1>
          <p className="mt-5 text-base sm:text-lg text-white/85">
            You've been selected for a <span className="text-spider-red">classified mission</span>.
            <br />
            Ready to join?
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative min-h-[80px]">
            <motion.button
              onClick={onAccept}
              whileTap={{ scale: 0.96 }}
              className="glass glow-red px-8 py-4 rounded-full font-display tracking-widest text-lg bg-gradient-to-r from-spider-red/80 to-red-700/80 min-h-[52px] w-full sm:w-auto"
            >
              ACCEPT MISSION
            </motion.button>
            <motion.button
              onMouseEnter={escape}
              onTouchStart={escape}
              onClick={escape}
              animate={{ x: pos?.x ?? 0, y: pos?.y ?? 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 18 }}
              className="glass px-8 py-4 rounded-full font-display tracking-widest text-lg border-white/20 min-h-[52px] w-full sm:w-auto"
            >
              DECLINE
            </motion.button>
          </div>
          <div className="mt-6"></div>
          <AnimatePresence>
            {msg && (
              <motion.div
                key={msg + Math.random()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 text-spider-blue text-glow-blue font-display"
              >
                {msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- ACCEPTED ---------- */
function Accepted({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([40, 30, 60]);
    [0, 300, 600].forEach((d) =>
      setTimeout(
        () =>
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#dc2626", "#1e40af", "#ffffff"],
          }),
        d,
      ),
    );
  }, []);
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] grid place-items-center px-5 overflow-hidden"
    >
      <SwingingSpiderMan />
      <div className="text-center max-w-3xl relative z-10">
        <div className="text-xs tracking-[0.5em] text-spider-blue text-glow-blue mb-3">STATUS</div>
        <motion.h1
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="font-display text-4xl sm:text-7xl text-glow-red"
        >
          MISSION ACCEPTED
        </motion.h1>
        <div className="mt-4 space-y-1 font-display text-sm sm:text-base text-white/70 tracking-widest">
          <div>ACCESS GRANTED</div>
          <div>SCANNING...</div>
          <div className="text-spider-blue text-glow-blue">MISSION READY</div>
        </div>
        <p className="mt-6 text-white/80 text-lg">Let's Go Watch</p>
        <div className="mt-2 font-display text-2xl sm:text-5xl bg-gradient-to-r from-spider-red via-white to-spider-blue bg-clip-text text-transparent">
          Spider-Man: Brand New Day
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="mt-10 glass glow-blue h-16 w-16 rounded-full grid place-items-center mx-auto"
        >
          <FaArrowRight className="text-2xl" />
        </motion.button>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- MOVIE ---------- */
function Movie({ onNext, onTrailer }: { onNext: () => void; onTrailer: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] grid place-items-center px-5 py-12"
    >
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ rotateY: -30, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="glass rounded-3xl aspect-[2/3] relative overflow-hidden mx-auto w-full max-w-sm"
        >
          <img
            src={heroImg}
            alt="Spider-Man poster"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <div className="text-[10px] tracking-[0.4em] text-white/70">MARVEL STUDIOS</div>
            <div className="font-display text-2xl sm:text-4xl leading-tight text-glow-red">
              SPIDER-MAN
            </div>
            <div className="font-display text-lg sm:text-2xl text-white/90">Brand New Day</div>
            <div className="mt-3 text-[10px] tracking-[0.3em] text-white/60">
              IN THEATRES · 30 July 2026
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-holo-shine" />
        </motion.div>
        <div className="text-center md:text-left">
          <div className="text-xs tracking-[0.5em] text-spider-red text-glow-red">NOW PLAYING</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl">A new chapter begins.</h2>
          <p className="mt-4 text-white/70">
            The multiverse is fractured. New York needs its hero. Peter Parker must rise again — as
            someone the world has never seen.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => window.open("https://www.youtube.com/watch?v=E1kipafZW2I", "_blank")}
              className="glass glow-red px-6 py-3 rounded-full inline-flex items-center justify-center gap-2 font-display tracking-widest min-h-[48px]"
            >
              <FaPlay /> WATCH TRAILER
            </button>

            <button
              onClick={onNext}
              className="glass glow-blue px-6 py-3 rounded-full inline-flex items-center justify-center gap-2 font-display tracking-widest min-h-[48px]"
            >
              CONTINUE <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- THEATRE ---------- */
function Theatre({
  time,
  setTime,
  onNext,
}: {
  time: string;
  setTime: (t: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] grid place-items-center px-5 py-12"
    >
      <div className="w-full max-w-2xl">
        <div className="text-xs tracking-[0.5em] text-spider-blue text-glow-blue text-center">
          SELECT SHOWTIME
        </div>
        <div className="glass rounded-3xl p-6 sm:p-8 mt-4 text-center">
          <div className="text-white/60 text-sm">Location</div>
          <div className="font-display text-xl sm:text-2xl">{THEATRE_LOCATION}</div>
          <div className="mt-4 text-white/60 text-sm">Cinema</div>
          <div className="font-display text-2xl sm:text-3xl text-glow-red">{THEATRE_NAME}</div>
          <div className="mt-3 flex justify-center gap-4 text-xs text-white/70 font-display tracking-widest">
            <span>{HALL_NO}</span>
            <span>·</span>
            <span>{SCREEN_NO}</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {SHOWTIMES.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`glass rounded-xl py-4 font-display tracking-wider transition min-h-[52px] ${
                  time === t ? "glow-red bg-spider-red/30 border-spider-red" : "active:scale-95"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={onNext}
            className="glass glow-blue px-8 py-4 rounded-full font-display tracking-widest inline-flex items-center gap-2 min-h-[52px]"
          >
            CONTINUE <FaArrowRight />
          </button>
        </div>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- IDENTITY ---------- */
function Identity({
  name,
  setName,
  onNext,
}: {
  name: string;
  setName: (n: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] grid place-items-center px-5"
    >
      <div className="w-full max-w-lg glass rounded-3xl p-6 sm:p-8 text-center">
        <GiSpiderMask className="mx-auto text-6xl text-spider-red animate-pulse-glow" />
        <div className="mt-3 text-[10px] sm:text-xs tracking-[0.4em] text-white/60">
          SPIDER IDENTITY
        </div>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">Enter Your Name</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Agent Name"
          className="mt-6 w-full bg-black/40 border border-white/20 rounded-xl px-4 py-4 text-center font-display text-xl tracking-widest focus:outline-none focus:border-spider-red focus:glow-red min-h-[52px]"
        />
        <button
          disabled={!name.trim()}
          onClick={onNext}
          className="mt-6 w-full glass glow-red px-6 py-4 rounded-full font-display tracking-widest disabled:opacity-40 min-h-[52px]"
        >
          CONTINUE <FaArrowRight className="inline ml-2" />
        </button>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- SUIT ---------- */
function SuitPick({
  suit,
  setSuit,
  onNext,
}: {
  suit: Suit;
  setSuit: (s: Suit) => void;
  onNext: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] px-5 py-12"
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center">
          <div className="text-[10px] sm:text-xs tracking-[0.4em] text-spider-blue text-glow-blue">
            ARMORY
          </div>
          <h2 className="font-display text-3xl sm:text-4xl mt-1">Choose Your Spider Suit</h2>
          <p className="text-white/60 text-sm mt-2">Tap a suit to equip</p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SUITS.map((s) => {
            const active = suit.id === s.id;
            return (
              <motion.button
                key={s.id}
                onClick={() => {
                  setSuit(s);
                  if ("vibrate" in navigator) navigator.vibrate(20);
                }}
                whileTap={{ scale: 0.96 }}
                className={`glass rounded-2xl p-3 text-left transition relative overflow-hidden ${
                  active ? "glow-red ring-2 ring-spider-red" : ""
                }`}
              >
                <div className="aspect-[3/4] rounded-xl mb-3 relative overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <div>
                      <div className="font-display text-white text-sm">{s.name}</div>
                      <div className="text-[10px] text-white/80">POWER {s.power}</div>
                    </div>

                    {active && (
                      <div className="bg-spider-red text-white text-[10px] px-2 py-1 rounded-full font-display">
                        EQUIPPED
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-display text-sm leading-tight">{s.name}</div>
                <div className="text-[11px] text-white/60 mt-1 line-clamp-2">{s.desc}</div>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <button
            onClick={onNext}
            className="glass glow-red px-8 py-4 rounded-full font-display tracking-widest inline-flex items-center gap-2 min-h-[52px]"
          >
            EQUIP {suit.name.toUpperCase()} <FaArrowRight />
          </button>
        </div>
      </div>
      <Footer />
    </motion.section>
  );
}

/* ---------- CARDS ---------- */

function Cards({ name, suit, onNext }: { name: string; suit: Suit; onNext: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const idNumber = useMemo(() => `SS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, []);
  const partnerName = "Chinmaya";
  const partnerId = useMemo(() => `SS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, []);
  const qr = useQR(`SPIDER-SOCIETY::AGENT::${name}::${suit.id}::${idNumber}`);

  const capture = async () => {
    if (!cardRef.current) return null;
    return await toPng(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#05060d",
    });
  };
  const handleDownload = async () => {
    const url = await capture();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `spider-id-${name || "agent"}.png`;
    a.click();
  };
  const handleShare = async () => {
    const url = await capture();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `spider-id-${name || "agent"}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          text: "I'm a Spider Society Mission Partner! 🕷️",
          title: "Spider Society",
        });
        return;
      }
    } catch {
      /* fall through */
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `spider-id-${name || "agent"}.png`;
    a.click();
  };
  const handleWhatsApp = () => {
    const phone = "919827757077";
    const text = encodeURIComponent("🕷️ Check out my Spider Society ID Card!");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `https://wa.me/${phone}?text=${text}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${text}`, "_blank");
    }
  };

  // Fixed 1000x650 card. Scale down for smaller viewports via CSS transform
  // so the capture always renders at native resolution.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      const w = Math.min(window.innerWidth - 24, 1000);
      setScale(Math.min(1, w / 1000));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const RED = "#e11d2a";
  const BLUE = "#1a56db";
  const INK = "#0a0a10";

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] px-3 py-10"
    >
      <div className="max-w-[1040px] mx-auto">
        <div className="text-center mb-6">
          <div className="text-[10px] sm:text-xs tracking-[0.4em] text-spider-red text-glow-red">
            DOSSIER GENERATED
          </div>
          <h2 className="font-display text-3xl sm:text-4xl mt-1">Spider Society ID</h2>
        </div>

        {/* Scaling wrapper keeps capture at 1000x650 */}
        <div className="mx-auto" style={{ width: 1000 * scale, height: 650 * scale }}>
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: 1000,
              height: 650,
            }}
          >
            <motion.div
              ref={cardRef}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                width: 1000,
                height: 650,
                background: INK,
                color: "#fff",
                borderRadius: 24,
                overflow: "hidden",
                display: "flex",
                fontFamily: "'Rajdhani', system-ui, sans-serif",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
                border: `2px solid ${RED}`,
              }}
            >
              {/* LEFT — artwork */}
              <div style={{ width: "35%", position: "relative", background: "#000" }}>
                <img
                  src={suit.image}
                  alt="Spider-Man"
                  crossOrigin="anonymous"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "left center",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(90deg, rgba(0,0,0,0) 60%, ${INK} 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    bottom: 16,
                    padding: "4px 10px",
                    background: RED,
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    letterSpacing: 2,
                    fontSize: 14,
                    borderRadius: 2,
                  }}
                >
                  MARVEL
                </div>
              </div>

              {/* RIGHT — details */}
              <div
                style={{
                  width: "65%",
                  position: "relative",
                  padding: "28px 32px",
                  background: `radial-gradient(120% 80% at 100% 0%, ${RED}22, transparent 60%), radial-gradient(120% 80% at 0% 100%, ${BLUE}22, transparent 60%), ${INK}`,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Top bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 34,
                        fontWeight: 900,
                        letterSpacing: 4,
                        lineHeight: 1,
                        color: "#fff",
                      }}
                    >
                      SPIDER <span style={{ color: RED }}>SOCIETY</span>
                    </div>
                    <div
                      style={{ marginTop: 8, fontSize: 11, letterSpacing: 6, color: "#ffffffaa" }}
                    >
                      CLASSIFIED ACCESS · LEVEL 07
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      border: `1px solid ${RED}`,
                      color: RED,
                      fontSize: 10,
                      letterSpacing: 4,
                      fontWeight: 700,
                      borderRadius: 2,
                    }}
                  >
                    ACTIVE
                  </div>
                </div>

                <div
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, ${RED}, ${BLUE}, transparent)`,
                    marginTop: 18,
                  }}
                />

                {/* Fields grid */}
                <div
                  style={{
                    marginTop: 22,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: 24,
                    rowGap: 16,
                    flex: 1,
                  }}
                >
                  <Field label="AGENT NAME" value={name || "Agent"} accent={RED} big />
                  <Field label="SPIDER ID" value={idNumber} accent={BLUE} />
                  <Field label="UNIVERSE" value="Earth-616" accent={BLUE} />
                  <Field label="SUIT" value={suit.name} accent={RED} />
                  <div>
                    <div style={labelStyle}>MISSION LEVEL</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#fff",
                        }}
                      >
                        {suit.power}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: "#ffffff18",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${suit.power}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${RED}, ${BLUE})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <Field label="PARTNER" value={partnerName} sub={partnerId} accent={BLUE} />
                </div>

                {/* Bottom row: status labels + QR */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        background: RED,
                        color: "#fff",
                        fontFamily: "var(--font-display)",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: 3,
                        borderRadius: 2,
                        width: "fit-content",
                      }}
                    >
                      <span
                        style={{ width: 8, height: 8, background: "#fff", borderRadius: 999 }}
                      />
                      MISSION ACCEPTED
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        background: "#ffffff10",
                        border: `1px solid ${BLUE}`,
                        color: "#fff",
                        fontFamily: "var(--font-display)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 3,
                        borderRadius: 2,
                        width: "fit-content",
                      }}
                    >
                      ACCESS GRANTED
                    </div>
                    <div
                      style={{ fontSize: 10, letterSpacing: 3, color: "#ffffff70", marginTop: 4 }}
                    >
                      © MARVEL · SPIDER SOCIETY DIVISION
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#fff",
                      padding: 8,
                      borderRadius: 8,
                      border: `2px solid ${RED}`,
                    }}
                  >
                    {qr ? (
                      <img src={qr} alt="qr" style={{ width: 96, height: 96, display: "block" }} />
                    ) : (
                      <div style={{ width: 96, height: 96 }} />
                    )}
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: 4,
                        fontSize: 8,
                        letterSpacing: 2,
                        color: INK,
                        fontWeight: 700,
                      }}
                    >
                      SCAN · VERIFY
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleDownload}
            className="glass glow-red px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
          >
            <FaDownload /> Download PNG
          </button>
          <button
            onClick={handleShare}
            className="glass px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
          >
            <FaShareAlt /> Share
          </button>
          <button
            onClick={handleWhatsApp}
            className="glass px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
          >
            <FaWhatsapp className="text-emerald-400" /> WhatsApp
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onNext}
            className="glass glow-blue px-8 py-4 rounded-full font-display tracking-widest inline-flex items-center gap-2 min-h-[52px]"
          >
            GET YOUR TICKET <FaArrowRight />
          </button>
        </div>
      </div>
      <Footer />
    </motion.section>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: 3,
  color: "#ffffff85",
  fontWeight: 600,
};
function Field({
  label,
  value,
  sub,
  accent,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  big?: boolean;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: big ? 26 : 18,
          fontWeight: 800,
          color: "#fff",
          marginTop: 4,
          borderLeft: `3px solid ${accent}`,
          paddingLeft: 8,
          lineHeight: 1.15,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "#ffffff70", marginTop: 2, paddingLeft: 11 }}>{sub}</div>
      )}
    </div>
  );
}

/* ---------- TICKET ---------- */
function Ticket({
  name,
  suit,
  time,
  bookingId,
  onNext,
}: {
  name: string;
  suit: Suit;
  time: string;
  bookingId: string;
  onNext: () => void;
}) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const qr = useQR(`TICKET::${bookingId}::${name}::${time}::A12,A13`);
  const releaseDate = "30 July 2026";

  const RED = "#e11d2a";
  const BLUE = "#1a56db";
  const INK = "#0a0a10";

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      const w = Math.min(window.innerWidth - 24, 1000);
      setScale(Math.min(1, w / 1000));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const capture = async () => {
    if (!ticketRef.current) return null;
    return await toPng(ticketRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#05060d",
    });
  };
  const handleDownload = async () => {
    const url = await capture();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `spider-ticket-${bookingId}.png`;
    a.click();
  };
  const handleShare = async () => {
    const url = await capture();
    if (!url) return;
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `spider-ticket-${bookingId}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          text: "I'm watching Spider-Man: Brand New Day! 🕷️",
          title: "Spider Society",
        });
        return;
      }
    } catch {
      /* fall through */
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `spider-ticket-${bookingId}.png`;
    a.click();
  };
  const handleWhatsApp = () => {
    const phone = "919827757077";

    const text = encodeURIComponent("🕷️ Check out my Spider Society Movie Ticket!");

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `https://wa.me/${phone}?text=${text}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${text}`, "_blank");
    }
  };

  const H = 420;
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] px-3 py-10"
    >
      <div className="max-w-[1040px] mx-auto">
        <div className="text-center mb-6">
          <div className="text-[10px] sm:text-xs tracking-[0.4em] text-spider-red text-glow-red">
            BOARDING PASS
          </div>
          <h2 className="font-display text-3xl sm:text-4xl mt-1">Your Movie Ticket</h2>
        </div>

        <div className="mx-auto" style={{ width: 1000 * scale, height: H * scale }}>
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: 1000,
              height: H,
            }}
          >
            <motion.div
              ref={ticketRef}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                width: 1000,
                height: H,
                display: "flex",
                fontFamily: "'Rajdhani', system-ui, sans-serif",
                color: "#fff",
                filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
              }}
            >
              {/* LEFT STUB — art + vertical brand */}
              <div
                style={{
                  width: 260,
                  position: "relative",
                  background: "#000",
                  borderTopLeftRadius: 24,
                  borderBottomLeftRadius: 24,
                  overflow: "hidden",
                  border: `2px solid ${RED}`,
                  borderRight: "none",
                }}
              >
                <img
                  src={spiderCardArt}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), linear-gradient(90deg, transparent 60%, ${INK} 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    padding: "4px 10px",
                    background: RED,
                    color: "#fff",
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    letterSpacing: 2,
                    fontSize: 13,
                    borderRadius: 2,
                  }}
                >
                  MARVEL
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: 3,
                      lineHeight: 1,
                      textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                    }}
                  >
                    SPIDER-MAN
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 14,
                      letterSpacing: 4,
                      color: "#ffffffcc",
                      marginTop: 4,
                    }}
                  >
                    BRAND NEW DAY
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 60,
                    right: 10,
                    transform: "rotate(90deg)",
                    transformOrigin: "right top",
                    fontSize: 10,
                    letterSpacing: 8,
                    color: "#ffffff88",
                    fontWeight: 700,
                  }}
                >
                  ADMIT ONE · SPIDER SOCIETY
                </div>
              </div>

              {/* PERFORATION */}
              <div style={{ position: "relative", width: 0 }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: -1,
                    borderLeft: "2px dashed #ffffff40",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: -14,
                    width: 26,
                    height: 26,
                    background: "#05060d",
                    borderRadius: "50%",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -14,
                    left: -14,
                    width: 26,
                    height: 26,
                    background: "#05060d",
                    borderRadius: "50%",
                  }}
                />
              </div>

              {/* MAIN */}
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  padding: "24px 28px",
                  background: `radial-gradient(120% 80% at 100% 0%, ${RED}22, transparent 60%), radial-gradient(120% 80% at 0% 100%, ${BLUE}22, transparent 60%), ${INK}`,
                  border: `2px solid ${RED}`,
                  borderLeft: "none",
                  borderRight: "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Top strip */}
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div
                    style={{ fontSize: 10, letterSpacing: 5, color: "#ffffffaa", fontWeight: 700 }}
                  >
                    MARVEL STUDIOS · CINEMA TICKET
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      border: `1px solid ${BLUE}`,
                      color: "#fff",
                      background: `${BLUE}22`,
                      fontSize: 10,
                      letterSpacing: 3,
                      fontWeight: 700,
                      borderRadius: 2,
                    }}
                  >
                    CONFIRMED
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 30,
                    fontWeight: 900,
                    letterSpacing: 3,
                    marginTop: 10,
                    lineHeight: 1,
                  }}
                >
                  SPIDER-<span style={{ color: RED }}>MAN</span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    letterSpacing: 4,
                    color: "#ffffffcc",
                    marginTop: 4,
                  }}
                >
                  BRAND NEW DAY
                </div>

                <div
                  style={{
                    height: 2,
                    background: `linear-gradient(90deg, ${RED}, ${BLUE}, transparent)`,
                    marginTop: 14,
                  }}
                />

                {/* Fields */}
                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                    columnGap: 18,
                    rowGap: 14,
                    flex: 1,
                  }}
                >
                  <TField label="CINEMA" value={THEATRE_NAME} sub={THEATRE_LOCATION} accent={RED} />
                  <TField label="DATE" value={releaseDate} accent={BLUE} />
                  <TField label="TIME" value={time} accent={BLUE} />
                  <TField label="SCREEN" value={SCREEN_NO} sub={HALL_NO} accent={RED} />
                  <TField label="AGENT" value={name || "Agent"} accent={RED} />
                  <TField label="SUIT" value={suit.name} accent={BLUE} />
                  <TField label="SEATS" value="A12 · A13" accent={RED} />
                  <TField label="CLASS" value="RECLINER" accent={BLUE} />
                </div>
              </div>

              {/* RIGHT STUB — QR */}
              <div
                style={{
                  width: 200,
                  position: "relative",
                  borderTopRightRadius: 24,
                  borderBottomRightRadius: 24,
                  border: `2px solid ${RED}`,
                  borderLeft: "none",
                  background: `linear-gradient(180deg, ${INK}, #14141c)`,
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: 9, letterSpacing: 4, color: "#ffffff88", fontWeight: 700 }}
                  >
                    ADMIT ONE
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: 2,
                      color: "#fff",
                    }}
                  >
                    × 2
                  </div>
                </div>

                <div
                  style={{
                    background: "#fff",
                    padding: 6,
                    borderRadius: 8,
                    border: `2px solid ${RED}`,
                  }}
                >
                  {qr ? (
                    <img src={qr} alt="qr" style={{ width: 130, height: 130, display: "block" }} />
                  ) : (
                    <div style={{ width: 130, height: 130 }} />
                  )}
                </div>

                <div style={{ textAlign: "center", width: "100%" }}>
                  <div
                    style={{ fontSize: 9, letterSpacing: 3, color: "#ffffff70", fontWeight: 700 }}
                  >
                    BOOKING ID
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: "#fff",
                      marginTop: 2,
                    }}
                  >
                    {bookingId}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      padding: "4px 8px",
                      background: RED,
                      color: "#fff",
                      fontSize: 9,
                      letterSpacing: 3,
                      fontWeight: 800,
                      borderRadius: 2,
                      display: "inline-block",
                    }}
                  >
                    MISSION ACCEPTED
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleDownload}
            className="glass glow-red px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
          >
            <FaDownload /> Download Ticket
          </button>
          <button
            onClick={handleWhatsApp}
            className="glass px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
          >
            <FaWhatsapp className="text-emerald-400" />
            WhatsApp
          </button>
          <button
            onClick={handleShare}
            className="glass px-5 py-3 rounded-full text-sm inline-flex items-center gap-2 min-h-[48px]"
          >
            <FaShareAlt /> Share
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onNext}
            className="glass glow-blue px-8 py-4 rounded-full font-display tracking-widest inline-flex items-center gap-2 min-h-[52px]"
          >
            COMPLETE MISSION <FaArrowRight />
          </button>
        </div>
      </div>
      <Footer />
    </motion.section>
  );
}

function TField({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: "#ffffff85", fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 800,
          color: "#fff",
          marginTop: 4,
          borderLeft: `3px solid ${accent}`,
          paddingLeft: 8,
          lineHeight: 1.15,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 9,
            color: "#ffffff70",
            marginTop: 2,
            paddingLeft: 11,
            letterSpacing: 1,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ---------- COMPLETE ---------- */
function Complete({ onRestart }: { onRestart: () => void }) {
  useEffect(() => {
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.6 },
      colors: ["#dc2626", "#1e40af", "#ffffff"],
    });
    if ("vibrate" in navigator) navigator.vibrate([60, 40, 60, 40, 120]);
  }, []);
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100dvh] grid place-items-center px-5 overflow-hidden"
    >
      <SwingingSpiderMan />
      <div className="text-center relative z-10">
        <motion.h1
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="font-display text-4xl sm:text-7xl text-glow-red"
        >
          MISSION COMPLETE
        </motion.h1>
        <p className="mt-6 text-lg sm:text-xl text-white/80">Welcome to the Spider Society.</p>
        <p className="mt-1 text-base sm:text-lg text-white/60">Enjoy the Movie!</p>
        <GiSpiderMask className="mx-auto mt-8 text-7xl sm:text-8xl text-spider-red animate-pulse-glow" />
        <button
          onClick={onRestart}
          className="mt-10 glass glow-blue px-8 py-4 rounded-full font-display tracking-widest min-h-[52px]"
        >
          RESTART MISSION
        </button>
      </div>
      <Footer />
    </motion.section>
  );
}
