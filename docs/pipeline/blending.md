# 混合 (Blending)

混合（Blending）是 OpenGL 渲染管线中的一个阶段，它将片段着色器（Fragment Shader）输出的颜色与颜色缓冲区中已有的颜色进行组合。通过配置混合参数，可以实现源颜色和目标颜色的多种组合方式。

## 透明度 (Transparency)

混合常用于实现透明效果，但这需要特殊处理，尤其是透明物体的排序问题。详见[透明度排序](/concepts/transparency-sorting)。

## 片段输出 (Fragment Outputs)

片段处理阶段的输出是一个或多个颜色值。这些颜色需要写入当前帧缓冲区（Framebuffer）的颜色缓冲区中。每个片段输出颜色通过 `glDrawBuffers` 或 `glDrawBuffer` 与特定的缓冲区关联。

当混合启用时，片段输出的颜色不会直接覆盖缓冲区中的现有值，而是根据混合函数将两者组合。

## 绘制缓冲区混合 (Draw Buffers Blend)

::: info 版本信息
- 核心版本：4.0+
- 扩展：`ARB_draw_buffers_blend`
:::

如果支持此功能，可以为每个缓冲区指定不同的混合参数或方程。相关函数在名称末尾添加 `i`（如 `glBlendFuncSeparatei`），第一个参数为缓冲区索引。

::: warning 硬件支持
AMD/ATI HD2000-4000 系列实现此扩展，但 NVIDIA 的 4.0 之前硬件不支持。
:::

注意：`glEnablei/glDisablei` 是 3.0 核心功能，用于单独启用/禁用各缓冲区的混合；而绘制缓冲区混合是指为不同缓冲区指定不同的混合参数。

## 源颜色、目标颜色与缓冲区

混合操作在**源颜色**（Source Color，片段着色器输出的颜色 **S**）和**目标颜色**（Destination Color，缓冲区中的颜色 **D**）之间进行，产生输出颜色 **O**。

- **S**、**D**、**O** 表示完整颜色向量
- **Srgb**、**Drgb** 表示 RGB 分量
- **Sa**、**Da** 表示 Alpha 分量

所有加法和乘法都是逐分量操作。

::: tip 颜色处理
- 若目标缓冲区使用归一化整数格式，源颜色 **S** 会被限制到 [0, 1] 范围
- 若目标缓冲区使用 sRGB 格式且启用了 `GL_FRAMEBUFFER_SRGB`，目标颜色 **D** 会被线性化
- 若目标缓冲区使用非归一化整数格式，混合被跳过，**S** 直接写入 **O**
:::

## 启用混合

```cpp
glEnablei(GL_BLEND, i);    // 为缓冲区 i 启用混合
glDisablei(GL_BLEND, i);   // 为缓冲区 i 禁用混合
glEnable(GL_BLEND);        // 为所有缓冲区启用混合
glDisable(GL_BLEND);       // 为所有缓冲区禁用混合
```

::: warning 限制
混合仅对浮点或归一化整数格式的缓冲区有效。对于非归一化整数格式，混合行为如同禁用。
:::

## 混合方程 (Blend Equations)

混合状态包含两部分：方程和参数。方程定义基本的数学运算，参数用于调整计算。

RGB 和 Alpha 分量使用独立的方程：

```cpp
void glBlendEquationSeparate(GLenum modeRGB, GLenum modeAlpha);
```

可用的方程：

| 枚举值 | 运算 | 说明 |
|--------|------|------|
| `GL_FUNC_ADD` | **O** = **sS** + **dD** | 源与目标相加 |
| `GL_FUNC_SUBTRACT` | **O** = **sS** - **dD** | 源减目标 |
| `GL_FUNC_REVERSE_SUBTRACT` | **O** = **dD** - **sS** | 目标减源 |
| `GL_MIN` | **O** = min(**S**, **D**) | 逐分量取最小值（忽略参数） |
| `GL_MAX` | **O** = max(**S**, **D**) | 逐分量取最大值（忽略参数） |

## 混合参数 (Blending Parameters)

对于使用参数的方程，计算公式为：

```
Orgb = srgb * Srgb + drgb * Drgb
Oa   = sa   * Sa   + da   * Da
```

参数通过以下函数设置：

```cpp
void glBlendFuncSeparate(GLenum srcRGB, GLenum dstRGB, GLenum srcAlpha, GLenum dstAlpha);
```

### 常量值

- `GL_ONE`：值为 1.0
- `GL_ZERO`：值为 0.0

### 颜色相关参数

| 枚举值 | 含义 |
|--------|------|
| `GL_SRC_COLOR` | 源颜色 **S** |
| `GL_DST_COLOR` | 目标颜色 **D** |
| `GL_ONE_MINUS_SRC_COLOR` | 1.0 - **S** |
| `GL_ONE_MINUS_DST_COLOR` | 1.0 - **D** |
| `GL_SRC_ALPHA` | 源 Alpha **Sa** |
| `GL_DST_ALPHA` | 目标 Alpha **Da** |
| `GL_ONE_MINUS_SRC_ALPHA` | 1.0 - **Sa** |
| `GL_ONE_MINUS_DST_ALPHA` | 1.0 - **Da** |

### 常用混合配置

**传统 Alpha 混合**（基于源 Alpha 在源和目标间线性插值）：

```cpp
glBlendEquationSeparate(GL_FUNC_ADD, GL_FUNC_ADD);
glBlendFuncSeparate(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_ONE, GL_ZERO);
```

**预乘 Alpha 混合**（Premultiplied Alpha，RGB 已预先乘以 Alpha）：

```cpp
glBlendEquationSeparate(GL_FUNC_ADD, GL_FUNC_ADD);
glBlendFuncSeparate(GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_ONE, GL_ONE_MINUS_SRC_ALPHA);
```

### 混合颜色 (Blend Color)

可设置一个常量颜色用于混合：

```cpp
void glBlendColor(GLclampf red, GLclampf green, GLclampf blue, GLclampf alpha);
```

相关参数：`GL_CONSTANT_COLOR`、`GL_ONE_MINUS_CONSTANT_COLOR`、`GL_CONSTANT_ALPHA`、`GL_ONE_MINUS_CONSTANT_ALPHA`

### 双源混合 (Dual Source Blending)

片段着色器可输出两个颜色到同一缓冲区：

```glsl
layout(location = 0, index = 0) out vec4 outputColor0;
layout(location = 0, index = 1) out vec4 outputColor1;
```

或使用 API：

```cpp
void glBindFragDataLocationIndexed(uint program, uint colorNumber, uint index, const char* name);
```

颜色 0 作为源颜色 **S**，颜色 1 仅用于参数：`GL_SRC1_COLOR`、`GL_SRC1_ALPHA`、`GL_ONE_MINUS_SRC1_COLOR`、`GL_ONE_MINUS_SRC1_ALPHA`

::: warning 限制
几乎所有实现中 `GL_MAX_DUAL_SOURCE_DRAW_BUFFERS` 为 1，使用双源混合时只能写入一个缓冲区。
:::