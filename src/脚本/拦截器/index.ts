import _ from 'lodash';

declare const waitGlobalInitialized: (name: string) => Promise<void>;
declare const eventOn: (eventName: string, callback: (...args: any[]) => void) => void;
declare const Mvu: any;
declare const toastr: any;
declare const $: any;

$(async () => {
  await waitGlobalInitialized('Mvu');

  const handleVariables = (variables: any) => {
    // 抽出计算核心逻辑为一个函数，方便对主角和所有 NPC 循环复用
    const processEntity = (entity: any, isProtagonist: boolean) => {
      if (!entity) return;

      const attrs = entity.属性面板;
      const hp = entity.生理与状态?.生命状态;
      const statusPoints = entity.生理与状态?.不良状态点数;
      const fixedStatus = entity.生理与状态?.固有状态;
      const inventory = entity.物品与资产;

      if (!attrs || !hp || !fixedStatus) return;

      // 1. 自动汇总属性值并写入 MVU
      const attrNames = ['力量', '敏捷', '耐力', '智力', '感知', '决心', '风度', '操控', '沉着'];

      // 扫描强化模板，提取属性加成
      const templates = entity.特质与模板?.强化模板 || {};
      const templateBonus: Record<string, number> = {};
      for (const tpl of Object.values<any>(templates)) {
        if (tpl.属性加成记录) {
          for (const [attrName, bonus] of Object.entries(tpl.属性加成记录)) {
            templateBonus[attrName] = (templateBonus[attrName] || 0) + Number(bonus);
          }
        }
      }

      for (const name of attrNames) {
        if (attrs[name]) {
          const base = Number(attrs[name].基础值 || 0);

          // 如果没有明确由AI设置常驻加值，将模板加成自动同步过去
          attrs[name].附加常驻缓存 = templateBonus[name] || 0;

          const permanentBonus = Number(attrs[name].附加常驻缓存 || 0);
          const tempBonus = Number(attrs[name].临时加值缓存 || 0);

          const currentVal = Math.max(0, base + permanentBonus + tempBonus);

          attrs[name].当前值 = currentVal;
          attrs[name].传奇点数 = currentVal >= 6 ? Math.floor((currentVal - 1) / 5) : 0;
        }
      }

      const getAttr = (name: string) => attrs[name]?.当前值 ?? 1;
      const getLeg = (name: string) => attrs[name]?.传奇点数 ?? 0;

      // 2. 计算体积与负重 (如果存在物品库)
      const volume = entity.生理与状态?.负重系统?.体积 ?? 5;
      let hpMod: number;
      if (volume < 1) hpMod = 0;
      else if (volume <= 3) hpMod = 2;
      else if (volume <= 6) hpMod = 5;
      else if (volume <= 12) hpMod = 10;
      else hpMod = 17;

      let armorDef = 0;
      let shieldDef = 0;

      if (inventory) {
        const spatialContents = new Set<string>();
        _.forEach(inventory.容器库, (container: any) => {
          const hasSpatialTrait = container.特性列表?.some((t: any) => t.名称.includes('空间') || t.效果.includes('空间'));
          const isSpatialName = /空间|储物|异次元/.test(container.名称);
          if (hasSpatialTrait || isSpatialName) {
            (container.内容物 || []).forEach((itemName: string) => spatialContents.add(itemName));
          }
        });

        let totalWeight = 0;
        const parseWeight = (wStr: string) => {
          if (!wStr) return 0;
          const match = String(wStr).match(/([\d.]+)/);
          return match ? parseFloat(match[1]) : 0;
        };

        const allLibs = [
          inventory.武器库, inventory.防具库, inventory.饰品库, inventory.消耗品与杂物, inventory.容器库
        ];

        allLibs.forEach(lib => {
          _.forEach(lib, (item: any, key: string) => {
            if (!spatialContents.has(key)) {
              const w = parseWeight(item.重量);
              totalWeight += w * (item.数量 || 1);
            }
            if (item.已装备) {
               if (item.盔甲防御) armorDef += Number(item.盔甲防御);
               if (item.盾牌防御) shieldDef += Number(item.盾牌防御);
            }
          });
        });

        if (entity.生理与状态.负重系统) {
          entity.生理与状态.负重系统.当前负重_kg = totalWeight;
        }

        if (inventory.当前防具 && inventory.当前防具.盔甲防御) {
          armorDef += Number(inventory.当前防具.盔甲防御);
        }
      }

      // 3. 计算所有衍生属性
      const legEnd = getLeg('耐力');
      const legHpBonus = (legEnd * (legEnd + 1)) / 2;
      const MAX_HP = getAttr('耐力') + hpMod + legHpBonus;

      const baseDef = Math.min(getAttr('敏捷'), getAttr('感知'));

      const getSkill = (name: string) => {
        const s = entity.技能列表?.[name];
        return s ? (Number(s.等级||0) + Number(s.常驻加值缓存||0) + Number(s.临时加值缓存||0)) : 0;
      };

      if (entity.生理与状态.衍生属性速查) {
        const derived = entity.生理与状态.衍生属性速查;
        derived.最大生命值 = MAX_HP;
        derived.最大意志力 = getAttr('决心') + getAttr('沉着') + (getLeg('决心') * 3) + (getLeg('沉着') * 3);
        derived.基础防御 = baseDef + armorDef + shieldDef;
        derived.防御附加成功 = getLeg('敏捷') + getLeg('感知');
        derived.先攻 = getAttr('敏捷') + getAttr('沉着') + (getLeg('沉着') * 3);
        derived.速度_米 = getAttr('力量') + getAttr('敏捷') + 5;
        derived.意志豁免DP = getAttr('决心') + getSkill('感受') + (getLeg('决心') * 3);
        derived.反射豁免DP = getAttr('敏捷') + getSkill('运动') + (getLeg('敏捷') * 3);
        derived.强韧豁免DP = getAttr('耐力') + getSkill('求生') + (legEnd * 3);
      }

      // 4. 生命值 B/L/A 满溢转化逻辑
      let b = hp.冲击_B || 0;
      let l = hp.严重_L || 0;
      let a = hp.恶性_A || 0;

      let overflow = (b + l + a) - MAX_HP;

      while (overflow > 0) {
        if (b >= 2) {
          b -= 2; l += 1; overflow -= 1;
        } else if (l >= 2) {
          l -= 2; a += 1; overflow -= 1;
        } else {
          a = MAX_HP; b = 0; l = 0;
          if (!fixedStatus.includes('死亡')) {
            fixedStatus.push('死亡');
            if (isProtagonist) toastr?.error('【系统警告】生命值全部转化为恶性伤害，角色已死亡！');
          }
          break;
        }
      }

      hp.冲击_B = b;
      hp.严重_L = l;
      hp.恶性_A = a;
      hp.完好 = Math.max(0, MAX_HP - (b + l + a));

      // 5. 0属性及阈值惩罚判定
      let diedFromStats = false;
      let comatoseFromStats = false;
      let downedFromStats = false;

      if (getAttr('耐力') <= 0) diedFromStats = true;

      const mentalAndSocial = ['智力', '感知', '决心', '风度', '操控', '沉着'];
      for (const stat of mentalAndSocial) {
        if (getAttr(stat) <= 0) comatoseFromStats = true;
      }

      if (getAttr('力量') <= 0 || getAttr('敏捷') <= 0) downedFromStats = true;

      if (diedFromStats && !fixedStatus.includes('死亡')) {
        fixedStatus.push('死亡');
        if (isProtagonist) toastr?.error('【系统警告】耐力降至 0，角色已死亡！');
      } else if (comatoseFromStats && !fixedStatus.includes('昏迷') && !fixedStatus.includes('死亡')) {
        fixedStatus.push('昏迷');
        if (isProtagonist) toastr?.warning('【系统警告】心智或互动属性降至 0，角色陷入昏迷或精神崩溃！');
      }

      if (downedFromStats && !fixedStatus.includes('倒地') && !fixedStatus.includes('昏迷') && !fixedStatus.includes('死亡')) {
        fixedStatus.push('倒地');
        if (isProtagonist) toastr?.warning('【系统警告】力量或敏捷降至 0，角色倒地并失去自主行动力！');
      }

      if (hp.完好 <= 0 && !fixedStatus.includes('昏迷') && !fixedStatus.includes('死亡')) {
        fixedStatus.push('昏迷');
        if (isProtagonist) toastr?.warning('【系统警告】完好生命值归零，角色陷入昏迷！');
      }

      if (statusPoints) {
        const statusThreshold = (getAttr('耐力') + getAttr('决心')) * 2;
        let TriggeredComa = false;
        if ((statusPoints['剧痛'] || 0) >= statusThreshold) TriggeredComa = true;
        if ((statusPoints['流血'] || 0) >= statusThreshold) TriggeredComa = true;

        if (TriggeredComa && !fixedStatus.includes('昏迷') && !fixedStatus.includes('死亡')) {
          fixedStatus.push('昏迷');
          if (isProtagonist) toastr?.warning(`【系统警告】状态点数超标，角色强制昏迷！`);
        }
      }
    };

    // 1. 处理主角
    const protagonist = _.get(variables, 'stat_data.主角');
    processEntity(protagonist, true);

    // 2. 处理所有 NPC
    const npcMap = _.get(variables, 'stat_data.人物关系记录');
    if (npcMap) {
      Object.values(npcMap).forEach(npc => {
        processEntity(npc, false);
      });
    }

  };

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, handleVariables);
  eventOn(Mvu.events.VARIABLE_INITIALIZED, handleVariables);
});