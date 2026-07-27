<template>
  <div class="trpg-status-panel">
    <!-- TODO: 未来计划加入UI分辨率/缩放比例的自定义设定 -->
    <div class="panel-layout">
      <!-- 左侧栏：核心资质与基础参数 -->
      <aside class="left-column">
        <!-- 头部：血统/改造与评级 -->
        <div class="identity-header">
          <h1 class="char-name">{{ store.protagonist.姓名 || '未知角色' }}</h1>
          <div class="bloodline-info">
            <span class="bloodline-name">{{ store.bloodline.name }}</span>
            <span class="bloodline-level">{{ store.bloodline.level }}</span>
          </div>
        </div>

        <!-- 资产区：支线剧情、奖励点、XP -->
        <div class="assets-section horizontal-assets">
          <div class="h-asset">
            <span class="label">支线</span>
            <span class="value">{{ store.branchPlots }}</span>
          </div>
          <div class="h-asset">
            <span class="label">PTS</span>
            <span class="value">{{ store.mvuData?.主神货币?.奖励点 || 0 }}</span>
          </div>
          <div class="h-asset">
            <span class="label">XP</span>
            <span class="value">{{ store.mvuData?.主神货币?.经验值_XP || 0 }}</span>
          </div>
        </div>

        <!-- 属性区：9大核心属性 -->
        <div class="attributes-section">
          <h3 class="section-title">能力值</h3>
          <div class="attr-list">
            <div v-for="(data, key) in store.currentAttributes" :key="key" class="list-row attr-row">
              <span class="label">{{ key }}</span>
              <span class="value">
                {{ data.value }}
                <span v-if="data.legendary > 0" class="legendary-bonus"> + {{ data.legendary }}</span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧栏：当前状态与派生能力 -->
      <main class="right-column">
        <!-- 状态监控 -->
        <div class="monitor-section">
          <h3 class="section-title">基本能力</h3>

          <!-- HP -->
          <div class="resource-row">
            <div class="res-label">HP</div>
            <div class="res-bar-container hp-container">
              <div class="res-bar">
                <div class="segment intact" :style="{ width: hpPercents.intact + '%' }"></div>
                <div class="segment shock" :style="{ width: hpPercents.shock + '%' }"></div>
                <div class="segment lethal" :style="{ width: hpPercents.lethal + '%' }"></div>
                <div class="segment aggra" :style="{ width: hpPercents.aggra + '%' }"></div>
              </div>
            </div>
            <div class="res-text">{{ store.protagonist?.生理与状态?.生命状态?.完好 || 0 }} / {{ store.derivedStats.最大HP }}</div>
          </div>

          <!-- WP -->
          <div class="resource-row">
            <div class="res-label">WP</div>
            <div class="res-bar-container wp-container">
              <div class="res-bar">
                <div class="segment wp-fill" :style="{ width: wpPercent + '%' }"></div>
              </div>
            </div>
            <div class="res-text">{{ store.protagonist?.生理与状态?.当前意志力 || 0 }} / {{ store.derivedStats.最大意志力 }}</div>
          </div>

          <!-- Energy Pool -->
          <div class="resource-row">
            <div class="res-label">EP</div>
            <div class="res-bar-container ep-container">
              <div class="res-bar">
                <div class="segment ep-fill" :style="{ width: epPercent + '%' }"></div>
              </div>
            </div>
            <div class="res-text">{{ store.protagonist?.生理与状态?.能量池?.当前值 || 0 }} / {{ energyMax }}</div>
          </div>
        </div>

        <!-- 派生参数 -->
        <div class="derived-section">
          <div class="list-row">
            <span class="label">总防御</span>
            <span class="value">{{ store.derivedStats.总防御 }}</span>
          </div>
          <div class="list-row">
            <span class="label">先攻</span>
            <span class="value">{{ store.derivedStats.先攻 }}</span>
          </div>
          <div class="list-row">
            <span class="label">装备重量</span>
            <span class="value">{{ store.encumbrance.weight }} / {{ store.encumbrance.limit }}</span>
          </div>
        </div>

        <!-- 技能列表 -->
        <div class="skills-section">
          <h3 class="section-title">技能掌握</h3>
          <div class="skills-scroll-area">
            <div v-for="(skill, key) in validSkills" :key="key" class="list-row">
              <span class="label">{{ key }}</span>
              <span class="value">{{ skill.等级 }}</span>
            </div>
            <div v-if="Object.keys(validSkills).length === 0" class="empty-hint">暂无已掌握技能</div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDataStore } from '../store';

const store = useDataStore();

// HP百分比
const hpPercents = computed(() => {
  const hp = store.protagonist?.生理与状态?.生命状态;
  const max = store.derivedStats.最大HP || 1;
  if (!hp) return { intact: 100, shock: 0, lethal: 0, aggra: 0 };
  return {
    intact: (hp.完好 / max) * 100,
    shock: (hp.冲击_B / max) * 100,
    lethal: (hp.严重_L / max) * 100,
    aggra: (hp.恶性_A / max) * 100
  };
});

// WP百分比
const wpPercent = computed(() => {
  const wp = store.protagonist?.生理与状态?.当前意志力 || 0;
  const max = store.derivedStats.最大意志力 || 1;
  return Math.min(100, Math.max(0, (wp / max) * 100));
});

// EP(能量池)计算
const energyMax = computed(() => {
  const ep = store.protagonist?.生理与状态?.能量池;
  return ep?.上限缓存 || 1;
});
const epPercent = computed(() => {
  const ep = store.protagonist?.生理与状态?.能量池;
  if (!ep) return 0;
  const max = ep.上限缓存 || 1;
  return Math.min(100, Math.max(0, (ep.当前值 / max) * 100));
});

// 过滤已掌握的技能
const validSkills = computed(() => {
  const skills = store.protagonist?.技能列表 || {};
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(skills)) {
    if ((v as any).等级 > 0) result[k] = v;
  }
  return result;
});
</script>

<style scoped lang="scss">
$bg-color: #0a0a0d;
$glass-bg: rgba(20, 20, 25, 0.6);
$border-gold: rgba(234, 179, 8, 0.4);
$accent-gold: #eab308;
$text-main: #e4e4e7;
$text-dim: #a1a1aa;
$glow-shadow: 0 0 15px rgba(234, 179, 8, 0.15);

.trpg-status-panel {
  width: 100%;
  background: linear-gradient(180deg, #111116 0%, #08080a 100%);
  color: $text-main;
  font-family: 'Segoe UI', system-ui, sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 16px;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5);
  backdrop-filter: blur(12px);
}

.panel-layout {
  display: flex;
  gap: 32px;
}

.left-column, .right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 分割线：黑魂风格细横线 */
.section-title {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: $text-main;
  font-weight: normal;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 4px;
  letter-spacing: 1px;
}

/* 头部样式 */
.identity-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

  .char-name {
    margin: 0 0 4px 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 2px;
    text-shadow: 0 0 10px rgba(255,255,255,0.2);
  }

  .bloodline-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
    color: $accent-gold;

    .bloodline-level {
      font-family: monospace;
    }
  }
}

/* 列表行统一样式 (黑魂属性列表风格) */
.list-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.95rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .label { color: $text-dim; }
  .value { color: #fff; font-family: monospace; }

  /* 传奇属性专属特效 */
  .legendary-bonus {
    color: $accent-gold;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
    font-weight: bold;
    margin-left: 2px;
  }
}

/* 资产区 */
.assets-section {
  margin-bottom: 24px;
}

.horizontal-assets {
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .h-asset {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .label {
      font-size: 0.8rem;
      color: $text-dim;
    }
    .value {
      font-size: 1rem;
      color: $accent-gold;
      font-family: monospace;
      font-weight: bold;
    }
  }
}

/* 状态监控渐变条 */
.monitor-section {
  margin-bottom: 20px;

  .resource-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;

    .res-label { width: 30px; font-size: 0.85rem; color: $text-dim; text-align: right; }
    .res-text { width: 80px; text-align: right; font-family: monospace; font-size: 0.85rem; color: #fff; }

    .res-bar-container {
      flex: 1;
      height: 6px;
      background: #1a1a24;
      border: 1px solid rgba(255,255,255,0.1);

      .res-bar {
        height: 100%;
        display: flex;

        .segment { height: 100%; transition: width 0.4s ease; }
      }

      &.hp-container .intact { background: #22c55e; }
      &.hp-container .shock { background: #eab308; }
      &.hp-container .lethal { background: #f97316; }
      &.hp-container .aggra { background: #ef4444; }

      &.wp-container .wp-fill { background: linear-gradient(90deg, #3b82f6, #60a5fa); box-shadow: 0 0 8px rgba(59,130,246,0.4); }
      &.ep-container .ep-fill { background: linear-gradient(90deg, #a855f7, #d946ef); box-shadow: 0 0 8px rgba(168,85,247,0.4); }
    }
  }
}

.derived-section {
  margin-bottom: 24px;
}

/* 技能滚动区 */
.skills-section {
  flex: 1;
  display: flex;
  flex-direction: column;

  .skills-scroll-area {
    flex: 1;
    max-height: 180px;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
    &::-webkit-scrollbar-thumb:hover { background: $accent-gold; }

    .empty-hint {
      color: rgba(255,255,255,0.2);
      text-align: center;
      padding: 20px 0;
      font-style: italic;
      font-size: 0.85rem;
    }
  }
}

/* 响应式断点：当特别窄时转为单列 */
@media (max-width: 600px) {
  .panel-layout {
    flex-direction: column;
    gap: 20px;
  }
}
</style>