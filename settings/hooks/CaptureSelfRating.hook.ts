#!/usr/bin/env bun
/**
 * CaptureSelfRating.hook.ts - Capture AI's Self-Rating (UserPromptSubmit)
 *
 * PURPOSE:
 * When user types /capture or /rate, extracts the AI's latest self-rating from
 * the conversation transcript and saves it to the ratings database.
 *
 * TRIGGER: UserPromptSubmit (when user types "/capture" or "/rate")
 *
 * USAGE:
 * User types: /capture
 * System reads last AI response from transcript, extracts ⭐ RATE line, saves to ratings.jsonl
 *
 * OUTPUT:
 * - Writes to: MEMORY/LEARNING/SIGNALS/ratings.jsonl (source: "ai_self_rating")
 */

import { readFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getIdentity, getPrincipal } from './lib/identity';

const PRINCIPAL_NAME = getPrincipal().name;
const ASSISTANT_NAME = getIdentity().name;

interface RatingEntry {
  timestamp: string;
  rating: number;
  session_id: string;
  source: string;
  rating_summary: string;
}

interface TranscriptEntry {
  type: string;
  message?: {
    content?: string | Array<{ type: string; text: string }>;
  };
}

// Extract rating from AI self-rating format
// Expected: ⭐ RATE (1-10): X/10 - optional comment
function extractSelfRating(text: string): { rating: number; summary: string } | null {
  // Match lines like: ⭐ RATE (1-10): 8/10 - Good response
  // Or: ⭐ RATE (1-10): 7
  const ratePattern = /⭐\s*RATE\s*\(1-10\):\s*(\d+)\/?\d*\s*(?:-\s*(.+?))?(?:\n|$)/im;
  const match = text.match(ratePattern);

  if (match) {
    const rating = parseInt(match[1], 10);
    const summary = match[2] ? match[2].trim() : 'AI self-assessment';
    return { rating, summary };
  }

  return null;
}

// Get last AI response from transcript
function getLastAIResponse(transcriptPath: string): string {
  try {
    if (!existsSync(transcriptPath)) {
      return '';
    }

    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    let lastAIResponse = '';

    // Parse from end to find most recent assistant message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry: TranscriptEntry = JSON.parse(lines[i]);

        if (entry.type === 'assistant' && entry.message?.content) {
          // Extract text content
          let text = '';
          if (typeof entry.message.content === 'string') {
            text = entry.message.content;
          } else if (Array.isArray(entry.message.content)) {
            text = entry.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text)
              .join('\n');
          }

          // Return the first (most recent) assistant response found
          return text;
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return lastAIResponse;
  } catch {
    return '';
  }
}

// Main hook function
export async function run(input: any): Promise<void> {
  const { prompt, user_prompt, transcript_path, session_id } = input;
  const userMessage = prompt || user_prompt || '';

  // Only trigger on /capture or /rate command
  if (!userMessage.toLowerCase().includes('/capture') && !userMessage.toLowerCase().includes('/rate')) {
    return;
  }

  try {
    // Get transcript path from input or environment
    const actualTranscriptPath = transcript_path || join(process.env.PAI_DIR || process.env.HOME + '/.claude', 'history.jsonl');

    // Extract last AI response
    const lastResponse = getLastAIResponse(actualTranscriptPath);

    if (!lastResponse) {
      console.error('✗ Could not find last AI response in transcript');
      return;
    }

    // Extract self-rating
    const ratingData = extractSelfRating(lastResponse);

    if (!ratingData) {
      console.error('✗ No self-rating found in last AI response');
      return;
    }

    // Create rating entry
    const entry: RatingEntry = {
      timestamp: new Date().toISOString(),
      rating: ratingData.rating,
      session_id: session_id || 'unknown',
      source: 'ai_self_rating',
      rating_summary: ratingData.summary
    };

    // Write to ratings database
    const ratingsPath = join(process.env.PAI_DIR || process.env.HOME + '/.claude', 'MEMORY/LEARNING/SIGNALS/ratings.jsonl');
    appendFileSync(ratingsPath, JSON.stringify(entry) + '\n');

    console.log(`✓ Captured AI self-rating: ${ratingData.rating}/10 - ${ratingData.summary}`);

  } catch (error) {
    console.error('✗ Error capturing self-rating:', error);
  }
}

// For direct execution
const args = process.argv.slice(2);
if (args.length > 0) {
  const input: any = {
    session_id: args[0] || 'manual',
    prompt: args[1] || '',
    transcript_path: args[2] || join(process.env.HOME || '.', '.claude/history.jsonl'),
    hook_event_name: 'UserPromptSubmit'
  };
  run(input);
}
