'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IoIosSend } from "react-icons/io";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const defaultMessage: Message = {
      id: String(Date.now()),
      role: 'ai',
      content: "This is the AIC support system. How may I help you?",
    };
    setMessages([defaultMessage]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
  
    if (!input.trim()) {
      return;
    }
  
    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input,
    };
  
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Ask me anything about the AIC events!",
          text: input,
        }),
      });
  
      if (!response.ok) {
        throw new Error("An error occurred while fetching the data");
      }
  
      if (!response.body) {
        throw new Error("Response body is null");
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiMessageContent = "";
  
      const aiMessage: Message = {
        id: String(Date.now() + 1),
        role: 'ai',
        content: "",
      };
      
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
  
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
  
        if (value) {
          let chunk = decoder.decode(value, { stream: true });
         chunk = chunk
         .replace(/0:/g, '')                // Remove the '0:' prefix
         .replace(/"/g, '')                 // Remove double quotes
         .replace(/d:\{.*?\}/g, '')         // Remove any extra metadata
         .replace(/\\n\\n/g, '\n\n')        // Replace escaped newlines with actual newlines
         .replace(/}\s*$/, '')               // Remove trailing curly bracket
         .replace(/\s+/g, ' ')               // Replace multiple spaces with a single space
       // Handle markdown-like formatting
       chunk = chunk
         .replace(/ \*\s*/g, '\n• ')         // Replace bullet points (e.g., "* text") with actual bullet points
         .replace(/^\s*\*\s+/gm, '• ')      // Ensure bullet points at the start of lines
         .replace(/\n{3,}/g, '\n\n');       // Ensure proper paragraph breaks

        aiMessageContent += chunk;
        
  
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessageIndex = updatedMessages.findIndex(msg => msg.id === aiMessage.id);
            if (lastMessageIndex > -1) {
              updatedMessages[lastMessageIndex].content = aiMessageContent;
            }
            return updatedMessages;
          });
        }
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  
  return (
    <main className="flex bg-zinc-800 min-h-screen flex-col items-center justify-between p-24">
      <Card className="w-80 h-2/3 max-w-full overflow-hidden rounded-xl border-none">
        <CardHeader className="bg-black rounded-t-l">
          <CardTitle className="bg-black text-white">AIC Chatbot</CardTitle>
        </CardHeader>
        <CardContent className="w-full h-80 overflow-y-auto py-3">
          {messages.map((message) => (
            <div key={message.id} className="break-words">
              {message.role === 'user' ? (
                <div className='bg-black text-white ml-4 m-2 p-4  rounded-lg text-right'>
                  {message.content}
                </div>
              ) : (
                <div className='bg-zinc-900 m-2 mr-4 text-white p-4 rounded-lg text-left'>
                  {message.content}
                </div>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="bg-black text-white rounded-b-l flex items-center justify-between py-3">
          <Input
            className="bg-black text-white border-none mr-2 w-full"
            type="text"
            onChange={handleInputChange}
            value={input}
            placeholder="Ask me anything about the AIC events!"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button className="bg-zinc-800 ml-2" type="submit" onClick={handleSubmit}>
            <IoIosSend />
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
