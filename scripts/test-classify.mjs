import fetch from 'node-fetch';

async function testClassify() {
  try {
    const res = await fetch('http://localhost:3000/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'This is a test transcript with some fake terms like digital arrest.' })
    });
    
    if (!res.ok) {
      console.log('HTTP Error:', res.status, res.statusText);
      console.log('Body:', await res.text());
      return;
    }
    
    const json = await res.json();
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testClassify();
