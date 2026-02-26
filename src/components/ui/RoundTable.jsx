import React, { useMemo } from 'react';

// 食物 emoji 池子
const FOOD_EMOJIS = ['🍕', '🍔', '🍗', '🥗', '🍜', '🍣', '🥩', '🍰', '🧁', '🍺', '🥤', '🍷', '☕', '🍝', '🌮', '🥟', '🍱', '🦐', '🍲', '🍛'];

// 人物颜色池
const PERSON_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

/**
 * 圆桌可视化：现代化设计
 * 支持传入 results 作为结算数据将其转换为根据金额配比的饼状图
 */
function RoundTable({ participants, items, results }) {
    const tableSize = 200;
    const tableRadius = tableSize / 2;
    const personDistance = tableRadius + 32;

    // 为每个食物生成位置
    const foodPositions = useMemo(() => {
        return items.map((item, idx) => {
            const seed = item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const angle = ((seed * 137.508 + idx * 72) % 360) * (Math.PI / 180);
            const r = 25 + (seed % 40);
            return {
                ...item,
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                emoji: FOOD_EMOJIS[idx % FOOD_EMOJIS.length],
                rotate: (seed * 7) % 20 - 10
            };
        });
    }, [items]);

    // 结算页饼图
    const totalBill = useMemo(() => {
        if (!results) return 0;
        return results.reduce((sum, r) => sum + r.total, 0);
    }, [results]);

    const pieBackground = useMemo(() => {
        if (!results || totalBill === 0) return null;
        let currentAngle = 0;
        const slices = results.map((person) => {
            const pIdx = participants.findIndex(p => p.id === person.id);
            const color = PERSON_COLORS[(pIdx !== -1 ? pIdx : 0) % PERSON_COLORS.length];
            const percentage = (person.total / totalBill) * 100;
            if (percentage === 0) return null;
            const slice = `${color} ${currentAngle}% ${currentAngle + percentage}%`;
            currentAngle += percentage;
            return slice;
        }).filter(Boolean);
        return slices.length > 0 ? `conic-gradient(${slices.join(', ')})` : null;
    }, [results, participants, totalBill]);

    const hasContent = items.length > 0 || participants.length > 0;

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '0.75rem 0', marginBottom: '0.75rem', position: 'relative',
            minHeight: tableSize + 70
        }}>
            <div style={{ position: 'relative', width: tableSize + 70, height: tableSize + 70 }}>

                {/* 主圆形区域 */}
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: tableSize, height: tableSize,
                    borderRadius: '50%',
                    background: pieBackground || `
                        linear-gradient(135deg,
                            rgba(255,255,255,0.95) 0%,
                            rgba(248,250,252,0.9) 50%,
                            rgba(241,245,249,0.95) 100%)
                    `,
                    boxShadow: `
                        0 4px 24px rgba(99, 102, 241, 0.12),
                        0 1px 3px rgba(0,0,0,0.05),
                        inset 0 1px 0 rgba(255,255,255,0.8)
                    `,
                    border: '2px solid rgba(99, 102, 241, 0.15)',
                    overflow: 'hidden',
                    transition: 'all 0.4s ease'
                }}>
                    {/* 装饰性内圈 */}
                    <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: tableSize - 30, height: tableSize - 30,
                        borderRadius: '50%',
                        background: pieBackground ? 'transparent' : `
                            linear-gradient(135deg,
                                rgba(99, 102, 241, 0.05) 0%,
                                rgba(236, 72, 153, 0.03) 100%)
                        `,
                        border: pieBackground ? 'none' : '1px dashed rgba(99, 102, 241, 0.15)'
                    }} />

                    {/* 食物分布 */}
                    {foodPositions.map((food, idx) => (
                        <div key={food.id} style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: `translate(calc(-50% + ${food.x}px), calc(-50% + ${food.y}px)) rotate(${food.rotate}deg)`,
                            fontSize: '1.4rem',
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            animation: 'foodPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                            zIndex: 2
                        }}
                            title={`${food.name} ¥${food.price}`}
                        >
                            {food.emoji}
                        </div>
                    ))}

                    {/* 空状态 */}
                    {items.length === 0 && !pieBackground && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', gap: '0.25rem'
                        }}>
                            <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>🍽️</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 500 }}>
                                {participants.length > 0 ? '等待添加菜品' : '等待开席'}
                            </span>
                        </div>
                    )}
                </div>

                {/* 参与者环绕 */}
                {participants.map((p, idx) => {
                    const angle = (idx / Math.max(participants.length, 1)) * 2 * Math.PI - Math.PI / 2;
                    const x = Math.cos(angle) * personDistance;
                    const y = Math.sin(angle) * personDistance;
                    const color = PERSON_COLORS[idx % PERSON_COLORS.length];

                    return (
                        <div key={p.id} style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            animation: 'seatBounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            zIndex: 3
                        }}>
                            {/* 头像 */}
                            <div style={{
                                width: 32, height: 32,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '0.8rem',
                                boxShadow: `0 2px 8px ${color}55`,
                                border: '2px solid white'
                            }}>
                                {p.name.charAt(0)}
                            </div>
                            {/* 名称 */}
                            <span style={{
                                fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-main)',
                                background: 'rgba(255,255,255,0.9)', padding: '1px 5px',
                                borderRadius: '4px', whiteSpace: 'nowrap', maxWidth: '55px',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                            }}>
                                {p.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 动画样式 */}
            <style>{`
                @keyframes foodPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                @keyframes seatBounce {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    60% { transform: translate(-50%, -50%) scale(1.15); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default RoundTable;