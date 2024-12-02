import { useEffect, useState } from "react";
import { MatchState } from "../api/match/state";
import { GameConnection } from "../gameManager";
import Confetti from 'react-confetti'

import data from '@emoji-mart/data/sets/15/twitter.json'
import Picker from '@emoji-mart/react'
import { EmojiData } from "../emojiMartAugments";
import { Spinner } from "../components/Spinner";
import { last, withLast } from "../util";
import { Link } from "../components/Link";
import { EMOJI_TIMER_SECS } from "../game";
import { Button } from "../components/Button";

const emojiAnimationFrames = ["🤔", "🤓", "🗿", "🍷", "🐈", "💡", "🥞", "😵‍💫", "💀", "😭"];

export default function GameStage({ game, visible, matchState }: {
  game: GameConnection | null,
  visible: boolean,
  matchState: MatchState | null
}) {
  const [emojiAnimFrame, setEmojiAnimFrame] = useState<number>(0);
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null);
  const [prevHistoryLength, setPrevHistoryLength] = useState(-1);
  const [lastPickedAt, setLastPickedAt] = useState(new Date());

  const ourDisplayEmoji = matchState == null || matchState.state !== "ENDED"
    ? currentEmoji
    : matchState.history.length != 0
      ? last(matchState.history).you
      : null;

  useEffect(() => {
    const id = setInterval(() => {
      setEmojiAnimFrame(x => (x + 1) % emojiAnimationFrames.length);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (matchState === null || matchState.state !== "ONGOING")
      return;

    if (prevHistoryLength != matchState.history.length) {
      setPrevHistoryLength(matchState.history.length);
      setCurrentEmoji(null);
      setLastPickedAt(new Date());
    }
  }, [matchState]);

  async function handleEmojiSelect(emoji: EmojiData) {
    if (game === null || matchState === null)
      throw new Error("Attempted to call handleEmojiSelect while game or matchState is null");

    if (matchState.state !== "ONGOING")
      throw new Error(`Can only select emojis while the match is ONGOING, not ${matchState.state}.`);

    for (const historyEntry of matchState.history) {
      if (historyEntry.you === emoji.native) {
        alert("😵‍💫 Sorry, you already picked that emoji before!");
        return;
      } else if (historyEntry.partner === emoji.native) {
        alert("😵‍💫 Sorry, the other player already picked that emoji before!");
        return;
      }
    }

    console.log(`[game] submitting pick: ${emoji.native}`);
    setCurrentEmoji(emoji.native);

    try {
      await game.submitPick(emoji.native);
    } catch (err) {
      setCurrentEmoji(null);

      if (err instanceof Error) {
        alert(`Sorry, we couldn't submit your move! ${err.message}`);
      } else {
        console.error("An unknown error occured while submitting an emoji pick.", err);
        alert(`Sorry, we couldn't submit your move! ${err}`);
      }
    }
  }

  const displayHistory = matchState == null
    ? []
    : matchState.state === "ENDED"
      ? matchState.history.slice(0, -1).toReversed()
      : matchState.state === "ONGOING"
        ? matchState.history.toReversed()
        : [];

  const didWin =
    matchState?.state === "ENDED"
    && matchState.history.length != 0 && withLast(matchState.history, x => x.partner == x.you);

  return (
    <section className={`${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'} flex flex-col ${matchState?.state === "MATCHMAKING" ? "md:justify-center" : ""} p-8 py-0 w-full h-full transition-opacity duration-500 absolute top-0 left-0`}>
      {
        matchState === null || game === null || matchState.state === "MATCHMAKING"
        ? (
          <div className="md:px-64 my-auto">
            <main className="flex flex-col gap-4 w-full text-center justify-center bg-[#ffe2b6] rounded-lg px-16 py-16 drop-shadow-sm">
              <Spinner width="48px" height="48px"/>
             
              <h1 className="font-bold text-lg">Looking for another player...</h1>
              <div className="text-3xl">{emojiAnimationFrames[emojiAnimFrame]}</div>
            </main>
          </div>
        )
        : matchState.state === "ONGOING" || matchState.state === "ENDED"
        ? (
          <main className="flex flex-col-reverse items-center md:items-start md:flex-row gap-16 pt-8 md:pt-16 md:px-16">
            <div className={matchState.state == "ENDED" || currentEmoji != null ? "grayscale pointer-events-none" : ""}>
              <Picker
                data={data} set="twitter"
                onEmojiSelect={handleEmojiSelect}
                noCountryFlags={true /* for some reason, emoji mart doesn't listen to us with this */} 
                skinTonePosition="none"
              />
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <section className="flex w-full place-content-between">
                <div className="flex flex-col gap-2 items-center">
                  <p className="font-bold">your choice:</p>

                  <div className="bg-[#ffe2b6] rounded-lg p-4 shadow-sm w-24 h-24">
                    <div className={ourDisplayEmoji == null ? "opacity-30 grayscale" : ""}>
                      <em-emoji set="twitter" id={ourDisplayEmoji ?? "dotted_line_face"} size="4em"/>
                    </div>
                  </div>
                </div>

                <section className="flex flex-col text-center gap-2">
                  <p className="font-bold">time left (for this round):</p>
                  
                  <p className="font-bold text-4xl">
                    { didWin ? "🥳" : Math.max(0, EMOJI_TIMER_SECS - Math.floor((new Date().getTime() - lastPickedAt.getTime()) / 1000))}
                  </p>
                </section>

                <div className="flex flex-col gap-2 items-center">
                  <p className="font-bold">other player's choice:</p>

                  <div className="bg-[#ffe2b6] rounded-lg p-4 shadow-sm w-24 h-24 flex justify-center items-center">
                    {
                      matchState.state === "ONGOING"
                      ? (
                        matchState.partnerPicked
                        ? <div className="grayscale opacity-50"><em-emoji set="twitter" id={"white_check_mark"} size="3em"/></div>
                        : <Spinner width="48px" height="48px"/>
                      )
                      : (
                        <em-emoji set="twitter" id={matchState.history.length != 0 ? last(matchState.history).partner : "🤷"} size="4em"/>
                      )
                    }
                  </div>
                </div>
              </section>

              <section className="flex gap-2 pl-2 pr-10 w-full place-content-between">
                <div className="flex flex-col min-w-20 gap-4 bg-[#ffe2b6] p-4 rounded-lg">
                  { displayHistory.map(x =>
                    <div key={x.you}>
                      <em-emoji set="twitter" id={x.you} size="3em"/>
                    </div>
                  ) }
                </div>

                <div className="flex flex-col min-w-20 gap-4 bg-[#ffe2b6] p-4 rounded-lg">
                  { displayHistory.map(x =>
                    <div key={x.partner}>
                      <em-emoji set="twitter" id={x.partner} size="3em"/>
                    </div>
                  ) }
                </div>
              </section>
            </div>

          </main>
        )
        : <div className="md:px-64 my-auto">
          <main className="flex flex-col gap-4 w-full text-center justify-center bg-[#ffe2b6] rounded-lg px-16 py-16 drop-shadow-sm">
            <div className="text-3xl">{emojiAnimationFrames[emojiAnimFrame]}</div>
            <h1 className="font-bold text-lg">Whoops...</h1>
            <p>
              Looks like the other player left the match, sorry!<br/>
              Click <Link href="/" content="here"/> to join a match with another player!
            </p>
          </main>
        </div>
      }

      <div className={`${matchState?.state !== "ENDED" ? "opacity-0 pointer-events-none" : "opacity-100" } transition-opacity fixed left-16 bottom-16 bg-[#fffde4] p-8 rounded-lg`}>
        <h1 className="font-bold text-xl uppercase">{ didWin ? "You won!" : "You lost!" }</h1>
        <p className="font-bold text-[#cf9889] mb-4">
          {
            didWin
            ? (<>Nice, you both picked the same emoji! 🥳<br/></>)
            : (<>Oops, you couldn't find the same emoji in time... 😣<br/></>)
          }
        </p>

        <Button
          content="Play again!"
          className="w-full"
          onClick={() => location.href = "/"}
        />
      </div>

      { didWin ? <Confetti style={{ position: "fixed" }}/> : <></> }
    </section>
  );
}