import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

// 版本号 - 每次修改自增
const VERSION = 'v1.0.13';

// 导入步骤组件
import StepPhotos from './components/steps/StepPhotos';
import StepItems from './components/steps/StepItems';
import StepAllocate from './components/steps/StepAllocate';
import StepUnclaimed from './components/steps/StepUnclaimed';
import StepResult from './components/steps/StepResult';

const STEPS = [
  { id: 'photos', title: '上传账单', subtitle: '上传账单照片，自动识别菜品和价格', icon: '📷' },
  { id: 'items', title: '添加信息', subtitle: '添加参与人员和消费项目', icon: '👥' },
  { id: 'allocate', title: '分配比例', subtitle: '设置每道菜每个人的食用比例', icon: '📊' },
  { id: 'unclaimed', title: '处理未分配', subtitle: '处理未分配满100%的物品', icon: '🔀' },
  { id: 'result', title: '结算结果', subtitle: '查看每个人的应付金额明细', icon: '💰' }
];

// 本地存储键名
const STORAGE_KEY = 'jikou_data';

// 从本地存储加载数据
function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
  return null;
}

// 保存数据到本地存储
function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

// 清除本地存储
function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}

function App() {
  // 尝试从本地存储恢复数据
  const savedData = useMemo(() => loadFromStorage(), []);

  const [currentStepIndex, setCurrentStepIndex] = useState(savedData?.currentStepIndex || 0);

  // 全局数据状态
  const [participants, setParticipants] = useState(savedData?.participants || []);
  const [items, setItems] = useState(savedData?.items || []);
  const [allocations, setAllocations] = useState(savedData?.allocations || {});

  // 保存数据到本地存储
  useEffect(() => {
    saveToStorage({
      currentStepIndex,
      participants,
      items,
      allocations
    });
  }, [currentStepIndex, participants, items, allocations]);

  // 计算是否有未分配物品（只看 claimed，不看 assigned）
  const hasUnclaimedItems = useMemo(() => {
    if (items.length === 0) return false;
    return items.some(item => {
      const itemAlloc = allocations[item.id] || {};
      let totalClaimed = 0;
      let totalAssigned = 0;
      participants.forEach(p => {
        const pConfig = itemAlloc[p.id] || {};
        totalClaimed += pConfig.claimed || 0;
        totalAssigned += pConfig.assigned || 0;
      });
      return (totalClaimed + totalAssigned) < 100;
    });
  }, [items, allocations, participants]);

  // 记录是否有未分配物品（用于导航判断）
  const [hadUnclaimedWhenAllocated, setHadUnclaimedWhenAllocated] = useState(false);

  // 重新开始
  const handleReset = () => {
    if (confirm('确定要重新开始吗？当前数据将被清空。')) {
      setCurrentStepIndex(0);
      setParticipants([]);
      setItems([]);
      setAllocations({});
      setHadUnclaimedWhenAllocated(false);
      clearStorage();
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      // 如果在 allocate 步骤，记录是否有未分配物品
      if (STEPS[currentStepIndex].id === 'allocate') {
        setHadUnclaimedWhenAllocated(hasUnclaimedItems);
        // 如果没有未分配物品，跳过 unclaimed 步骤
        if (!hasUnclaimedItems) {
          setCurrentStepIndex(currentStepIndex + 2); // 跳到 result
          return;
        }
      }
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      // 如果在 result 步骤，根据之前记录的状态决定跳回哪一步
      if (STEPS[currentStepIndex].id === 'result' && !hadUnclaimedWhenAllocated) {
        setCurrentStepIndex(currentStepIndex - 2); // 回到 allocate
        return;
      }
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // 根据当前步骤渲染对应的组件
  const renderCurrentStep = () => {
    const stepProps = {
      participants, setParticipants,
      items, setItems,
      allocations, setAllocations,
      onNext: handleNext,
      onPrev: handlePrev,
      onReset: handleReset
    };

    switch (STEPS[currentStepIndex].id) {
      case 'photos': return <StepPhotos {...stepProps} />;
      case 'items': return <StepItems {...stepProps} />;
      case 'allocate': return <StepAllocate {...stepProps} />;
      case 'unclaimed': return <StepUnclaimed {...stepProps} />;
      case 'result': return <StepResult {...stepProps} />;
      default: return null;
    }
  };

  // 计算实际显示的步骤数（可能跳过 unclaimed）
  const getDisplayStepInfo = () => {
    const currentStep = STEPS[currentStepIndex];
    if (currentStep.id === 'allocate') {
      if (!hasUnclaimedItems) {
        const visibleSteps = STEPS.filter(s => s.id !== 'unclaimed');
        const currentIndex = visibleSteps.findIndex(s => s.id === currentStep.id);
        return { total: visibleSteps.length, current: currentIndex + 1, steps: visibleSteps };
      }
    } else {
      if (!hadUnclaimedWhenAllocated) {
        const visibleSteps = STEPS.filter(s => s.id !== 'unclaimed');
        const currentIndex = visibleSteps.findIndex(s => s.id === currentStep.id);
        return { total: visibleSteps.length, current: currentIndex + 1, steps: visibleSteps };
      }
    }
    return { total: STEPS.length, current: currentStepIndex + 1, steps: STEPS };
  };

  const stepInfo = getDisplayStepInfo();
  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="app-container">
      {/* 顶部进度指示器 */}
      <header className="glass-container fade-in-up" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}>极抠</span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: '500',
              letterSpacing: '0.02em'
            }}>精准AA</span>
          </div>
          {/* 重新开始按钮 */}
          {(items.length > 0 || participants.length > 0) && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                e.target.style.color = 'var(--color-danger)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = 'var(--text-muted)';
              }}
            >
              重新开始
            </button>
          )}
        </div>

        {/* 步骤指示器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {stepInfo.steps.map((step, index) => {
            const isCompleted = index < stepInfo.current - 1;
            const isCurrent = index === stepInfo.current - 1;
            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: isCurrent ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' :
                            isCompleted ? 'var(--color-success)' : 'var(--border-glass)',
                  color: (isCurrent || isCompleted) ? 'white' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? '600' : '400',
                  transition: 'all 0.3s ease'
                }}>
                  <span>{step.icon}</span>
                  <span style={{ display: isCurrent ? 'inline' : 'none' }}>{step.title}</span>
                </div>
                {index < stepInfo.steps.length - 1 && (
                  <div style={{
                    width: '12px',
                    height: '2px',
                    background: index < stepInfo.current - 1 ? 'var(--color-success)' : 'var(--border-glass)',
                    margin: '0 0.25rem',
                    transition: 'background 0.3s ease'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </header>

      {/* 主体内容区，带淡入动画区隔每次刷新 */}
      <main key={currentStep.id} className="fade-in-up">
        <div className="glass-container">
          <h1 className="step-title">{currentStep.title}</h1>
          <p className="step-subtitle">{currentStep.subtitle}</p>

          <div className="step-content">
            {renderCurrentStep()}
          </div>
        </div>

        {/* 底部提示 */}
        <footer style={{
          textAlign: 'center',
          padding: '1rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          opacity: 0.6,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span>数据仅保存在本地浏览器</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{VERSION}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;