"use client";

import Image from "next/image";
import { Button } from "../components/Button";
import { Link } from "../components/Link";

export default function LandingStage({ visible, onStart }: {
    visible: boolean,
    onStart: () => void
}) {
  return (
    <section className={`${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'} p-8 py-0 w-full transition-opacity duration-500 absolute top-0 left-0`}>
      <main className="w-full md:p-16 py-8 flex flex-col md:flex-row gap-4">
        <div className="flex flex-col gap-8 w-full md:w-1/2 justify-center bg-[#ffe2b6] rounded-lg p-16 drop-shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 w-full items-center">
            <div>
              <Image
                src="/thinking.svg"
                alt="🤔"
                width={128} height={128}
                className="drop-shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-5xl font-bold">emoji telepathy</h1>
              <p className="font-bold">try to guess and hone in on a single emoji with a total stranger in as few rounds as possible!</p>
            </div>
          </div>

          <Button content="Start!" onClick={onStart}/>
        </div>

        <div className="flex flex-col gap-8 w-full md:w-1/2 justify-center bg-[#ffe2b6] rounded-lg p-8 drop-shadow-sm">
          <video src="/guide.mp4" loop muted autoPlay
            className="border-dotted border-2 border-[#88352e69] rounded-lg"
          />
        </div>
      </main>

      <footer className="w-full font-bold flex flex-col items-center gap-4 pb-16">
        <p>see the source code at <Link href="https://github.com/ascpixi/emoji-telepathy" content="github.com/ascpixi/emoji-telepathy"/></p><br/>
        <p>created with 🧡 by <Link href="https://ascpixi.dev" content="@ascpixi" newTab={true}/> for</p>
        <a href="https://highseas.hackclub.com/" target="_blank">
          <Image
            src="/highlogo.svg"
            alt="Hack Club High Seas"
            width={951 * 0.25} height={546 * 0.25}
            className="drop-shadow-sm"
          />
        </a>
      </footer>
    </section>
  );
}
