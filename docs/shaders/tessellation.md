# 曲面细分 (Tessellation)

曲面细分（Tessellation）是 OpenGL 渲染管线中的顶点处理阶段，用于将面片（Patch）的顶点数据细分为更小的图元。这个过程由两个着色器阶段和一个固定功能阶段组成。

::: info 版本信息
- 核心版本：4.6
- 引入版本：4.0
- ARB 扩展：`ARB_tessellation_shader`
:::

::: warning 注意
本文描述的是 OpenGL 4.0 引入的曲面细分功能，而非旧的 `gluTess*` 细分功能。
:::

## 概述

曲面细分过程分为三个阶段，构成顶点处理的可选部分。其中两个阶段是可编程的，中间是一个固定功能阶段：

1. **曲面细分控制着色器 (TCS)**：确定细分程度，可调整面片数据
2. **曲面细分图元生成器**：固定功能阶段，根据细分级别生成新图元
3. **曲面细分评估着色器 (TES)**：计算生成顶点的实际属性值

---

## 面片 (Patches)

曲面细分阶段操作的是面片，一种由 `GL_PATCHES` 表示的图元类型。面片是一种通用图元，每 n 个顶点构成一个新的面片。

设置每个面片的顶点数：

```cpp
void glPatchParameteri(GLenum pname, GLint value);
```

使用 `GL_PATCH_VERTICES` 作为目标，value 的范围是 [1, `GL_MAX_PATCH_VERTICES`)。最大面片顶点数由实现决定，但不小于 32。

::: tip 提示
面片图元总是独立面片的序列，不存在"面片条带"或"面片环"。如需类似三角形条带的行为，应使用索引渲染。
:::

---

## 曲面细分控制着色器 (TCS)

TCS 是曲面细分的第一步，负责：

- 确定图元的细分程度
- 对输入面片数据进行变换

### 执行模型

TCS 的执行模型类似计算着色器。对于每个面片，将执行 n 次 TCS 调用，n 为输出面片的顶点数。每个调用只负责输出面片中的单个顶点。

输出面片大小通过布局限定符指定：

```glsl
layout(vertices = patch_size) out;
```

`patch_size` 必须是大于零的整数常量表达式，且小于 `GL_MAX_PATCH_VERTICES`。

### 输入

从顶点着色器到 TCS 的所有输入都根据输入面片大小聚合成数组：

```glsl
in vec2 texCoord[];  // 可声明为无界数组
```

内置输入变量：

```glsl
in int gl_PatchVerticesIn;   // 输入面片的顶点数
in int gl_PrimitiveID;       // 当前渲染命令中的面片索引
in int gl_InvocationID;      // 当前面片内的 TCS 调用索引
```

顶点着色器输出：

```glsl
in gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
} gl_in[gl_MaxPatchVertices];
```

### 输出

#### 每顶点输出

```glsl
out vec2 vertexTexCoord[];
```

::: warning 写入限制
TCS 只能写入与其调用对应的每顶点输出：`vertexTexCoord[gl_InvocationID]`。其他索引表达式会导致编译错误。
:::

#### 每面片变量

使用 `patch` 关键字声明：

```glsl
patch out vec4 data;
```

#### 细分级别

```glsl
patch out float gl_TessLevelOuter[4];  // 外部细分级别
patch out float gl_TessLevelInner[2];  // 内部细分级别
```

::: warning 面片丢弃
如果任何使用的外部级别为 0、负数或 NaN，该面片将被丢弃，不会产生任何 TES 调用。
:::

### 同步

处理同一面片的 TCS 调用可以相互读取输出变量，但需要同步：

```glsl
barrier();
```

`barrier()` 的限制：
- 必须直接在 `main()` 函数中
- 不能在任何流控制语句内
- 不能在任何 `return` 语句之前

### 可选性

TCS 是可选的。如果没有激活 TCS，则使用默认细分级别：

```cpp
void glPatchParameterfv(GLenum pname, const GLfloat *values);
```

- `GL_PATCH_DEFAULT_OUTER_LEVEL`：4 元素数组，定义四个外部细分级别
- `GL_PATCH_DEFAULT_INNER_LEVEL`：2 元素数组，定义两个内部细分级别

---

## 曲面细分图元生成

图元生成是固定功能阶段，负责从输入面片创建新图元。此阶段仅在 TES 激活时执行。

影响因素：
- 细分级别（由 TCS 或默认值提供）
- 顶点间距（由 TES 定义：`equal_spacing`、`fractional_even_spacing`、`fractional_odd_spacing`）
- 输入图元类型（由 TES 定义：`triangles`、`quads`、`isolines`）
- 图元生成顺序（由 TES 定义：`cw` 或 `ccw`）

### 抽象面片

图元生成器不关心实际的顶点坐标和面片数据，只根据细分级别确定：
- 生成多少顶点
- 顶点的生成顺序
- 构建什么类型的图元

生成的每个顶点在抽象面片内有归一化位置 [0, 1]，通过 `gl_TessCoord` 提供给 TES。

### 细分级别

细分级别定义了抽象面片上的细分程度：
- **外部细分级别**：定义外边缘的细分，确保相邻面片正确连接
- **内部细分级别**：定义面片内部的细分

细分级别经过钳制处理生成有效细分级别，最大值由 `GL_MAX_TESS_GEN_LEVEL` 定义（至少 64）。

#### 间距类型

| 类型 | 说明 |
|------|------|
| `equal_spacing` | 钳制到 [1, max] 并向上取整，所有段等长 |
| `fractional_even_spacing` | 钳制到 [2, max] 并向上取整到偶数 |
| `fractional_odd_spacing` | 钳制到 [1, max-1] 并向上取整到奇数 |

---

## 细分图元类型

### 三角形 (Triangles)

抽象面片为三角形，使用前三个外部级别和第一个内部级别。

每个生成顶点获得重心坐标作为 `gl_TessCoord`：

```glsl
vec3 accum = vec3(0.0f);
accum += gl_TessCoord[0] * value[0];
accum += gl_TessCoord[1] * value[1];
accum += gl_TessCoord[2] * value[2];
```

### 四边形 (Quads)

抽象面片为正方形，使用全部 4 个外部级别和 2 个内部级别。

每个生成顶点获得归一化 2D 坐标，`gl_TessCoord.z` 为 0.0。

### 等值线 (Isolines)

抽象面片为一系列水平线，只使用前两个外部级别，忽略内部级别。

- `gl_TessCoord.x`：沿线的距离
- `gl_TessCoord.y`：指定哪条线

---

## 曲面细分评估着色器 (TES)

TES 接收图元生成器生成的抽象坐标和 TCS 的输出，计算顶点的实际属性值。TES 是曲面细分的必需部分。

### 布局限定符

```glsl
layout(param1, param2, ...) in;
```

#### 抽象面片类型（必需）

| 类型 | 说明 |
|------|------|
| `isolines` | 平行线的矩形块，输出线段 |
| `triangles` | 三角形，输出三角形 |
| `quads` | 四边形，输出三角形 |

#### 间距（可选）

默认为 `equal_spacing`。

#### 图元顺序（可选）

`cw` 或 `ccw`，默认 `ccw`。控制抽象面片内三角形的缠绕顺序。

#### 点模式（可选）

使用 `point_mode` 强制生成点图元而非三角形或线段。

### 输入

从 TCS（或顶点着色器）接收每顶点和每面片输出：

```glsl
in vec2 vertexTexCoord[];      // 每顶点输入
patch in vec4 data;            // 每面片输入
```

内置输入：

```glsl
in vec3 gl_TessCoord;          // 抽象面片内的位置
in int gl_PatchVerticesIn;     // 面片顶点数
in int gl_PrimitiveID;         // 面片索引
```

细分级别：

```glsl
patch in float gl_TessLevelOuter[4];
patch in float gl_TessLevelInner[2];
```

顶点数据：

```glsl
in gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
} gl_in[gl_MaxPatchVertices];
```

### 输出

每个 TES 调用输出一个顶点的数据：

```glsl
out gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
};
```

---

## 面片接口与连续性

确保相邻面片之间无缝隙需要遵循以下规则：

::: warning 规则 1
TES 对边缘顶点的插值必须接收二进制相同的输入值。TCS 必须确保共享边缘的数据在两个面片间相同。
:::

::: warning 规则 2
共享边缘的外部细分级别必须二进制相同。
:::

::: warning 规则 3
TES 必须仅基于二进制相同的数据，使用完全相同的数学运算计算边缘顶点。
:::

---

## 限制

| 限制 | 枚举值 | 最小值 |
|------|--------|--------|
| 最大面片顶点数 | `GL_MAX_PATCH_VERTICES` | 32 |
| 最大细分级别 | `GL_MAX_TESS_GEN_LEVEL` | 64 |
| TCS 每顶点输出分量数 | `GL_MAX_TESS_CONTROL_OUTPUT_COMPONENTS` | 128 |
| TCS 每面片输出分量数 | `GL_MAX_TESS_PATCH_COMPONENTS` | 120 |
| TCS 总输出分量数 | `GL_MAX_TESS_CONTROL_TOTAL_OUTPUT_COMPONENTS` | 4096 |
| TES 输入分量数 | `GL_MAX_TESS_EVALUATION_INPUT_COMPONENTS` | 128 |

---

## 另见

- [顶点着色器](./vertex)
- [几何着色器](./geometry)
- [图元](../pipeline/primitive)