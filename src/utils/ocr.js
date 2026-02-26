import Tesseract from 'tesseract.js';

/**
 * 本地OCR识别账单图片
 * 使用 Tesseract.js 进行本地文字识别
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

            // 缩放到合适大小，提高识别率
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

            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // 转灰度并增强对比度
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                // 增强对比度
                const contrast = 1.5;
                const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
                const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

                // 二值化
                const threshold = 180;
                const final = newGray > threshold ? 255 : 0;

                data[i] = final;
                data[i + 1] = final;
                data[i + 2] = final;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = imageDataUrl;
    });
}

/**
 * 识别图片中的文字
 * @param {string} imageDataUrl - Base64图片数据
 * @param {Function} onProgress - 进度回调 (progress: 0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(imageDataUrl, onProgress = () => {}) {
    try {
        // 预处理图片
        onProgress({ stage: 'preprocessing', progress: 5 });
        const processedImage = await preprocessImage(imageDataUrl);
        onProgress({ stage: 'loading', progress: 10 });

        const result = await Tesseract.recognize(processedImage, 'chi_sim+eng', {
            logger: (m) => {
                console.log('Tesseract:', m.status, m.progress);
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
            langPath: 'https://cdn.jsdelivr.net/npm/tessdata@5/dist'
        });

        console.log('OCR Result:', result.data);

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

    console.log('=== OCR Raw Text ===');
    console.log(text);
    console.log('====================');

    // 按行分割，处理各种换行符
    const lines = text.split(/[\r\n]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

    console.log('Parsed lines:', lines);

    // 中文菜品名的常见模式
    // 匹配：菜名 + 价格
    // 支持格式：
    // 1. 宫保鸡丁 28
    // 2. 宫保鸡丁 ¥28
    // 3. 宫保鸡丁 28元
    // 4. 宫保鸡丁 28.00
    // 5. 1 宫保鸡丁 28 (带序号)
    // 6. 宫保鸡丁...28 (有分隔符)

    const patterns = [
        // 标准格式：菜名 数字（可能有小数）可选的"元"
        /^[\s]*(\d*[\s]*)?([^\d\r\n]+?)[\s]*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元?[\s]*$/,
        // 带点的分隔符
        /^[\s]*(\d*[\s]*)?([^\d\r\n.]+?)[\s.·:：]+\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*$/,
        // 价格在前：¥数字 菜名
        /^[\s]*[¥￥]\s*(\d+(?:\.\d{1,2})?)[\s]+([^\d\r\n]+?)[\s]*$/,
    ];

    // 过滤关键词 - 这些行不是菜品
    const invalidKeywords = [
        '合计', '总计', '小计', '优惠', '折扣', '找零', '实付', '应付', '应收',
        '微信', '支付宝', '现金', '刷卡', '会员', '积分', '电话', '地址', '时间',
        '日期', '订单', '编号', '收银', '欢迎', '谢谢', '发票', '盖章', '签名',
        '备注', '说明', '温馨提示', '扫码', '关注', '公众号', '店铺', '店名',
        '桌号', '人数', '服务', '包装', '配送', '外卖', '满减', '优惠券', '收货',
        '联系人', '手机', '付款', '金额', '数量', '单价', '品类', '品名'
    ];

    // 价格范围
    const MIN_PRICE = 1;
    const MAX_PRICE = 50000;

    for (const line of lines) {
        // 跳过空行
        if (!line || line.length < 2) continue;

        // 检查是否包含无效关键词
        if (invalidKeywords.some(kw => line.includes(kw))) {
            console.log(`Skipped (invalid keyword): ${line}`);
            continue;
        }

        // 检查是否包含数字
        if (!/\d/.test(line)) {
            console.log(`Skipped (no number): ${line}`);
            continue;
        }

        let matched = false;
        let name = '';
        let price = 0;

        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i];
            const match = line.match(pattern);

            if (match) {
                if (i === 2) {
                    // 价格在前的模式
                    price = parseFloat(match[1]);
                    name = match[2].trim();
                } else {
                    name = match[2].trim();
                    price = parseFloat(match[3]);
                }

                // 清理名称
                name = name.replace(/[\s¥￥元.·:：]+/g, '').trim();

                // 验证
                if (name.length >= 1 && name.length <= 30 &&
                    !isNaN(price) && price >= MIN_PRICE && price <= MAX_PRICE &&
                    !invalidKeywords.some(kw => name.includes(kw))) {
                    items.push({ name, price });
                    matched = true;
                    console.log(`Matched pattern ${i}: "${name}" = ¥${price}`);
                    break;
                }
            }
        }

        if (!matched) {
            // 尝试更宽松的匹配：提取行中最后一个数字作为价格
            const numbers = line.match(/\d+(?:\.\d{1,2})?/g);
            if (numbers && numbers.length > 0) {
                // 取最后一个数字作为价格
                const lastNum = numbers[numbers.length - 1];
                const potentialPrice = parseFloat(lastNum);

                // 价格前的内容作为名称
                const priceIndex = line.lastIndexOf(lastNum);
                let potentialName = line.substring(0, priceIndex).trim();
                // 清理名称
                potentialName = potentialName.replace(/^[\d\s]+/, '').replace(/[\s¥￥元.·:：]+$/g, '').trim();

                if (potentialName.length >= 1 && potentialName.length <= 30 &&
                    potentialPrice >= MIN_PRICE && potentialPrice <= MAX_PRICE &&
                    !invalidKeywords.some(kw => potentialName.includes(kw))) {
                    items.push({ name: potentialName, price: potentialPrice });
                    console.log(`Matched fallback: "${potentialName}" = ¥${potentialPrice}`);
                } else {
                    console.log(`Failed fallback: name="${potentialName}", price=${potentialPrice}`);
                }
            }
        }
    }

    // 去重
    const seen = new Set();
    const uniqueItems = items.filter(item => {
        const key = `${item.name}_${item.price}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log('Final items:', uniqueItems);
    return uniqueItems;
}

/**
 * 完整的账单识别流程
 * @param {string} imageDataUrl - Base64图片数据
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<{items: Array, rawText: string, confidence: number}>}
 */
export async function scanReceipt(imageDataUrl, onProgress = () => {}) {
    const { text, confidence } = await recognizeText(imageDataUrl, onProgress);

    onProgress({ stage: 'parsing', progress: 100 });

    const items = parseReceiptText(text);

    return {
        items,
        rawText: text,
        confidence
    };
}