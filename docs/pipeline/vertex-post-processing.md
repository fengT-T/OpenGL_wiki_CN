# 顶点后处理 (Vertex Post-Processing)

顶点后处理是 OpenGL 渲染管线中的一个阶段，顶点处理的输出在此经历各种操作。其中许多是为图元组装 (Primitive Assembly) 和光栅化 (Rasterization) 阶段做准备的。

顶点处理后，以下步骤按本文档中的顺序执行。

## 变换反馈 (Transform Feedback)

变换反馈是一种将顶点处理阶段输出的值记录到缓冲区对象中的方法。只有最后一个顶点处理阶段可以执行变换反馈。

变换反馈的主要用途：
- 捕获顶点着色器计算的结果
- 实现粒子系统
- 在 GPU 上执行通用计算
- 生成几何数据供后续渲染使用

## 图元组装 (Primitive Assembly)

图元组装将顶点流转换为图元序列，按照渲染命令中指定的图元类型进行。图元也可以在此处被丢弃，以允许仅进行变换反馈而不渲染任何内容。

## 裁剪 (Clipping)

前一阶段生成的图元被收集并裁剪到视见体。每个顶点都有一个裁剪空间位置（最后一个顶点处理阶段的 `gl_Position` 输出）。顶点的视见体定义为：

$$-w_c \leq x_c \leq w_c$$
$$-w_c \leq y_c \leq w_c$$
$$-w_c \leq z_c \leq w_c$$

该视见体可以通过深度钳制和添加用户定义裁剪平面来修改。图元被裁剪到的总体积（包括用户定义裁剪平面）称为裁剪体积。

图元被裁剪到裁剪体积的方式取决于基本图元类型：

### 点

点不会真正被"裁剪"。如果点以任何方式在裁剪体积之外，则图元被丢弃（即不渲染）。点可以大于一个像素，但裁剪仍然适用——如果点的中心（实际的 `gl_Position` 值）在裁剪范围之外，它将被丢弃。

::: warning 平台问题 (NVIDIA)
某些 NVIDIA 显卡不会"正确"裁剪点，而是执行人们通常期望的行为（仅当点完全在体积之外时才丢弃），而不是 OpenGL 规范要求的。请注意其他硬件遵循 OpenGL 规范。
:::

### 线

如果线完全在体积之外，则被丢弃。如果线部分在体积之外，则被裁剪；为一个或两个顶点计算新的顶点坐标。裁剪顶点的端点位于裁剪体积的边界上。

### 三角形

三角形通过生成适当的三角形裁剪到视见体，这些三角形的顶点位于裁剪体积的边界上。这可能会生成多个三角形。如果三角形完全在视见体之外，则被剔除。

当图元被裁剪时，必须为它们生成新的逐顶点输出。这些通过裁剪空间中的线性插值生成。平面着色的输出不进行此处理。

### 深度钳制 (Depth Clamping)

可以通过激活深度钳制来关闭对顶点 Z 位置的裁剪行为：

```cpp
glEnable(GL_DEPTH_CLAMP);
```

这将导致裁剪空间 Z 不被前视见体和后视见体裁剪。

::: warning 注意
使用透视投影时，仍然会对视见体的侧面进行裁剪。深度钳制将视锥体变成金字塔，金字塔仍在尖端结束。因此，移动到相机后面的对象仍然会被裁剪。未被裁剪的是投影近平面和相机之间的对象。
:::

Z 值计算将正常通过管线进行。计算窗口空间位置后，结果 Z 值将被钳制到 `glDepthRange`。

### 用户定义裁剪 (User-Defined Clipping)

最后一个活动的顶点处理着色器阶段可以通过输出数组 `gl_ClipDistance` 指定额外的裁剪。

每个数组元素代表裁剪图元的独立条件。每个数组元素必须通过 `glEnable(GL_CLIP_DISTANCEi)` 独立启用，其中 i 是数组中裁剪距离的索引。裁剪距离的最大数量是 `GL_MAX_CLIP_DISTANCES`，最小值为 8。

对于每个启用的裁剪距离，在裁剪阶段检查 `gl_ClipDistance` 数组中的对应元素。如果距离为非负，则图元被认为在该裁剪区域内。如果距离为负，则在该裁剪区域之外。

要写入 `gl_ClipDistance` 数组，必须先使用显式大小重新声明该数组：

```glsl
// GLSL 4.10 或 ARB_separate_shader_objects
out gl_PerVertex
{
  vec4 gl_Position;
  float gl_ClipDistance[3];
};

// 早期 GLSL 版本
out float gl_ClipDistance[3];
```

#### 用途

用户定义裁剪可用于多种场景：

- 经典用途是裁剪场景中超出特定平面的所有顶点
- GUI 元素裁剪：确保窗口内的对象不会绘制到窗口外

计算裁剪距离的示例：给定平面方程 `Ax + By + Cz + D = 0`，其中 (A, B, C) 是单位法线，D 是从原点到平面的距离，裁剪距离可以通过简单的点积计算：`dot(position, plane)`。

::: warning 多重采样注意事项
当用户定义裁剪与多重采样一起使用时，GUI 元素可能绘制在裁剪区域之外。用户定义裁剪发生在顶点级别，而不是片段级别。
:::

## 透视除法 (Perspective Divide)

裁剪阶段返回的裁剪空间位置通过以下方程转换为归一化设备坐标 (NDC)：

$$x_{ndc} = \frac{x_c}{w_c}$$
$$y_{ndc} = \frac{y_c}{w_c}$$
$$z_{ndc} = \frac{z_c}{w_c}$$

## 视口变换 (Viewport Transform)

视口变换定义了顶点位置从 NDC 空间到窗口空间的变换。这些坐标被光栅化到输出图像。

视口由多个视口参数定义，通过以下函数设置：

```cpp
void glViewport(GLint x, GLint y, GLsizei width, GLsizei height);
void glDepthRange(GLdouble nearVal, GLdouble farVal);
void glDepthRangef(GLfloat nearVal, GLfloat farVal);
```

给定视口参数，通过以下方程计算窗口空间坐标：

$$x_w = \frac{width}{2}x_{ndc} + x + \frac{width}{2}$$
$$y_w = \frac{height}{2}y_{ndc} + y + \frac{height}{2}$$
$$z_w = \frac{farVal - nearVal}{2}z_{ndc} + \frac{farVal + nearVal}{2}$$

### 视口数组 (Viewport Array)

::: info 版本信息
- 核心版本：4.1
- 核心扩展：`ARB_viewport_array`
:::

OpenGL 中可以使用多个视口。特定图元的视口可以由几何着色器设置。如果几何着色器未指定视口，则选择视口编号 0。

视口集合的索引范围为 [0, `GL_MAX_VIEWPORTS`)。每个索引都有自己的深度范围和视口坐标。

设置特定索引的视口参数：

```cpp
void glViewportIndexedf(GLuint index, GLfloat x, GLfloat y, GLfloat w, GLfloat h);
void glViewportIndexedfv(GLuint index, const GLfloat *v);
void glDepthRangeIndexed(GLuint index, GLdouble nearVal, GLdouble farVal);
```

使用单个函数设置多个视口索引：

```cpp
void glViewportArrayv(GLuint first, GLsizei count, const GLfloat *v);
void glDepthRangeArrayv(GLuint first, GLsizei count, const GLdouble *v);
```

## 参见

- [变换反馈 (Transform Feedback)](/pipeline/transform-feedback)
- [图元组装 (Primitive Assembly)](/pipeline/primitive-assembly)
- [光栅化 (Rasterization)](/pipeline/rasterization)