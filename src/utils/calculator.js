/**
 * 精准 AA 计算核心逻辑
 * 将餐费分为"已认领百分比"和"公共未认领百分比"，将公共部分平摊给所有人
 */

/**
 * 计算每个人的最终应付金额
 * @param {Array} participants - 所有参与者列表，例如 [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]
 * @param {Array} items - 所有餐品列表，例如 [{id: 'i1', name: 'Pizza', price: 40}]
 * @param {Object} allocations - 分配映射表。
 * {
 *   'i1': { // 披萨
 *      1: 20, // Alice 认领 20%
 *      2: 20  // Bob 认领 20%
 *   }
 * }
 * @returns {Array} 每个人应付细节及总额 [{ participantId: 1, name: 'Alice', total: 10, details: [...] }]
 */
export function calculateBalances(participants, items, allocations) {
    if (!participants || participants.length === 0) return [];
    if (!items || items.length === 0) return participants.map(p => ({ ...p, total: 0, details: [] }));

    const numPeople = participants.length;
    // 初始化每个人的账单结果结构
    const results = participants.reduce((acc, p) => {
        acc[p.id] = { id: p.id, name: p.name, total: 0, details: [] };
        return acc;
    }, {});

    items.forEach(item => {
        const itemConfig = allocations[item.id] || {};
        let totalClaimedPercent = 0;

        // 计算此餐品已被认领的百分比总数
        participants.forEach(p => {
            totalClaimedPercent += itemConfig[p.id] || 0;
        });

        // 计算未认领部分
        let unclaimedPercent = 100 - totalClaimedPercent;
        if (unclaimedPercent < 0) unclaimedPercent = 0; // 兜底：理论上 UI 层会拦截超过 100% 的情况

        const unclaimedSharePerPerson = unclaimedPercent / numPeople; // 未认领部分平摊

        // 转化为金额分配给每个人
        participants.forEach(p => {
            const pClaimedPercent = itemConfig[p.id] || 0;
            const finalPercent = pClaimedPercent + unclaimedSharePerPerson;
            const claimedCost = (pClaimedPercent / 100) * item.price;
            const autoCost = (unclaimedSharePerPerson / 100) * item.price;
            const costForThisItem = claimedCost + autoCost;

            results[p.id].total += costForThisItem;

            // 记录明细（含认领/自动平摊拆分）
            results[p.id].details.push({
                itemId: item.id,
                itemName: item.name,
                itemPrice: item.price,
                claimedPercent: pClaimedPercent,
                autoPercent: unclaimedSharePerPerson,
                finalPercent: finalPercent,
                claimedCost: claimedCost,
                autoCost: autoCost,
                cost: costForThisItem
            });
        });
    });

    // 格式化输出为数组并处理浮点数精度保留2位
    return Object.values(results).map(r => ({
        ...r,
        total: Math.round(r.total * 100) / 100, // 规避浮点数问题
        details: r.details.map(d => ({
            ...d,
            cost: Math.round(d.cost * 100) / 100
        }))
    }));
}
