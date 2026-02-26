import React, { useState } from 'react';
import RoundTable from '../ui/RoundTable';

function StepItems({ participants, setParticipants, items, setItems, onNext, onPrev }) {
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newParticipantName, setNewParticipantName] = useState('');
    const [editingItemId, setEditingItemId] = useState(null);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (newItemName && newItemPrice) {
            setItems([...items, {
                id: 'item_' + Date.now(),
                name: newItemName,
                price: parseFloat(newItemPrice)
            }]);
            setNewItemName('');
            setNewItemPrice('');
        }
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
        if (editingItemId === id) setEditingItemId(null);
    };

    const handleUpdateItemPrice = (id, newPrice) => {
        const parsed = parseFloat(newPrice);
        if (!isNaN(parsed) && parsed >= 0) {
            setItems(items.map(item => item.id === id ? { ...item, price: parsed } : item));
        }
    };

    const handleAddParticipant = (e) => {
        e.preventDefault();
        if (newParticipantName) {
            setParticipants([...participants, {
                id: 'p_' + Date.now(),
                name: newParticipantName
            }]);
            setNewParticipantName('');
        }
    };

    const handleRemoveParticipant = (id) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    const isNextDisabled = items.length === 0 || participants.length === 0;

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* 圆桌可视化 */}
            <RoundTable participants={participants} items={items} />

            {/* 模块：参与者录入 */}
            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    👥 分赃团伙 ({participants.length}人)
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {participants.map(p => (
                        <div key={p.id} style={{
                            background: 'rgba(255,255,255, 0.8)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                            <button
                                onClick={() => handleRemoveParticipant(p.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                            >×</button>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddParticipant} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="输入嫌疑人名 (例: 大冤种Bob)"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                    <button type="submit" className="btn-secondary" style={{ width: 'auto' }}>添加</button>
                </form>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', marginBottom: '2rem' }} />

            {/* 模块：消费项录入 */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🍔 罪证清单
                </h3>

                {items.length > 0 && (
                    <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255, 0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                        {items.map((item, index) => (
                            <div key={item.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem',
                                borderBottom: index < items.length - 1 ? '1px solid var(--border-glass)' : 'none'
                            }}>
                                <span style={{ fontWeight: 500 }}>{item.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {editingItemId === item.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>¥</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                defaultValue={item.price}
                                                autoFocus
                                                onBlur={(e) => {
                                                    handleUpdateItemPrice(item.id, e.target.value);
                                                    setEditingItemId(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateItemPrice(item.id, e.target.value);
                                                        setEditingItemId(null);
                                                    }
                                                }}
                                                style={{
                                                    width: '5rem', padding: '0.25rem 0.5rem',
                                                    border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
                                                    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 'bold',
                                                    color: 'var(--color-primary)', background: 'white', outline: 'none'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <span
                                            onClick={() => setEditingItemId(item.id)}
                                            title="点击修改价格"
                                            style={{
                                                color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer',
                                                padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)',
                                                transition: 'all var(--transition-fast)',
                                                border: '1px dashed transparent'
                                            }}
                                            onMouseEnter={(e) => e.target.style.border = '1px dashed var(--color-primary)'}
                                            onMouseLeave={(e) => e.target.style.border = '1px dashed transparent'}
                                        >¥{item.price.toFixed(2)}</span>
                                    )}
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="被吃了啥"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        style={{ marginBottom: 0, flex: 2 }}
                    />
                    <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="放血价 ¥"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        style={{ marginBottom: 0, flex: 1 }}
                    />
                    <button type="submit" className="btn-secondary" style={{ width: 'auto' }}>+</button>
                </form>
            </section>

            {/* 底部导航 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>退堂</button>
                <button className="btn-primary" onClick={onNext} disabled={isNextDisabled} style={{ flex: 2, opacity: isNextDisabled ? 0.5 : 1 }}>
                    召唤嫌疑人来分赃
                </button>
            </div>
        </div>
    );
}

export default StepItems;
