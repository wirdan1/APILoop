const axios = require('axios');

module.exports = function(app) {
    const TOKEN_URL = "https://restapi-v2.vercel.app/api/other/spotify-token";

    const getAccessToken = async () => {
        try {
            const response = await axios.get(TOKEN_URL);
            return response.data.response.access_token;
        } catch (error) {
            throw new Error("Error fetching token: " + (error.response?.data || error.message));
        }
    };

    async function fetchSearch(query) {
        const token = await getAccessToken();
        try {
            const response = await axios.get(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const tracks = response?.data?.tracks?.items || [];
            return {
                status: true,
                result: tracks.map((track) => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists.map((artist) => artist.name),
                    album: track.album.name,
                    release_date: track.album.release_date,
                    url: track.external_urls.spotify,
                })),
            };
        } catch (error) {
            throw new Error("Error fetching from Spotify API: " + error.message);
        }
    }

    app.get('/spotify/search', async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(400).json({ status: false, error: 'Query parameter "q" is required' });
            
            const result = await fetchSearch(q);
            res.json(result);
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
