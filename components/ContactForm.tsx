"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const CONTACT_EMAIL = "shahzaibzafar093@gmail.com";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General question");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `[Free Construction Tools] ${topic}`;
    const body = `Name: ${name}\nReply-to: ${email}\n\n${message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  const inputCls =
    "w-full h-11 px-3 border border-zinc-200 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm bg-white text-zinc-900 placeholder-zinc-400 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-900 mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-zinc-900 mb-1.5">
          Topic
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={inputCls}
        >
          <option>General question</option>
          <option>Suggest a calculator</option>
          <option>Report an incorrect result</option>
          <option>Advertising / partnership</option>
          <option>Privacy request</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-zinc-900 mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          required
          rows={6}
          className="w-full px-3 py-2.5 border border-zinc-200 rounded-md focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm bg-white text-zinc-900 placeholder-zinc-400 transition-colors resize-y"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-zinc-950 text-white hover:bg-zinc-800 rounded-md text-sm font-medium transition-colors"
      >
        <Send className="w-4 h-4" />
        Send message
      </button>
      <p className="text-xs text-zinc-500">
        This opens your email app with the message pre-filled — or write to us directly at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
        >
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </form>
  );
}
