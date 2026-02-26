import React, { useState } from 'react';
import { scanReceipt } from '../../utils/ocr';

/**
 * 第一步：账单拍照上传（OCR识别）
 */
function StepPhotos({ onNext, setItems }) {
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStage, setScanStage] = useState('');
    const [error, setError] = useState(null);
    const [recognizedItems, setRecognizedItems] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setRecognizedItems([]);
        setShowResults(false);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target.result;
            setPhotoPreview(dataUrl);

            setIsScanning(true);
            setScanProgress(0);
            setScanStage('准备中...');

            try {
                const result = await scanReceipt(dataUrl, (info) => {
                    setScanProgress(info.progress || 0);
                    const stageLabels = {
                        'preprocessing': '处理图片...',
                        'loading': '加载引擎...',
                        'initializing': '初始化...',
                        'loading-lang': '下载语言包(首次较慢)...',
                        'initializing-api': '准备识别...',
                        'recognizing': '识别文字...',
                        'parsing': '解析结果...'
                    };
                    setScanStage(stageLabels[info.stage] || info.stage);
                });

                if (result.items.length > 0) {
                    setRecognizedItems(result.items);
                    setShowResults(true);
                    setScanStage(`识别完成，发现 ${result.items.length} 项`);
                } else {
                    setError('未识别到有效的菜品信息，请手动录入');
                    setScanStage('');
                }

                setIsScanning(false);
            } catch (err) {
                console.error('OCR error:', err);
                setIsScanning(false);
                setError('识别失败，请手动录入或尝试其他图片');
                setScanStage('');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleConfirm = () => {
        const newItems = recognizedItems.map((item, idx) => ({
            id: 'item_' + Date.now() + '_' + idx,
            name: item.name,
            price: item.price
        }));
        setItems(prev => [...prev, ...newItems]);
        onNext();
    };

    const handleRemoveItem = (index) => {
        setRecognizedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index, field, value) => {
        setRecognizedItems(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value };
            }
            return item;
        }));
    };

    const handleAddItem = () => {
        setRecognizedItems(prev => [...prev, { name: '', price: 0 }]);
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* 提示信息 */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                marginBottom: '1.25rem'
            }}>
                <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.15rem', fontSize: '0.9rem' }}>
                    📷 上传账单，自动识别菜品和价格
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    识别结果可编辑，首次使用需下载语言包
                </p>
            </div>

            {/* 上传区域 */}
            <div style={{
                border: '2px dashed var(--border-glass)',
                borderRadius: 'var(--radius-lg)',
                padding: showResults ? '1rem' : '2rem',
                textAlign: 'center',
                background: photoPreview ? 'rgba(99, 102, 241, 0.02)' : 'rgba(99, 102, 241, 0.02)',
                cursor: isScanning ? 'wait' : 'pointer',
                marginBottom: '1.25rem',
                position: 'relative',
                transition: 'all var(--transition-normal)',
                opacity: isScanning ? 0.8 : 1
            }}>
                {photoPreview ? (
                    <div>
                        <img
                            src={photoPreview}
                            alt="Receipt Preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: showResults ? '120px' : '180px',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--shadow-md)'
                            }}
                        />
                        {isScanning ? (
                            <div style={{ marginTop: '0.75rem' }}>
                                <div style={{
                                    width: '100%',
                                    maxWidth: '200px',
                                    height: '6px',
                                    background: 'var(--border-glass)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                    margin: '0 auto 0.5rem'
                                }}>
                                    <div style={{
                                        width: `${scanProgress}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                                        transition: 'width 0.2s ease'
                                    }} />
                                </div>
                                <p style={{ color: 'var(--color-primary)', fontWeight: '500', margin: 0, fontSize: '0.85rem' }}>
                                    {scanStage}
                                </p>
                            </div>
                        ) : (
                            <p style={{ marginTop: '0.5rem', color: 'var(--color-primary)', fontWeight: '500', fontSize: '0.85rem' }}>
                                点击更换图片
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: isScanning ? 0.5 : 0.4 }}>
                            {isScanning ? '⏳' : '📷'}
                        </div>
                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                            {isScanning ? '识别中...' : '点击上传账单图片'}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                            支持 JPG, PNG 格式
                        </p>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isScanning}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: isScanning ? 'wait' : 'pointer'
                    }}
                />
            </div>

            {/* 错误提示 */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 0.875rem',
                    marginBottom: '1rem',
                    color: 'var(--color-danger)',
                    fontSize: '0.85rem'
                }}>
                    {error}
                </div>
            )}

            {/* 识别结果编辑区域 */}
            {showResults && recognizedItems.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            识别结果
                            <span style={{
                                background: 'var(--color-success)',
                                color: 'white',
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-full)',
                                marginLeft: '0.5rem'
                            }}>{recognizedItems.length}项</span>
                        </h4>
                        <button
                            onClick={handleAddItem}
                            style={{
                                padding: '0.2rem 0.6rem',
                                fontSize: '0.75rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            + 添加
                        </button>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)'
                    }}>
                        {recognizedItems.map((item, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.6rem 0.875rem',
                                borderBottom: index < recognizedItems.length - 1 ? '1px solid var(--border-glass)' : 'none',
                                gap: '0.5rem'
                            }}>
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                                    placeholder="菜品名称"
                                    style={{
                                        flex: 2,
                                        padding: '0.4rem 0.6rem',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.85rem',
                                        background: 'white'
                                    }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1 }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>¥</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.price}
                                        onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                                        placeholder="价格"
                                        style={{
                                            width: '100%',
                                            padding: '0.4rem 0.6rem',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.85rem',
                                            background: 'white'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-danger)',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem',
                                        padding: '0.1rem',
                                        lineHeight: 1,
                                        opacity: 0.7
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        可编辑识别结果，确认后将填入下一步
                    </p>
                </div>
            )}

            {/* 底部按钮 */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    className="btn-secondary"
                    onClick={onNext}
                    disabled={isScanning}
                    style={{ flex: 1 }}
                >
                    跳过
                </button>
                {showResults && recognizedItems.length > 0 ? (
                    <button
                        className="btn-primary"
                        onClick={handleConfirm}
                        style={{ flex: 2 }}
                    >
                        确认并继续
                    </button>
                ) : (
                    <button
                        className="btn-primary"
                        onClick={onNext}
                        disabled={isScanning}
                        style={{ flex: 2, opacity: isScanning ? 0.5 : 1 }}
                    >
                        下一步
                    </button>
                )}
            </div>
        </div>
    );
}

export default StepPhotos;