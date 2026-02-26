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
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                上传你那惨痛消费的遗照。目前这图就是个摆设，只配用来刺痛你的双眼，未来某天也许人工智能会屈尊降贵来帮你自动识别。
            </p>

            <div style={{
                border: '2px dashed var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(99, 102, 241, 0.05)',
                cursor: 'pointer',
                marginBottom: '2rem',
                position: 'relative',
                transition: 'all var(--transition-bounce)'
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
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                        <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>点击给账单收尸（上传图片）</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>支持 JPG, PNG 格式</p>
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
                <button className="btn-secondary" onClick={onNext} style={{ flex: 1 }}>太惨了，跳过</button>
                <button className="btn-primary" onClick={onNext} style={{ flex: 2 }} disabled={!photoPreview}>
                    含泪继续录入
                </button>
            </div>
        </div>
    );
}

export default StepPhotos;
