import React, { useState } from 'react';

/**
 * 第一步：账单拍照上传（视觉辅助）
 */
function StepPhotos({ onNext }) {
    const [photoPreview, setPhotoPreview] = useState(null);

    const handleFakeUpload = (e) => {
        // 模拟读取本地文件转为预览图
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPhotoPreview(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
            }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🚧</span>
                <div>
                    <p style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        功能开发中
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                        可先跳过此步骤，直接录入信息。后续将支持AI识别账单。
                    </p>
                </div>
            </div>

            <div style={{
                border: '2px dashed var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(99, 102, 241, 0.03)',
                cursor: 'pointer',
                marginBottom: '2rem',
                position: 'relative',
                transition: 'all var(--transition-bounce)',
                opacity: 0.65
            }}>
                {photoPreview ? (
                    <div>
                        <img
                            src={photoPreview}
                            alt="Receipt Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)' }}
                        />
                        <p style={{ marginTop: '1rem', color: 'var(--color-primary)', fontWeight: '600' }}>点击更换图片</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>📷</div>
                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1rem' }}>点击上传账单图片</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6 }}>支持 JPG, PNG 格式</p>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFakeUpload}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={onNext} style={{ flex: 2 }}>
                    👉 跳过，直接录入
                </button>
                {photoPreview && (
                    <button className="btn-secondary" onClick={onNext} style={{ flex: 1 }}>
                        继续下一步
                    </button>
                )}
            </div>
        </div>
    );
}

export default StepPhotos;
