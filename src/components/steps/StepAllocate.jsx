import React, { useState, useMemo } from 'react';

/**
 * 步骤3：认领与分配 (核心交互)
 */
function StepAllocate({ participants, items, allocations, setAllocations, onNext, onPrev }) {
    const [activeItemIndex, setActiveItemIndex] = useState(0);

    if (items.length === 0) return null;
    const currentItem = items[activeItemIndex];

    // 提取当前项的分摊数据
    const itemAllocation = allocations[currentItem.id] || {};

    // 计算当前项已认领的总比例
    let totalClaimed = 0;
    participants.forEach(p => {
        const pConfig = itemAllocation[p.id] || {};
        totalClaimed += pConfig.claimed || 0;
    });
    const unclaimed = Math.max(0, 100 - totalClaimed);
    const isOverAllocated = totalClaimed > 100;

    // 获取某个人的认领百分比
    const getClaimedPercent = (participantId) => {
        const pConfig = itemAllocation[participantId] || {};
        return pConfig.claimed || 0;
    };

    const handlePercentageChange = (participantId, value) => {
        const val = parseInt(value, 10) || 0;
        setAllocations(prev => ({
            ...prev,
            [currentItem.id]: {
                ...(prev[currentItem.id] || {}),
                [participantId]: {
                    ...(prev[currentItem.id]?.[participantId] || {}),
                    claimed: val
                }
            }
        }));
    };

    const handleQuickSet = (participantId, value) => {
        handlePercentageChange(participantId, value);
    };

    // 快速均分当前菜品给所有人
    const handleSplitEqually = () => {
        const percentPerPerson = Math.floor(100 / participants.length);
        const remainder = 100 - percentPerPerson * participants.length;

        const newAllocation = {};
        participants.forEach((p, idx) => {
            newAllocation[p.id] = {
                ...(allocations[currentItem.id]?.[p.id] || {}),
                claimed: percentPerPerson + (idx === 0 ? remainder : 0)
            };
        });

        setAllocations(prev => ({
            ...prev,
            [currentItem.id]: newAllocation
        }));
    };

    // 清空当前菜品的分配
    const handleClearAllocation = () => {
        setAllocations(prev => {
            const newAlloc = { ...prev };
            if (newAlloc[currentItem.id]) {
                // 保留 assigned，只清除 claimed
                Object.keys(newAlloc[currentItem.id]).forEach(pId => {
                    newAlloc[currentItem.id][pId] = {
                        ...newAlloc[currentItem.id][pId],
                        claimed: 0
                    };
                });
            }
            return newAlloc;
        });
    };

    const handleNextItem = () => {
        if (activeItemIndex < items.length - 1) {
            setActiveItemIndex(activeItemIndex + 1);
        } else {
            onNext();
        }
    };

    const handlePrevItem = () => {
        if (activeItemIndex > 0) {
            setActiveItemIndex(activeItemIndex - 1);
        } else {
            onPrev();
        }
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* 进度指示器 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                padding: '0.5rem 0'
            }}>
                {items.map((item, idx) => {
                    const itemAlloc = allocations[item.id] || {};
                    let total = 0;
                    participants.forEach(p => {
                        total += (itemAlloc[p.id]?.claimed || 0);
                    });
                    const isComplete = total === 100;
                    const isCurrent = idx === activeItemIndex;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveItemIndex(idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: 'none',
                                background: isCurrent ? 'var(--color-primary)' :
                                          isComplete ? 'var(--color-success)' : 'var(--border-glass)',
                                color: (isCurrent || isComplete) ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: isCurrent ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
                            }}
                        >
                            {isComplete ? '✓' : idx + 1}
                        </button>
                    );
                })}
            </div>

            {/* 当前菜品信息 */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', textAlign: 'center',
                border: '1px solid var(--border-glass)'
            }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{currentItem.name}</h2>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    ¥ {currentItem.price.toFixed(2)}
                </div>

                {/* 认领状态条 */}
                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <span style={{ color: isOverAllocated ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                            已分配: {totalClaimed}%
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                            {isOverAllocated ? '超出!' : `剩余: ${unclaimed}%`}
                        </span>
                    </div>
                    <div style={{
                        height: '10px',
                        background: 'var(--border-glass)',
                        borderRadius: '5px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(100, totalClaimed)}%`,
                            background: isOverAllocated ? 'var(--color-danger)' : 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    {isOverAllocated && (
                        <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 500 }}>
                            总比例超过 100%，请调整
                        </p>
                    )}
                </div>
            </div>

            {/* 快捷操作 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    onClick={handleSplitEqually}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-primary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                    }}
                >
                    ⚖️ 均分
                </button>
                <button
                    onClick={handleClearAllocation}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-danger)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                    }}
                >
                    🗑️ 清空
                </button>
            </div>

            {/* 滑块分配区 */}
            <div style={{ marginBottom: '2rem' }}>
                {participants.map(p => {
                    const pValue = getClaimedPercent(p.id);
                    return (
                        <div key={p.id} style={{
                            marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.6)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)',
                            transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600' }}>{p.name}</span>
                                <span style={{
                                    color: 'var(--color-primary)',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    minWidth: '50px',
                                    textAlign: 'right'
                                }}>
                                    {pValue}%
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0" max="100" step="5"
                                value={pValue}
                                onChange={(e) => handlePercentageChange(p.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    marginBottom: '0.75rem',
                                    accentColor: 'var(--color-primary)'
                                }}
                            />

                            {/* 快捷按钮 */}
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {[0, 25, 50, 75, 100].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleQuickSet(p.id, val)}
                                        style={{
                                            flex: 1,
                                            padding: '0.35rem 0',
                                            fontSize: '0.75rem',
                                            background: pValue === val ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)',
                                            color: pValue === val ? 'white' : 'var(--text-main)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {val === 0 ? '没吃' : val === 100 ? '全包' : `${val}%`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 底部导航 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    className="btn-secondary"
                    onClick={handlePrevItem}
                    style={{ flex: 1 }}
                >
                    {activeItemIndex === 0 ? '上一步' : '上一项'}
                </button>
                <button
                    className="btn-primary"
                    onClick={handleNextItem}
                    disabled={isOverAllocated}
                    style={{ flex: 2, opacity: isOverAllocated ? 0.5 : 1 }}
                >
                    {activeItemIndex === items.length - 1 ? '下一步' : '下一项'}
                </button>
            </div>
        </div>
    );
}

export default StepAllocate;