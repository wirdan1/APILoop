const axios = require('axios');

module.exports = function(app) {
    const API_KEY = 'danz-dev'; // Replace with your actual API key

    async function enhanceImage(imageUrl) {
        try {
            const response = await axios.get(`https://api.botcahx.eu.org/api/tools/remini`, {
                params: {
                    url: imageUrl,
                    apikey: API_KEY
                },
                responseType: 'json'
            });
            return response.data.url;
        } catch (error) {
            console.error('Image enhancement error:', error.message);
            throw error;
        }
    }

    app.get('/tools/remini', async (req, res) => {
        try {
            const { imageUrl } = req.query;
            
            if (!imageUrl) {
                return res.status(400).json({
                    status: false,
                    error: 'Image URL is required',
                    example: '/tools/remini?imageUrl=https://example.com/photo.jpg'
                });
            }

            // Validate URL format
            if (!/^https?:\/\/.+\..+/.test(imageUrl)) {
                return res.status(400).json({
                    status: false,
                    error: 'Invalid URL format',
                    message: 'Please provide a valid http/https image URL'
                });
            }

            const enhancedImageUrl = await enhanceImage(imageUrl);

            res.json({
                status: true,
                result: {
                    original_image: imageUrl,
                    enhanced_image: enhancedImageUrl
                },
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error('REMINI processing error:', err);
            res.status(500).json({
                status: false,
                error: 'Failed to enhance image',
                details: err.message
            });
        }
    });
};
