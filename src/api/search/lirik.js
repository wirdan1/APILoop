const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function searchLyrics(query) {
        try {
            // Search for lyrics
            const { data } = await axios.get(`https://lirik.web.id/search/${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const $ = cheerio.load(data);
            const results = [];

            // Extract search results
            $('.search-results article').each((i, el) => {
                const title = $(el).find('h2 a').text().trim();
                const url = $(el).find('h2 a').attr('href');
                results.push({ title, url });
            });

            // Get one top song from homepage
            const homeData = await axios.get('https://lirik.web.id', {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            const home$ = cheerio.load(homeData.data);
            const topSong = {
                title: home$('.popular-posts li:first-child a').text().trim(),
                url: home$('.popular-posts li:first-child a').attr('href')
            };

            return {
                searchResults: results.slice(0, 5), // Limit to 5 results
                topSong
            };
        } catch (error) {
            console.error('Lyrics search error:', error.message);
            return null;
        }
    }

    app.get('/api/lyrics', async (req, res) => {
        try {
            const { title } = req.query;
            
            if (!title) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Search query is required',
                    example: '/search/lyrics?query=judul+lagu'
                });
            }

            const result = await searchLyrics(query);
            
            if (!result) {
                return res.status(500).json({ 
                    status: false, 
                    error: 'Failed to search lyrics' 
                });
            }

            res.json({ 
                status: true, 
                result,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            res.status(500).json({ 
                status: false, 
                error: err.message 
            });
        }
    });
};
