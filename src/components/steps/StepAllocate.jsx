import React, { useState } from 'react';

/**
 * 步骤3：认领与分配 (核心交互)
 */
function StepAllocate({ participants, items, allocations, setAllocations, onNext, onPrev }) {
    const [activeItemIndex, setActiveItemIndex] = useState(0);

    if (items.length === 0) return null;
    const currentItem = items[activeItemIndex];

    // 提取当前项的分摊数据，未设置则默认为 0
    const itemAllocation = allocations[currentItem.id] || {};

    // 计算当前项已分配的总比例
    let totalAllocated = 0;
    participants.forEach(p => {
        totalAllocated += (itemAllocation[p.id] || 0);
    });
    const unallocated = Math.max(0, 100 - totalAllocated);
    const isOverAllocated = totalAllocated > 100;

    const handlePercentageChange = (participantId, value) => {
        const val = parseInt(value, 10) || 0;
        setAllocations(prev => ({
            ...prev,
            [currentItem.id]: {
                ...(prev[currentItem.id] || {}),
                [participantId]: val
            }
        }));
    };

    const handleQuickSet = (participantId, value) => {
        handlePercentageChange(participantId, value);
    };

    const handleNextItem = () => {
        if (activeItemIndex < items.length - 1) {
            setActiveItemIndex(activeItemIndex + 1);
        } else {
            onNext(); // 都分完了就去下一步
        }
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* 顶部指示器：当前在分摊哪个菜 */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', textAlign: 'center',
                border: '1px solid var(--border-glass)'
            }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    餐品录入进度 {activeItemIndex + 1} / {items.length}
                </div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>{currentItem.name}</h2>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>¥ {currentItem.price.toFixed(2)}</div>

                {/* 认领状态条 */}
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: isOverAllocated ? 'var(--color-danger)' : 'var(--text-main)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>已认领: {totalAllocated}%</span>
                        <span>待平摊: {isOverAllocated ? '错误' : `${unallocated}%`}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border-glass)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{
                            width: `${Math.min(100, totalAllocated)}%`,
                            background: isOverAllocated ? 'var(--color-danger)' : 'var(--color-success)',
                            transition: 'all 0.3s ease'
                        }}></div>
                        {!isOverAllocated && (
                            <div style={{
                                width: `${unallocated}%`,
                                background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
                                transition: 'all 0.3s ease'
                            }}></div>
                        )}
                    </div>
                    {isOverAllocated && (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>
                            总比例不能超过 100%
                        </div>
                    )}
                </div>
            </div>

            {/* 滑块分配区 */}
            <div style={{ marginBottom: '2rem' }}>
                {participants.map(p => {
                    const pValue = itemAllocation[p.id] || 0;
                    return (
                        <div key={p.id} style={{
                            marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.6)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{p.name}</span>
                                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{pValue}%</span>
                            </div>

                            <input
                                type="range"
                                min="0" max="100" step="5"
                                value={pValue}
                                onChange={(e) => handlePercentageChange(p.id, e.target.value)}
                                style={{ width: '100%', marginBottom: '1rem', accentColor: 'var(--color-primary)' }}
                            />

                            {/* 快捷按钮 */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-secondary btn-sm" style={{ flex: 1, padding: '0.25rem 0' }} onClick={() => handleQuickSet(p.id, 0)}>没吃</button>
                                <button className="btn-secondary btn-sm" style={{ flex: 1, padding: '0.25rem 0' }} onClick={() => handleQuickSet(p.id, 25)}>尝点</button>
                                <button className="btn-secondary btn-sm" style={{ flex: 1, padding: '0.25rem 0' }} onClick={() => handleQuickSet(p.id, 50)}>一半</button>
                                <button className="btn-secondary btn-sm" style={{ flex: 1, padding: '0.25rem 0' }} onClick={() => handleQuickSet(p.id, 100)}>全包</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 底部导航 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                {activeItemIndex === 0 ? (
                    <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>上一步</button>
                ) : (
                    <button className="btn-secondary" onClick={() => setActiveItemIndex(activeItemIndex - 1)} style={{ flex: 1 }}>上一餐品</button>
                )}

                <button
                    className="btn-primary"
                    onClick={handleNextItem}
                    disabled={isOverAllocated}
                    style={{ flex: 2, opacity: isOverAllocated ? 0.5 : 1 }}
                >
                    {activeItemIndex === items.length - 1 ? '查看结果' : '下一项'}
                </button>
            </div>

        </div>
    );
}

export default StepAllocate;
