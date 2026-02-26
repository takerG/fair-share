import React, { useMemo } from 'react';

// 食物 emoji 池子
const FOOD_EMOJIS = ['🍕', '🍔', '🍗', '🥗', '🍜', '🍣', '🥩', '🍰', '🧁', '🍺', '🥤', '🍷', '☕', '🍝', '🌮', '🥟', '🍱', '🦐', '🍲', '🍛'];

// 人物颜色池
const PERSON_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

/**
 * 圆桌可视化：参与者围坐在桌边，食物散布在桌面上
 */
function RoundTable({ participants, items }) {
    const tableSize = 220;
    const tableRadius = tableSize / 2;
    const personDistance = tableRadius + 36; // 人物离圆心的距离

    // 为每个食物生成稳定的随机位置（基于 id 的哈希）
    const foodPositions = useMemo(() => {
        return items.map((item, idx) => {
            // 用简单的伪随机让同一个 item 的位置稳定
            const seed = item.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const angle = ((seed * 137.508 + idx * 72) % 360) * (Math.PI / 180);
            const r = 20 + (seed % 50); // 距离圆心 20~70px
            return {
                ...item,
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                emoji: FOOD_EMOJIS[idx % FOOD_EMOJIS.length],
                rotate: (seed * 7) % 30 - 15 // -15° ~ 15° 随机旋转
            };
        });
    }, [items]);

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '1rem 0', marginBottom: '1rem', position: 'relative',
            minHeight: tableSize + 90
        }}>
            {/* 外层容器：参与者 + 桌子 */}
            <div style={{ position: 'relative', width: tableSize + 80, height: tableSize + 80 }}>

                {/* 圆桌 */}
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: tableSize, height: tableSize,
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse at 40% 40%, #d4a574, #b8895a, #9c7042)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 -4px 8px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2)',
                    border: '4px solid #8b6234',
                    overflow: 'hidden'
                }}>
                    {/* 桌面木纹装饰 */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'repeating-radial-gradient(circle at 50% 50%, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 22px)',
                    }} />

                    {/* 食物分布 */}
                    {foodPositions.map((food, idx) => (
                        <div key={food.id} style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: `translate(calc(-50% + ${food.x}px), calc(-50% + ${food.y}px)) rotate(${food.rotate}deg)`,
                            fontSize: '1.6rem',
                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            animation: 'foodPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            cursor: 'default',
                            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
                            zIndex: 2
                        }}
                            title={`${food.name} ¥${food.price}`}
                        >
                            {food.emoji}
                        </div>
                    ))}

                    {/* 空桌子提示 */}
                    {items.length === 0 && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600
                        }}>
                            空空如也...
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
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            animation: 'seatBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            zIndex: 3
                        }}>
                            {/* 头像圆形 */}
                            <div style={{
                                width: 36, height: 36,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                boxShadow: `0 3px 8px ${color}44`,
                                border: '2px solid white'
                            }}>
                                {p.name.charAt(0)}
                            </div>
                            {/* 名称 */}
                            <span style={{
                                fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)',
                                background: 'rgba(255,255,255,0.85)', padding: '1px 6px',
                                borderRadius: '6px', whiteSpace: 'nowrap', maxWidth: '60px',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
                    60% { transform: translate(-50%, -50%) scale(1.2); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default RoundTable;
