FinSight V8.5 完整包（包含 V8.4 的全部修复）

1. Overview 的 Inventory：
   - 标准标签从 1 个扩到 7 个（含航空 AirlineRelatedInventoryNet、零售、能源、公用事业、房地产）
   - 没有总数时，用 产成品+在制品+原材料 相加，或 存货毛额 − LIFO 准备，标为 derived-components
   - 还查不到时，从 10-K 原文资产负债表按行名读取（会自动排除行名里嵌着的跌价准备金额）
2. 功能07 交易模拟 Balance Sheet：Prepaid assets、Net PP&E、Accrued wages、Deferred revenue 不再写死为空：
   - 先查 SEC 标准标签，查不到再从 10-K 原文按行名读取
   - 航空公司的 Deferred revenue 取 Air traffic liability（当期合同负债）
3. V8.4 的 Operating ROA / Valuation 自动映射保留。

部署：上传全部文件（含 netlify/functions 和 sw-v85.js）到 GitHub 根目录并提交。页面和后端都应显示 8.5。
