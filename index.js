const express = require("express");
const sqlite3 = require('sqlite3').verbose();
const openai = require('openai');

const app = express();
const port = 3000;

// Configure OpenAI credentials
openai.apiKey = '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';

// Configure SQLite database
const db = new sqlite3.Database(':memory:');

// Create table for book summaries
db.serialize(() => {
    db.run('CREATE TABLE summaries (id INTEGER PRIMARY KEY, title TEXT, summary TEXT)');
});

// Route for getting book summaries
app.get('/summary', (req, res) => {
    const title = req.query.title;

    // Generate book summary using OpenAI
    openai.completions.create({
            engine: 'davinci',
            prompt: `Generate a summary for the book "${title}".`,
            maxTokens: 256,
            n: 1,
            stop: '\n',
        })
        .then((response) => {
            const summary = response.choices[0].text.trim();

            // Store summary in database
            db.run('INSERT INTO summaries (title, summary) VALUES (?, ?)', [title, summary], (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error storing summary in database.');
                } else {
                    res.json({ title, summary });
                }
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error generating book summary.');
        });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});