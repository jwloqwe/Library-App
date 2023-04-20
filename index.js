const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const db = new sqlite3.Database('./books.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the books database.');
});

db.run('CREATE TABLE IF NOT EXISTS books (title TEXT, summary TEXT)');

const app = express();
app.use(express.json());

app.post('/books', async(req, res) => {
    const { title } = req.body;
    const apiUrl = `https://api.openai.com/v1/completions`;
    const prompt = `Generate a summary for the book ${title}.`;
    const data = {
        model: "text-davinci-003",
        prompt,
        max_tokens: 1000,
        temperature: 0,
        stop: '\n',
    };

    try {
        const response = await axios.post(apiUrl, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });
        const summary = response.data.choices[0].text.trim();

        db.run('INSERT INTO books (title, summary) VALUES (?, ?)', [title, summary], (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Failed to save book summary to database.');
            } else {
                res.send({ title, summary });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to generate book summary.');
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}.`);
});