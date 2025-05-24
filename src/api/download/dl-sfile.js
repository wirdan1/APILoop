const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    const createHeaders = (referer) => ({
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="137", "Google Chrome";v="137"',
        'dnt': '1',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'Referer': referer,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
    });

    const extractCookies = (responseHeaders) => {
        return responseHeaders['set-cookie']?.map(cookie => cookie.split(';')[0]).join('; ') || '';
    };

    const extractMetadata = ($) => {
        const metadata = {};
        $('.file-content').eq(0).each((_, element) => {
            const $element = $(element);
            metadata.file_name = $element.find('img').attr('alt');
            metadata.mimetype = $element.find('.list').eq(0).text().trim().split('-')[1].trim();
            metadata.upload_date = $element.find('.list').eq(2).text().trim().split(':')[1].trim();
            metadata.download_count = $element.find('.list').eq(3).text().trim().split(':')[1].trim();
            metadata.author_name = $element.find('.list').eq(1).find('a').text().trim();
        });
        return metadata;
    };

    const makeRequest = async (url, options) => {
        try {
            return await axios.get(url, {
                ...options,
                timeout: 10000,
                maxRedirects: 5
            });
        } catch (error) {
            if (error.response) {
                return error.response;
            }
            throw error;
        }
    };

    app.get('/sfile/download', async (req, res) => {
        const startTime = process.hrtime();
        
        try {
            const { url, buffer = 'false' } = req.query;
            
            if (!url || !url.includes('sfile.mobi/')) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_URL',
                        message: 'Valid SFile URL is required',
                        example: '/api/sfile/download?url=https://sfile.mobi/37qyoPNMDS1&buffer=false'
                    },
                    meta: getResponseMetadata(startTime)
                });
            }

            const resultBuffer = buffer === 'true';
            const headers = createHeaders(url);
            const initialResponse = await makeRequest(url, { headers });
            
            if (initialResponse.status !== 200) {
                throw new Error(`Initial request failed with status ${initialResponse.status}`);
            }

            const cookies = extractCookies(initialResponse.headers);
            headers['Cookie'] = cookies;
            
            const $ = cheerio.load(initialResponse.data);
            const metadata = extractMetadata($);
            const downloadUrl = $('#download').attr('href');
            
            if (!downloadUrl) {
                throw new Error('DOWNLOAD_URL_NOT_FOUND');
            }

            headers['Referer'] = downloadUrl;
            const processResponse = await makeRequest(downloadUrl, { headers });
            
            if (processResponse.status !== 200) {
                throw new Error(`Process request failed with status ${processResponse.status}`);
            }

            const $process = cheerio.load(processResponse.data);
            const downloadButton = $('#download');
            
            if (!downloadButton.length) {
                throw new Error('DOWNLOAD_BUTTON_NOT_FOUND');
            }

            const onClickAttr = downloadButton.attr('onclick');
            if (!onClickAttr) {
                throw new Error('DOWNLOAD_KEY_NOT_FOUND');
            }

            const key = onClickAttr.split("'+'")[1]?.split("';")[0];
            if (!key) {
                throw new Error('INVALID_DOWNLOAD_KEY');
            }

            const finalUrl = downloadButton.attr('href') + '&k=' + key;
            let download;

            if (resultBuffer) {
                const fileResponse = await makeRequest(finalUrl, { 
                    headers, 
                    responseType: 'arraybuffer' 
                });
                download = fileResponse.data.toString('base64');
            } else {
                download = finalUrl;
            }

            res.json({
                success: true,
                data: {
                    metadata,
                    download: resultBuffer ? 'BASE64_ENCODED_FILE' : download
                },
                meta: getResponseMetadata(startTime)
            });

        } catch (error) {
            console.error('SFile Download Error:', error.message);
            
            let errorCode = 'SERVER_ERROR';
            if (error.message.includes('NOT_FOUND')) errorCode = 'RESOURCE_NOT_FOUND';
            if (error.message.includes('INVALID')) errorCode = 'INVALID_REQUEST';
            
            res.status(500).json({
                success: false,
                error: {
                    code: errorCode,
                    message: error.message.includes('SERVER_ERROR') 
                        ? 'Failed to process download request' 
                        : error.message
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
            apiVersion: '1.0.0'
        };
    }
};
