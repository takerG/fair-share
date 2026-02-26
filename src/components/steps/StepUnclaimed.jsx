import React, { useMemo, useState, useEffect } from 'react';

/**
 * 步骤：处理未分配部分
 * 显示所有未分配满100%的物品，让用户选择平摊或指定归属
 * 注意：只处理 claimed 之外的部分，assigned 由本步骤设置
 */
function StepUnclaimed({ participants, items, allocations, setAllocations, onNext, onPrev }) {
    // 计算每个物品的未分配情况（只看 claimed，不看 assigned）
    const unclaimedItems = useMemo(() => {
        return items.map(item => {
            const itemAlloc = allocations[item.id] || {};
            let totalClaimed = 0;
            let totalAssigned = 0;

            participants.forEach(p => {
                const pConfig = itemAlloc[p.id] || {};
                totalClaimed += pConfig.claimed || 0;
                totalAssigned += pConfig.assigned || 0;
            });

            const unclaimedPercent = Math.max(0, 100 - totalClaimed - totalAssigned);
            const unclaimedAmount = (unclaimedPercent / 100) * item.price;

            return {
                ...item,
                totalClaimed,
                totalAssigned,
                unclaimedPercent,
                unclaimedAmount
            };
        }).filter(item => item.unclaimedPercent > 0);
    }, [items, allocations, participants]);

    // 每个未分配物品的处理方式: 'split' | 'assign' | null
    // 初始化时，如果已有 assigned 数据，恢复之前的选择
    const [handleModes, setHandleModes] = useState(() => {
        const modes = {};
        items.forEach(item => {
            const itemAlloc = allocations[item.id] || {};
            // 检查是否有 assigned 数据
            let hasAssigned = false;
            let assignedTo = null;

            participants.forEach(p => {
                const pConfig = itemAlloc[p.id] || {};
                if (pConfig.assigned > 0) {
                    hasAssigned = true;
                    assignedTo = p.id;
                }
            });

            if (hasAssigned && assignedTo) {
                modes[item.id] = 'assign';
            } else if (Object.keys(itemAlloc).length > 0) {
                // 如果有认领数据但没有指定，默认为平摊
                modes[item.id] = 'split';
            }
        });
        return modes;
    });

    const [assignTargets, setAssignTargets] = useState(() => {
        const targets = {};
        items.forEach(item => {
            const itemAlloc = allocations[item.id] || {};
            participants.forEach(p => {
                const pConfig = itemAlloc[p.id] || {};
                if (pConfig.assigned > 0) {
                    targets[item.id] = p.id;
                }
            });
        });
        return targets;
    });

    const hasUnclaimed = unclaimedItems.length > 0;

    // 设置处理方式
    const setHandleMode = (itemId, mode) => {
        setHandleModes(prev => ({ ...prev, [itemId]: mode }));
        if (mode === 'split') {
            // 清除指定对象
            setAssignTargets(prev => {
                const next = { ...prev };
                delete next[itemId];
                return next;
            });
        }
    };

    // 设置指定对象
    const setAssignTarget = (itemId, participantId) => {
        setAssignTargets(prev => ({ ...prev, [itemId]: participantId }));
    };

    // 检查是否所有未分配物品都已处理
    const allHandled = unclaimedItems.every(item => {
        const mode = handleModes[item.id];
        if (mode === 'split') return true;
        if (mode === 'assign') return assignTargets[item.id] != null;
        return false;
    });

    // 确认处理
    const handleConfirm = () => {
        if (!allHandled) return;

        // 更新 allocations，只修改 assigned 字段
        const newAllocations = { ...allocations };

        unclaimedItems.forEach(item => {
            const mode = handleModes[item.id];
            if (!newAllocations[item.id]) {
                newAllocations[item.id] = {};
            }

            // 先清除所有之前的 assigned
            participants.forEach(p => {
                if (!newAllocations[item.id][p.id]) {
                    newAllocations[item.id][p.id] = {};
                }
                // 保留 claimed，清除 assigned
                const claimed = newAllocations[item.id][p.id].claimed || 0;
                newAllocations[item.id][p.id] = { claimed };
            });

            if (mode === 'assign') {
                // 指定给某人
                const targetId = assignTargets[item.id];
                if (targetId && newAllocations[item.id][targetId]) {
                    newAllocations[item.id][targetId].assigned = item.unclaimedPercent;
                } else if (targetId) {
                    newAllocations[item.id][targetId] = { claimed: 0, assigned: item.unclaimedPercent };
                }
            }
            // split 模式：不需要设置 assigned，由 calculator 自动平摊
        });

        setAllocations(newAllocations);
        onNext();
    };

    // 如果没有未分配物品，直接跳过
    if (!hasUnclaimed) {
        return (
            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>所有物品都已分配完毕</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        没有需要处理的部分
                    </p>
                    <button className="btn-primary" onClick={onNext}>
                        查看结果
                    </button>
                </div>
            </div>
        );
    }

    // 计算总未分配金额
    const totalUnclaimed = unclaimedItems.reduce((sum, item) => sum + item.unclaimedAmount, 0);

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* 提示信息 */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem'
            }}>
                <p style={{ color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    有 {unclaimedItems.length} 项物品未完全分配
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    共计 ¥{totalUnclaimed.toFixed(2)} 需要处理
                </p>
            </div>

            {/* 未分配物品列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {unclaimedItems.map(item => (
                    <div key={item.id} style={{
                        background: 'rgba(255,255,255, 0.8)',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        {/* 物品信息 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                                ¥{item.unclaimedAmount.toFixed(2)} 未分配 ({item.unclaimedPercent}%)
                            </span>
                        </div>

                        {/* 已认领信息 */}
                        {item.totalClaimed > 0 && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                已认领: {item.totalClaimed}%
                            </div>
                        )}

                        {/* 处理选项 */}
                        <div style={{ marginBottom: '0.75rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                选择处理方式：
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setHandleMode(item.id, 'split')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 1rem',
                                        background: handleModes[item.id] === 'split' ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)',
                                        color: handleModes[item.id] === 'split' ? 'white' : 'var(--color-primary)',
                                        border: '2px solid var(--color-primary)',
                                        borderRadius: 'var(--radius-full)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🤷 平摊给所有人
                                </button>
                                <button
                                    onClick={() => setHandleMode(item.id, 'assign')}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 1rem',
                                        background: handleModes[item.id] === 'assign' ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)',
                                        color: handleModes[item.id] === 'assign' ? 'white' : 'var(--color-primary)',
                                        border: '2px solid var(--color-primary)',
                                        borderRadius: 'var(--radius-full)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    👤 指定给某人
                                </button>
                            </div>
                        </div>

                        {/* 指定对象选择 */}
                        {handleModes[item.id] === 'assign' && (
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(99, 102, 241, 0.05)',
                                borderRadius: 'var(--radius-sm)',
                                marginTop: '0.5rem'
                            }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    选择归属人：
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {participants.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setAssignTarget(item.id, p.id)}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: 'var(--radius-full)',
                                                border: '2px solid',
                                                borderColor: assignTargets[item.id] === p.id ? 'var(--color-primary)' : 'var(--border-glass)',
                                                background: assignTargets[item.id] === p.id ? 'var(--color-primary)' : 'white',
                                                color: assignTargets[item.id] === p.id ? 'white' : 'var(--text-main)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 底部导航 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>
                    返回修改
                </button>
                <button
                    className="btn-primary"
                    onClick={handleConfirm}
                    disabled={!allHandled}
                    style={{ flex: 2, opacity: allHandled ? 1 : 0.5 }}
                >
                    确认并查看结果
                </button>
            </div>
        </div>
    );
}

export default StepUnclaimed;