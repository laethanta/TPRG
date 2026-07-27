import { defineStore } from 'pinia';
import { computed, Ref, ref } from 'vue';
import { z } from 'zod';
// 假设这些来自框架提供的库 (请根据实际路径调整)
// import { defineMvuDataStore } from '@util/mvu';
// import { getCurrentMessageId } from '@util/tavern';
import { Schema } from '../schema';
import _ from 'lodash';

// 临时占位，实际项目中需从框架导入
function defineMvuDataStore<T extends z.ZodObject<any, any>, R>(
  schema: T,
  _options: any,
  setup: (data: Ref<z.infer<T>>) => R
) {
  return defineStore('mvuData', () => {
    // 模拟数据源，实际应为 Ref<z.infer<typeof Schema>>
    const data = ref(schema.parse({})) as Ref<z.infer<T>>;
    return setup(data);
  });
}

function getCurrentMessageId() { return 0; }

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() }, (data: Ref<z.infer<typeof Schema>>) => {
  const protagonist = computed(() => data.value.主角);

  // 1. 【动态当前属性计算 & 传奇属性】
  const currentAttributes = computed(() => {
    const baseAttrs = protagonist.value.属性面板;
    const result: Record<string, { value: number; legendary: number }> = {};

    for (const [attrName, attrData] of Object.entries<any>(baseAttrs)) {
      const value = attrData.基础值 + attrData.附加常驻缓存 + attrData.临时加值缓存;
      // 传奇属性公式：达到6为1，11为2...
      const legendary = value >= 6 ? Math.floor((value - 1) / 5) : 0;

      result[attrName] = { value, legendary };
    }
    return result;
  });

  // 2. 【体积缩放计算】
  // 根据体积计算生命值调整和装备重量缩放倍率
  const volumeData = computed(() => {
    // 基础体积，若为主角则读取其负重系统缓存的体积
    const volume = protagonist.value.生理与状态.负重系统?.体积 ?? 5;

    // 生命值调整值 (简化映射：超微0, 微1, 小2, 中5, 大10, 超大17, 巨26, 超巨37)
    let hpMod = 5;
    if (volume < 1) hpMod = 0;
    else if (volume === 1) hpMod = 1;
    else if (volume <= 3) hpMod = 2;
    else if (volume <= 6) hpMod = 5; // 默认5
    else if (volume <= 12) hpMod = 10;
    else if (volume <= 21) hpMod = 17;
    else if (volume <= 33) hpMod = 26;
    else hpMod = 37;

    // 装备缩放倍率
    const ratio = volume / 5;

    return {
      volume,
      hpMod,
      equipmentRatio: ratio
    };
  });

  // 3. 【衍生防御与先攻】
  const derivedStats = computed(() => {
    const attrs = currentAttributes.value;
    const vData = volumeData.value;

    // 传奇加成
    const legEndurance = attrs['耐力'].legendary;
    const legAgility = attrs['敏捷'].legendary;
    const legPerception = attrs['感知'].legendary;
    const legResolve = attrs['决心'].legendary;
    const legComposure = attrs['沉着'].legendary;

    // 基础防御 (用于削减敌人攻击DP): Min(敏捷, 感知)
    const baseDefense = Math.min(attrs['敏捷'].value, attrs['感知'].value);

    // 防御附加成功 (用于直接抵消敌人成功数): 传奇敏捷 + 传奇感知
    const defenseAutoSuccess = legAgility + legPerception;

    // 防具防御汇总
    let armorDef = 0;
    let shieldDef = 0;

    // 遍历防具库，累加所有标记为"已装备"的防具属性
    Object.values(protagonist.value.物品与资产.防具库 || {}).forEach((item: any) => {
      if (item.已装备) {
        armorDef += item.盔甲防御 || 0;
        shieldDef += item.盾牌防御 || 0;
      }
    });

    // HP 与 WP
    // 传奇耐力HP加成：n(n+1)/2
    const legHpBonus = (legEndurance * (legEndurance + 1)) / 2;
    // 假设有培元固本，每次加成按规则定（此处简化为每次+5）
    const peiyuanBonus = 0; // 需从主神空间档案读取

    return {
      最大HP: attrs['耐力'].value + vData.hpMod + legHpBonus + peiyuanBonus,
      最大意志力: attrs['决心'].value + attrs['沉着'].value + (legResolve * 3) + (legComposure * 3),
      先攻: attrs['敏捷'].value + attrs['沉着'].value + (legComposure * 3),
      速度: attrs['力量'].value + attrs['敏捷'].value + 5,
      基础防御: baseDefense,
      // 总防御DP削减
      总防御: baseDefense + armorDef + shieldDef,
      // 直接抵消成功数
      防御附加成功: defenseAutoSuccess
    };
  });

  // 4. 【负重状态计算】
  const encumbrance = computed(() => {
    // 实际项目中应遍历所有未在容器中的物品
    let totalWeightKg = protagonist.value.生理与状态.负重系统.当前负重_kg || 0;

    const strength = currentAttributes.value['力量'].value;
    const legStrength = currentAttributes.value['力量'].legendary;

    // 负重倍数 = 传奇力量(n+1)倍
    const multiplier = (legStrength + 1);

    // 基础公式: 10 + 3*力量
    const limit = (10 + 3 * strength) * multiplier;

    let status = '轻度';
    if (totalWeightKg > limit * 3) status = '压垮';
    else if (totalWeightKg > limit * 2) status = '重度';
    else if (totalWeightKg > limit) status = '中度';

    return {
      weight: totalWeightKg,
      limit,
      status
    };
  });

  // 4.5 【NPC关系层级自动化】
  const npcRelations = computed(() => {
    const records = data.value.人物关系记录 || {};
    const result: Record<string, { fav: number; level: string; summary: string }> = {};

    for (const [npcName, npcData] of Object.entries(records)) {
      if (!npcData.关系记录) continue;
      const fav = npcData.关系记录.好感度;
      let level = '冷淡';

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

  // 5. 【DP 骰池生成器】
  const getDicePool = (
    attrName: string,
    skillName?: string,
    options?: { profession?: string; weaponName?: string; isPhysical?: boolean }
  ) => {
    let dp = 0;
    let autoSuccess = 0;
    let perfectBonus = 0;
    const details: string[] = [];

    // 1. 属性判定
    const attrData = currentAttributes.value[attrName];
    if (attrData) {
      dp += attrData.value;
      details.push(`${attrName} ${attrData.value}`);

      // 传奇属性基础效果：n个附加成功
      if (attrData.legendary > 0) {
        autoSuccess += attrData.legendary;
        details.push(`传奇${attrName}附加成功 +${attrData.legendary}`);

        // 传奇力量在力量检定上额外提供n点完美加值
        if (attrName === '力量') {
          perfectBonus += attrData.legendary;
          details.push(`传奇力量完美加值 +${attrData.legendary}`);
        }
      }
    }

    // 2. 技能与专业判定
    let hasSkill = false;
    let skillType = '未知'; // 用于 0 级惩罚判定

    // 粗略判断技能系别（这里简化为硬编码列表，真实项目可提到外部配置）
    const physSkills = ['运动', '肉搏', '驾驶', '枪械', '手上功夫', '隐藏', '求生', '白刃'];
    const mentSkills = ['学识', '电脑', '调查', '医学', '神秘学', '科学'];
    const intSkills = ['动物沟通', '感受', '胁迫', '交际', '掩饰'];
    if (skillName) {
      if (physSkills.includes(skillName)) skillType = '生理系';
      else if (mentSkills.includes(skillName) || skillName.startsWith('手艺')) skillType = '心智系';
      else if (intSkills.includes(skillName) || skillName.startsWith('表达')) skillType = '互动系';

      const skillData = protagonist.value.技能列表[skillName];
      if (skillData) {
        hasSkill = skillData.等级 > 0;
        const skillTotal = skillData.等级 + skillData.常驻加值缓存 + skillData.临时加值缓存;
        if (skillTotal > 0) {
          dp += skillTotal;
          details.push(`${skillName} ${skillTotal}`);
        }

        // 技能熟练度带来的附加成功 (5/7/9/11/13/15级分别给 1/2/3/4/5/6 个)
        if (skillData.等级 >= 5) {
          const masteryBonus = Math.floor((skillData.等级 - 3) / 2);
          autoSuccess += masteryBonus;
          details.push(`技能熟练附加成功 +${masteryBonus}`);
        }

        // 专业判定 (满足多个专业不叠加，仅算一次)
        let hasProfession = false;
        if (skillName.includes('-')) {
          hasProfession = true;
        } else if (options?.profession && skillData.已解锁专业.includes(options.profession)) {
          hasProfession = true;
        }

        if (hasProfession) {
          dp += 1;
          details.push(`专业加成 +1`);
        }
      }
    }

    // 2.5 零级惩罚判定
    if (skillName && !hasSkill) {
      if (skillType === '生理系') {
        details.push(`[警告]生理技能为0，结算时失去1个自然成功数`);
      } else if (skillType === '心智系') {
        details.push(`[致命]心智技能为0，无法检定，自动失败`);
        dp = 0; autoSuccess = 0; perfectBonus = 0;
      } else if (skillType === '互动系') {
        details.push(`[警告]互动技能为0，结算时失去2个自然成功数（若为高专业行为则直接失败）`);
      }
    }

    // 3. 武器伤害判定
    if (options?.weaponName) {
      const weapon = protagonist.value.物品与资产.武器库[options.weaponName];
      if (weapon && weapon.武器伤害) {
        const dmgMatch = weapon.武器伤害.match(/(\d+)/);
        if (dmgMatch) {
          const dmgVal = parseInt(dmgMatch[1], 10);
          dp += dmgVal;
          details.push(`武器伤害 +${dmgVal}`);
        }
      }
    }

    // 4. 负重减值判定
    const physicalAttrs = ['力量', '敏捷', '耐力'];
    const isPhysicalCheck = options?.isPhysical !== undefined ? options.isPhysical : physicalAttrs.includes(attrName);

    if (isPhysicalCheck) {
      const encStatus = encumbrance.value.status;
      if (encStatus === '压垮') {
        return { dp: 0, autoSuccess: 0, perfectBonus: 0, details: ['处于压垮状态，无法行动'] };
      } else if (encStatus === '重度') {
        dp -= 3;
        details.push(`重度负重 -3`);
      } else if (encStatus === '中度') {
        dp -= 1;
        details.push(`中度负重 -1`);
      }
    }

    // DP 最低为 0
    dp = Math.max(0, dp);

    return { dp, autoSuccess, perfectBonus, details };
  };

  // 返回给组件使用
  return {
    mvuData: data,
    protagonist,
    currentAttributes,
    volumeData,
    derivedStats,
    encumbrance,
    npcRelations,
    getDicePool
  };
});
