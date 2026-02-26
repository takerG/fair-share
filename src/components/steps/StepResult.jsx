import React, { useMemo, useRef, useState } from 'react';
import { calculateBalances } from '../../utils/calculator';
import RoundTable from '../ui/RoundTable';
import html2canvas from 'html2canvas';

/**
 * 步骤4：清算时刻 - 最终账单结算与构成明细展示
 */
function StepResult({ participants, items, allocations, onPrev }) {
    const resultRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const results = useMemo(() => {
        return calculateBalances(participants, items, allocations);
    }, [participants, items, allocations]);

    const totalBill = items.reduce((sum, item) => sum + item.price, 0);

    const handleDownload = async () => {
        if (!resultRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(resultRef.current, {
                scale: window.devicePixelRatio || 2, // 保证清晰度
                useCORS: true,
                backgroundColor: '#f8fafc' // 提供一个浅底色避免透明底出现问题
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `极扣_账单_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('生成账单图片失败', error);
            alert('生成图片失败，请重试');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* 圆桌算账饼图联动 (排除在截图区域外) */}
            <RoundTable participants={participants} items={items} results={results} />

            {/* 用来被截图的区域：剔除了复杂的圆桌组件 */}
            <div ref={resultRef} style={{ padding: '0.5rem', margin: '-0.5rem', borderRadius: 'var(--radius-lg)' }}>

                <div style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem',
                    color: 'white', textAlign: 'center', boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>💸 总金额</div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: 0 }}>¥ {totalBill.toFixed(2)}</h2>
                </div>

                <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '1px' }}>
                    🔍 应付明细
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
                                            {/* 拆分：认领 + 指定 + 平摊 */}
                                            <div style={{ paddingLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                                {detail.claimedPercent > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>🙋 认领 {Math.round(detail.claimedPercent)}%</span>
                                                        <span>¥ {detail.claimedCost.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {detail.assignedPercent > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>👆 指定 {Math.round(detail.assignedPercent)}%</span>
                                                        <span>¥ {detail.assignedCost.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {detail.splitPercent > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>🤷 平摊 {Math.round(detail.splitPercent)}%</span>
                                                        <span>¥ {detail.splitCost.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {detail.claimedPercent === 0 && detail.assignedPercent === 0 && detail.splitPercent === 0 && (
                                                    <div>✅ 无</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>暂无明细</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* 底部操作 */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>返回修改</button>
                <button className="btn-primary" onClick={handleDownload} disabled={isDownloading} style={{ flex: 2 }}>
                    {isDownloading ? '生成中...' : '保存图片'}
                </button>
            </div>

        </div>
    );
}

export default StepResult;
