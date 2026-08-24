'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TripData, ChatMessage } from '@/types/trip';
import { Sparkles, Send, Bot, User, RefreshCw, CheckCircle } from 'lucide-react';

interface AITravelAssistantProps {
  tripData: TripData;
  onUpdateTrip?: (updatedItinerary: any[], updatedBudget?: number) => void;
}

export default function AITravelAssistant({ tripData, onUpdateTrip }: AITravelAssistantProps) {
  const msgCounter = useRef(1);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I'm your Voyara AI Travel Concierge. Need to tweak your ${tripData.destination} itinerary? Ask me to make Day 3 cheaper, add a sunrise spot, or change dietary preferences!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    msgCounter.current += 1;
    const userMsgId = `msg-${msgCounter.current}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          currentTrip: tripData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to reach AI Assistant.');
      }

      const data = await res.json();

      msgCounter.current += 1;
      const aiMsgId = `ai-${msgCounter.current}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: data.replyText || 'I have analyzed your request and updated your itinerary context.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If AI returned updated itinerary, notify parent component
      if (data.updatedItinerary && onUpdateTrip) {
        onUpdateTrip(data.updatedItinerary, data.updatedBudget);
      }
    } catch (err) {
      console.error('Chat error:', err);
      msgCounter.current += 1;
      const errMsgId = `err-${msgCounter.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errMsgId,
          sender: 'ai',
          text: 'Apologies, I encountered a connection glitch. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Make Day 3 less expensive',
    'Add a sunrise activity',
    'Suggest vegetarian dinner spots',
    'Add more relaxation time',
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 shadow-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white leading-tight">
              AI Travel Concierge
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Context-aware assistant for {tripData.destination}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Active
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-600'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50 rounded-tl-none'
              }`}
            >
              <p>{msg.text}</p>
              <span className="block text-[10px] opacity-60 text-right mt-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            Voyara AI is optimizing your itinerary...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            onClick={() => handleSend(qp)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 whitespace-nowrap transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-2 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to modify your trip or add places..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white disabled:opacity-50 hover:scale-105 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
