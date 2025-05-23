const axios = require('axios');

module.exports = function(app) {
    const base64EncodingUrl = (trackUrl, trackName, artistName) => {
        const data = `__/:${trackUrl}:${trackName}:${artistName}`;
        return Buffer.from(data).toString('base64');
    };

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://spotify-down.com/'
    };

    async function downloadSpotifyTrack(url) {
        try {
            if (!/open.spotify.com/.test(url)) {
                throw new Error("Input URL must be from Spotify");
            }

            // Get track metadata
            const metadataResponse = await axios({
                method: 'post',
                url: 'https://spotify-down.com/api/metadata',
                params: { link: url },
                headers: headers
            });

            const metadata = metadataResponse.data.data;
            const base64Encoded = base64EncodingUrl(metadata.link, metadata.title, metadata.artists);

            // Get download link
            const downloadResponse = await axios.get('https://spotify-down.com/api/download', {
                params: {
                    link: metadata.link,
                    n: metadata.title,
                    a: metadata.artists,
                    t: base64Encoded
                },
                headers: headers
            });

            return {
                status: true,
                metadata: {
                    title: metadata.title,
                    artists: metadata.artists,
                    duration: metadata.duration,
                    thumbnail: metadata.thumbnail,
                    link: metadata.link
                },
                downloadUrl: downloadResponse.data.data.link
            };
        } catch (error) {
            console.error('Spotify download error:', error.message);
            return null;
        }
    }

    app.get('/spotify/download', async (req, res) => {
        try {
            const { url } = req.query;
            
            if (!url) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Spotify URL is required',
                    example: '/spotify/download?url=https://open.spotify.com/track/...'
                });
            }

            const result = await downloadSpotifyTrack(url);
            
            if (!result) {
                return res.status(500).json({ 
                    status: false, 
                    error: 'Failed to download Spotify track' 
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
