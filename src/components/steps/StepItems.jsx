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

    const handleClearAllItems = () => {
        if (items.length === 0) return;
        if (confirm('确定要清空所有消费项目吗？')) {
            setItems([]);
            setEditingItemId(null);
        }
    };

    const handleAddParticipant = (e) => {
        e.preventDefault();
        if (newParticipantName.trim()) {
            setParticipants([...participants, {
                id: 'p_' + Date.now(),
                name: newParticipantName.trim()
            }]);
            setNewParticipantName('');
        }
    };

    const handleRemoveParticipant = (id) => {
        if (participants.length <= 1) {
            alert('至少需要保留一位参与者');
            return;
        }
        setParticipants(participants.filter(p => p.id !== id));
    };

    const handleAddQuickParticipant = (name) => {
        if (name && !participants.some(p => p.name === name)) {
            setParticipants([...participants, {
                id: 'p_' + Date.now(),
                name: name
            }]);
        }
    };

    // 计算总金额
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const isNextDisabled = items.length === 0 || participants.length === 0;

    // 快速添加参与者建议
    const quickAddSuggestions = ['我', '朋友A', '朋友B', '同事A', '同事B'].filter(
        name => !participants.some(p => p.name === name)
    ).slice(0, 3);

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* 圆桌可视化 */}
            <RoundTable participants={participants} items={items} />

            {/* 模块：参与者录入 */}
            <section style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        👥 参与人员
                        <span style={{
                            background: 'var(--color-primary)',
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-full)'
                        }}>{participants.length}人</span>
                    </h3>
                </div>

                {/* 参与者标签 */}
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

                {/* 快速添加建议 */}
                {quickAddSuggestions.length > 0 && participants.length < 5 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>快速添加:</span>
                        {quickAddSuggestions.map(name => (
                            <button
                                key={name}
                                onClick={() => handleAddQuickParticipant(name)}
                                style={{
                                    background: 'var(--border-glass)',
                                    border: 'none',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    marginRight: '0.25rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                + {name}
                            </button>
                        ))}
                    </div>
                )}

                {/* 添加参与者表单 */}
                <form onSubmit={handleAddParticipant} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="输入姓名"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                    <button type="submit" className="btn-secondary" style={{ width: 'auto', padding: '0 1rem' }}>添加</button>
                </form>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', marginBottom: '2rem' }} />

            {/* 模块：消费项录入 */}
            <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🍔 消费项目
                        {items.length > 0 && (
                            <span style={{
                                background: 'var(--color-secondary)',
                                color: 'white',
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-full)'
                            }}>{items.length}项</span>
                        )}
                    </h3>
                    {items.length > 0 && (
                        <button
                            onClick={handleClearAllItems}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                padding: '0.25rem 0.5rem'
                            }}
                        >
                            清空
                        </button>
                    )}
                </div>

                {/* 总金额显示 */}
                {items.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>消费总额</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                            ¥ {totalAmount.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* 物品列表 */}
                {items.length > 0 ? (
                    <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255, 0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                        {items.map((item, index) => (
                            <div key={item.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem',
                                borderBottom: index < items.length - 1 ? '1px solid var(--border-glass)' : 'none'
                            }}>
                                <span style={{ fontWeight: 500, flex: 1 }}>{item.name}</span>
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
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem 1rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255,255,255, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>🍽️</div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>还没有添加消费项目</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>在下方输入菜品名称和价格</p>
                    </div>
                )}

                {/* 添加物品表单 */}
                <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="菜品名称"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        style={{ marginBottom: 0, flex: 2 }}
                    />
                    <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="价格 ¥"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        style={{ marginBottom: 0, flex: 1 }}
                    />
                    <button type="submit" className="btn-secondary" style={{ width: 'auto', padding: '0 1rem' }}>+</button>
                </form>
            </section>

            {/* 底部导航 */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>上一步</button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={isNextDisabled}
                    style={{ flex: 2, opacity: isNextDisabled ? 0.5 : 1 }}
                >
                    {isNextDisabled ? (items.length === 0 ? '请添加消费项目' : '请添加参与者') : '下一步'}
                </button>
            </div>
        </div>
    );
}

export default StepItems;