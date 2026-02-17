# 样式主题配置说明

## 概述

本项目采用统一的蓝白淡色调主题，所有样式变量已封装在 `src/styles` 目录下，方便后续修改和维护。

## 文件结构

```
src/styles/
├── theme.ts       # TypeScript 主题配置对象
├── theme.css      # CSS 变量定义
└── global.css     # 全局样式和组件样式覆盖
```

## 主题颜色

### 主色调（蓝色系）
- `--color-primary`: #3b82f6 - 主蓝色
- `--color-primary-light`: #60a5fa - 浅蓝色
- `--color-primary-lighter`: #93c5fd - 更浅蓝色
- `--color-primary-dark`: #2563eb - 深蓝色
- `--color-primary-darker`: #1d4ed8 - 更深蓝色

### 中性色
- `--color-secondary`: #64748b - 次要灰色
- `--color-secondary-light`: #94a3b8 - 浅灰色
- `--color-secondary-lighter`: #cbd5e1 - 更浅灰色

### 功能色
- `--color-success`: #10b981 - 成功绿
- `--color-warning`: #f59e0b - 警告黄
- `--color-danger`: #ef4444 - 危险红
- `--color-info`: #06b6d4 - 信息青

### 背景色
- `--color-background`: #f8fafc - 页面背景
- `--color-background-light`: #f1f5f9 - 浅色背景
- `--color-background-dark`: #e2e8f0 - 深色背景
- `--color-surface`: #ffffff - 卡片表面
- `--color-surface-hover`: #f8fafc - 悬停表面

### 文本色
- `--color-text-primary`: #1e293b - 主要文本
- `--color-text-secondary`: #475569 - 次要文本
- `--color-text-tertiary`: #64748b - 三级文本
- `--color-text-disabled`: #94a3b8 - 禁用文本
- `--color-text-inverse`: #ffffff - 反色文本

### 边框色
- `--color-border`: #e2e8f0 - 边框
- `--color-border-light`: #f1f5f9 - 浅边框

## 渐变色

- `--gradient-primary`: 紫色渐变
- `--gradient-blue`: 蓝色渐变（主）
- `--gradient-light`: 浅色渐变
- `--gradient-soft`: 柔和蓝色渐变

## 间距系统

- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 20px
- `--spacing-2xl`: 24px
- `--spacing-3xl`: 32px
- `--spacing-4xl`: 40px

## 圆角系统

- `--border-radius-sm`: 4px
- `--border-radius-md`: 6px
- `--border-radius-lg`: 8px
- `--border-radius-xl`: 12px
- `--border-radius-2xl`: 16px
- `--border-radius-full`: 9999px

## 字体大小

- `--font-size-xs`: 12px
- `--font-size-sm`: 13px
- `--font-size-base`: 14px
- `--font-size-md`: 15px
- `--font-size-lg`: 16px
- `--font-size-xl`: 18px
- `--font-size-2xl`: 20px
- `--font-size-3xl`: 24px
- `--font-size-4xl`: 28px

## 阴影系统

- `--shadow-xs`: 极小阴影
- `--shadow-sm`: 小阴影
- `--shadow-md`: 中等阴影
- `--shadow-lg`: 大阴影
- `--shadow-xl`: 超大阴影

## 过渡动画

- `--transition-fast`: 150ms
- `--transition-base`: 200ms
- `--transition-slow`: 300ms

## 使用方式

### 在 CSS 中使用

```css
.my-component {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

### 在 TypeScript 中使用

```typescript
import theme from '@/styles/theme'

const primaryColor = theme.colors.primary
const spacing = theme.spacing.lg
```

## 修改主题

如需修改主题颜色，只需编辑以下文件：

1. **CSS 变量**: `src/styles/theme.css` - 修改 CSS 变量值
2. **TS 配置**: `src/styles/theme.ts` - 修改 TypeScript 配置对象

### 示例：修改主色调为绿色

在 `theme.css` 中：

```css
:root {
  --color-primary: #10b981;
  --color-primary-light: #34d399;
  --color-primary-lighter: #6ee7b7;
  --color-primary-dark: #059669;
  --color-primary-darker: #047857;
}
```

在 `theme.ts` 中：

```typescript
export const theme = {
  colors: {
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryLighter: '#6ee7b7',
    primaryDark: '#059669',
    primaryDarker: '#047857',
  }
}
```

## 设计风格特点

1. **现代简约**: 采用淡色调和柔和的阴影，符合近年来的设计趋势
2. **蓝白配色**: 以蓝色为主色调，白色为背景，清新专业
3. **圆角设计**: 适度使用圆角，增加亲和力
4. **微交互**: 按钮悬停、输入框聚焦等都有细腻的过渡效果
5. **层次分明**: 通过阴影和背景色区分不同层级的内容

## 已更新的组件

以下组件已应用新主题：

- ✅ 全局样式
- ✅ 布局组件
- ✅ 登录页面
- ✅ 首页
- ✅ 用户列表页
- ✅ 用户表单页
- ✅ 系统管理首页

## Element Plus 组件覆盖

已在 `global.css` 中对以下 Element Plus 组件进行了样式覆盖：

- Button（按钮）
- Input（输入框）
- Card（卡片）
- Table（表格）
- Pagination（分页）
- Tag（标签）
- Menu（菜单）
- Dialog（对话框）
- Message（消息提示）
- Dropdown（下拉菜单）
- Form（表单）

## 注意事项

1. 所有新开发的组件应优先使用 CSS 变量
2. 避免硬编码颜色值，统一使用主题变量
3. 保持设计风格的一致性
4. 如需添加新的颜色变量，请同时更新 `theme.css` 和 `theme.ts`
