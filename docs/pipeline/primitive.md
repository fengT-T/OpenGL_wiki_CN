# 图元 (Primitive)

OpenGL 中的"图元"（Primitive）有两个相关但不同的含义：

1. **图元类型**：OpenGL 解释顶点流的方案，如 `GL_POINTS`、`GL_TRIANGLES`
2. **基础图元**：顶点流解释后的结果，即图元组装产生的有序图元序列

---

## 顶点流

顶点流是有序顶点列表，来源取决于图元组装发生的位置：

| 来源 | 说明 |
|------|------|
| 顶点渲染命令 | 由顶点规范定义，经顶点着色器处理 |
| 曲面细分 | TES 执行后，图元类型由抽象面片类型定义 |
| 几何着色器 | 图元类型由 GS 指定 |

---

## 点图元

`GL_POINTS` 将每个顶点解释为一个点。映射了纹理的点常称为"点精灵"（Point Sprite）。

点被光栅化为屏幕对齐的正方形，大小可由两种方式指定：

1. **着色器输出**：启用 `GL_PROGRAM_POINT_SIZE` 后，使用 `gl_PointSize`
2. **上下文状态**：使用 `glPointSize()` 函数

::: warning 注意
点大小必须大于 0，否则行为未定义。实际大小会被钳制到实现定义的范围。
:::

### 点片段输入

片段着色器可使用 `vec2 gl_PointCoord` 获取片段在点内的相对位置 [0, 1]：

- `GL_LOWER_LEFT`：(0, 0) 在左下角
- `GL_UPPER_LEFT`：(0, 0) 在左上角（默认）

---

## 线图元

| 类型 | 说明 |
|------|------|
| `GL_LINES` | 每 2 个顶点一条线，奇数顶点时忽略最后一个 |
| `GL_LINE_STRIP` | 相邻顶点连线，n 个顶点产生 n-1 条线 |
| `GL_LINE_LOOP` | 同线带，首尾顶点也连线，n 个顶点产生 n 条线 |

线被光栅化为统一宽度的屏幕对齐四边形。

---

## 三角形图元

三角形由 3 个顶点组成，是顶点数最少的 2D 形状，保证是平面的。

| 类型 | 说明 |
|------|------|
| `GL_TRIANGLES` | 每 3 个顶点一个三角形 |
| `GL_TRIANGLE_STRIP` | 每 3 个相邻顶点一个三角形，n 个顶点产生 n-2 个三角形 |
| `GL_TRIANGLE_FAN` | 第一个顶点固定，每 2 个相邻顶点与它构成三角形 |

### 三角形带示例

```
索引:        0 1 2 3 4 5 ...
三角形:      {0 1 2}
               {1 2 3}  绘制顺序 (2 1 3) 保持正确缠绕
                 {2 3 4}
                   {3 4 5}  绘制顺序 (4 3 5)
```

### 三角形扇示例

```
索引:        0 1 2 3 4 5 ...
三角形:      {0 1 2}
             {0 2 3}
             {0 3 4}
             {0 4 5}
```

### 三角形朝向

缠绕顺序（Winding Order）决定三角形的朝向，用于：
- 背面剔除
- 模板测试
- 片段着色器中的面朝向判断

::: tip 提示
朝向仅对三角形光栅化有意义。非三角形图元类型都被视为正面。
:::

---

## 四边形（已弃用）

::: warning 已弃用
四边形图元在 OpenGL 3.1+ 核心配置中已移除。
:::

| 类型 | 说明 |
|------|------|
| `GL_QUADS` | 每 4 个顶点一个四边形 |
| `GL_QUAD_STRIP` | 相邻边构成下一个四边形 |

四边形通常被光栅化为两个三角形，可能导致插值伪影。

---

## 邻接图元

邻接图元专用于几何着色器，提供额外顶点数据：

- `GL_LINES_ADJACENCY`
- `GL_LINE_STRIP_ADJACENCY`
- `GL_TRIANGLES_ADJACENCY`
- `GL_TRIANGLE_STRIP_ADJACENCY`

这些模式允许 GS 访问相邻图元的顶点数据。

---

## 面片 (Patches)

`GL_PATCHES` 仅在曲面细分激活时使用。每个面片的顶点数由 `glPatchParameteri()` 设置：

```cpp
glPatchParameteri(GL_PATCH_VERTICES, v);
```

系统将每 v 个顶点解释为一个面片，经曲面细分后转换为点、线或三角形。

---

## 引发顶点 (Provoking Vertex)

输出图元中的一个顶点被指定为"引发顶点"，具有特殊意义：

- 使用 `flat` 插值时，只有引发顶点的输出被使用
- 片段从引发顶点获取 flat 变量

```cpp
void glProvokingVertex(GLenum provokeMode);
```

模式：
- `GL_FIRST_VERTEX_CONVENTION`
- `GL_LAST_VERTEX_CONVENTION`（默认）

### 各图元的引发顶点

| 图元类型 | 首顶点约定 | 末顶点约定 |
|----------|-----------|-----------|
| `GL_POINTS` | i | i |
| `GL_LINES` | 2i-1 | 2i |
| `GL_LINE_STRIP` | i | i+1 |
| `GL_TRIANGLES` | 3i-2 | 3i |
| `GL_TRIANGLE_STRIP` | i | i+2 |
| `GL_TRIANGLE_FAN` | i+1 | i+2 |

::: warning 面片注意
面片没有引发顶点。曲面细分输出的图元的引发顶点是实现定义的，使用 `flat` 插值需谨慎。
:::

---

## 图元重启

设置图元重启索引后，当顶点流中遇到该索引时，图元解释将被重置：

```cpp
glEnable(GL_PRIMITIVE_RESTART);
glPrimitiveRestartIndex(index);
```

该索引处的顶点数据不会被处理，也不会插入顶点流。

---

## 另见

- [顶点规范](../rendering/vertex-specification)
- [顶点渲染](../rendering/vertex-rendering)
- [曲面细分](../shaders/tessellation)
- [几何着色器](../shaders/geometry)