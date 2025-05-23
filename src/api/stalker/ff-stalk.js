const axios = require('axios');

module.exports = function(app) {
    const FF_APP_ID = 100067; // Free Fire application ID
    const API_URL = 'https://kiosgamer.co.id/api/auth/player_id_login';

    async function fetchFreeFireProfile(playerId) {
        try {
            if (!playerId || typeof playerId !== 'string') {
                throw new Error('Invalid player ID');
            }

            const requestData = {
                app_id: FF_APP_ID,
                login_id: playerId
            };

            const config = {
                method: 'POST',
                url: API_URL,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'sec-ch-ua-platform': '"Android"',
                    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                    'sec-ch-ua-mobile': '?1',
                    'Origin': 'https://kiosgamer.co.id',
                    'Sec-Fetch-Site': 'same-origin',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Dest': 'empty',
                    'Referer': 'https://kiosgamer.co.id/',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                data: JSON.stringify(requestData),
                timeout: 10000 // 10 second timeout
            };

            const response = await axios(config);
            
            if (!response.data) {
                throw new Error('Empty response from server');
            }

            return response.data;
        } catch (error) {
            console.error('Free Fire Stalk Error:', error.message);
            throw error;
        }
    }

    app.get('/stalk/freefire', async (req, res) => {
        const startTime = process.hrtime();
        
        try {
            const { playerId } = req.query;
            
            if (!playerId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_PARAMETER',
                        message: 'Player ID is required',
                        example: '/api/freefire/profile?playerId=123456789'
                    },
                    meta: getResponseMetadata(startTime)
                });
            }

            const profileData = await fetchFreeFireProfile(playerId);
            
            res.json({
                success: true,
                data: profileData,
                meta: getResponseMetadata(startTime)
            });

        } catch (error) {
            const statusCode = error.response?.status || 500;
            const errorMessage = error.response?.data?.message || error.message;
            
            res.status(statusCode).json({
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: errorMessage
                },
                meta: getResponseMetadata(startTime)
            });
        }
    });

    function getResponseMetadata(startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const responseTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
        
        return {
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            apiVersion: '1.0.0',
            source: 'kiosgamer.co.id'
        };
    }
};
