import { z } from 'zod';
import _ from 'lodash';

// ----------------------------------------------------------------------
// 1. 基础构件 (Primitive Schemas)
// ----------------------------------------------------------------------

// 肉体与灵魂年龄结构 (仅主角使用详细年龄)
const AgeSchema = z.object({
  实际: z.coerce.number().prefault(20),
  外观: z.coerce.number().prefault(20),
  寿命上限: z.coerce.number().prefault(100),
  灵魂实际: z.coerce.number().prefault(20),
  灵魂寿命上限: z.coerce.number().prefault(100)
}).prefault({ 实际: 20, 外观: 20, 寿命上限: 100, 灵魂实际: 20, 灵魂寿命上限: 100 });

// 九维属性结构 (仅记录原生投入的加点基础值，当前值和传奇点数由脚本自动汇总后填入衍生速查)
const AttributeValueSchema = z.object({
  基础值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(1),
  附加常驻缓存: z.coerce.number().describe('由脚本汇总血统/专长等永久加成').prefault(0),
  临时加值缓存: z.coerce.number().describe('由脚本汇总装备等临时加成').prefault(0),
  当前值: z.coerce.number().describe('由脚本计算，禁止AI修改').prefault(1),
  传奇点数: z.coerce.number().describe('由脚本计算，禁止AI修改').prefault(0)
}).prefault({ 基础值: 1, 附加常驻缓存: 0, 临时加值缓存: 0, 当前值: 1, 传奇点数: 0 });

const AttributesSchema = z.object({
  // 生理系
  力量: AttributeValueSchema.prefault({ 基础值: 1 }),
  敏捷: AttributeValueSchema.prefault({ 基础值: 1 }),
  耐力: AttributeValueSchema.prefault({ 基础值: 1 }),
  // 心智系
  智力: AttributeValueSchema.prefault({ 基础值: 1 }),
  感知: AttributeValueSchema.prefault({ 基础值: 1 }),
  决心: AttributeValueSchema.prefault({ 基础值: 1 }),
  // 互动系
  风度: AttributeValueSchema.prefault({ 基础值: 1 }),
  操控: AttributeValueSchema.prefault({ 基础值: 1 }),
  沉着: AttributeValueSchema.prefault({ 基础值: 1 })
}).prefault({});

// 技能与专业结构 (基础技能)
const SkillSchema = z.object({
  等级: z.coerce.number().transform(v => _.clamp(v, 0, 15)).prefault(0), // 0-15级
  已解锁专业: z.array(z.string()).prefault([]), // 如：['手枪', '步枪']
  常驻加值缓存: z.coerce.number().describe('由脚本汇总血统/专长等永久加成').prefault(0),
  临时加值缓存: z.coerce.number().describe('由脚本汇总装备等临时加成').prefault(0)
}).prefault({ 等级: 0, 已解锁专业: [], 常驻加值缓存: 0, 临时加值缓存: 0 });

// 技能列表集合结构
// 我们不再硬编码所有19个技能，而是采用 Record，允许通过名称动态存取，
// 这样同时也完美兼容了 "手艺-制造科技武器" 这种子分类技能。
const SkillListSchema = z.record(z.string(), SkillSchema).prefault({});

// 生命周期状态池 (B/L/A 伤害记录)
const HealthPoolsSchema = z.object({
  上限缓存: z.coerce.number().describe('用于前端展示，实际值由脚本计算').prefault(5),
  完好: z.coerce.number().prefault(5),
  冲击_B: z.coerce.number().prefault(0),
  严重_L: z.coerce.number().prefault(0),
  恶性_A: z.coerce.number().prefault(0)
}).prefault({ 上限缓存: 5, 完好: 5, 冲击_B: 0, 严重_L: 0, 恶性_A: 0 });

// 不良状态与增益状态
const StatusPointsSchema = z.record(z.string(), z.coerce.number().prefault(0)).prefault({});
const FixedStatusSchema = z.array(z.string()).prefault([]);

// 能量池记录
const EnergyPoolSchema = z.object({
  名称: z.string().prefault('无'),
  当前值: z.coerce.number().prefault(0),
  基础上限加成: z.coerce.number().prefault(0), // 例如重复开启的补偿
  上限缓存: z.coerce.number().describe('用于前端展示，实际值由脚本计算').prefault(0)
}).prefault({ 名称: '无', 当前值: 0, 基础上限加成: 0, 上限缓存: 0 });

// 基因锁记录
const GeneLockSchema = z.object({
  最高已开启阶数: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(0),
  各阶熟练度: z.array(z.coerce.number()).prefault([0, 0, 0, 0, 0]), // 一到五阶的熟练度累计
  当前处于开启阶数: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(0),
  反噬记录: z.record(z.string(), z.any()).prefault({}) // 记录如开启轮数等信息
}).prefault({ 最高已开启阶数: 0, 各阶熟练度: [0, 0, 0, 0, 0], 当前处于开启阶数: 0, 反噬记录: {} });

// 负重状态与体积 (主要为主角准备，供脚本计算后缓存)
const EncumbranceSchema = z.object({
  体积: z.coerce.number().describe('由血统/专长等计算').prefault(5),
  当前负重_kg: z.coerce.number().prefault(0),
  负重上限缓存_kg: z.coerce.number().prefault(10),
  当前状态: z.enum(['轻度', '中度', '重度', '压垮']).prefault('轻度')
}).prefault({ 体积: 5, 当前负重_kg: 0, 负重上限缓存_kg: 10, 当前状态: '轻度' });


const DerivedStatsSchema = z.object({
  最大HP: z.coerce.number().prefault(5),
  最大意志力: z.coerce.number().prefault(2),
  基础防御: z.coerce.number().prefault(1),
  防御附加成功: z.coerce.number().prefault(0),
  先攻: z.coerce.number().prefault(2),
  速度: z.coerce.number().prefault(10),
  意志豁免DP: z.coerce.number().prefault(2),
  反射豁免DP: z.coerce.number().prefault(2),
  强韧豁免DP: z.coerce.number().prefault(2)
}).prefault({ 最大HP: 5, 最大意志力: 2, 基础防御: 1, 防御附加成功: 0, 先攻: 2, 速度: 10, 意志豁免DP: 2, 反射豁免DP: 2, 强韧豁免DP: 2 });

// 生理与状态集合 (通用基础结构)

const PhysiologyBaseSchema = z.object({
  生命状态: HealthPoolsSchema,
  当前意志力: z.coerce.number().prefault(1),
  意志力上限缓存: z.coerce.number().describe('用于前端展示，实际值由脚本计算').prefault(1),
  能量池: EnergyPoolSchema,
  不良状态点数: StatusPointsSchema,
  固有状态: FixedStatusSchema,
  增益状态: z.array(z.string()).describe('记录临时增益，如加速、隐形等').prefault([]),
  基因锁: GeneLockSchema,
  衍生属性速查: DerivedStatsSchema
});

// 生理与状态集合 (NPC默认使用)
const PhysiologySchema = PhysiologyBaseSchema.prefault({
  生命状态: {}, 当前意志力: 1, 意志力上限缓存: 1, 能量池: {}, 不良状态点数: {}, 固有状态: [], 增益状态: [], 基因锁: {}, 衍生属性速查: {}
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
  特殊: z.string().prefault('')
});

// 模板类(血统/改造/瞳术/修炼体系/典籍)
const TemplateSchema = z.object({
  名称: z.string(),
  模板分类: z.enum(['血统', '改造', '瞳术', '修炼体系', '典籍', '流派', '称号']).prefault('血统'),
  本质: z.string().prefault('魔幻本质'),
  前提: z.string().prefault('无'),
  当前评级或层数: z.string().prefault('D级'),
  价格: z.string().prefault(''),
  描述: z.string().prefault(''),
  属性加成记录: z.record(z.string(), z.coerce.number()).describe('如 { 力量: 1, 敏捷: 1 } 以便脚本统计').prefault({}),
  能量池说明: z.string().prefault('无'),
  技能树说明: z.string().prefault('无'),
  特性列表: z.array(TraitSchema).prefault([]),
  特殊: z.string().prefault('')
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
  数量: z.coerce.number().prefault(1)
});

const EquipmentBaseSchema = ItemBaseSchema.extend({
  已装备: z.boolean().prefault(false)
});

// 武器
const WeaponSchema = EquipmentBaseSchema.extend({
  武器伤害: z.string().prefault('0L'), // 如 4L, 2B
  特殊属性: z.string().prefault('无'), // 破甲等
  特性列表: z.array(TraitSchema).prefault([])
});

// 防具
const ArmorSchema = EquipmentBaseSchema.extend({
  盔甲防御: z.coerce.number().prefault(0),
  盾牌防御: z.coerce.number().optional(),
  特殊属性: z.string().prefault('无'),
  特性列表: z.array(TraitSchema).prefault([])
});

// 饰品结构
const AccessorySchema = EquipmentBaseSchema.extend({
  特殊属性: z.string().prefault('无'),
  特性列表: z.array(TraitSchema).prefault([])
});

// 空间容器结构 (如战术腰包、空间戒指)
const ContainerSchema = EquipmentBaseSchema.extend({
  空间体积上限: z.coerce.number().prefault(10),
  内容物: z.array(z.string()).describe('记录内部存放的物品键名，内部物品不计入负重').prefault([]),
  特性列表: z.array(TraitSchema).prefault([])
});

// 消耗品
const ConsumableSchema = ItemBaseSchema.extend({
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
// 3. 货币体系 (Currency Schema)
// ----------------------------------------------------------------------

const CurrencySchema = z.object({
  奖励点: z.coerce.number().prefault(0),
  经验值_XP: z.coerce.number().prefault(0),
  支线剧情: z.string().describe('当前拥有的支线剧情，例如：C×1 D×2 或 无').prefault('无')
}).prefault({ 奖励点: 0, 经验值_XP: 0, 支线剧情: '无' });


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
  主神货币: CurrencySchema,
  生理与状态: PhysiologyBaseSchema.extend({
    负重系统: EncumbranceSchema
  }).prefault({
    生命状态: {}, 当前意志力: 1, 意志力上限缓存: 1, 能量池: {}, 不良状态点数: {}, 固有状态: [], 增益状态: [], 基因锁: {}, 负重系统: {}
  }),

  物品与资产: z.object({
    武器库: z.record(z.string(), WeaponSchema).prefault({}),
    防具库: z.record(z.string(), ArmorSchema).prefault({}),
    饰品库: z.record(z.string(), AccessorySchema).prefault({}),
    容器库: z.record(z.string(), ContainerSchema).prefault({}),
    消耗品与杂物: z.record(z.string(), z.union([ConsumableSchema, ItemBaseSchema])).prefault({}),
    载具库: z.record(z.string(), VehicleSchema).prefault({})
  }).prefault({ 武器库: {}, 防具库: {}, 饰品库: {}, 容器库: {}, 消耗品与杂物: {}, 载具库: {} })
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
  主神货币: CurrencySchema,
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
  经验值_XP: z.coerce.number().optional(),
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
  武器列表: z.array(WeaponSchema).prefault([]),
  防具列表: z.array(ArmorSchema).prefault([]),
  强化模板列表: z.array(TemplateSchema).prefault([]),
  物品与消耗品列表: z.array(z.union([ConsumableSchema, ItemBaseSchema])).prefault([])
}).prefault({ 武器列表: [], 防具列表: [], 强化模板列表: [], 物品与消耗品列表: [] });

const WorldRecordSchema = z.object({
  当前影片信息: z.object({
    名称: z.string().prefault('主神空间'),
    类型: z.string().prefault('中转站'),
    难度评级: z.string().prefault('未知'),
    本质倾向: z.string().prefault('混合'),
    当前区域: z.string().prefault('广场平台'),
    当前地标: z.string().prefault('中央光球'),
    当前精确时间: z.string().describe('如 YYYY-MM-DD HH:mm').prefault('未知')
  }).prefault({ 名称: '主神空间', 类型: '中转站', 难度评级: '未知', 本质倾向: '混合', 当前区域: '广场平台', 当前地标: '中央光球', 当前精确时间: '未知' }),

  团战状态: TeamBattleSchema,

  任务日志: z.record(z.string(), QuestSchema).prefault({}),

  环境状态: z.array(z.string()).describe('记录场景临时效应如高辐射、暴风雨等').prefault([]),

  主神空间档案: z.object({
    恐怖片经历计数: z.coerce.number().prefault(0),
    距离下次传送_天: z.coerce.number().prefault(10),
    已解锁世界列表: z.array(z.string()).describe('首位应为上一场经历的世界').prefault([]),
    私人房间状态: z.string().prefault('10平方米白墙空房间'),
    培元固本次数: z.coerce.number().transform(v => _.clamp(v, 0, 3)).prefault(0),
    主神商店当前列表: GodSpaceStoreSchema
  }).prefault({ 恐怖片经历计数: 0, 距离下次传送_天: 10, 已解锁世界列表: [], 私人房间状态: '10平方米白墙空房间', 培元固本次数: 0, 主神商店当前列表: {} })
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
  // 主角数据
  主角: ProtagonistSchema.prefault({
    属性面板: {},
    技能列表: {},
    特质与模板: {},
    主神货币: {},
    生理与状态: {},
    物品与资产: {},
  }),

  // 世界与副本记录
  世界记录: WorldRecordSchema,

  // NPC与队友记录表
  人物关系记录: z.record(z.string().describe('NPC或队友姓名'), NpcSchema).prefault({}),
});
