import { NextResponse } from 'next/server';
import { convertToCoreMessages, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { text, prompt } = await req.json();
  console.log('Parsed Messages:', prompt);

  if (!prompt) return new Response('Prompt is required', { status: 400 });

  try {
    const result = await streamText({
      model: groq('llama3-8b-8192'),
      system: `You are the AIC (Artificial Intelligence Club) Society at Mehran University Of Engineering and Technology chatbot, an AI assistant designed to provide information about the AIC Society at our university. Your primary role is to assist students with queries related to various non-tech events organized by the society, the structure and organization of the society, membership details, and eligibility criteria.
        AIC contains of core team, head team and other member fot the heads to contribute in. president is abdul ahad student of BSAI in muet 23 batch. the core team is also from 23 batch BSAI. we have shafaque as our vice president. narmeen afreen as our membership chair, head treasurer hadeed hyder, general secretary muneeb ur Rehman and web master muzamil muhammad. each tenure is of one year and applications opens relativily. 
      `,
      prompt: `Prompt: ${prompt}\nText: ${text}`,
    });
    
    const response = result.toAIStreamResponse();
    const reader = response.body.getReader();
    let decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let done = false;
    
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            console.log('Response chunk:', chunk);
            controller.enqueue(value);
          }
        }
    
        controller.close();
        console.log('Stream complete');
      }
    });
    
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error while streaming text:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
