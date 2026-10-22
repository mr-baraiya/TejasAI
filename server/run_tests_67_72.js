const tests = [
  { id: 'TEST 67 — Neutral Improvement', prompt: 'Make this sentence better: "Our app helps students learn."' },
  { id: 'TEST 68 — Direct Persuasive Rewrite', prompt: 'Make this sentence more persuasive for a marketing website: "Our app helps students learn."' },
  { id: 'TEST 69 — Explicit Meta-Prompt', prompt: 'Write a prompt that asks an AI to make this sentence more persuasive: "Our app helps students learn."' },
  { id: 'TEST 70A — Translation (Direct)', prompt: 'Translate "Good morning" into Gujarati.' },
  { id: 'TEST 70B — Translation Prompt', prompt: 'Write a prompt that asks an AI to translate "Good morning" into Gujarati.' },
  { id: 'TEST 71 — Contradictory Requirements', prompt: 'Summarize this text in five words, preserving every original word in its original order: "Our app helps students learn."' },
  { id: 'TEST 72 — No Unsupported Claims', prompt: 'Make this sentence sound professional without changing its meaning: "Our software helps small businesses."' }
];

async function runAll() {
  for (const t of tests) {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: t.prompt })
      });
      const data = await res.json();
      console.log('=== ' + t.id + ' ===');
      console.log('INPUT: ' + t.prompt);
      console.log('ENHANCED PROMPT:');
      console.log(data.enhancedPrompt || data.error || JSON.stringify(data));
      console.log('WHY BETTER:');
      console.log(JSON.stringify(data.whyBetter || [], null, 2));
      console.log('--------------------------------------------\n');
    } catch (err) {
      console.error('Error on ' + t.id + ':', err.message);
    }
  }
}

runAll();
