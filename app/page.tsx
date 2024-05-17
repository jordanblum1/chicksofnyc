'use client';
import Image from "next/image";
import MenuBar from "./components/MenuBar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <MenuBar />
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/chicks-of-nyc-logo.png"
          alt="NYC Chicks Logo"
          width={400}
          height={400}
          priority
        />
      </div>
      <div className="w-full max-w-3xl">
        <iframe
          src="https://www.google.com/maps/d/u/0/embed?mid=13UCUpt_uJToGhcRjSQltSAbXV9zNDWg&ehbc=2E312F"
          width="640"
          height="480"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </main>
  );
}
