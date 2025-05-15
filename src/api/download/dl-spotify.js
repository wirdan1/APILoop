const axios = require('axios');

module.exports = function(app) {
    async function fetchDownload(url) {
        try {
            const getMetadata = await axios.get(`https://api.fabdl.com/spotify/get?url=${url}`);
            const metaData = getMetadata?.data?.result;
            if (!metaData) throw new Error('Failed to retrieve metadata.');

            const getTrack = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${metaData.gid}/${metaData.id}`);
            const dataTrack = getTrack?.data?.result;
            if (!dataTrack?.download_url) throw new Error('Failed to retrieve track download URL.');

            const trackUrl = `https://api.fabdl.com${dataTrack.download_url}`;

            return {
                status: true,
                result: {
                    id: metaData.id,
                    type: metaData.type,
                    name: metaData.name,
                    artists: metaData.artists,
                    url: trackUrl
                }
            };
        } catch (error) {
            throw new Error("Error fetching content from Spotify: " + error.message);
        }
    }

    app.get('/spotify/download', async (req, res) => {
        try {
            const { url } = req.query;
            if (!url) return res.status(400).json({ status: false, error: 'Parameter "url" is required' });

            const result = await fetchDownload(url);
            res.json(result);
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
