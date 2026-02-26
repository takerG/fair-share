import React, { useMemo, useRef, useState } from 'react';
import { calculateBalances } from '../../utils/calculator';
import RoundTable from '../ui/RoundTable';
import html2canvas from 'html2canvas';

/**
 * 步骤：结算结果
 */
function StepResult({ participants, items, allocations, onPrev, onReset }) {
    const resultRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const results = useMemo(() => {
        return calculateBalances(participants, items, allocations);
    }, [participants, items, allocations]);

    const totalBill = items.reduce((sum, item) => sum + item.price, 0);

    // 计算统计数据
    const stats = useMemo(() => {
        const maxPayer = results.reduce((max, p) => p.total > max.total ? p : max, results[0] || { total: 0 });
        const minPayer = results.reduce((min, p) => p.total < min.total ? p : min, results[0] || { total: 0 });
        const avgAmount = totalBill / Math.max(participants.length, 1);
        return { maxPayer, minPayer, avgAmount };
    }, [results, totalBill, participants.length]);

    const handleDownload = async () => {
        if (!resultRef.current || isDownloading) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(resultRef.current, {
                scale: window.devicePixelRatio || 2,
                useCORS: true,
                backgroundColor: '#f8fafc'
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `极抠_账单_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('生成图片失败', error);
            alert('生成图片失败，请重试');
        } finally {
            setIsDownloading(false);
        }
    };

    if (participants.length === 0 || items.length === 0) {
        return (
            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>暂无数据</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>请先添加参与者和消费项目</p>
                    <button className="btn-secondary" onClick={onPrev}>返回添加</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* 圆桌算账饼图联动 */}
            <RoundTable participants={participants} items={items} results={results} />

            {/* 截图区域 */}
            <div ref={resultRef} style={{ padding: '0.5rem', margin: '-0.5rem', borderRadius: 'var(--radius-lg)' }}>

                {/* 总金额卡片 */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem',
                    color: 'white', textAlign: 'center', boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>消费总额</div>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', fontWeight: '800' }}>¥ {totalBill.toFixed(2)}</h2>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {participants.length} 人 · {items.length} 项
                    </div>
                </div>

                {/* 统计摘要 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>最多</div>
                        <div style={{ fontWeight: '700', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                            {stats.maxPayer.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>
                            ¥{stats.maxPayer.total.toFixed(0)}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>人均</div>
                        <div style={{ fontWeight: '700', color: 'var(--color-success)', fontSize: '0.9rem' }}>
                            平均
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>
                            ¥{stats.avgAmount.toFixed(0)}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>最少</div>
                        <div style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                            {stats.minPayer.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                            ¥{stats.minPayer.total.toFixed(0)}
                        </div>
                    </div>
                </div>

                {/* 明细列表 */}
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                    💰 应付明细
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {results.sort((a, b) => b.total - a.total).map((person, idx) => (
                        <div key={person.id} style={{
                            background: 'rgba(255,255,255, 0.8)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-glass)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        width: '24px', height: '24px',
                                        borderRadius: '50%',
                                        background: idx === 0 ? 'var(--color-danger)' :
                                                   idx === results.length - 1 ? 'var(--color-success)' : 'var(--color-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '0.75rem', fontWeight: '700'
                                    }}>
                                        {idx + 1}
                                    </span>
                                    <span style={{ fontWeight: '600', fontSize: '1rem' }}>{person.name}</span>
                                </div>
                                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                    ¥ {person.total.toFixed(2)}
                                </span>
                            </div>

                            {/* 构成明细 */}
                            <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                {person.details.length > 0 ? (
                                    person.details.map((detail, dIdx) => (
                                        <div key={dIdx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            padding: '0.2rem 0'
                                        }}>
                                            <span>{detail.itemName}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)', marginLeft: '0.5rem' }}>
                                                    ¥{detail.cost.toFixed(2)}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                                                    ({detail.claimedPercent > 0 && `🙋${Math.round(detail.claimedPercent)}%`}
                                                    {detail.assignedPercent > 0 && ` 👆${Math.round(detail.assignedPercent)}%`}
                                                    {detail.splitPercent > 0 && ` 🤷${Math.round(detail.splitPercent)}%`})
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>无消费</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* 底部操作 */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>返回修改</button>
                <button className="btn-secondary" onClick={onReset} style={{ flex: 1 }}>重新开始</button>
                <button
                    className="btn-primary"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    style={{ flex: 1.5, opacity: isDownloading ? 0.5 : 1 }}
                >
                    {isDownloading ? '生成中...' : '保存图片'}
                </button>
            </div>
        </div>
    );
}

export default StepResult;