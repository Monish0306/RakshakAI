import handler from '../api/classify.js';

async function run() {
  const req = {
    method: 'POST',
    body: {
      transcript: 'Hello I am calling from CBI your digital arrest warrant is ready please share otp.',
      language: 'en'
    }
  };
  
  const res = {
    setHeader: () => {},
    status: (code) => {
      console.log('STATUS:', code);
      return {
        json: (data) => console.log('JSON:', JSON.stringify(data, null, 2)),
        end: () => console.log('END')
      };
    }
  };

  await handler(req, res);
}

run();
