"use client";

import { useState } from "react";

import { sleep } from "./util";
import { createGameConnection, GameConnection } from "./gameManager";
import { MatchState } from "./api/match/state";
import { TurnstileModal } from "./components/TurnstileModal";

import LandingStage from "./stages/LandingStage";
import GameStage from "./stages/GameStage";

export default function Home() {
  const [game, setGame] = useState<GameConnection | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  const [landingVisible, setLandingVisible] = useState(true);
  const [gameVisible, setGameVisible] = useState(false);

  const [showTurnstile, setShowTurnstile] = useState(false);

  function handleStartClick() {
    setShowTurnstile(true);
  }

  async function handleTurnstileVerified(token: string) {
    setShowTurnstile(false);
    setLandingVisible(false);

    await sleep(250);

    setGameVisible(true);

    setGame(await createGameConnection(token, match => {
      setMatchState(match);
    }));
  }

  return (
    <div>
      <TurnstileModal isOpen={showTurnstile} onVerify={handleTurnstileVerified} />

      <LandingStage visible={landingVisible} onStart={handleStartClick} />
      <GameStage visible={gameVisible} game={game} matchState={matchState} />

      { /* background grid */ }
      <div
        className="absolute -z-10 inset-0 h-full w-full bg-[#f9c19c] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
      />
    </div>
  );
}
