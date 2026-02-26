/**
 * 本地OCR识别账单图片
 * 使用动态导入延迟加载 Tesseract.js，避免阻塞页面加载
 */

/**
 * 图片预处理 - 增强对比度，转灰度
 */
function preprocessImage(imageDataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const maxSize = 2000;
            let width = img.width;
            let height = img.height;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const contrast = 1.5;
                const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
                const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
                const threshold = 180;
                const final = newGray > threshold ? 255 : 0;
                data[i] = final;
                data[i + 1] = final;
                data[i + 2] = final;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(imageDataUrl);
        img.src = imageDataUrl;
    });
}

// 备用 CDN 列表（国内友好）
const LANG_PATHS = [
    'https://unpkg.com/tessdata@5/dist',
    'https://cdn.jsdelivr.net/npm/tessdata@5/dist'
];

/**
 * 识别图片中的文字（动态加载 Tesseract）
 */
async function recognizeText(imageDataUrl, onProgress = () => {}) {
    onProgress({ stage: 'preprocessing', progress: 5 });
    const processedImage = await preprocessImage(imageDataUrl);
    onProgress({ stage: 'loading', progress: 10 });

    // 动态导入 Tesseract
    const Tesseract = await import('tesseract.js');

    let lastError = null;
    for (const langPath of LANG_PATHS) {
        try {
            const result = await Tesseract.recognize(processedImage, 'chi_sim+eng', {
                logger: (m) => {
                    if (m.status === 'loading tesseract core') {
                        onProgress({ stage: 'loading', progress: 10 + m.progress * 10 });
                    } else if (m.status === 'initializing tesseract') {
                        onProgress({ stage: 'initializing', progress: 20 + m.progress * 10 });
                    } else if (m.status === 'loading language traineddata') {
                        onProgress({ stage: 'loading-lang', progress: 30 + m.progress * 30 });
                    } else if (m.status === 'initializing api') {
                        onProgress({ stage: 'initializing-api', progress: 60 + m.progress * 10 });
                    } else if (m.status === 'recognizing text') {
                        onProgress({ stage: 'recognizing', progress: 70 + m.progress * 30 });
                    }
                },
                langPath
            });

            return {
                text: result.data.text,
                confidence: result.data.confidence
            };
        } catch (error) {
            console.warn('OCR CDN failed:', langPath, error.message);
            lastError = error;
        }
    }

    throw lastError || new Error('OCR识别失败');
}

/**
 * 从识别的文本中提取菜品和价格
 */
export function parseReceiptText(text) {
    const items = [];
    const lines = text.split(/[\r\n]+/).map(line => line.trim()).filter(Boolean);

    const patterns = [
        /^[\s]*(\d*[\s]*)?([^\d\r\n]+?)[\s]*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元?[\s]*$/,
        /^[\s]*(\d*[\s]*)?([^\d\r\n.]+?)[\s.·:：]+\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*$/,
        /^[\s]*[¥￥]\s*(\d+(?:\.\d{1,2})?)[\s]+([^\d\r\n]+?)[\s]*$/,
    ];

    const invalidKeywords = [
        '合计', '总计', '小计', '优惠', '折扣', '找零', '实付', '应付', '应收',
        '微信', '支付宝', '现金', '刷卡', '会员', '积分', '电话', '地址', '时间',
        '日期', '订单', '编号', '收银', '欢迎', '谢谢', '发票', '盖章', '签名',
        '备注', '说明', '温馨提示', '扫码', '关注', '公众号', '店铺', '店名',
        '桌号', '人数', '服务', '包装', '配送', '外卖', '满减', '优惠券', '收货',
        '联系人', '手机', '付款', '金额', '数量', '单价', '品类', '品名'
    ];

    const MIN_PRICE = 1;
    const MAX_PRICE = 50000;

    for (const line of lines) {
        if (!line || line.length < 2) continue;
        if (invalidKeywords.some(kw => line.includes(kw))) continue;
        if (!/\d/.test(line)) continue;

        for (let i = 0; i < patterns.length; i++) {
            const match = line.match(patterns[i]);
            if (match) {
                let name, price;
                if (i === 2) {
                    price = parseFloat(match[1]);
                    name = match[2].trim();
                } else {
                    name = match[2].trim();
                    price = parseFloat(match[3]);
                }

                name = name.replace(/[\s¥￥元.·:：]+/g, '').trim();

                if (name.length >= 1 && name.length <= 30 &&
                    !isNaN(price) && price >= MIN_PRICE && price <= MAX_PRICE &&
                    !invalidKeywords.some(kw => name.includes(kw))) {
                    items.push({ name, price });
                    break;
                }
            }
        }

        // 宽松匹配
        const numbers = line.match(/\d+(?:\.\d{1,2})?/g);
        if (numbers && numbers.length > 0 && items.findIndex(i => line.includes(i.name)) === -1) {
            const lastNum = numbers[numbers.length - 1];
            const potentialPrice = parseFloat(lastNum);
            const priceIndex = line.lastIndexOf(lastNum);
            let potentialName = line.substring(0, priceIndex).trim();
            potentialName = potentialName.replace(/^[\d\s]+/, '').replace(/[\s¥￥元.·:：]+$/g, '').trim();

            if (potentialName.length >= 1 && potentialName.length <= 30 &&
                potentialPrice >= MIN_PRICE && potentialPrice <= MAX_PRICE &&
                !invalidKeywords.some(kw => potentialName.includes(kw))) {
                items.push({ name: potentialName, price: potentialPrice });
            }
        }
    }

    // 去重
    const seen = new Set();
    return items.filter(item => {
        const key = `${item.name}_${item.price}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * 完整的账单识别流程
 */
export async function scanReceipt(imageDataUrl, onProgress = () => {}) {
    const { text, confidence } = await recognizeText(imageDataUrl, onProgress);
    onProgress({ stage: 'parsing', progress: 100 });
    const items = parseReceiptText(text);
    return { items, rawText: text, confidence };
}