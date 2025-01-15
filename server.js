const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Store high scores in memory
let highScores = [];

// GET endpoint to retrieve top 10 high scores
app.get('/highscores', (req, res) => {
    const topScores = [...highScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    res.json(topScores);
});

// POST endpoint to add a new score
app.post('/highscores', (req, res) => {
    const { username, score } = req.body;
    
    if (!username || !score) {
        return res.status(400).json({ error: 'Username and score are required' });
    }

    const newScore = {
        username,
        score,
        date: new Date().toISOString()
    };

    highScores.push(newScore);
    res.status(201).json(newScore);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
