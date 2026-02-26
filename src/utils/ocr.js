import Tesseract from 'tesseract.js';

/**
 * 本地OCR识别账单图片
 * 使用 Tesseract.js 进行本地文字识别
 */

// 中英文语言包
const LANGUAGES = 'chi_sim+eng';

/**
 * 识别图片中的文字
 * @param {string} imageDataUrl - Base64图片数据
 * @param {Function} onProgress - 进度回调 (progress: 0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(imageDataUrl, onProgress = () => {}) {
    try {
        const result = await Tesseract.recognize(imageDataUrl, LANGUAGES, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    onProgress(Math.round(m.progress * 100));
                }
            }
        });

        return {
            text: result.data.text,
            confidence: result.data.confidence
        };
    } catch (error) {
        console.error('OCR recognition failed:', error);
        throw error;
    }
}

/**
 * 从识别的文本中提取菜品和价格
 * @param {string} text - OCR识别的文本
 * @returns {Array<{name: string, price: number}>}
 */
export function parseReceiptText(text) {
    const items = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // 匹配价格的模式：数字.数字 或 整数
    // 中文菜单常见格式：
    // 菜名 ¥价格
    // 菜名 价格元
    // 菜名 价格
    const pricePatterns = [
        /(.+?)\s*[¥￥$]?\s*(\d+(?:\.\d{1,2})?)\s*元?$/,     // 菜名 ¥12.00 或 菜名 12.00元
        /(.+?)\s*[¥￥$]\s*(\d+(?:\.\d{1,2})?)$/,              // 菜名 ¥12
        /(.+?)\s+(\d+(?:\.\d{1,2})?)\s*$/,                    // 菜名 12.00
        /[¥￥$]\s*(\d+(?:\.\d{1,2})?)\s*(.+)$/,              // ¥12.00 菜名（价格在前）
    ];

    for (const line of lines) {
        let matched = false;

        for (const pattern of pricePatterns) {
            const match = line.match(pattern);
            if (match) {
                let name, price;

                if (pattern === pricePatterns[3]) {
                    // 价格在前的情况
                    price = parseFloat(match[1]);
                    name = match[2].trim();
                } else {
                    name = match[1].trim();
                    price = parseFloat(match[2]);
                }

                // 过滤无效条目
                if (name && price > 0 && price < 100000) {
                    // 过滤明显不是菜名的行（如合计、总计等）
                    const invalidKeywords = ['合计', '总计', '小计', '总计', '优惠', '折扣', '找零', '实付', '应付', '微信', '支付宝', '现金', '刷卡', '会员', '电话', '地址', '时间', '日期', '订单', '编号', '收银', '欢迎'];
                    const isInvalid = invalidKeywords.some(kw => name.includes(kw));

                    if (!isInvalid && name.length > 0 && name.length < 50) {
                        items.push({ name, price });
                        matched = true;
                        break;
                    }
                }
            }
        }
    }

    return items;
}

/**
 * 完整的账单识别流程
 * @param {string} imageDataUrl - Base64图片数据
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<{items: Array, rawText: string, confidence: number}>}
 */
export async function scanReceipt(imageDataUrl, onProgress = () => {}) {
    onProgress({ stage: 'recognizing', progress: 0 });

    const { text, confidence } = await recognizeText(imageDataUrl, (p) => {
        onProgress({ stage: 'recognizing', progress: p });
    });

    onProgress({ stage: 'parsing', progress: 100 });

    const items = parseReceiptText(text);

    return {
        items,
        rawText: text,
        confidence
    };
}