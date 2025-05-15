const axios = require('axios');

module.exports = function (app) {
    app.get('/api/autoai', async (req, res) => {
        const { text, prompt } = req.query;

        if (!text || !prompt) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "text" dan "prompt" wajib diisi.'
            });
        }

        try {
            const response = await axios.post('https://luminai.my.id', {
                content: text,
                prompt: prompt
            });

            res.json({
                status: true,
                result: response.data.result
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                error: 'Gagal memproses permintaan.'
            });
        }
    });
};
