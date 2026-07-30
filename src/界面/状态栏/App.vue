<template>
  <div class="trpg-status-panel">
    <!-- 遮罩层 (用于全屏模态框) -->
    <transition name="fade">
      <div v-if="activeModal" class="modal-overlay" @click.self="activeModal = null">
        <!-- 侧边菜单 (Drawer) -->
        <div v-if="activeModal === 'menu'" class="side-drawer">
          <button class="drawer-close-btn" @click="activeModal = null">×</button>
          <h3 class="drawer-title">系统菜单</h3>
          <div class="drawer-menu">
            <button class="menu-btn" @click="openModal('store')">主神兑换商店</button>
            <button class="menu-btn" @click="openModal('inventory')">个人物品栏</button>
            <button class="menu-btn" @click="openModal('npc')">人际网络</button>
          </div>
        </div>

        <!-- 血统模态框 -->
        <div v-if="activeModal === 'bloodline' && store.bloodlineDetails" class="content-modal">
          <button class="modal-close-btn" @click="activeModal = null">×</button>
          <h4 class="modal-title">{{ store.bloodlineDetails?.名称 }} <span class="modal-level">[{{ store.bloodlineDetails?.当前评级或层数 }}]</span></h4>
          <div class="modal-body scrollable">
            <div class="pop-desc">{{ store.bloodlineDetails?.描述 || '无描述' }}</div>
            <div v-if="Object.keys(store.bloodlineDetails?.属性加成记录 || {}).length > 0" class="pop-section">
              <div class="pop-subtitle">属性加成</div>
              <div class="pop-attr-grid">
                <span v-for="(val, key) in store.bloodlineDetails?.属性加成记录" :key="key" class="pop-attr-tag">
                  {{ key }}: +{{ val }}
                </span>
              </div>
            </div>
            <div v-if="(store.bloodlineDetails?.特性列表 || []).length > 0" class="pop-section">
              <div class="pop-subtitle">特性列表</div>
              <ul class="pop-trait-list">
                <li v-for="(trait, idx) in store.bloodlineDetails?.特性列表" :key="idx">
                  <strong>{{ trait.名称 }}</strong>: {{ trait.效果 }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 主神商店模态框 -->
        <div v-if="activeModal === 'store'" class="content-modal large-modal">
          <button class="modal-close-btn" @click="activeModal = null">×</button>
          <h4 class="modal-title">主神兑换商店</h4>
          <div class="modal-body scrollable">
            <div class="item-grid">
              <div v-for="(item, idx) in store.godSpaceItems" :key="idx" class="item-card" @click="toggleItemDetail(idx, 'store')">
                <div class="item-header">
                  <span class="item-name">{{ item.名称 }}</span>
                  <span class="item-price">{{ item.价格 }}</span>
                </div>
                <div class="item-meta">{{ item.本质 }} | {{ item.分类 || '未知' }}</div>
                <div v-if="expandedItem === `store-${idx}`" class="item-detail-drawer">
                  {{ item.描述 || '暂无详细描述' }}
                  <ul v-if="item.特性列表?.length" class="pop-trait-list">
                    <li v-for="(t, ti) in item.特性列表" :key="ti"><strong>{{ t.名称 }}</strong>: {{ t.效果 }}</li>
                  </ul>
                </div>
              </div>
              <div v-if="store.godSpaceItems.length === 0" class="empty-hint">当前未连接到主神空间数据库</div>
            </div>
          </div>
        </div>

        <!-- 物品栏模态框 -->
        <div v-if="activeModal === 'inventory'" class="content-modal large-modal">
          <button class="modal-close-btn" @click="activeModal = null">×</button>
          <h4 class="modal-title">个人物品栏</h4>
          <div class="modal-body scrollable">
            <div class="item-grid">
              <div v-for="(item, idx) in store.inventoryItems" :key="idx" class="item-card" @click="toggleItemDetail(idx, 'inv')">
                <div class="item-header">
                  <span class="item-name">{{ item.名称 }} <span v-if="item.数量 > 1">x{{ item.数量 }}</span></span>
                  <span v-if="item.已装备" class="equip-badge">已装备</span>
                </div>
                <div class="item-meta">{{ item._category }} | {{ item.重量 || '-' }}</div>
                <div v-if="expandedItem === `inv-${idx}`" class="item-detail-drawer">
                  {{ item.描述 || '暂无详细描述' }}
                  <ul v-if="item.特性列表?.length" class="pop-trait-list">
                    <li v-for="(t, ti) in item.特性列表" :key="ti"><strong>{{ t.名称 }}</strong>: {{ t.效果 }}</li>
                  </ul>
                </div>
              </div>
              <div v-if="store.inventoryItems.length === 0" class="empty-hint">物品栏空空如也</div>
            </div>
          </div>
        </div>

        <!-- NPC 人际网络模态框 -->
        <div v-if="activeModal === 'npc'" class="content-modal">
          <button class="modal-close-btn" @click="activeModal = null">×</button>
          <h4 class="modal-title">人际网络</h4>
          <div class="modal-body scrollable">
            <div class="npc-list">
              <div v-for="(npc, key) in store.npcRelations" :key="key" class="npc-card">
                <div class="npc-header">
                  <span class="npc-name">{{ key }}</span>
                  <span class="npc-level" :class="npc.level">{{ npc.level }}</span>
                </div>
                <div class="npc-favor-bar">
                  <div class="favor-fill" :style="{ width: (Math.min(200, Math.max(0, npc.fav || 0)) / 2) + '%' }"></div>
                </div>
                <div class="npc-desc">{{ npc.summary || '暂无印象' }}</div>
              </div>
              <div v-if="Object.keys(store.npcRelations).length === 0" class="empty-hint">孤身一人</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- TODO: 未来计划加入UI分辨率/缩放比例的自定义设定 -->
    <div class="panel-layout">
      <!-- 左侧栏：核心资质与基础参数 -->
      <aside class="left-column">
        <!-- 头部：头像、名字、生存状态、基因锁 -->
        <div class="identity-header">
          <div class="avatar-box">
            <!-- 这里可以替换成真实的头像路径变量，目前用占位图标 -->
            <svg class="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="identity-info">
            <h1 class="char-name">{{ store.protagonist.姓名 || '未知角色' }}</h1>
            <div class="status-line">
              <span class="status-alive">STATUS: {{ store.characterStatus }}</span>
              <span class="separator"> | </span>
              <span class="gene-lock">基因锁: {{ store.geneLockTier }}</span>
            </div>

            <!-- 血统/改造与评级 (可点击展开详细信息) -->
            <div v-if="store.bloodlineDetails" class="bloodline-info has-details" @click="openModal('bloodline')">
              <span class="bloodline-name">{{ store.bloodline.name }}</span>
              <span class="bloodline-level">{{ store.bloodline.level }}</span>
            </div>
          </div>

          <button class="sys-menu-btn" @click="openModal('menu')" title="系统菜单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 资产区：支线剧情、奖励点、XP (改为上下排列) -->
        <div class="assets-section">
          <div class="list-row">
            <span class="label">支线</span>
            <span class="value">{{ store.branchPlots }}</span>
          </div>
          <div class="list-row">
            <span class="label">PTS</span>
            <span class="value">{{ store.protagonist?.资源?.奖励点 || 0 }}</span>
          </div>
          <div class="list-row">
            <span class="label">XP</span>
            <span class="value">{{ store.protagonist?.资源?.经验值 || 0 }}</span>
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

// 模态框状态管理 ('menu' | 'bloodline' | 'store' | 'inventory' | 'npc' | null)
const activeModal = ref<string | null>(null);
const expandedItem = ref<string | null>(null);

const openModal = (type: string) => {
  activeModal.value = type;
  expandedItem.value = null;
};

const toggleItemDetail = (idx: number, prefix: string) => {
  const key = `${prefix}-${idx}`;
  expandedItem.value = expandedItem.value === key ? null : key;
};

// HP百分比
const hpPercents = computed(() => {
  const hp = store.protagonist?.生理与状态?.生命状态;
  const max = store.derivedStats.最大HP || 1;
  if (!hp) return { intact: 100, shock: 0, lethal: 0, aggra: 0 };
  return {
    intact: (hp.完好 / max) * 100,
    shock: (hp.冲击B / max) * 100,
    lethal: (hp.严重L / max) * 100,
    aggra: (hp.恶性A / max) * 100
  };
});

// WP百分比
const wpPercent = computed(() => {
  const wp = store.protagonist?.生理与状态?.意志力 || 0;
  const max = store.derivedStats.最大意志力 || 1;
  return Math.min(100, Math.max(0, (wp / max) * 100));
});

// EP(能量池)计算
const energyMax = computed(() => {
  const ep = store.protagonist?.生理与状态?.能量池;
  return ep?.上限 || 1;
});
const epPercent = computed(() => {
  const ep = store.protagonist?.生理与状态?.能量池;
  if (!ep) return 0;
  const max = ep.上限 || 1;
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

/* 头部样式：头像与信息组合 */
.identity-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);

  .avatar-box {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid $accent-gold;
    box-shadow: $glow-shadow;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    flex-shrink: 0;

    .avatar-icon {
      width: 32px;
      height: 32px;
      color: $accent-gold;
    }
  }

  .identity-info {
    flex: 1;

    .char-name {
      margin: 0 0 4px 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #fff;
      letter-spacing: 2px;
      text-shadow: 0 0 10px rgba(255,255,255,0.2);
    }

    .status-line {
      font-size: 0.85rem;
      color: $text-dim;

      .status-alive {
        color: $accent-gold;
        font-family: monospace;
      }

      .separator {
        color: rgba(255,255,255,0.2);
        margin: 0 4px;
      }

      .gene-lock {
        color: #fff;
        text-shadow: 0 0 5px rgba(255,255,255,0.3);
      }
    }

    /* 血统/改造与评级 (可点击展开) */
    .bloodline-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.95rem;
      color: $accent-gold;
      margin-top: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      transition: all 0.2s;

      &.has-details {
        cursor: pointer;
        background: rgba(234, 179, 8, 0.05);
        border: 1px solid rgba(234, 179, 8, 0.2);

        &:hover {
          background: rgba(234, 179, 8, 0.1);
          box-shadow: $glow-shadow;
        }
      }

      .bloodline-name {
        font-weight: 500;
      }

      .bloodline-level {
        font-family: monospace;
      }
    }
  }

  .sys-menu-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: $text-dim;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
      border-color: $accent-gold;
      box-shadow: 0 0 8px rgba(234,179,8,0.2);
    }
  }
}

/* 全屏模态框与遮罩 */
.modal-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 侧边滑出抽屉菜单 */
.side-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 200px;
  background: #111116;
  border-left: 1px solid $border-gold;
  box-shadow: -5px 0 20px rgba(0,0,0,0.8);
  padding: 20px;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease forwards;

  .drawer-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: $text-dim;
    font-size: 1.5rem;
    cursor: pointer;
    &:hover { color: #fff; }
  }

  .drawer-title {
    margin: 0 0 20px 0;
    color: $accent-gold;
    font-size: 1.1rem;
    border-bottom: 1px dotted rgba(234,179,8,0.3);
    padding-bottom: 8px;
  }

  .drawer-menu {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .menu-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;

      &:hover {
        background: rgba(234,179,8,0.1);
        border-color: $accent-gold;
        box-shadow: $glow-shadow;
      }
    }
  }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* 居中内容模态框 */
.content-modal {
  position: relative;
  background: #111116;
  border: 1px solid $border-gold;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  max-height: 80%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.9), $glow-shadow;
  display: flex;
  flex-direction: column;
  animation: popIn 0.3s ease forwards;

  &.large-modal {
    max-width: 500px;
  }

  .modal-close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    color: $text-dim;
    font-size: 1.5rem;
    cursor: pointer;
    &:hover { color: #ef4444; }
  }

  .modal-title {
    margin: 0 0 16px 0;
    color: #fff;
    font-size: 1.2rem;
    border-bottom: 1px solid rgba(234, 179, 8, 0.3);
    padding-bottom: 8px;

    .modal-level {
      color: $accent-gold;
      font-size: 0.85rem;
      font-weight: normal;
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    &::-webkit-scrollbar-thumb { background: rgba(234,179,8,0.3); border-radius: 3px; }
    &::-webkit-scrollbar-thumb:hover { background: $accent-gold; }
  }
}

@keyframes popIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 模态框内部共用样式 (血统、物品、NPC) */
.pop-desc {
  font-size: 0.85rem;
  color: $text-dim;
  margin-bottom: 12px;
  line-height: 1.4;
}

.pop-section {
  margin-bottom: 12px;

  .pop-subtitle {
    font-size: 0.85rem;
    color: $accent-gold;
    margin-bottom: 6px;
  }

  .pop-attr-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .pop-attr-tag {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #fff;
    }
  }

  .pop-trait-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.85rem;
    color: $text-main;

    li {
      margin-bottom: 6px;
      strong { color: #fff; }
    }
  }
}

/* 物品网格卡片 */
.item-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .empty-hint {
    text-align: center;
    color: $text-dim;
    padding: 20px;
    font-style: italic;
  }

  .item-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 6px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(234,179,8,0.3);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;

      .item-name { color: #fff; font-weight: 500; font-size: 0.95rem; }
      .item-price { color: $accent-gold; font-family: monospace; font-size: 0.9rem; }
      .equip-badge { background: rgba(34,197,94,0.2); color: #22c55e; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; }
    }

    .item-meta {
      font-size: 0.8rem;
      color: $text-dim;
    }

    .item-detail-drawer {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255,255,255,0.1);
      font-size: 0.85rem;
      color: $text-main;
      line-height: 1.4;
    }
  }
}

/* NPC 列表 */
.npc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .npc-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 6px;
    padding: 12px;

    .npc-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .npc-name { color: #fff; font-weight: 500; }
      .npc-level { font-size: 0.8rem; }
      .npc-level.敌对 { color: #ef4444; }
      .npc-level.不友善 { color: #f97316; }
      .npc-level.友善 { color: #22c55e; }
      .npc-level.崇敬 { color: #a855f7; }
    }

    .npc-favor-bar {
      height: 4px;
      background: #1a1a24;
      border-radius: 2px;
      margin-bottom: 8px;
      overflow: hidden;
      .favor-fill { height: 100%; background: #ec4899; }
    }

    .npc-desc { font-size: 0.8rem; color: $text-dim; line-height: 1.3; }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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