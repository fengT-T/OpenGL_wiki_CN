# 光栅化 (Rasterization)

光栅化是将每个独立图元分解为离散元素（称为片段）的过程，基于图元的样本覆盖范围。

## 概述

光栅化是 OpenGL 渲染管线的核心阶段，负责将几何图元（点、线、三角形）转换为片段。每个片段对应帧缓冲区中的一个潜在像素位置，并携带从顶点数据插值得到的各种属性。

光栅化过程包括：
1. 确定图元覆盖哪些样本
2. 为每个覆盖的样本生成片段
3. 插值顶点属性到片段

## 点光栅化

点图元的光栅化生成一个或多个片段。点的大小可以通过以下方式设置：

```cpp
glPointSize(GLfloat size);           // 设置点大小（默认为 1.0）
```

在顶点着色器中，可以使用 `gl_PointSize` 输出变量设置逐顶点的点大小：

```glsl
out float gl_PointSize;              // 顶点着色器输出
```

## 线光栅化

线图元的光栅化沿线的长度生成片段。线宽可以通过以下方式设置：

```cpp
glLineWidth(GLfloat width);          // 设置线宽（默认为 1.0）
```

::: warning 注意
许多 OpenGL 实现仅支持宽度为 1.0 的抗锯齿线。对于更粗的线，可能需要使用几何着色器生成三角形条带。
:::

## 多边形光栅化

三角形图元的光栅化是最常见的光栅化类型。多边形的光栅化模式可以控制：

```cpp
glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);    // 填充模式（默认）
glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);    // 线框模式
glPolygonMode(GL_FRONT_AND_BACK, GL_POINT);   // 点模式
```

### 多边形偏移 (Polygon Offset)

多边形偏移用于解决深度缓冲区冲突（z-fighting）问题，特别是在渲染共面几何体时：

```cpp
glEnable(GL_POLYGON_OFFSET_FILL);
glPolygonOffset(GLfloat factor, GLfloat units);
```

偏移量计算公式：
$$offset = factor \times slope + units \times r$$

其中 `slope` 是多边形的最大深度斜率，`r` 是实现确定的最小可分辨深度值。

典型用途：
- 渲染阴影贴图
- 贴花渲染
- 线框叠加在填充多边形上

## 属性插值

光栅化期间，顶点属性被插值到片段。插值方式可以在片段着色器中指定：

```glsl
smooth out vec4 color;               // 平滑插值（默认，透视校正）
flat out vec4 color;                 // 平面着色（使用激发顶点的值）
noperspective out vec4 color;        // 无透视校正的线性插值
centroid out vec4 color;             // 质心采样（用于多重采样抗锯齿）
```

### 平滑插值

默认的平滑插值执行透视校正插值，确保在透视投影下属性正确插值：

$$value = \frac{a \cdot v_0/w_0 + b \cdot v_1/w_1 + c \cdot v_2/w_2}{a/w_0 + b/w_1 + c/w_2}$$

其中 a、b、c 是重心坐标，w 是顶点的裁剪空间 w 分量。

### 平面着色

平面着色使用激发顶点（provoking vertex）的属性值作为整个图元的常量值。激发顶点由图元类型和 `GL_PROVOKING_VERTEX` 设置决定：

```cpp
glProvokingVertex(GL_LAST_VERTEX_CONVENTION);  // 默认
glProvokingVertex(GL_FIRST_VERTEX_CONVENTION);
```

## 多重采样

多重采样抗锯齿 (MSAA) 是一种高效的抗锯齿技术，每个像素使用多个样本：

```cpp
glEnable(GL_MULTISAMPLE);            // 启用多重采样
glDisable(GL_MULTISAMPLE);           // 禁用多重采样
```

多重采样时：
- 每个像素有多个样本位置
- 图元覆盖测试在每个样本位置独立执行
- 片段着色器通常每个像素只执行一次
- 深度和模板测试在每个样本独立执行

### 样本覆盖

可以查询样本位置和覆盖信息：

```cpp
glGetMultisamplefv(GL_SAMPLE_POSITION, index, &position);
```

## 深度边界

光栅化产生的深度值受 `glDepthRange` 限制：

```cpp
glDepthRange(0.0, 1.0);              // 默认范围
glDepthRange(0.0, 0.0);              // 强制所有深度为 0（用于阴影贴图）
```

## 裁剪空间变换

光栅化前，顶点位置经历以下变换：

1. **裁剪空间 → NDC**：透视除法 (x/w, y/w, z/w)
2. **NDC → 窗口空间**：视口变换

视口变换将 [-1, 1] 范围的 NDC 坐标映射到窗口坐标：

$$x_{window} = viewport_x + \frac{viewport_{width} \times (x_{ndc} + 1)}{2}$$
$$y_{window} = viewport_y + \frac{viewport_{height} \times (y_{ndc} + 1)}{2}$$

## 参见

- [图元 (Primitive)](/pipeline/primitive)
- [片段 (Fragment)](/pipeline/fragment)
- [片段着色器 (Fragment Shader)](/pipeline/fragment-shader)
- [图元组装 (Primitive Assembly)](/pipeline/primitive-assembly)