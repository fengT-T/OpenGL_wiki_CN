---
title: 纹理
---

# 纹理（Texture）

纹理（Texture）是一种 OpenGL Object（OpenGL对象），包含一个或多个具有相同图像格式（Image Format）的图像。纹理有两种用途：作为着色器（Shader）纹理采样的数据源，或作为渲染目标。

## 基本概念

### 图像的定义

在讨论纹理时，**图像（Image）** 定义为具有特定维度（1D、2D 或 3D）、特定大小和特定格式的像素数组。

纹理是图像的容器，但对所包含的图像有特定约束。纹理有三个定义特征：

- **纹理类型（Texture Type）**：定义纹理内图像的排列方式
- **纹理大小（Texture Size）**：定义纹理中图像的尺寸
- **图像格式（Image Format）**：定义所有图像共享的格式

### 纹理类型

OpenGL 支持以下纹理类型：

| 枚举值 | 说明 |
|--------|------|
| `GL_TEXTURE_1D` | 一维纹理，只有宽度，无高度和深度 |
| `GL_TEXTURE_2D` | 二维纹理，有宽度和高度，无深度 |
| `GL_TEXTURE_3D` | 三维纹理，有宽度、高度和深度 |
| `GL_TEXTURE_RECTANGLE` | 矩形纹理，只有一层图像，不支持 Mipmap，纹理坐标不归一化 |
| `GL_TEXTURE_BUFFER` | 缓冲纹理，数据存储来自 Buffer Object（缓冲对象） |
| `GL_TEXTURE_CUBE_MAP` | 立方体贴图，包含 6 个相同尺寸的正方形 2D 图像 |
| `GL_TEXTURE_1D_ARRAY` | 一维数组纹理，包含多个一维图像 |
| `GL_TEXTURE_2D_ARRAY` | 二维数组纹理，包含多个二维图像 |
| `GL_TEXTURE_CUBE_MAP_ARRAY` | 立方体数组纹理，包含多个立方体贴图 |
| `GL_TEXTURE_2D_MULTISAMPLE` | 二维多重采样纹理，每个像素包含多个采样值 |
| `GL_TEXTURE_2D_MULTISAMPLE_ARRAY` | 二维多重采样数组纹理 |

### 纹理大小限制

纹理大小受 OpenGL 实现限制：

- 1D/2D 纹理（及类似类型）：最大尺寸为 `GL_MAX_TEXTURE_SIZE`
- 数组纹理：最大数组长度为 `GL_MAX_ARRAY_TEXTURE_LAYERS`
- 3D 纹理：任意维度不超过 `GL_MAX_3D_TEXTURE_SIZE`

::: tip
建议使用 2 的幂次方作为纹理大小，除非有特殊需求。
:::

### Mipmap（多级渐远纹理）

当纹理映射到表面时，使用的纹素（Texel）数量取决于渲染角度。远处观察或斜视角度只使用纹理的一小部分像素，这会导致动画中出现混叠伪影（Aliasing Artifacts）。

**Mipmap** 是预缩小的图像版本，每级 mipmap 是上一级的一半大小（向下取整），直到所有维度都变为 1。

::: info 示例
一个 64×16 的 2D 纹理可以有 6 级 mipmap：32×8、16×4、8×2、4×1、2×1、1×1。
:::

- **基级（Base Level）**：最大的 mipmap 级别，编号为 0
- mipmap 链不必完整，但有效范围必须连续
- 采样时，OpenGL 会根据视角、纹理大小等因素自动选择 mipmap 级别

## 纹理对象（Texture Objects）

纹理是标准的 OpenGL 对象，遵循标准约定：

```cpp
void glGenTextures(GLsizei n, GLuint *textures);
void glBindTexture(GLenum target, GLuint texture);
```

`glBindTexture` 的 `target` 参数对应纹理类型。首次绑定新创建的纹理名称时，会定义纹理类型。纹理对象不能绑定到与其初始类型不同的目标。

### 纹理完整性（Texture Completeness）

完整纹理对象处于可用的逻辑状态。不完整的纹理不能用于着色器采样或 Image Load Store 操作，附加到 Framebuffer Object（帧缓冲对象）也需要特定形式的完整性。

纹理完整性包括三类要求：

#### Mipmap 完整性

使用不可变存储（Immutable Storage）分配的纹理始终满足 mipmap 完整性。对于其他纹理：

如果 `GL_TEXTURE_MIN_FILTER` 使用 mipmap，则必须满足：

1. 每个 mipmap 级别使用**完全相同**的内部格式
2. 每个已分配的 mipmap 级别大小一致（宽度/高度/深度 = 基级值 ÷ 2^k，向下取整，最小为 1）
3. mipmap 范围参数 `GL_TEXTURE_BASE_LEVEL` ≤ `GL_TEXTURE_MAX_LEVEL`
4. 基级和最大级只能指定已分配的 mipmap 级别

::: warning 数组纹理的特殊规则
1D 数组纹理的 height 表示数组层数，**不随 mipmap 级别变化**。同理适用于 2D 数组和立方体数组纹理的 depth 参数。
:::

#### 立方体贴图完整性

使用不可变存储的立方体贴图始终满足完整性。其他情况需满足：

- 每个 mipmap 级别的每个面必须大小相同且为正方形
- 每个 mipmap 级别的每个面必须使用相同的内部格式

#### 图像格式完整性

整数颜色格式和模板索引格式不支持线性过滤：

- `GL_TEXTURE_MAG_FILTER` 必须为 `GL_NEAREST`
- `GL_TEXTURE_MIN_FILTER` 必须为 `GL_NEAREST` 或 `GL_NEAREST_MIPMAP_NEAREST`

#### 采样器对象与完整性

使用 Sampler Object（采样器对象）时，纹理完整性基于采样器对象的采样参数判断，而非纹理内部的采样参数。

::: tip
纹理可能在不同上下文中被判定为完整或不完整。
:::

Image Load Store 不使用采样器对象，但仍执行纹理完整性检查，使用纹理内部的采样参数。

## 存储（Storage）

纹理对象的存储创建涉及众多函数，详见 [Texture Storage](./texture-storage.md)。

## 参数（Parameters）

纹理参数控制纹理的工作方式。设置函数如下：

```cpp
void glTexParameter[if](GLenum target, GLenum pname, T param);
void glTexParameter[if]v(GLenum target, GLenum pname, T *params);
void glTexParameterI[i ui]v(GLenum target, GLenum pname, T *params);
```

### Mipmap 范围

`GL_TEXTURE_BASE_LEVEL` 和 `GL_TEXTURE_MAX_LEVEL` 定义可用的 mipmap 闭区间：

- 不能采样小于基级或大于最大级的 mipmap
- GLSL 纹理大小函数返回基级大小，而非 0 级

::: warning
不可变存储纹理创建时已设置 mipmap 范围值，设置为超出可用范围的值会产生错误。
:::

### Swizzle 掩码（Swizzle Mask）

Swizzle 参数控制从纹理获取数据的通道重排。仅适用于颜色格式的纹理。

每个输出分量（RGBA）可设置为特定颜色通道：

| 参数值 | 说明 |
|--------|------|
| `GL_RED` | 来自红色通道 |
| `GL_GREEN` | 来自绿色通道，无则为 0 |
| `GL_BLUE` | 来自蓝色通道，无则为 0 |
| `GL_ALPHA` | 来自 alpha 通道，无则为 1 |
| `GL_ZERO` | 始终为 0 |
| `GL_ONE` | 始终为 1 |

```cpp
GLint swizzleMask[] = {GL_ZERO, GL_ZERO, GL_ZERO, GL_RED};
glTexParameteriv(GL_TEXTURE_2D, GL_TEXTURE_SWIZZLE_RGBA, swizzleMask);
```

上述代码将图像的红色通道映射到着色器访问时的 alpha 通道。

::: warning
Swizzle 掩码只影响着色器读取操作，不影响 Image Load Store 写入、混合（Blending）等操作。
:::

### 模板纹理（Stencil Texturing）

深度/模板格式的纹理可通过 `GL_DEPTH_STENCIL_TEXTURE_MODE` 参数访问模板分量：

- `GL_DEPTH_COMPONENT`：访问深度分量（默认）
- `GL_STENCIL_INDEX`：访问模板分量（无符号整数）

使用模板模式时，必须使用无符号整数采样器（如 `usampler2D`）。

::: info
此参数影响采样但不是采样参数。无法用两个采样器对象分别获取深度和模板。但可创建纹理视图（Texture View）分别设置不同参数。
:::

## 采样参数（Sampling Parameters）

采样是从纹理获取值的过程。采样参数详见 [Sampler Object](./sampler-object.md)。

采样参数由纹理对象和 Sampler Object 共享。使用采样器对象时，其参数会覆盖纹理对象的参数。

## 纹理图像单元（Texture Image Units）

纹理可绑定到一个或多个纹理图像单元用于渲染。OpenGL 上下文的最大纹理图像单元数可通过 `GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS`）。

绑定纹理到纹理单元：

```cpp
void glBindTextureUnit(GLuint unit, GLuint texture);
```

这是 DSA（Direct State Access）函数。传统方式：

```cpp
// DSA 方式
glBindTextureUnit(0, texture1);
glBindTextureUnit(1, texture2);

// 传统方式
glActiveTexture(GL_TEXTURE0 + 0);
glBindTexture(GL_TEXTURE_2D, texture1);

glActiveTexture(GL_TEXTURE0 + 1);
glBindTexture(GL_TEXTURE_3D, texture2);
```

`glBindTextureUnit` 更简洁，且自动从纹理对象推断正确的 target。

::: danger 重要
不同类型的采样器不能共享同一纹理单元。即使类型不同，也会导致渲染失败。
:::

## GLSL 绑定

### 采样器（Samplers）

采样器是 GLSL 中的 uniform 变量，代表可访问的纹理：

1. 设置采样器 uniform 值为纹理单元索引
2. 渲染时将纹理绑定到对应纹理单元

```cpp
// 设置采样器 uniform
glUniform1i(location, 0); // 使用纹理单元 0

// 绑定纹理
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, texture);
```

采样器类型必须与纹理类型匹配。如 `sampler1D` 需要 `GL_TEXTURE_1D` 纹理。

### 图像（Images）

纹理图像可用于 Image Load Store 操作，通过图像变量（image variable）声明为 uniform。使用 `glBindImageTexture` 绑定到图像单元。

## 渲染目标（Render Targets）

通过 Framebuffer Object（帧缓冲对象），纹理中的单个图像可作为渲染目标。详见 [Framebuffer Object](./framebuffer-object.md)。
