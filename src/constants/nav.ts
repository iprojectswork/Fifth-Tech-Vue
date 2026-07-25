/**
 * B1 导航常量
 * 产品契约：docs/B1-NAVIGATION.md
 */

/** 工作台路由（壳模式：无侧栏、无页签条） */
export const WORKBENCH_PATH = '/dashboard'

/** 顶栏一级域平铺上限，超出进入「更多」下拉（不含「工作台」本身） */
export const TOP_NAV_VISIBLE_COUNT = 10

/** 「更多」hover 展开延迟(ms)，避免鼠标划过误开 */
export const MORE_OPEN_DELAY = 250

/** 「更多」移出后关闭延迟(ms)，便于移入下拉面板 */
export const MORE_CLOSE_DELAY = 250
