import _ from 'lodash';

declare const waitGlobalInitialized: (name: string) => Promise<void>;
declare const eventOn: (eventName: string, callback: (...args: any[]) => void) => void;
declare const Mvu: any;
declare const toastr: any;
declare const $: any;

$(async () => {
  await waitGlobalInitialized('Mvu');

  const handleVariables = (variables: any, variables_before_update?: any) => {
    // 抽出计算核心逻辑为一个函数，方便对主角和所有 NPC 循环复用
    const processEntity = (entity: any, oldEntity: any, isProtagonist: boolean) => {
      if (!entity) return;

      const attrs = entity.属性面板;       // 这是AI看到的扁平属性结果面板
      const hp = entity.生理与状态?.生命状态;
      const statusPoints = entity.生理与状态?.不良状态点数;
      const fixedStatus = entity.生理与状态?.固有状态;
      const inventory = entity.物品与资产;

      if (!attrs || !hp || !fixedStatus) return;

      const attrNames = ['力量', '敏捷', '耐力', '智力', '感知', '决心', '风度', '操控', '沉着'];

      // 提取指定实体的全部加成（血统 + 装备）
      const getBuffs = (ent: any) => {
        const buffs: Record<string, number> = {};
        if (!ent) return buffs;

        // 血统加成
        const templates = ent.特质与模板?.强化模板 || {};
        for (const tpl of Object.values<any>(templates)) {
          if (tpl.属性加成) {
            for (const [attrName, bonus] of Object.entries(tpl.属性加成)) {
              buffs[attrName] = (buffs[attrName] || 0) + Number(bonus);
            }
          }
        }

        // 装备加成
        const inv = ent.物品与资产;
        if (inv) {
          const allLibs = [inv.武器库, inv.防具库, inv.饰品库, inv.空间道具库];
          allLibs.forEach(lib => {
            _.forEach(lib, (item: any) => {
              if (item.已装备 && item.属性加成) {
                for (const [attrName, bonus] of Object.entries(item.属性加成)) {
                  buffs[attrName] = (buffs[attrName] || 0) + Number(bonus);
                }
              }
            });
          });
        }
        return buffs;
      };

      // 1. 差值法 (Delta Calculation) 动态更新属性面板
      const newBuffs = getBuffs(entity);
      let oldBuffs: Record<string, number> = {};

      const isInit = typeof variables_before_update !== 'object';
      if (!isInit && oldEntity) {
        oldBuffs = getBuffs(oldEntity);
      }

      for (const name of attrNames) {
        const diff = (newBuffs[name] || 0) - (oldBuffs[name] || 0);
        if (diff !== 0) {
          // 如果加成发生了变化（比如穿脱了装备，或血统进阶），把差值直接叠加到当前属性上
          attrs[name] = Math.max(0, (Number(attrs[name]) || 1) + diff);
        }
      }

      // 计算传奇点数
      for (const name of attrNames) {
        const currentVal = Number(attrs[name]) || 1;
        attrs[`传奇${name}`] = currentVal >= 6 ? Math.floor((currentVal - 1) / 5) : 0;
      }

      // 2. 扫描已装备的物品，处理装备槽位限制与空间道具
      let armorDef = 0;
      let shieldDef = 0;
      let totalWeight = 0;
      let eqWeaponCount = 0;
      let eqArmorCount = 0;
      let eqAccessoryCount = 0;
      let eqSpatialCount = 0;
      let spatialCapacity = 0;
      let spatialUsed = 0;

      const parseWeight = (wStr: string) => {
        if (!wStr) return 0;
        const match = String(wStr).match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
      };

      if (inventory) {
        // 先处理空间道具，获取容量上限
        _.forEach(inventory.空间道具库, (item: any) => {
          if (item.已装备) {
            if (eqSpatialCount >= 1) {
              item.已装备 = false; // 强行卸下超出的空间道具
              return;
            }
            eqSpatialCount++;
            spatialCapacity += Number(item.空间体积上限 || 0);
          }
        });

        // 统一遍历所有物品库，计算装备加成与负重
        const allLibs = [
          inventory.武器库, inventory.防具库, inventory.饰品库, inventory.其他物品, inventory.载具库, inventory.空间道具库
        ];

        allLibs.forEach((lib, libIdx) => {
          _.forEach(lib, (item: any) => {
            // 空间内物品判定
            if (item.在空间内) {
              const v = Number(item.体积 || 0) * (item.数量 || 1);
              if (spatialUsed + v > spatialCapacity) {
                // 超出空间上限，强行从空间弹出
                item.在空间内 = false;
                if (isProtagonist) toastr?.warning(`【系统】空间容量不足，[${item.名称}]已弹出。`);
              } else {
                spatialUsed += v;
              }
            }

            // 如果不在空间内，计算物理重量
            if (!item.在空间内) {
              const w = parseWeight(item.重量);
              totalWeight += w * (item.数量 || 1);
            }

            // 处理装备槽位与属性提取
            if (item.已装备) {
              if (libIdx === 0) { // 武器库
                if (eqWeaponCount >= 2) { item.已装备 = false; return; }
                eqWeaponCount++;
              } else if (libIdx === 1) { // 防具库
                if (eqArmorCount >= 1) { item.已装备 = false; return; }
                eqArmorCount++;
                if (item.盔甲防御) armorDef += Number(item.盔甲防御);
                if (item.盾牌防御) shieldDef += Number(item.盾牌防御);
              } else if (libIdx === 2) { // 饰品库
                if (eqAccessoryCount >= 2) { item.已装备 = false; return; }
                eqAccessoryCount++;
              }
            }
          });
        });
      }

      const getAttr = (name: string) => Number(attrs[name]) || 1;
      const getLeg = (name: string) => Number(attrs[`传奇${name}`]) || 0;

      // 4. 计算体积与物理负重状态
      const volume = entity.生理与状态?.负重系统?.体积 ?? 5;
      let hpMod: number;
      if (volume < 1) hpMod = 0;
      else if (volume <= 3) hpMod = 2;
      else if (volume <= 6) hpMod = 5;
      else if (volume <= 12) hpMod = 10;
      else hpMod = 17;

      if (entity.生理与状态?.负重系统) {
        const sys = entity.生理与状态.负重系统;
        sys.当前负重 = totalWeight;
        const limit = (10 + 3 * getAttr('力量')) * (getLeg('力量') + 1);
        sys.负重上限 = limit;
        if (totalWeight > limit * 3) sys.负重状态 = '压垮';
        else if (totalWeight > limit * 2) sys.负重状态 = '重度';
        else if (totalWeight > limit) sys.负重状态 = '中度';
        else sys.负重状态 = '轻度';
      }

      // 5. 计算衍生属性
      const legEnd = getLeg('耐力');
      const legHpBonus = (legEnd * (legEnd + 1)) / 2;
      const MAX_HP = getAttr('耐力') + hpMod + legHpBonus;

      const baseDef = Math.min(getAttr('敏捷'), getAttr('感知'));

      const getSkill = (name: string) => {
        const s = entity.技能列表?.[name];
        return s ? Number(s.等级||0) : 0;
      };

      if (entity.生理与状态?.衍生属性) {
        const derived = entity.生理与状态.衍生属性;
        derived.最大HP = MAX_HP;
        derived.最大意志力 = getAttr('决心') + getAttr('沉着') + (getLeg('决心') * 3) + (getLeg('沉着') * 3);
        derived.基础防御 = baseDef + armorDef + shieldDef;
        derived.防御附加成功 = getLeg('敏捷') + getLeg('感知');
        derived.先攻 = getAttr('敏捷') + getAttr('沉着') + (getLeg('沉着') * 3);
        derived.速度 = getAttr('力量') + getAttr('敏捷') + 5;
        derived.意志豁免 = getAttr('决心') + getSkill('感受') + (getLeg('决心') * 3);
        derived.反射豁免 = getAttr('敏捷') + getSkill('运动') + (getLeg('敏捷') * 3);
        derived.强韧豁免 = getAttr('耐力') + getSkill('求生') + (legEnd * 3);
        derived.空间余量 = Math.max(0, spatialCapacity - spatialUsed);
      }

      // 6. 生命值 B/L/A 满溢转化逻辑
      let b = hp.冲击B || 0;
      let l = hp.严重L || 0;
      let a = hp.恶性A || 0;

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

      hp.冲击B = b;
      hp.严重L = l;
      hp.恶性A = a;
      hp.完好 = Math.max(0, MAX_HP - (b + l + a));

      // 7. 0属性及阈值惩罚判定
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
      // 8. 支线剧情自动进位 (三进一)
      if (entity.资源 && typeof entity.资源.支线剧情 === 'string') {
        const plotStr = entity.资源.支线剧情;
        let s = 0, a = 0, b = 0, c = 0, d = 0;

        // 提取现有的支线数量
        const matchS = plotStr.match(/S[^\d]*(\d+)/i);
        const matchA = plotStr.match(/A[^\d]*(\d+)/i);
        const matchB = plotStr.match(/B[^\d]*(\d+)/i);
        const matchC = plotStr.match(/C[^\d]*(\d+)/i);
        const matchD = plotStr.match(/D[^\d]*(\d+)/i);

        if (matchS) s = parseInt(matchS[1], 10);
        if (matchA) a = parseInt(matchA[1], 10);
        if (matchB) b = parseInt(matchB[1], 10);
        if (matchC) c = parseInt(matchC[1], 10);
        if (matchD) d = parseInt(matchD[1], 10);

        // 全部折算为 D 级当做基数
        let totalD = d + (c * 3) + (b * 9) + (a * 27) + (s * 81);

        // 重新进位换算
        const newS = Math.floor(totalD / 81);
        totalD %= 81;
        const newA = Math.floor(totalD / 27);
        totalD %= 27;
        const newB = Math.floor(totalD / 9);
        totalD %= 9;
        const newC = Math.floor(totalD / 3);
        const newD = totalD % 3;

        // 拼装标准字符串
        const parts = [];
        if (newS > 0) parts.push(`S×${newS}`);
        if (newA > 0) parts.push(`A×${newA}`);
        if (newB > 0) parts.push(`B×${newB}`);
        if (newC > 0) parts.push(`C×${newC}`);
        if (newD > 0) parts.push(`D×${newD}`);

        entity.资源.支线剧情 = parts.length > 0 ? parts.join(' ') : '无';
      }
    };

    // 判断当前是否是 init 阶段
    const isInit = typeof variables_before_update !== 'object';

    // 处理主角
    const protagonist = _.get(variables, 'stat_data.轮回者');
    const oldProtagonist = !isInit ? _.get(variables_before_update, 'stat_data.轮回者') : undefined;
    processEntity(protagonist, oldProtagonist, true);

    // 处理所有 NPC
    const npcMap = _.get(variables, 'stat_data.人物关系记录');
    if (npcMap) {
      Object.entries(npcMap).forEach(([npcName, npc]: [string, any]) => {
        const oldNpc = !isInit ? _.get(variables_before_update, `stat_data.人物关系记录.${npcName}`) : undefined;
        processEntity(npc, oldNpc, false);
      });
    }

  };

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, handleVariables);
  eventOn(Mvu.events.VARIABLE_INITIALIZED, handleVariables);
});