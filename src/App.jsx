import React, { useState, useMemo } from 'react';
import './index.css';

// 导入步骤组件
import StepPhotos from './components/steps/StepPhotos';
import StepItems from './components/steps/StepItems';
import StepAllocate from './components/steps/StepAllocate';
import StepUnclaimed from './components/steps/StepUnclaimed';
import StepResult from './components/steps/StepResult';

const STEPS = [
  { id: 'photos', title: '上传账单', subtitle: '上传账单照片（AI识别功能开发中）' },
  { id: 'items', title: '添加信息', subtitle: '添加参与人员和消费项目' },
  { id: 'allocate', title: '分配比例', subtitle: '设置每道菜每个人的食用比例' },
  { id: 'unclaimed', title: '处理未分配', subtitle: '处理未分配满100%的物品' },
  { id: 'result', title: '结算结果', subtitle: '查看每个人的应付金额明细' }
];

function App() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 全局数据状态
  const [participants, setParticipants] = useState([
    { id: 'p1', name: '我' },
    { id: 'p2', name: '朋友A' }
  ]);
  const [items, setItems] = useState([]); // {id, name, price}
  const [allocations, setAllocations] = useState({}); // { itemId: { pId: percent } }

  // 计算是否有未分配物品
  const hasUnclaimedItems = useMemo(() => {
    if (items.length === 0) return false;
    return items.some(item => {
      const itemAlloc = allocations[item.id] || {};
      let totalAllocated = 0;
      participants.forEach(p => {
        totalAllocated += (itemAlloc[p.id] || 0);
      });
      return totalAllocated < 100;
    });
  }, [items, allocations, participants]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      // 如果在 allocate 步骤，且没有未分配物品，跳过 unclaimed 步骤
      if (STEPS[currentStepIndex].id === 'allocate' && !hasUnclaimedItems) {
        setCurrentStepIndex(currentStepIndex + 2); // 跳到 result
      } else {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      // 如果在 result 步骤，且没有未分配物品，跳回 allocate
      if (STEPS[currentStepIndex].id === 'result' && !hasUnclaimedItems) {
        setCurrentStepIndex(currentStepIndex - 2); // 回到 allocate
      } else {
        setCurrentStepIndex(currentStepIndex - 1);
      }
    }
  };

  // 根据当前步骤渲染对应的组件
  const renderCurrentStep = () => {
    const stepProps = {
      participants, setParticipants,
      items, setItems,
      allocations, setAllocations,
      onNext: handleNext,
      onPrev: handlePrev
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
    // 如果没有未分配物品，显示时跳过 unclaimed 步骤
    if (!hasUnclaimedItems) {
      const visibleSteps = STEPS.filter(s => s.id !== 'unclaimed');
      const currentStep = STEPS[currentStepIndex];
      const currentIndex = visibleSteps.findIndex(s => s.id === currentStep.id);
      return { total: visibleSteps.length, current: currentIndex + 1 };
    }
    return { total: STEPS.length, current: currentStepIndex + 1 };
  };

  const stepInfo = getDisplayStepInfo();
  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="app-container">
      {/* 顶部进度指示器 */}
      <header className="glass-container fade-in-up" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>极抠<span style={{ color: 'var(--color-primary)' }}>.</span></h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Step {stepInfo.current} of {stepInfo.total}
          </span>
        </div>

        {/* 进度条动画体验 */}
        <div style={{ width: '100%', height: '4px', background: 'var(--border-glass)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((stepInfo.current - 1) / Math.max(1, stepInfo.total - 1)) * 100}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
            transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }} />
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
      </main>
    </div>
  );
}

export default App;
