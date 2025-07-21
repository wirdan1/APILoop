const axios = require("axios");
const QRCode = require("qrcode");

const diamondMapping = {
  5: "FF5-S24", 10: "FF_10--73", 50: "FF50-S24", 70: "FF_70--16",
  100: "FF_100--73", 140: "FF_140--24", 210: "FF_210--24",
  330: "FF_330--73", 800: "FF_800--2", "booyah pass": "FF_BP--73", "bp": "FF_BP--73"
};

const diamondPrices = {
  5: 826, 10: 1000, 50: 6000, 70: 9000, 100: 13000, 140: 18000,
  210: 27000, 330: 45000, 800: 100000, "booyah pass": 46000, "bp": 46000
};

const generateQRBuffer = async (data) => {
  return new Promise((resolve, reject) => {
    QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H', width: 500, margin: 2
    }, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
};

const freeFireTopup = {
  list() {
    const list = Object.entries(diamondPrices).map(
      ([key, price]) => `• ${key.toUpperCase()} = Rp ${price.toLocaleString("id-ID")}`
    ).join("\n");
    return `💎 *Daftar Diamond & Booyah Pass Free Fire:*\n\n${list}\n\n📌 *Note:* Biaya admin tambahan 0,3%`;
  },

  async order(userID, jumlah) {
    const diamondKey = isNaN(jumlah) ? jumlah.toLowerCase() : parseInt(jumlah);
    const packageCode = diamondMapping[diamondKey];

    if (!userID || !packageCode) {
      return {
        success: false,
        message: `❌ Jumlah diamond *${jumlah}* tidak valid.\nPilih dari: ${Object.keys(diamondMapping).join(", ")}`
      };
    }

    try {
      const body = {
        contact: {
          emailAddress: "",
          phoneNumber: "+6283849737975"
        },
        paymentMethod: "QRIS_ID_BNC",
        productId: "644359b1f61740160ca158ca",
        productPackageCode: packageCode,
        questionnaireAnswers: [
          {
            questionnaire: {
              code: "userid",
              inputType: "STRING",
              translations: [{ language: "ID", question: "Masukkan User ID", description: "User ID" }]
            },
            answer: userID
          }
        ]
      };

      const headers = {
        "content-type": "application/json",
        "x-app-instance-id": "c07e0b553bf54f39956591553c7d4c64",
        "x-original-url": "https://www.tokogame.com/id-id/digital/free-fire-diamonds",
        "x-request-id": "4b4ecec1-805e-4da6-9c11-6fefbfa1d3e1",
        "x-secret-id": "d30b58ad135594f78526dc6b2a9a459f033dde902d78bc808b16c054d003985a",
        "x-currency": "IDR", "x-language": "ID", "x-region": "ID",
        referer: "https://www.tokogame.com/", origin: "https://www.tokogame.com",
        "user-agent": "Mozilla/5.0"
      };

      const res = await axios.post("https://api.tokogame.com/core/v1/orders/create-order", body, { headers });
      const result = res.data?.data;

      if (!result?.checkoutUrl?.qr) throw new Error("QR code tidak ditemukan.");

      const qrBuffer = await generateQRBuffer(result.checkoutUrl.qr);
      const totalHarga = result.totalPriceInCents
        ? `Rp ${parseInt(result.totalPriceInCents / 100).toLocaleString("id-ID")}`
        : "Tidak diketahui";

      return {
        success: true,
        buffer: qrBuffer,
        info: {
          userID,
          jumlah,
          orderID: result.id,
          total: totalHarga,
          method: result.paymentMethodDisplayText || "QRIS",
          status: result.paymentStatus || "Pending",
          expired: "2 jam",
          productCode: result.productPackage?.code || "-"
        }
      };

    } catch (err) {
      return {
        success: false,
        message: `❌ Gagal memproses pesanan. Error: ${err.message}`
      };
    }
  }
};

module.exports = freeFireTopup;
