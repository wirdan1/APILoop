const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function ScrapeFreeFire(charId) {
        try {
            const url = `https://ff.garena.com/id/chars/${charId}`;
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const characterData = {
                name: $('.char-name').text().trim(),
                abstract: $('.char-abstract').text().trim(),
                ability: $('.skill-profile-name').text().trim(),
                abilityDescription: $('.skill-introduction').text().trim(),
                biography: $('.detail p').text().trim(),
                profile: {},
                images: {
                    character: $('.char-pic img').attr('src'),
                    background: $('.char-detail-bg-pic div').first().css('background-image')?.match(/url\("(.+)"\)/)?.[1] || 'Not available',
                    biography: $('.pic-img').css('background-image')?.match(/url\("(.+)"\)/)?.[1] || 'Not available'
                },
                navigation: {
                    previousCharacter: {
                        name: $('.char-prev .pre-next .prev div').text().trim(),
                        link: $('.char-prev a').attr('href')
                    },
                    nextCharacter: {
                        name: $('.char-next .pre-next .next div').text().trim(),
                        link: $('.char-next a').attr('href')
                    }
                }
            };

            $('.profile-item').each((i, el) => {
                const key = $(el).find('.profile-key').text().trim();
                const value = $(el).find('.profile-value').text().trim();
                characterData.profile[key] = value;
            });

            return characterData;
        } catch (error) {
            console.error('Error fetching Free Fire character data:', error.message);
            return null;
        }
    }

    app.get('/stalk/freefire', async (req, res) => {
        try {
            const { charId } = req.query;
            if (!charId) {
                return res.status(400).json({ status: false, error: 'Character ID is required' });
            }

            const result = await ScrapeFreeFire(charId);
            if (!result) {
                return res.status(500).json({ status: false, error: 'Failed to fetch character data' });
            }
            res.json({ status: true, result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
