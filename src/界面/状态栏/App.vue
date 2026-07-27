<template>
  <div class="god-space-dashboard">
    <!-- Header: Avatar & Core Info -->
    <header class="dashboard-header">
      <div class="avatar-container">
        <svg class="god-sphere" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="sphere-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fffbea" stop-opacity="1"/>
              <stop offset="40%" stop-color="#f5d061" stop-opacity="0.8"/>
              <stop offset="80%" stop-color="#b87a14" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#sphere-glow)" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#eab308" stroke-width="1" opacity="0.5" stroke-dasharray="4 4" class="spin"/>
        </svg>
      </div>

      <div class="character-identity">
        <h1 class="char-name">
          {{ store.protagonist.姓名 }}
          <span class="char-title">[{{ store.protagonist.基本信息.身份 }}]</span>
        </h1>

        <div class="currency-panel">
          <div class="currency-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>
            <span class="value">{{ store.mvuData?.主神货币?.奖励点 || 0 }}</span>
            <span class="label">PTS</span>
          </div>
          <div class="currency-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span class="value">{{ store.mvuData?.主神货币?.经验值_XP || 0 }}</span>
            <span class="label">XP</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Resource Bars (HP / WP) -->
    <section class="resource-monitor">
      <div class="resource-row">
        <div class="resource-label">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          生命状态 (HP)
        </div>
        <div class="resource-bar hp-bar">
          <div class="segment intact" :style="{ width: hpPercents.intact + '%' }"></div>
          <div class="segment shock" :style="{ width: hpPercents.shock + '%' }"></div>
          <div class="segment lethal" :style="{ width: hpPercents.lethal + '%' }"></div>
          <div class="segment aggra" :style="{ width: hpPercents.aggra + '%' }"></div>
        </div>
        <div class="resource-value">{{ store.protagonist?.生理与状态?.生命状态?.完好 || 0 }} / {{ store.derivedStats.最大生命值 }}</div>
      </div>

      <div class="resource-row">
        <div class="resource-label">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          精神意志 (WP)
        </div>
        <div class="resource-bar wp-bar">
          <div class="segment wp-fill" :style="{ width: wpPercent + '%' }"></div>
        </div>
        <div class="resource-value">{{ store.protagonist?.生理与状态?.当前意志力 || 0 }} / {{ store.derivedStats.最大意志力 }}</div>
      </div>
    </section>

    <!-- Quick Actions (Front-end Mocks) -->
    <div class="quick-actions">
      <button class="btn-action rest-short" @click="mockAction('短休')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        短休 (1h)
      </button>
      <button class="btn-action rest-long" @click="mockAction('长休')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        长休 (8h)
      </button>
      <button class="btn-action combat-mode" @click="mockAction('战斗')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>
        进入战斗
      </button>
    </div>

    <!-- Navigation Tabs -->
    <nav class="system-tabs">
      <button v-for="tab in tabs" :key="tab.id" :class="['tab-btn', { active: currentTab === tab.id }]" @click="currentTab = tab.id">
        {{ tab.label }}
      </button>
    </nav>

    <!-- Tab Contents -->
    <main class="system-content">

      <!-- Attributes & Skills Tab -->
      <transition name="fade" mode="out-in">
        <div v-if="currentTab === 'attributes'" key="attr" class="tab-pane dual-pane">

          <!-- Left: Attributes -->
          <div class="left-pane">
            <h3 class="pane-title">核心属性</h3>
            <div class="attr-grid">
              <div v-for="(data, key) in store.currentAttributes" :key="key" class="attr-card">
                <div class="attr-name">{{ key }}</div>
                <div class="attr-val">{{ data.value }}</div>
                <div v-if="data.legendary > 0" class="attr-legend">
                  <span v-for="n in data.legendary" :key="n" class="legend-star">★</span>
                </div>
              </div>
            </div>

            <div class="derived-stats-panel">
              <h3 class="pane-title">派生参数</h3>
              <div class="derived-grid">
                <div class="d-stat"><span>基础防御</span> <span class="v">{{ store.derivedStats.基础防御 }}</span></div>
                <div class="d-stat"><span>总防御</span> <span class="v">{{ store.derivedStats.总防御 }}</span></div>
                <div class="d-stat"><span>先攻</span> <span class="v">{{ store.derivedStats.先攻 }}</span></div>
                <div class="d-stat"><span>速度</span> <span class="v">{{ store.derivedStats.速度_米 }}m</span></div>
                <div class="d-stat"><span>负重状态</span> <span class="v" :class="store.encumbrance.status">{{ store.encumbrance.status }}</span></div>
              </div>
            </div>
          </div>

          <!-- Right: Skills & Traits -->
          <div class="right-pane scrollable">
            <h3 class="pane-title">特质与血统</h3>
            <ul class="trait-list">
              <li v-for="(item, key) in store.protagonist?.特质与模板?.强化模板 || {}" :key="key" class="trait-item">
                <div class="trait-header">
                  <span class="t-name">{{ item.名称 }}</span>
                  <span class="t-badge">{{ item.当前评级或层数 }}</span>
                </div>
                <div class="t-desc">{{ item.描述 }}</div>
              </li>
              <li v-for="(item, key) in store.protagonist?.特质与模板?.专长列表 || {}" :key="'feat-'+key" class="trait-item">
                <div class="trait-header">
                  <span class="t-name">{{ item.名称 }}</span>
                  <span class="t-badge">{{ item.等级或点数 }} 级</span>
                </div>
                <div class="t-desc">{{ item.描述 }}</div>
              </li>
            </ul>

            <h3 class="pane-title">掌握技能</h3>
            <div class="skill-tags">
              <span v-for="(skill, key) in validSkills" :key="key" class="skill-tag">
                {{ key }} <span class="s-lvl">{{ skill.等级 }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Store Tab -->
        <div v-else-if="currentTab === 'store'" key="store" class="tab-pane store-pane">
          <h3>主神推荐列表</h3>
          <div class="store-grid">
            <div v-for="(item, idx) in godSpaceItems" :key="idx" class="store-item">
              <div class="item-name">{{ item.名称 }}</div>
              <div class="item-type">{{ item.本质 }} | {{ item.分类 || '未知' }}</div>
              <div class="item-price">{{ item.价格 }}</div>
              <button class="btn-buy" @click="mockAction('购买 ' + item.名称)">兑换</button>
            </div>
            <div v-if="godSpaceItems.length === 0" class="empty-state">当前未进行主神检索...</div>
          </div>
        </div>

        <!-- NPCs Tab -->
        <div v-else-if="currentTab === 'npcs'" key="npc" class="tab-pane npc-pane">
          <div v-for="(npc, key) in npcs" :key="key" class="npc-card">
            <div class="npc-header">
              <span class="npc-name">{{ npc.姓名 }}</span>
              <span class="npc-relation" :data-level="npc.level">{{ npc.level }}</span>
            </div>
            <div class="npc-favor-bar">
              <div class="favor-fill" :style="{ width: (Math.min(200, Math.max(0, npc.fav || 0)) / 2) + '%' }"></div>
            </div>
            <div class="npc-desc">{{ npc.summary || '暂无印象' }}</div>
          </div>
        </div>
      </transition>
    </main>

    <!-- Notification Overlay Mock -->
    <div v-if="notification" class="notification-toast">
      {{ notification }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDataStore } from '../store';

const store: any = useDataStore();

const tabs = [
  { id: 'attributes', label: '角色面板' },
  { id: 'store', label: '主神枢纽' },
  { id: 'npcs', label: '人际网络' }
];
const currentTab = ref('attributes');
const notification = ref('');

// 计算 HP 百分比用于渲染多段血条
const hpPercents = computed(() => {
  const hp = store.protagonist?.生理与状态?.生命状态;
  const max = store.derivedStats.最大生命值 || 1;
  if (!hp) return { intact: 100, shock: 0, lethal: 0, aggra: 0 };
  return {
    intact: (hp.完好 / max) * 100,
    shock: (hp.冲击_B / max) * 100,
    lethal: (hp.严重_L / max) * 100,
    aggra: (hp.恶性_A / max) * 100
  };
});

// 计算 WP 百分比
const wpPercent = computed(() => {
  const wp = store.protagonist?.生理与状态?.当前意志力 || 0;
  const max = store.derivedStats.最大意志力 || 1;
  return Math.min(100, Math.max(0, (wp / max) * 100));
});

// 过滤出等级大于0的技能
const validSkills = computed(() => {
  const skills = store.protagonist?.技能列表 || {};
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(skills)) {
    if ((v as any).等级 > 0) result[k] = v;
  }
  return result;
});

// 提取所有商店物品
const godSpaceItems = computed(() => {
  const list = [];
  const s = store.mvuData?.世界记录?.主神空间档案?.主神商店当前列表;
  if (s) {
    if (s.武器列表) list.push(...s.武器列表);
    if (s.防具列表) list.push(...s.防具列表);
    if (s.强化模板列表) list.push(...s.强化模板列表);
    if (s.物品与消耗品列表) list.push(...s.物品与消耗品列表);
  }
  return list;
});

// 提取 NPC
const npcs = computed(() => store.npcRelations || {});

function mockAction(action: string) {
  notification.value = `系统指令已发送：[${action}]`;
  setTimeout(() => { notification.value = ''; }, 2500);
}
</script>

<style scoped lang="scss">
// ====== 美学定义：暗黑科幻 + 神秘主义玻璃态 ======
$bg-color: #0a0a0d;
$glass-bg: rgba(20, 20, 25, 0.6);
$border-gold: rgba(234, 179, 8, 0.4);
$accent-gold: #eab308;
$text-main: #e4e4e7;
$text-dim: #a1a1aa;
$glow-shadow: 0 0 15px rgba(234, 179, 8, 0.15);

.god-space-dashboard {
  background: linear-gradient(180deg, #111116 0%, #08080a 100%);
  color: $text-main;
  font-family: 'Segoe UI', system-ui, sans-serif;
  border: 1px solid $border-gold;
  border-radius: 8px;
  padding: 16px;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  max-width: 800px;
  margin: 0 auto;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, $accent-gold, transparent);
    opacity: 0.5;
  }
}

.icon { width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; }

// --- Header ---
.dashboard-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 15px;

  .avatar-container {
    width: 60px; height: 60px;
    position: relative;
    .spin { transform-origin: 50px 50px; animation: rotate 10s linear infinite; }
  }

  .character-identity {
    flex: 1;
    .char-name {
      margin: 0 0 8px 0; font-size: 1.4rem; font-weight: 600; letter-spacing: 1px;
      color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3);
    }
    .char-title { font-size: 0.9rem; color: $accent-gold; font-weight: normal; }

    .currency-panel {
      display: flex; gap: 15px;
      .currency-item {
        background: rgba(0,0,0,0.4);
        padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
        display: flex; align-items: center; font-family: monospace; font-size: 0.9rem;
        .value { color: $accent-gold; font-weight: bold; margin: 0 6px; }
        .label { color: $text-dim; font-size: 0.75rem; }
      }
    }
  }
}

@keyframes rotate { 100% { transform: rotate(360deg); } }

// --- Resources ---
.resource-monitor {
  display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;
  .resource-row {
    display: flex; align-items: center; gap: 10px;
    .resource-label { width: 130px; font-size: 0.85rem; color: $text-dim; }
    .resource-value { width: 60px; text-align: right; font-family: monospace; font-size: 0.9rem; }
    .resource-bar {
      flex: 1; height: 8px; background: #1a1a24; border-radius: 4px; overflow: hidden; display: flex;
      border: 1px solid rgba(255,255,255,0.1);
      .segment { height: 100%; transition: width 0.4s ease; }
      &.hp-bar {
        .intact { background: #22c55e; }
        .shock { background: #eab308; }
        .lethal { background: #f97316; }
        .aggra { background: #ef4444; }
      }
      &.wp-bar {
        .wp-fill { background: linear-gradient(90deg, #3b82f6, #60a5fa); box-shadow: 0 0 10px rgba(59,130,246,0.5); }
      }
    }
  }
}

// --- Quick Actions ---
.quick-actions {
  display: flex; gap: 10px; margin-bottom: 20px;
  .btn-action {
    flex: 1; background: $glass-bg; border: 1px solid rgba(255,255,255,0.1); color: $text-main;
    padding: 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;
    font-size: 0.85rem; display: flex; align-items: center; justify-content: center;
    &:hover { background: rgba(255,255,255,0.1); border-color: $accent-gold; box-shadow: $glow-shadow; transform: translateY(-1px); }
    &.combat-mode { border-color: rgba(239,68,68,0.3); color: #fca5a5; &:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.2); } }
  }
}

// --- Tabs ---
.system-tabs {
  display: flex; gap: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 16px;
  .tab-btn {
    background: transparent; border: none; color: $text-dim; padding: 8px 16px; cursor: pointer;
    font-size: 0.9rem; border-bottom: 2px solid transparent; transition: all 0.3s ease;
    &:hover { color: #fff; }
    &.active { color: $accent-gold; border-bottom-color: $accent-gold; text-shadow: 0 0 8px rgba(234,179,8,0.5); }
  }
}

// --- Content Panes ---
.system-content {
  

  // Attributes & Skills Dual Pane
  .dual-pane {
    display: flex;
    gap: 20px;
    

    .left-pane {
      flex: 1;
      display: flex;
      flex-direction: column;

      .attr-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;
        .attr-card {
          background: $glass-bg; border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; text-align: center;
          transition: transform 0.2s;
          &:hover { border-color: $accent-gold; transform: scale(1.05); }
          .attr-name { font-size: 0.8rem; color: $text-dim; margin-bottom: 4px; }
          .attr-val { font-size: 1.5rem; font-weight: bold; font-family: monospace; color: #fff; }
          .legend-star { color: $accent-gold; font-size: 0.7rem; text-shadow: 0 0 5px $accent-gold; }
        }
      }

      .derived-stats-panel {
        background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); flex-grow: 1;
        .derived-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 0.85rem;
          .d-stat { display: flex; justify-content: space-between; color: $text-dim; .v { color: #fff; font-family: monospace; } }
          .v.重度 { color: #f97316; } .v.压垮 { color: #ef4444; font-weight: bold; }
        }
      }
    }

    .right-pane {
      flex: 1;
      background: rgba(0,0,0,0.2);
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
      padding: 12px;
      

      // Custom Scrollbar for dark theme
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
      &::-webkit-scrollbar-thumb { background: $border-gold; border-radius: 3px; }
      &::-webkit-scrollbar-thumb:hover { background: $accent-gold; }

      .trait-list {
        list-style: none; padding: 0; margin: 0 0 20px 0;
        .trait-item {
          background: $glass-bg; border-left: 3px solid $accent-gold; padding: 10px; margin-bottom: 8px; border-radius: 0 4px 4px 0;
          .trait-header { display: flex; justify-content: space-between; margin-bottom: 4px; .t-name { color: #fff; font-weight: 500; font-size: 0.9rem; } .t-badge { font-size: 0.7rem; background: rgba(234,179,8,0.2); color: $accent-gold; padding: 2px 6px; border-radius: 10px; } }
          .t-desc { font-size: 0.75rem; color: $text-dim; line-height: 1.4; }
        }
      }
      .skill-tags {
        display: flex; flex-wrap: wrap; gap: 8px;
        .skill-tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; .s-lvl { color: $accent-gold; font-weight: bold; margin-left: 4px; } }
      }
    }
  }

  .pane-title { margin: 0 0 10px 0; font-size: 0.9rem; color: $accent-gold; font-weight: normal; border-bottom: 1px solid rgba(234,179,8,0.2); padding-bottom: 4px; }

  // Store
  .store-grid {
    display: flex; flex-direction: column; gap: 10px;
    .empty-state { text-align: center; color: $text-dim; padding: 20px; font-style: italic; }
    .store-item {
      display: flex; align-items: center; background: $glass-bg; padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);
      .item-name { flex: 2; color: #fff; font-weight: 500; }
      .item-type { flex: 1; color: $text-dim; font-size: 0.8rem; }
      .item-price { flex: 1; color: $accent-gold; font-family: monospace; }
      .btn-buy { background: transparent; border: 1px solid $accent-gold; color: $accent-gold; padding: 4px 12px; border-radius: 4px; cursor: pointer; &:hover { background: rgba(234,179,8,0.1); } }
    }
  }

  // NPCs
  .npc-pane {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;
    .npc-card {
      background: $glass-bg; border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 6px;
      .npc-header { display: flex; justify-content: space-between; margin-bottom: 8px; .npc-name { color: #fff; font-weight: bold; } .npc-relation { font-size: 0.75rem; color: $accent-gold; } }
      .npc-favor-bar { height: 4px; background: #1a1a24; border-radius: 2px; margin-bottom: 8px; overflow: hidden; .favor-fill { height: 100%; background: #ec4899; } }
      .npc-desc { font-size: 0.8rem; color: $text-dim; }
    }
  }
}

// Transitions
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(5px); }

// Toast
.notification-toast {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(234, 179, 8, 0.9); color: #000; padding: 8px 16px; border-radius: 20px;
  font-size: 0.9rem; font-weight: 500; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { opacity: 0; bottom: 0; } to { opacity: 1; bottom: 20px; } }
</style>
