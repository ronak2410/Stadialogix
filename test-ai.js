const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/GROQ_API_KEY=(.*)/)[1];

async function test() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'user', content: 'Respond ONLY with a JSON object containing an "alerts" array.' }
        ],
        response_format: { type: 'json_object' }
      })
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("ERROR CAUGHT:");
    console.error(error);
  }
}

test();
