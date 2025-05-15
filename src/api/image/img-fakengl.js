const axios = require('axios');

module.exports = function (app) {
    app.get('/api/ngl', async (req, res) => {
        const { title, text } = req.query;

        if (!title || !text) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "title" dan "text" diperlukan.'
            });
        }

        const apiUrl = `https://flowfalcon.dpdns.org/imagecreator/ngl?title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`;

        try {
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer', // karena hasil berupa gambar
            });

            res.set('Content-Type', 'image/png');
            res.send(response.data);
        } catch (err) {
            res.status(500).json({
                status: false,
                error: 'Gagal mengambil gambar dari API.'
            });
        }
    });
};
