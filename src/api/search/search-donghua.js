const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function searchDonghua(keyword) {
        try {
            const url = `https://anichin.co.id/?s=${encodeURIComponent(keyword)}`;
            const { data } = await axios.get(url, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);

            const results = [];
            $('.listupd .bs').each((i, el) => {
                const link = $(el).find('.bsx > a').attr('href');
                const img = $(el).find('img').attr('src');
                const namaDonghua = $(el).find('.tt').clone().children().remove().end().text().trim();
                const episode = $(el).find('.epx').text().trim();

                results.push({ 
                    link, 
                    img, 
                    namaDonghua, 
                    episode,
                    lastUpdated: new Date().toISOString() 
                });
            });

            return results.length > 0 ? results : null;
        } catch (error) {
            console.error('Donghua search error:', error.message);
            throw error;
        }
    }

    app.get('/search/donghua', async (req, res) => {
        try {
            const { keyword, limit = 3 } = req.query;
            
            if (!keyword || keyword.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: {
                        code: 'MISSING_PARAMETER',
                        message: 'Search keyword is required',
                        example: '/api/v1/search/donghua?keyword=martial&limit=5'
                    },
                    timestamp: new Date().toISOString()
                });
            }

            const results = await searchDonghua(keyword);
            
            if (!results) {
                return res.status(404).json({ 
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'No donghua found matching your search'
                    },
                    timestamp: new Date().toISOString()
                });
            }

            // Apply limit if specified
            const limitedResults = limit ? results.slice(0, parseInt(limit)) : results;

            res.json({ 
                success: true,
                data: {
                    count: limitedResults.length,
                    results: limitedResults
                },
                meta: {
                    source: 'anichin.co.id',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('API Error:', err);
            res.status(500).json({ 
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: 'Failed to process your request',
                    details: process.env.NODE_ENV === 'development' ? err.message : undefined
                },
                timestamp: new Date().toISOString()
            });
        }
    });
};
