const axios = require('axios');

async function generatePromptFromImage(imgUrl, lang) {
    const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data).toString('base64');
    const base64 = `data:image/png;base64,${buffer}`;

    const payload = {
        image: base64,
        language: lang || 'en',
        model: 'flux'
    };

    const { data } = await axios.post("https://imagetoprompt.org/api/describe/generate", payload);
    return data;
}

module.exports = function(app) {
    app.get('/ai/img2prompt', async (req, res) => {
        const { img, lang } = req.query;

        if (!img) {
            return res.status(400).json({
                status: false,
                message: 'Query parameter ?img= is required'
            });
        }

        try {
            const result = await generatePromptFromImage(img, lang);

            res.json({
                status: true,
                language: lang || 'en',
                prompt: result.description || null,
                raw: result
            });
        } catch (err) {
            console.error('imgToPrompt error:', err.message);
            res.status(500).json({
                status: false,
                message: 'Failed to generate prompt from image'
            });
        }
    });
};
