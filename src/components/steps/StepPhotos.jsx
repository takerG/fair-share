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

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);

        // 显示预览
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target.result;
            setPhotoPreview(dataUrl);

            // 开始OCR识别
            setIsScanning(true);
            setScanProgress(0);
            setScanStage('初始化...');

            try {
                const result = await scanReceipt(dataUrl, ({ stage, progress }) => {
                    setScanProgress(progress);
                    setScanStage(stage === 'recognizing' ? '识别中...' : '解析中...');
                });

                if (result.items.length > 0) {
                    // 自动填入消费项目
                    const newItems = result.items.map((item, idx) => ({
                        id: 'item_' + Date.now() + '_' + idx,
                        name: item.name,
                        price: item.price
                    }));
                    setItems(prev => [...prev, ...newItems]);
                }

                setIsScanning(false);
                setScanStage(`识别完成，发现 ${result.items.length} 项`);
            } catch (err) {
                console.error('OCR error:', err);
                setIsScanning(false);
                setError('识别失败，请手动录入或尝试其他图片');
                setScanStage('');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleNextWithItems = () => {
        onNext();
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem'
            }}>
                <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    上传账单图片，自动识别菜品和价格
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    识别结果将自动填入下一步，可在信息页修改
                </p>
            </div>

            <div style={{
                border: '2px dashed var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                background: photoPreview ? 'rgba(99, 102, 241, 0.03)' : 'rgba(99, 102, 241, 0.03)',
                cursor: isScanning ? 'wait' : 'pointer',
                marginBottom: '1.5rem',
                position: 'relative',
                transition: 'all var(--transition-normal)',
                opacity: isScanning ? 0.8 : 1
            }}>
                {photoPreview ? (
                    <div>
                        <img
                            src={photoPreview}
                            alt="Receipt Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)' }}
                        />
                        {isScanning ? (
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    background: 'var(--border-glass)',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    marginBottom: '0.5rem'
                                }}>
                                    <div style={{
                                        width: `${scanProgress}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <p style={{ color: 'var(--color-primary)', fontWeight: '600', margin: 0 }}>
                                    {scanStage} {scanProgress}%
                                </p>
                            </div>
                        ) : (
                            <p style={{ marginTop: '1rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                                {scanStage || '点击更换图片'}
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: isScanning ? 0.5 : 0.4 }}>
                            {isScanning ? '⏳' : '📷'}
                        </div>
                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1rem' }}>
                            {isScanning ? '识别中，请稍候...' : '点击上传账单图片'}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                            支持 JPG, PNG 格式，首次识别需下载语言包
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

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={onNext} style={{ flex: 1 }} disabled={isScanning}>
                    跳过
                </button>
                <button
                    className="btn-primary"
                    onClick={handleNextWithItems}
                    disabled={isScanning}
                    style={{ flex: 2, opacity: isScanning ? 0.5 : 1 }}
                >
                    下一步
                </button>
            </div>
        </div>
    );
}

export default StepPhotos;