import React, { useMemo } from 'react';
import { calculateBalances } from '../../utils/calculator';

/**
 * 步骤4：清算时刻 - 最终账单结算与构成明细展示
 */
function StepResult({ participants, items, allocations, onPrev }) {

    const results = useMemo(() => {
        return calculateBalances(participants, items, allocations);
    }, [participants, items, allocations]);

    const totalBill = items.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            <div style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem',
                color: 'white', textAlign: 'center', boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>💸 这顿饭的总代价</div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: 0 }}>¥ {totalBill.toFixed(2)}</h2>
            </div>

            <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '1px' }}>
                🔍 各嫌疑人的罪行明细
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {results.map((person) => (
                    <div key={person.id} style={{
                        background: 'rgba(255,255,255, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{person.name}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                ¥ {person.total.toFixed(2)}
                            </span>
                        </div>

                        {/* 构成明细：认领 + 自动平摊 拆分展示 */}
                        <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                            {person.details.length > 0 ? (
                                person.details.map((detail, idx) => (
                                    <div key={idx} style={{ marginBottom: '0.75rem' }}>
                                        {/* 餐品名与总费用 */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            <span>{detail.itemName}</span>
                                            <span>¥ {detail.cost.toFixed(2)}</span>
                                        </div>
                                        {/* 拆分：自觉认领 + 自动平摊 */}
                                        <div style={{ paddingLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                            {detail.claimedPercent > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>🙋 自觉认领 {Math.round(detail.claimedPercent)}%</span>
                                                    <span>¥ {detail.claimedCost.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {detail.autoPercent > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>🤷 连坐平摊 {Math.round(detail.autoPercent)}%</span>
                                                    <span>¥ {detail.autoCost.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {detail.claimedPercent === 0 && detail.autoPercent === 0 && (
                                                <div>✅ 与此菜无瓜</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>这位倒是清白的</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 底部操作 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>翻案重审</button>
                <button className="btn-primary" onClick={() => window.print()} style={{ flex: 2 }}>
                    判决生效，打印账单
                </button>
            </div>

        </div>
    );
}

export default StepResult;
