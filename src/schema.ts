import { z } from 'zod';
import _ from 'lodash';

// ----------------------------------------------------------------------
// 1. 基础构件 (Primitive Schemas)
// ----------------------------------------------------------------------

// 肉体与灵魂年龄结构
const AgeSchema = z.object({
  实际: z.coerce.number().prefault(20),
  寿命上限: z.coerce.number().prefault(100),
  灵魂实际: z.coerce.number().prefault(20),
  灵魂寿命上限: z.coerce.number().prefault(100)
}).prefault({ 实际: 20, 寿命上限: 100, 灵魂实际: 20, 灵魂寿命上限: 100 });

// 扁平化属性结构
const AttributesSchema = z.object({
  力量: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇力量: z.coerce.number().prefault(0),
  敏捷: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇敏捷: z.coerce.number().prefault(0),
  耐力: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇耐力: z.coerce.number().prefault(0),
  智力: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇智力: z.coerce.number().prefault(0),
  感知: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇感知: z.coerce.number().prefault(0),
  决心: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇决心: z.coerce.number().prefault(0),
  风度: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇风度: z.coerce.number().prefault(0),
  操控: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇操控: z.coerce.number().prefault(0),
  沉着: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  传奇沉着: z.coerce.number().prefault(0)
}).prefault({ 力量: 1, 传奇力量: 0, 敏捷: 1, 传奇敏捷: 0, 耐力: 1, 传奇耐力: 0, 智力: 1, 传奇智力: 0, 感知: 1, 传奇感知: 0, 决心: 1, 传奇决心: 0, 风度: 1, 传奇风度: 0, 操控: 1, 传奇操控: 0, 沉着: 1, 传奇沉着: 0 });

// 技能与专业结构 (基础技能)
const SkillSchema = z.object({
  等级: z.coerce.number().transform(v => _.clamp(v, 0, 15)).prefault(0), // 0-15级
  专业: z.array(z.string()).prefault([]) // 如：['手枪', '步枪']
}).prefault({ 等级: 0, 专业: [] });

// 技能列表集合结构
const SkillListSchema = z.record(z.string(), SkillSchema).prefault({});

// 生命周期状态池
const HealthPoolsSchema = z.object({
  上限: z.coerce.number().describe('用于前端展示，实际值由脚本计算').prefault(5),
  完好: z.coerce.number().prefault(5),
  冲击B: z.coerce.number().prefault(0),
  严重L: z.coerce.number().prefault(0),
  恶性A: z.coerce.number().prefault(0)
}).prefault({ 上限: 5, 完好: 5, 冲击B: 0, 严重L: 0, 恶性A: 0 });

// 不良状态与增益状态
const StatusPointsSchema = z.record(z.string(), z.coerce.number().prefault(0)).prefault({});
const FixedStatusSchema = z.array(z.string()).prefault([]);

// 能量池记录
const EnergyPoolSchema = z.object({
  名称: z.string().prefault('无'),
  当前值: z.coerce.number().prefault(0),
  基础上限加成: z.coerce.number().prefault(0), // 例如重复开启的补偿
  上限: z.coerce.number().describe('用于前端展示，实际值由脚本计算').prefault(0)
}).prefault({ 名称: '无', 当前值: 0, 基础上限加成: 0, 上限: 0 });

// 基因锁记录
const GeneLockSchema = z.object({
  最高阶数: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(0),
  熟练度: z.coerce.number().prefault(0),
  开启状态: z.boolean().prefault(false),
  开启轮数: z.coerce.number().prefault(0)
}).prefault({ 最高阶数: 0, 熟练度: 0, 开启状态: false, 开启轮数: 0 });

// 负重状态与体积 (主要为主角准备，供脚本计算后缓存)
const EncumbranceSchema = z.object({
  体积: z.coerce.number().describe('由血统/专长等计算').prefault(5),
  当前负重: z.coerce.number().prefault(0),
  负重上限: z.coerce.number().prefault(10),
  负重状态: z.enum(['轻度', '中度', '重度', '压垮']).prefault('轻度')
}).prefault({ 体积: 5, 当前负重: 0, 负重上限: 10, 负重状态: '轻度' });

const DerivedStatsSchema = z.object({
  最大HP: z.coerce.number().prefault(5),
  最大意志力: z.coerce.number().prefault(2),
  基础防御: z.coerce.number().prefault(1),
  防御附加成功: z.coerce.number().prefault(0),
  先攻: z.coerce.number().prefault(2),
  速度: z.coerce.number().prefault(10),
  意志豁免: z.coerce.number().prefault(2),
  反射豁免: z.coerce.number().prefault(2),
  强韧豁免: z.coerce.number().prefault(2),
  空间余量: z.coerce.number().describe('计算出的空间道具剩余体积').prefault(0)
}).prefault({ 最大HP: 5, 最大意志力: 2, 基础防御: 1, 防御附加成功: 0, 先攻: 2, 速度: 10, 意志豁免: 2, 反射豁免: 2, 强韧豁免: 2, 空间余量: 0 });

// 生理与状态集合 (通用基础结构)
const PhysiologyBaseSchema = z.object({
  生命状态: HealthPoolsSchema,
  意志力: z.coerce.number().prefault(1),
  意志力上限: z.coerce.number().describe('用于前端展示，实际值由脚本计算').prefault(1),
  能量池: EnergyPoolSchema,
  不良状态点数: StatusPointsSchema,
  固有状态: FixedStatusSchema,
  增益状态: z.array(z.string()).describe('记录临时增益，如加速、隐形等').prefault([]),
  基因锁: GeneLockSchema,
  衍生属性: DerivedStatsSchema
});

// 生理与状态集合 (NPC默认使用)
const PhysiologySchema = PhysiologyBaseSchema.prefault({
  生命状态: {}, 意志力: 1, 意志力上限: 1, 能量池: {}, 不良状态点数: {}, 固有状态: [], 增益状态: [], 基因锁: {}, 衍生属性: {}
});

// ----------------------------------------------------------------------
// 2. 强化、物品与装备体系
// ----------------------------------------------------------------------

// 特性/效果通用结构
const TraitSchema = z.object({
  名称: z.string().prefault('未命名'),
  效果: z.string().prefault('')
}).prefault({ 名称: '未命名', 效果: '' });

// 专长/缺陷/天赋/怪癖
const FeatSchema = z.object({
  名称: z.string(),
  类型: z.enum(['普通专长', '非凡专长', '超魔专长', '建卡专长', '缺陷', '怪癖', '天赋']).prefault('普通专长'),
  等级或点数: z.coerce.number().prefault(1), // 专长1-5级，缺陷为负数或0等
  前提: z.string().prefault('无'),
  描述: z.string().prefault(''),
  特性列表: z.array(TraitSchema).prefault([]),
  关键词: z.string().describe('只写用【】包裹的简述，例如：【防弹】、【追踪】等').prefault('')
});

// 模板类(血统/改造/瞳术/修炼体系/典籍)
const TemplateSchema = z.object({
  名称: z.string(),
  模板分类: z.enum(['血统', '改造', '瞳术', '修炼体系', '典籍', '流派', '称号']).prefault('血统'),
  本质: z.string().prefault('魔幻本质'),
  前提: z.string().prefault('无'),
  强化等级: z.string().prefault('D级'),
  价格: z.string().prefault(''),
  描述: z.string().prefault(''),
  属性加成: z.record(z.string(), z.coerce.number()).describe('如 { 力量: 1, 敏捷: 1 } 以便脚本统计').prefault({}),
  能量池说明: z.string().prefault('无'),
  技能树说明: z.string().prefault('无'),
  特性列表: z.array(TraitSchema).prefault([]),
  关键词: z.string().describe('只写用【】包裹的简述，例如：【防弹】、【追踪】等').prefault('')
});

// 技艺与法术
const TechniqueSchema = z.object({
  名称: z.string(),
  类型: z.enum(['技艺', '招式', '法术']).prefault('法术'),
  本质: z.string().prefault('魔幻本质'),
  关键字: z.string().prefault(''),
  前提: z.string().prefault('无'),
  专业: z.string().prefault('无'),
  威力值: z.coerce.number().optional(), // 仅法术
  价格: z.string().prefault(''),
  动作: z.string().prefault('标准动作'),
  能耗: z.string().prefault('无'),
  成分: z.string().optional(), // 仅法术: 语言/姿势/材料
  射程: z.string().prefault('触及'),
  目标: z.string().prefault('一个目标'),
  范围: z.string().prefault('无'),
  持续时间: z.string().prefault('立即'),
  描述: z.string().prefault(''),
  效果: z.string().prefault(''),
  增幅: z.string().optional()
});

// 特质与模板集合
const TraitsAndTemplatesSchema = z.object({
  专长列表: z.record(z.string(), FeatSchema).prefault({}),
  强化模板: z.record(z.string(), TemplateSchema).prefault({}),
  技艺法术: z.record(z.string(), TechniqueSchema).prefault({})
}).prefault({ 专长列表: {}, 强化模板: {}, 技艺法术: {} });

// 物品基础结构
const ItemBaseSchema = z.object({
  名称: z.string(),
  本质: z.string().prefault('自然本质'),
  分类: z.string().prefault('普通物品'),
  前提: z.string().prefault('无'),
  体积: z.coerce.number().prefault(1),
  重量: z.string().prefault('1公斤'), // string以便记录如"0.5公斤"
  价格: z.string().prefault(''),
  描述: z.string().prefault(''),
  数量: z.coerce.number().prefault(1),
  在空间内: z.boolean().describe('是否被收入空间道具中（不计负重）').prefault(false)
});

const EquipmentBaseSchema = ItemBaseSchema.extend({
  已装备: z.boolean().describe('是否穿戴在身上').prefault(false),
  关键词: z.string().describe('只写用【】包裹的简述，如：【空间】、【防弹】').prefault('')
});

// 武器
const WeaponSchema = EquipmentBaseSchema.extend({
  武器伤害: z.string().prefault('0L'), // 如 4L, 2B
  特性列表: z.array(TraitSchema).prefault([])
});

// 防具
const ArmorSchema = EquipmentBaseSchema.extend({
  盔甲防御: z.coerce.number().prefault(0),
  盾牌防御: z.coerce.number().optional(),
  特性列表: z.array(TraitSchema).prefault([])
});

// 饰品结构
const AccessorySchema = EquipmentBaseSchema.extend({
  特性列表: z.array(TraitSchema).prefault([])
});

// 空间道具结构 (如战术腰包、空间戒指)
const SpatialItemSchema = EquipmentBaseSchema.extend({
  空间体积上限: z.coerce.number().prefault(10),
  特性列表: z.array(TraitSchema).prefault([])
});

// 其他物品 (原杂物/消耗品)
const OtherItemSchema = ItemBaseSchema.extend({
  效果: z.string().prefault('')
});

// 载具
const VehicleSchema = ItemBaseSchema.extend({
  载具类型: z.string().prefault('机械载具'),
  生命: z.coerce.number().prefault(10),
  护甲: z.coerce.number().prefault(0),
  硬度: z.coerce.number().prefault(1),
  速度: z.string().prefault('10米/轮'),
  灵活性: z.string().prefault('中等'),
  载员: z.string().prefault('1人'),
  出力: z.coerce.number().prefault(5),
  机动: z.coerce.number().prefault(5),
  能源: z.string().prefault('燃油'),
  特性列表: z.array(TraitSchema).prefault([])
});




// ----------------------------------------------------------------------
// 3. 资源体系 (Resource Schema)
// ----------------------------------------------------------------------

const ResourceSchema = z.object({
  奖励点: z.coerce.number().prefault(0),
  经验值: z.coerce.number().prefault(0),
  支线剧情: z.string().describe('当前拥有的支线剧情，例如：C×1 D×2 或 无').prefault('无')
}).prefault({ 奖励点: 0, 经验值: 0, 支线剧情: '无' });


// ----------------------------------------------------------------------
// 4. 实体模板 (ProtagonistSchema & NpcSchema)
// ----------------------------------------------------------------------

// 主角专属结构：详细年龄，完整资产库，包含负重系统
const ProtagonistSchema = z.object({
  姓名: z.string().prefault('主角'),

  基本信息: z.object({
    身份: z.string().prefault('轮回者'),
    性别: z.string().prefault('未知'),
    背景描述: z.string().prefault(''),
    肉体年龄: AgeSchema
  }).prefault({ 身份: '轮回者', 性别: '未知', 背景描述: '', 肉体年龄: {} }),

  属性面板: AttributesSchema,
  技能列表: SkillListSchema,
  特质与模板: TraitsAndTemplatesSchema,
  资源: ResourceSchema,
  生理与状态: PhysiologyBaseSchema.extend({
    负重系统: EncumbranceSchema
  }).prefault({
    生命状态: {}, 意志力: 1, 意志力上限: 1, 能量池: {}, 不良状态点数: {}, 固有状态: [], 增益状态: [], 基因锁: {}, 负重系统: {}, 衍生属性: {}
  }),

  物品与资产: z.object({
    武器库: z.record(z.string(), WeaponSchema).prefault({}),
    防具库: z.record(z.string(), ArmorSchema).prefault({}),
    饰品库: z.record(z.string(), AccessorySchema).prefault({}),
    空间道具库: z.record(z.string(), SpatialItemSchema).prefault({}),
    其他物品: z.record(z.string(), z.union([OtherItemSchema, ItemBaseSchema])).prefault({}),
    载具库: z.record(z.string(), VehicleSchema).prefault({})
  }).prefault({ 武器库: {}, 防具库: {}, 饰品库: {}, 空间道具库: {}, 其他物品: {}, 载具库: {} })
});

// NPC专属结构：简化年龄，简化物品库，强制包含详细社交关系
const NpcSchema = z.object({
  基本信息: z.object({
    身份: z.string().prefault('未知'),
    性别: z.string().prefault('未知'),
    年龄: z.string().prefault('未知'), // NPC简化为单一字符串或数字
    性格: z.string().prefault(''),
    外貌: z.string().prefault(''),
    背景描述: z.string().prefault(''),
    所处地点: z.string().prefault('未知')
  }).prefault({ 身份: '未知', 性别: '未知', 年龄: '未知', 性格: '', 外貌: '', 背景描述: '', 所处地点: '未知' }),

  属性面板: AttributesSchema,
  技能列表: SkillListSchema,
  特质与模板: TraitsAndTemplatesSchema,
  资源: ResourceSchema,
  生理与状态: PhysiologySchema,

  // NPC 物品与资产极简化：仅保留当前穿着和极少量的关键掉落/持有物
  物品与资产: z.object({
    当前武器: WeaponSchema.optional(),
    当前防具: ArmorSchema.optional(),
    携带物品: z.array(z.string()).describe('无需详细数据的普通物品').prefault([])
  }).prefault({ 携带物品: [] }),

  // 关系记录为 NPC 必须记录的数据 (针对主角的态度)
  关系记录: z.object({
    好感度: z.coerce.number().transform(v => _.clamp(v, 0, 200)).prefault(70),
    印象简评: z.string().prefault('')
  }).prefault({ 好感度: 70, 印象简评: '' })
});


// ----------------------------------------------------------------------
// 5. 世界记录与主神空间
// ----------------------------------------------------------------------

const QuestRewardSchema = z.object({
  奖励点: z.coerce.number().optional(),
  经验值: z.coerce.number().optional(),
  支线剧情: z.string().describe('例如：C×1 D×2').optional(),
  其他奖励描述: z.string().prefault('')
});

const QuestSchema = z.object({
  类型: z.enum(['主线任务', '支线任务']).prefault('支线任务'),
  目标: z.string().prefault(''),
  时间限制: z.string().prefault('无'),
  成功奖励: QuestRewardSchema.optional(),
  失败惩罚: z.string().describe('纯文本描述惩罚，如抹杀、扣除点数等').prefault('无'),
  当前状态: z.enum(['未触发', '进行中', '已完成', '已失败']).prefault('进行中')
});

const TeamBattleSchema = z.object({
  是否开启: z.boolean().prefault(false),
  敌对小队: z.array(z.string()).prefault([]),
  己方积分: z.coerce.number().prefault(0)
}).prefault({ 是否开启: false, 敌对小队: [], 己方积分: 0 });

const GodSpaceStoreSchema = z.object({
  科幻类兑换: z.array(z.union([WeaponSchema, ArmorSchema, AccessorySchema, SpatialItemSchema, OtherItemSchema, VehicleSchema, ItemBaseSchema])).prefault([]),
  魔法传说类兑换: z.array(z.union([WeaponSchema, ArmorSchema, AccessorySchema, SpatialItemSchema, OtherItemSchema, VehicleSchema, ItemBaseSchema])).prefault([]),
  血统及技能: z.array(z.union([TemplateSchema, TechniqueSchema, FeatSchema])).prefault([]),
  材料及药品: z.array(z.union([OtherItemSchema, ItemBaseSchema])).prefault([])
}).prefault({ 科幻类兑换: [], 魔法传说类兑换: [], 血统及技能: [], 材料及药品: [] });

const WorldRecordSchema = z.object({
  当前影片信息: z.object({
    名称: z.string().prefault('主神空间'),
    类型: z.string().prefault('无'),
    难度评级: z.string().prefault('无'),
    本质倾向: z.string().prefault('无'),
    当前区域: z.string().prefault('广场平台'),
    当前地标: z.string().prefault('中央光球'),
    当前时间: z.string().prefault('倒计时10天')
  }).prefault({ 名称: '主神空间', 类型: '无', 难度评级: '无', 本质倾向: '无', 当前区域: '广场平台', 当前地标: '中央光球', 当前时间: '倒计时10天' }),

  团战状态: TeamBattleSchema,

  任务日志: z.record(z.string(), QuestSchema).prefault({}),

  环境状态: z.array(z.string()).describe('记录场景临时效应如高辐射、暴风雨等').prefault([]),

  主神空间档案: z.object({
    恐怖片经历计数: z.coerce.number().prefault(1),
    恐怖片倒计时: z.coerce.number().describe('返回主神空间后开始倒计时').prefault(10),
    已解锁世界列表: z.array(z.string()).describe('首位应为上一场经历的世界').prefault([]),
    私人房间状态: z.string().prefault('10平方米白墙空房间'),
    培元固本次数: z.coerce.number().transform(v => _.clamp(v, 0, 3)).prefault(0),
    主神商店当前列表: GodSpaceStoreSchema
  }).prefault({ 恐怖片经历计数: 1, 恐怖片倒计时: 10, 已解锁世界列表: [], 私人房间状态: '10平方米白墙空房间', 培元固本次数: 0, 主神商店当前列表: {} })
}).prefault({
  当前影片信息: {},
  团战状态: {},
  任务日志: {},
  环境状态: [],
  主神空间档案: {}
});


// ----------------------------------------------------------------------
// 6. 顶层 Schema 聚合
// ----------------------------------------------------------------------

export const Schema = z.object({
  // 世界与副本记录
  世界记录: WorldRecordSchema,

  // 主角数据
  轮回者: ProtagonistSchema.prefault({
    属性面板: {},
    技能列表: {},
    特质与模板: {},
    资源: {},
    生理与状态: {},
    物品与资产: {},
  }),

  // NPC与队友记录表
  人物关系记录: z.record(z.string().describe('NPC或队友姓名'), NpcSchema).prefault({}),
});
