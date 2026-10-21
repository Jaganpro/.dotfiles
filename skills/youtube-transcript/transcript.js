#!/usr/bin/env node
// From badlogic/pi-skills (https://github.com/badlogic/pi-skills),
// youtube-transcript/transcript.js, Copyright (c) 2024 Mario Zechner, MIT
// (see third_party/badlogic-pi-skills.LICENSE).
// Modified: youtube-transcript-plus 1.2 returns offsets in seconds, so they are
// no longer divided by 1000 (every timestamp printed as [0:00] before).

import { YoutubeTranscript } from 'youtube-transcript-plus';

const videoId = process.argv[2];

if (!videoId) {
  console.error('Usage: transcript.js <video-id-or-url>');
  console.error('Example: transcript.js EBw7gsDPAYQ');
  console.error('Example: transcript.js https://www.youtube.com/watch?v=EBw7gsDPAYQ');
  process.exit(1);
}

// Extract video ID if full URL is provided
let extractedId = videoId;
if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
  const match = videoId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    extractedId = match[1];
  }
}

try {
  const transcript = await YoutubeTranscript.fetchTranscript(extractedId);

  for (const entry of transcript) {
    const timestamp = formatTimestamp(entry.offset); // offset is in seconds
    console.log(`[${timestamp}] ${entry.text}`);
  }
} catch (error) {
  console.error('Error fetching transcript:', error.message);
  process.exit(1);
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
