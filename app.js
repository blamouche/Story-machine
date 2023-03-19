// Load the http, fs, and querystring modules from Node.js
const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));



// Define the port number that the server will listen on
const port = 3000;

// Define the OpenAI API endpoint and key
const openaiEndpoint = 'https://api.openai.com/v1/completions';
const openaiKey = 'YOUR-API-KEY-HERE'; // Replace with your actual OpenAI API key


  
  async function generateHtmlFromText(text) {
    const sentences = text.split(/[.!?\n]/g);
    const html = sentences
      .filter(sentence => sentence.trim() !== '')
      .map(async sentence => {
        return `<p>${sentence.trim()}.</p>`;
      });
  
    const htmlArray = await Promise.all(html);
    return htmlArray.join('');
  }
  
  async function generateImageFromText(text) {
    
    console.log(text);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        'model': 'image-alpha-001',
        'prompt': text,
        'num_images': 1,
        'size': '256x256',
        'response_format': 'url'
      })
    });
    const json = await response.json();
  
    if (json.data && json.data.length > 0) {
      const imageUrl = json.data[0].url;
      return `<img src="${imageUrl}" />`;
    } else {
      console.log('Error: data array is empty');
      return '';
    }
  }
  

// Create the server using the http module
const server = http.createServer((req, res) => {
  // Set the response header to indicate that we're sending HTML
  res.setHeader('Content-Type', 'text/html');

  if (req.method === 'POST') {
    
    
    
    
    
    // Handle POST requests to the server
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const animal = querystring.parse(body).animal;
      const transport = querystring.parse(body).transport;
      const lieu = querystring.parse(body).lieu;
      const duree = querystring.parse(body).duree;
      const ton = querystring.parse(body).ton;

      // Make a request to the OpenAI API to generate text
      const requestBody = {
        prompt: `Invente une ${duree} histoire ${ton} pour enfant avec les personages : ${animal}. Ils utilisent ${transport}. L'histoire se passe à ${lieu}. En Francais.`,
        model: 'text-davinci-003',
        temperature: 1,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };
      
      console.log(requestBody);

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      };

      const requestOptions = {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
      };

      fetch(openaiEndpoint, requestOptions)
        .then(response => response.json())
        .then(data => {
          // Extract the generated text from the API response
          const text = data.choices[0].text.trim();


          // Read the contents of the index.html file
          fs.readFile('index.html', async (err, data) => {
            if (err) {
              // If there was an error reading the file, send a 500 error
              res.writeHead(500);
              return res.end(`Error loading index.html: ${err}`);
            }
          
            // Replace the placeholder in the HTML file with the generated HTML
            const htmlimg = await generateImageFromText(`digital art ${animal} with ${lieu} in ${lieu}`);
            const html = await generateHtmlFromText(text);
            const finalHtml = data.toString().replace('{text}', htmlimg.concat(html));
          
            // Write the HTML to the response
            res.writeHead(200);
            res.write(finalHtml);
            res.end();
          });
        })
        .catch(error => {
          console.error(`Error calling OpenAI API: ${error}`);
          res.writeHead(500);
          res.end('Error calling OpenAI API');
        });
    });
  } else {
    // Handle GET requests to the server
    // Read the contents of the index.html file
    fs.readFile('index.html', (err, data) => {
      if (err) {
        // If there was an error reading the file, send a 500 error
        res.writeHead(500);
        return res.end(`Error loading index.html: ${err}`);
      }

      // Replace the placeholder in the HTML file with an empty string
      const html = data.toString().replace('{text}', '');

      // Write the HTML to the response
      res.writeHead(200);
      res.write(html);
      res.end();
    });
  }
});

// Start the server listening on the specified port
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});


  