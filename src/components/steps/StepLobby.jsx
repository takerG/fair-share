import React, { useState } from 'react';

function StepLobby({ onJoin, onCreate }) {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState('choose'); // 'choose', 'create', 'join'

    const handleCreate = (e) => {
        e.preventDefault();
        if (!name.trim()) return alert('请输入你的名字');
        // 生成6位带大写字母和数字的房间号
        const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
        onCreate(name.trim(), newRoom);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!name.trim()) return alert('请输入你的名字');
        if (!roomId.trim()) return alert('请输入要加入的账单号');
        onJoin(name.trim(), roomId.trim().toUpperCase());
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span style={{ fontSize: '3rem' }}>👋</span>
                <h2 style={{ marginTop: '1rem', color: 'var(--color-primary)' }}>欢迎来到极扣 AA</h2>
                <p style={{ color: 'var(--text-muted)' }}>无需注册，即用即走的多人记账工具</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.8)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                {mode === 'choose' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button className="btn-primary" onClick={() => setMode('create')}>我是发起人（创建账单）</button>
                        <button className="btn-secondary" onClick={() => setMode('join')}>我是参与者（加入账单）</button>
                    </div>
                )}

                {mode === 'create' && (
                    <form onSubmit={handleCreate}>
                        <h3 style={{ marginBottom: '1rem' }}>🎉 创建新账单</h3>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>我在这个账单里的称呼：</label>
                        <input type="text" className="input-field" placeholder="输入你的名字" value={name} onChange={e => setName(e.target.value)} autoFocus />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setMode('choose')}>返回</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2 }}>创建账单房间</button>
                        </div>
                    </form>
                )}

                {mode === 'join' && (
                    <form onSubmit={handleJoin}>
                        <h3 style={{ marginBottom: '1rem' }}>🤝 加入现有账单</h3>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>我在这个账单里的称呼：</label>
                        <input type="text" className="input-field" placeholder="输入你的名字" value={name} onChange={e => setName(e.target.value)} autoFocus />
                        <label style={{ display: 'block', marginBottom: '0.5rem', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>发起人分享给你的6位短码：</label>
                        <input type="text" className="input-field" placeholder="输入6位数字字母组合" value={roomId} onChange={e => setRoomId(e.target.value)} style={{ textTransform: 'uppercase' }} maxLength={6} />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setMode('choose')}>返回</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2 }}>确认加入</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default StepLobby;
