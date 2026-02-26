import Tesseract from 'tesseract.js';

/**
 * 本地OCR识别账单图片
 * 使用 Tesseract.js 进行本地文字识别
 */

/**
 * 识别图片中的文字
 * @param {string} imageDataUrl - Base64图片数据
 * @param {Function} onProgress - 进度回调 (progress: 0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(imageDataUrl, onProgress = () => {}) {
    try {
        const result = await Tesseract.recognize(imageDataUrl, 'chi_sim+eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    onProgress(Math.round(m.progress * 100));
                } else if (m.status === 'loading language traineddata') {
                    onProgress(Math.round(m.progress * 30));
                }
            },
            // 使用 CDN 加载语言包
            langPath: 'https://cdn.jsdelivr.net/npm/tessdata@5'
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
 * 针对中文账单优化
 * @param {string} text - OCR识别的文本
 * @returns {Array<{name: string, price: number}>}
 */
export function parseReceiptText(text) {
    const items = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    console.log('OCR Raw Text:', text);
    console.log('OCR Lines:', lines);

    // 中文账单常见价格模式
    // 模式优先级从高到低
    const patterns = [
        // 菜名 ¥价格 或 菜名￥价格
        /^[\s]*([^\d¥￥\.\s][^\d¥￥]*?[^\d¥￥\.\s])[\s]*[¥￥][\s]*(\d+(?:\.\d{1,2})?)[\s]*$/,
        // 菜名 价格元 或 菜名 价格 元
        /^[\s]*([^\d\.\s][^\d]*?[^\d\.\s])[\s]*(\d+(?:\.\d{1,2})?)[\s]*元[\s]*$/,
        // 菜名 数字.数字 (价格在末尾)
        /^[\s]*([^\d\.\s][^\d]*?[^\d\.\s])[\s]+(\d+(?:\.\d{1,2})?)[\s]*$/,
        // ¥价格 菜名 (价格在前)
        /^[\s]*[¥￥][\s]*(\d+(?:\.\d{1,2})?)[\s]+([^\d\.\s][^\d]*?[^\d\.\s])[\s]*$/,
        // 数字 菜名 (可能匹配，需谨慎)
        /^[\s]*(\d+(?:\.\d{1,2})?)[\s]+([^\d\.\s][^\d]*?[^\d\.\s])[\s]*$/,
    ];

    // 过滤关键词 - 这些行不是菜品
    const invalidKeywords = [
        '合计', '总计', '小计', '优惠', '折扣', '找零', '实付', '应付', '应收',
        '微信', '支付宝', '现金', '刷卡', '会员', '积分', '电话', '地址', '时间',
        '日期', '订单', '编号', '收银', '欢迎', '谢谢', '发票', '盖章', '签名',
        '备注', '说明', '温馨提示', '扫码', '关注', '公众号', '店铺', '店名',
        '桌号', '人数', '服务', '包装', '配送', '外卖', '满减', '优惠券'
    ];

    // 价格范围过滤（排除明显不合理的价格）
    const MIN_PRICE = 0.5;
    const MAX_PRICE = 10000;

    for (const line of lines) {
        // 先检查是否包含无效关键词
        if (invalidKeywords.some(kw => line.includes(kw))) {
            continue;
        }

        // 检查是否包含数字，没有数字的行跳过
        if (!/\d/.test(line)) {
            continue;
        }

        let matched = false;

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const match = line.match(pattern);

            if (match) {
                let name, price;

                if (i === 3 || i === 4) {
                    // 价格在前的模式
                    price = parseFloat(match[1]);
                    name = match[2].trim();
                } else {
                    name = match[1].trim();
                    price = parseFloat(match[2]);
                }

                // 过滤无效条目
                if (name && !isNaN(price) && price >= MIN_PRICE && price <= MAX_PRICE) {
                    // 名称长度检查
                    if (name.length >= 1 && name.length <= 30) {
                        // 再次检查名称中是否包含无效关键词
                        const hasInvalidWord = invalidKeywords.some(kw => name.includes(kw));
                        if (!hasInvalidWord) {
                            items.push({ name, price });
                            matched = true;
                            console.log(`Matched pattern ${i}: "${name}" = ${price}`);
                            break;
                        }
                    }
                }
            }
        }

        // 如果常规模式都没匹配，尝试更宽松的提取
        if (!matched) {
            // 尝试从行中提取最后一个数字作为价格
            const priceMatch = line.match(/(\d+(?:\.\d{1,2})?)\s*$/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                // 提取价格前的部分作为名称
                let name = line.substring(0, line.lastIndexOf(priceMatch[0])).trim();
                // 清理名称中的特殊字符
                name = name.replace(/^[¥￥\s]+/, '').replace(/[\s]+$/, '');

                if (name.length >= 1 && name.length <= 30 &&
                    price >= MIN_PRICE && price <= MAX_PRICE &&
                    !invalidKeywords.some(kw => name.includes(kw))) {
                    items.push({ name, price });
                    console.log(`Matched fallback: "${name}" = ${price}`);
                }
            }
        }
    }

    // 去重（相同名称的只保留第一个）
    const seen = new Set();
    const uniqueItems = items.filter(item => {
        if (seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
    });

    return uniqueItems;
}

/**
 * 完整的账单识别流程
 * @param {string} imageDataUrl - Base64图片数据
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<{items: Array, rawText: string, confidence: number}>}
 */
export async function scanReceipt(imageDataUrl, onProgress = () => {}) {
    onProgress({ stage: 'initializing', progress: 0 });

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