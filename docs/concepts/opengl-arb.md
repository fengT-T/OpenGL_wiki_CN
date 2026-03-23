# OpenGL 架构评审委员会（ARB）

**OpenGL 架构评审委员会**（OpenGL Architectural Review Board，简称 ARB）是 Khronos Group 内部负责 OpenGL API 演进的团队。

## 职责

ARB 的主要职责包括：

- 制定和修订 OpenGL 规范
- 审批和推广 OpenGL 扩展
- 管理 OpenGL 扩展注册表
- 协调各厂商的 OpenGL 实现

## 扩展审批流程

ARB 审批的扩展使用 `GL_ARB_` 前缀，这些扩展：

1. 经过多个厂商协商
2. 最可能进入后续核心版本
3. 进入核心时改动较小

典型的扩展演进路径：

```
厂商私有扩展 → EXT 扩展 → ARB 扩展 → 核心功能
```

::: info 提示
GLSL 的扩展版本（`ARB_shader_objects`）与核心 2.0 功能存在差异，这是扩展与核心功能不同的典型案例。
:::

## 历史背景

ARB 最初是独立的行业联盟，后来并入 Khronos Group。其主要成员包括：

- NVIDIA
- AMD（原 ATI）
- Intel
- 其他主要图形厂商

## 相关链接

- [Khronos Group](https://www.khronos.org/) - OpenGL 管理组织
- [OpenGL Registry](http://www.opengl.org/registry/) - 扩展注册表
