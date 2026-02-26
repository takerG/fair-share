import React, { useMemo, useState } from 'react';

/**
 * 步骤：处理未分配部分
 */
function StepUnclaimed({ participants, items, allocations, setAllocations, onNext, onPrev }) {
    // 计算每个物品的未分配情况
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

    // 处理方式状态
    const [handleModes, setHandleModes] = useState(() => {
        const modes = {};
        items.forEach(item => {
            const itemAlloc = allocations[item.id] || {};
            participants.forEach(p => {
                const pConfig = itemAlloc[p.id] || {};
                if (pConfig.assigned > 0) {
                    modes[item.id] = 'assign';
                }
            });
            if (!modes[item.id]) {
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

    const setHandleMode = (itemId, mode) => {
        setHandleModes(prev => ({ ...prev, [itemId]: mode }));
        if (mode === 'split') {
            setAssignTargets(prev => {
                const next = { ...prev };
                delete next[itemId];
                return next;
            });
        }
    };

    const setAssignTarget = (itemId, participantId) => {
        setAssignTargets(prev => ({ ...prev, [itemId]: participantId }));
    };

    const allHandled = unclaimedItems.every(item => {
        const mode = handleModes[item.id];
        if (mode === 'split') return true;
        if (mode === 'assign') return assignTargets[item.id] != null;
        return false;
    });

    const handleConfirm = () => {
        if (!allHandled) return;

        const newAllocations = { ...allocations };

        unclaimedItems.forEach(item => {
            const mode = handleModes[item.id];
            if (!newAllocations[item.id]) {
                newAllocations[item.id] = {};
            }

            participants.forEach(p => {
                if (!newAllocations[item.id][p.id]) {
                    newAllocations[item.id][p.id] = {};
                }
                const claimed = newAllocations[item.id][p.id].claimed || 0;
                newAllocations[item.id][p.id] = { claimed };
            });

            if (mode === 'assign') {
                const targetId = assignTargets[item.id];
                if (targetId && newAllocations[item.id][targetId]) {
                    newAllocations[item.id][targetId].assigned = item.unclaimedPercent;
                } else if (targetId) {
                    newAllocations[item.id][targetId] = { claimed: 0, assigned: item.unclaimedPercent };
                }
            }
        });

        setAllocations(newAllocations);
        onNext();
    };

    // 全部平摊
    const handleSplitAll = () => {
        const modes = {};
        unclaimedItems.forEach(item => {
            modes[item.id] = 'split';
        });
        setHandleModes(modes);
        setAssignTargets({});
    };

    if (!hasUnclaimed) {
        return (
            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>所有物品都已分配完毕</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>无需额外处理</p>
                    <button className="btn-primary" onClick={onNext}>查看结果</button>
                </div>
            </div>
        );
    }

    const totalUnclaimed = unclaimedItems.reduce((sum, item) => sum + item.unclaimedAmount, 0);

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* 提示信息 */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1rem'
            }}>
                <p style={{ color: 'var(--color-accent)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    ⚠️ 有 {unclaimedItems.length} 项未完全分配
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                    未分配金额: <strong style={{ color: 'var(--color-danger)' }}>¥{totalUnclaimed.toFixed(2)}</strong>
                </p>
            </div>

            {/* 快捷操作 */}
            <div style={{ marginBottom: '1rem' }}>
                <button
                    onClick={handleSplitAll}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    🤷 全部平摊给所有人
                </button>
            </div>

            {/* 未分配物品列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {unclaimedItems.map(item => (
                    <div key={item.id} style={{
                        background: 'rgba(255,255,255, 0.8)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                            <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.9rem' }}>
                                ¥{item.unclaimedAmount.toFixed(2)} ({item.unclaimedPercent}%)
                            </span>
                        </div>

                        {/* 处理选项 */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setHandleMode(item.id, 'split')}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: handleModes[item.id] === 'split' ? 'var(--color-primary)' : 'white',
                                    color: handleModes[item.id] === 'split' ? 'white' : 'var(--text-main)',
                                    border: '2px solid var(--color-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🤷 平摊
                            </button>
                            <button
                                onClick={() => setHandleMode(item.id, 'assign')}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: handleModes[item.id] === 'assign' ? 'var(--color-primary)' : 'white',
                                    color: handleModes[item.id] === 'assign' ? 'white' : 'var(--text-main)',
                                    border: '2px solid var(--color-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                👤 指定
                            </button>
                        </div>

                        {/* 指定对象选择 */}
                        {handleModes[item.id] === 'assign' && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {participants.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setAssignTarget(item.id, p.id)}
                                            style={{
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: 'var(--radius-full)',
                                                border: '2px solid',
                                                borderColor: assignTargets[item.id] === p.id ? 'var(--color-primary)' : 'var(--border-glass)',
                                                background: assignTargets[item.id] === p.id ? 'var(--color-primary)' : 'white',
                                                color: assignTargets[item.id] === p.id ? 'white' : 'var(--text-main)',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
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
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>返回</button>
                <button
                    className="btn-primary"
                    onClick={handleConfirm}
                    disabled={!allHandled}
                    style={{ flex: 2, opacity: allHandled ? 1 : 0.5 }}
                >
                    确认
                </button>
            </div>
        </div>
    );
}

export default StepUnclaimed;