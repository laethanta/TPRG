import { defineStore } from 'pinia';
import { computed } from 'vue';
import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../schema';
import _ from 'lodash';

// 初始化底层 MVU 数据源 Store，连接到酒馆的真实数据层
export const useMvuStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });

// 包装一层派生数据的 Store，供前端各个组件调用
export const useDataStore = defineStore('mvuDerivedData', () => {
  const mvuStore = useMvuStore();
  // 因为底层 mvuStore 的核心数据挂载在 .data 上
  const data = computed(() => mvuStore.data);

  const protagonist = computed(() => data.value.轮回者);

  // 1. 【动态当前属性计算 & 传奇属性】
  // 现在拦截器已经把最终的计算结果写到了属性面板上，所以这里只需要简单读取即可。
  const currentAttributes = computed(() => {
    const attrs = protagonist.value.属性面板 || {};
    const attrNames = ['力量', '敏捷', '耐力', '智力', '感知', '决心', '风度', '操控', '沉着'];
    const result: Record<string, { value: number; legendary: number }> = {};

    for (const name of attrNames) {
      result[name] = {
        value: Number(attrs[name]) || 1,
        legendary: Number(attrs[`传奇${name}`]) || 0
      };
    }
    return result;
  });

  // 2. 【读取衍生属性与负重】
  // 拦截器已经算好了衍生属性，前端直接读取展示
  const derivedStats = computed(() => protagonist.value.生理与状态?.衍生属性 || {});

  const encumbrance = computed(() => {
    const sys = protagonist.value.生理与状态?.负重系统 || {};
    return {
      weight: sys.当前负重 || 0,
      limit: sys.负重上限 || 10,
      status: sys.负重状态 || '轻度'
    };
  });

  // 4.5 【NPC关系层级自动化】
  const npcRelations = computed(() => {
    const records = data.value.人物关系记录 || {};
    const result: Record<string, { fav: number; level: string; summary: string }> = {};

    for (const [npcName, npcData] of Object.entries(records)) {
      if (!npcData.关系记录) continue;
      const fav = npcData.关系记录.好感度;
      let level: string;

      if (fav <= 20) level = '敌对';
      else if (fav <= 40) level = '不友善';
      else if (fav <= 60) level = '警惕';
      else if (fav <= 110) level = '冷淡';
      else if (fav <= 150) level = '友善';
      else if (fav <= 180) level = '亲切';
      else level = '崇敬';

      result[npcName] = {
        fav,
        level,
        summary: npcData.关系记录.印象简评
      };
    }
    return result;
  });

  // 4.6 【血统与支线剧情格式化】
  const bloodline = computed(() => {
    const templates = protagonist.value.特质与模板?.强化模板 || {};
    const keys = Object.keys(templates);
    if (keys.length === 0) return { name: '无血统/改造', level: '无' };

    const mainTemplate = templates[keys[0]];
    return {
      name: mainTemplate.名称 || keys[0],
      level: mainTemplate.当前评级或层数 || '未知'
    };
  });

  const branchPlots = computed(() => {
    return protagonist.value.资源?.支线剧情 || '无';
  });

  // 4.7 【状态与基因锁格式化】
  const characterStatus = computed(() => {
    const status = protagonist.value.生理与状态?.固有状态 || [];
    if (status.includes('死亡')) return 'DEAD';
    if (status.includes('昏迷')) return 'COMA';
    return 'ALIVE';
  });

  const geneLockTier = computed(() => {
    const tier = protagonist.value.生理与状态?.基因锁?.最高阶数 || 0;
    const numerals = ['未开启', '阶级 I', '阶级 II', '阶级 III', '阶级 IV', '阶级 V'];
    return numerals[tier] || `阶级 ${tier}`;
  });

  const bloodlineDetails = computed(() => {
    const templates = protagonist.value.特质与模板?.强化模板 || {};
    const keys = Object.keys(templates);
    if (keys.length === 0) return null;
    return templates[keys[0]];
  });

  // 6. 【主神空间物品列表】
  const godSpaceItems = computed(() => {
    const list: any[] = [];
    const s = data.value.世界记录?.主神空间档案?.主神商店当前列表;
    if (s) {
      if (s.科幻类兑换) list.push(...s.科幻类兑换);
      if (s.魔法传说类兑换) list.push(...s.魔法传说类兑换);
      if (s.血统及技能) list.push(...s.血统及技能);
      if (s.材料及药品) list.push(...s.材料及药品);
    }
    return list;
  });

  // 7. 【主角持有的物品列表】
  const inventoryItems = computed(() => {
    const list: any[] = [];
    const inv = protagonist.value.物品与资产;
    if (inv) {
      Object.values(inv.武器库 || {}).forEach((i: any) => list.push({ ...i, _category: '武器' }));
      Object.values(inv.防具库 || {}).forEach((i: any) => list.push({ ...i, _category: '防具' }));
      Object.values(inv.饰品库 || {}).forEach((i: any) => list.push({ ...i, _category: '饰品' }));
      Object.values(inv.空间道具库 || {}).forEach((i: any) => list.push({ ...i, _category: '空间道具' }));
      Object.values(inv.其他物品 || {}).forEach((i: any) => list.push({ ...i, _category: '其他物品' }));
      Object.values(inv.载具库 || {}).forEach((i: any) => list.push({ ...i, _category: '载具' }));
    }
    return list;
  });

  // 返回给组件使用
  return {
    mvuData: data,
    protagonist,
    currentAttributes,
    derivedStats,
    encumbrance,
    npcRelations,
    bloodline,
    branchPlots,
    characterStatus,
    geneLockTier,
    bloodlineDetails,
    godSpaceItems,
    inventoryItems
  };
});
