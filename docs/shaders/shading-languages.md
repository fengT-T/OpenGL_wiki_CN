# 着色语言 (Shading Languages)

着色语言是用于编写着色器程序的专用编程语言。OpenGL 支持多种着色语言，它们共享一些通用特性，但在灵活性和限制方面各有不同。

## 通用概念

所有着色语言都遵循相似的设计理念，在图形管线中完成类似的功能。在选择具体语言之前，了解着色语言在图形管线中的角色很重要。

着色语言主要用于：
- 定义顶点变换和属性处理
- 实现光照和材质计算
- 控制纹理采样和过滤
- 执行几何图元的生成和修改
- 实现通用 GPU 计算

## OpenGL 支持的着色语言

### GLSL (OpenGL Shading Language)

**GLSL** 是 OpenGL 的原生着色语言，与 OpenGL 规范紧密集成。

**特点**：
- 与 OpenGL 版本同步发展
- 直接编译为 GPU 可执行代码
- 支持 OpenGL 的所有着色器阶段
- 跨平台、跨厂商兼容

::: tip 推荐
对于纯 OpenGL 项目，GLSL 是首选语言。它与 OpenGL API 无缝集成，文档丰富，社区支持完善。
:::

详细内容请参考 [GLSL 概述](./glsl-overview.md)。

### SPIR-V

**SPIR-V** 是一种二进制中间表示格式，最初为 Vulkan 设计，OpenGL 4.6 开始支持。

**特点**：
- 二进制格式，无需运行时编译
- 可由 GLSL 或其他语言（HLSL）编译生成
- 提供 `glSpecializeShader` 进行着色器特化
- 支持 OpenGL 和 Vulkan 之间的代码共享

**使用场景**：
- 需要保护着色器源码
- 需要跨 API（OpenGL/Vulkan）共享着色器
- 需要更快的着色器加载速度

详细内容请参考 [SPIR-V](./spirv.md)。

### Cg (已废弃)

**Cg** 是 NVIDIA 开发的专有着色语言，由微软 HLSL 和 NVIDIA 联合开发。

::: warning 已废弃
Cg 工具包已于 2012 年停止更新。不建议在新项目中使用。
:::

**历史背景**：
- 曾提供跨 API（OpenGL/DirectX）的着色器开发能力
- 语法类似 HLSL
- 需要运行时 Cg 运行时库

## 语言选择指南

选择着色语言时，应考虑以下因素：

| 因素 | GLSL | SPIR-V |
|------|------|--------|
| 学习曲线 | 平缓 | 需要 GLSL 基础 |
| 运行时编译 | 是 | 否（预编译） |
| 源码保护 | 无 | 有 |
| 跨 API 支持 | 仅 OpenGL | OpenGL + Vulkan |
| 调试便利性 | 较好 | 较难 |
| 加载速度 | 较慢（需编译） | 较快 |

### 推荐选择

1. **学习 OpenGL**：使用 GLSL
2. **纯 OpenGL 项目**：使用 GLSL
3. **需要源码保护**：使用 SPIR-V
4. **跨 OpenGL/Vulkan 项目**：使用 SPIR-V
5. **需要快速加载**：使用 SPIR-V

## 相关主题

- [GLSL 常见错误](https://www.khronos.org/opengl/wiki/GLSL:_common_mistakes) - 开发中常见的 GLSL 错误及其解决方案
- [GLSL 推荐](https://www.khronos.org/opengl/wiki/GLSL:_recommendations) - GLSL 编码最佳实践
- [顶点纹理获取 (Vertex Texture Fetch)](https://www.khronos.org/opengl/wiki/Vertex_Texture_Fetch) - 在顶点着色器中采样纹理
- [纹理采样 (Texture Sampling)](https://www.khronos.org/opengl/wiki/Texture_Sampling) - 纹理采样的工作原理
- [几何着色器](./geometry.md) - 几何着色器的使用

## 厂商特定特性

不同 GPU 厂商可能提供特定扩展：

- **NVIDIA 特性**：支持一些 NVIDIA 专有扩展
- **AMD/ATI 特性**：支持一些 AMD 专有扩展

::: warning 可移植性
使用厂商特定特性会降低代码的可移植性。在生产环境中应谨慎使用，并提供回退方案。
:::
