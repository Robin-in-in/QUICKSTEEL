const express = require('express');
const app = express();
const port = 3001;

const { createServer } = require('node:http');
const { join } = require('node:path');
const server = createServer(app);

// Serve static files from the 'public' directory
//app.use(express.static(join(__dirname, '../../public')));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../client/html/index.html'));
});

server.listen(port, () => {
    console.log('Server is running at http://localhost:' + port);
});

