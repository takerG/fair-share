/**
 * AA 账单计算核心逻辑
 * 将餐费分为"认领"、"指定"、"平摊"三种类型
 */

/**
 * 计算每个人的最终应付金额
 * @param {Array} participants - 所有参与者列表，例如 [{id: 'p1', name: 'Alice'}, {id: 'p2', name: 'Bob'}]
 * @param {Array} items - 所有餐品列表，例如 [{id: 'i1', name: 'Pizza', price: 40}]
 * @param {Object} allocations - 分配映射表。
 * {
 *   'i1': { // 披萨
 *      'p1': { claimed: 20, assigned: 10 }, // Alice 认领 20%，指定 10%
 *      'p2': { claimed: 30 } // Bob 认领 30%
 *   }
 * }
 * @returns {Array} 每个人应付细节及总额 [{ id: 'p1', name: 'Alice', total: 10, details: [...] }]
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
        let totalAssignedPercent = 0;

        // 计算此餐品已认领和已指定的百分比总数
        participants.forEach(p => {
            const pConfig = itemConfig[p.id] || {};
            totalClaimedPercent += pConfig.claimed || 0;
            totalAssignedPercent += pConfig.assigned || 0;
        });

        const totalAllocated = totalClaimedPercent + totalAssignedPercent;

        // 计算未分配部分（需要平摊）
        let unclaimedPercent = 100 - totalAllocated;
        if (unclaimedPercent < 0) unclaimedPercent = 0;

        const splitPercentPerPerson = unclaimedPercent / numPeople; // 平摊给每个人

        // 转化为金额分配给每个人
        participants.forEach(p => {
            const pConfig = itemConfig[p.id] || {};
            const claimedPercent = pConfig.claimed || 0;
            const assignedPercent = pConfig.assigned || 0;
            const splitPercent = splitPercentPerPerson;

            const finalPercent = claimedPercent + assignedPercent + splitPercent;
            const claimedCost = (claimedPercent / 100) * item.price;
            const assignedCost = (assignedPercent / 100) * item.price;
            const splitCost = (splitPercent / 100) * item.price;
            const costForThisItem = claimedCost + assignedCost + splitCost;

            results[p.id].total += costForThisItem;

            // 记录明细（含认领/指定/平摊拆分）
            results[p.id].details.push({
                itemId: item.id,
                itemName: item.name,
                itemPrice: item.price,
                claimedPercent,
                assignedPercent,
                splitPercent,
                finalPercent,
                claimedCost,
                assignedCost,
                splitCost,
                cost: costForThisItem
            });
        });
    });

    // 格式化输出为数组并处理浮点数精度保留2位
    return Object.values(results).map(r => ({
        ...r,
        total: Math.round(r.total * 100) / 100,
        details: r.details.map(d => ({
            ...d,
            cost: Math.round(d.cost * 100) / 100
        }))
    }));
}