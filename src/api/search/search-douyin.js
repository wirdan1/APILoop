const axios = require('axios');
const cheerio = require('cheerio');
const vm = require('vm');

module.exports = function (app) {
    app.get('/search/douyin', async (req, res) => {
        const { q } = req.query;

        if (!query) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "query" diperlukan.'
            });
        }

        const baseURL = 'https://so.douyin.com/';
        const defaultParams = {
            search_entrance: 'aweme',
            enter_method: 'normal_search',
            innerWidth: '431',
            innerHeight: '814',
            reloadNavStart: String(Date.now()),
            is_no_width_reload: '1',
            keyword: '',
        };
        let cookies = {};

        const api = axios.create({
            baseURL,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'id-ID,id;q=0.9',
                'referer': baseURL,
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
            }
        });

        api.interceptors.response.use(res => {
            const setCookies = res.headers['set-cookie'];
            if (setCookies) {
                setCookies.forEach(c => {
                    const [name, value] = c.split(';')[0].split('=');
                    if (name && value) cookies[name] = value;
                });
            }
            return res;
        });

        api.interceptors.request.use(config => {
            if (Object.keys(cookies).length) {
                config.headers['Cookie'] = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
            }
            return config;
        });

        try {
            await api.get('/');
            const params = { ...defaultParams, keyword: query, reloadNavStart: String(Date.now()) };
            const response = await api.get('s', { params });
            const $ = cheerio.load(response.data);

            let scriptWithData = '';
            $('script').each((_, el) => {
                const text = $(el).html();
                if (text.includes('let data =') && text.includes('"business_data":')) {
                    scriptWithData = text;
                }
            });

            if (!scriptWithData) {
                return res.status(500).json({ status: false, error: 'Script containing data not found.' });
            }

            const match = scriptWithData.match(/let\s+data\s*=\s*(\{[\s\S]+?\});/);
            if (!match) {
                return res.status(500).json({ status: false, error: 'Unable to match data object.' });
            }

            const dataCode = `data = ${match[1]}`;
            const sandbox = {};
            vm.createContext(sandbox);
            vm.runInContext(dataCode, sandbox);

            const fullData = sandbox.data;
            const awemeInfos = fullData?.business_data
                ?.map(entry => entry?.data?.aweme_info)
                .filter(Boolean);

            res.json({
                status: true,
                data: awemeInfos
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message || 'Gagal memproses permintaan.'
            });
        }
    });
};
