# 片段着色器 (Fragment Shader)

片段着色器是处理光栅化生成的片段的着色器阶段，将每个片段转换为一组颜色值和一个深度值。

片段着色器是 OpenGL 管线中图元光栅化后的阶段。对于图元覆盖的像素的每个采样点，都会生成一个"片段"。每个片段具有窗口空间位置、一些其他值，以及来自最后一个顶点处理阶段的所有插值顶点输出值。

片段着色器的输出是一个深度值、可能的模板值（不被片段着色器修改）以及零个或多个颜色值，这些值可能会被写入当前帧缓冲区的缓冲区中。

## 可选性

片段着色器在技术上是可选的着色器阶段。如果不使用片段着色器，输出片段的颜色值是未定义的。但是，输出片段的深度和模板值与输入值相同。

这对于只输出片段深度的渲染很有用，例如阴影映射和深度预优化。

## 特殊操作

与其他着色器阶段不同，片段着色器会生成隐式导数，因此可以使用大多数纹理函数。但仍需注意非均匀控制流。

片段着色器还可以访问 `discard` 命令。执行时，片段的输出值被丢弃，片段不会进入下一个管线阶段。

### 早期片段测试

通过 OpenGL 4.2 或 `ARB_shader_image_load_store`，可以强制执行早期片段测试：

```glsl
layout(early_fragment_tests) in;
```

这确保条件性逐采样测试在片段着色器执行之前进行。

::: warning
这**不**意味着可以颠覆深度测试的含义。如果强制早期片段测试并尝试写入 `gl_FragDepth`，写入的值**将被忽略**。写入深度缓冲区的值始终是与深度缓冲区测试的值。
:::

## 输入

片段着色器的输入由系统生成或从先前的固定功能操作传递，并可能跨图元表面插值。

用户定义的输入根据片段着色器声明的插值限定符进行插值。

### 系统输入

片段着色器有以下内置输入变量：

```glsl
in vec4 gl_FragCoord;
in bool gl_FrontFacing;
in vec2 gl_PointCoord;
```

#### gl_FragCoord

片段在窗口空间中的位置。X、Y 和 Z 分量是片段的窗口空间位置。如果着色器没有写入 `gl_FragDepth`，Z 值将被写入深度缓冲区。W 分量是 `1/W_clip`，其中 `W_clip` 是从最后一个顶点处理阶段输出到 `gl_Position` 的裁剪空间顶点位置的插值 W 分量。

可以通过重新声明来修改 `gl_FragCoord` 的空间：

```glsl
layout(origin_upper_left) in vec4 gl_FragCoord;
```

这将使 `gl_FragCoord` 的窗口空间原点位于屏幕左上角，而不是通常的左下角。

```glsl
layout(pixel_center_integer) in vec4 gl_FragCoord;
```

使用整数值表示像素中心（默认是半整数边界，如左下角像素中心为 (0.5, 0.5)）。

::: tip
这两个选项是为了与 D3D 的窗口空间兼容。除非需要这种兼容性，否则不建议使用。
:::

#### gl_FrontFacing

如果片段由图元的背面生成则为 false，其他情况为 true（包括没有背面的图元）。

#### gl_PointCoord

点图元中片段相对于点边缘的位置。点的有效范围是 [0, 1]，默认使用左上角原点。可以通过以下方式切换到左下角原点：

```cpp
glPointParameteri(GL_POINT_SPRITE_COORD_ORIGIN, GL_LOWER_LEFT);
```

### OpenGL 4.0+ 额外输入

```glsl
in int gl_SampleID;
in vec2 gl_SamplePosition;
in int gl_SampleMaskIn[];
```

#### gl_SampleID

当前片段光栅化的采样的整数标识符。

::: warning
使用此变量将强制着色器逐采样执行，这会抵消多重采样的主要优势。仅在必要时使用。
:::

#### gl_SamplePosition

当前片段采样在像素区域内的位置，范围 [0, 1]。原点在像素区域左下角。

::: warning
使用此变量将强制着色器逐采样执行。
:::

#### gl_SampleMaskIn

使用多重采样时，包含生成片段的采样掩码位域。

### 用户可控输入

```glsl
in float gl_ClipDistance[];
in int gl_PrimitiveID;
```

#### gl_ClipDistance

包含从最后一个顶点处理阶段输出的插值裁剪平面半空间数组。

#### gl_PrimitiveID

当前正在渲染的图元的索引。如果几何着色器处于活动状态，`gl_PrimitiveID` 完全是 GS 提供的输出值。

### OpenGL 4.3+ 额外输入

```glsl
in int gl_Layer;
in int gl_ViewportIndex;
```

#### gl_Layer

图元的层号（由几何着色器输出），或 0。

#### gl_ViewportIndex

图元的视口索引（由几何着色器输出），或 0。

## 输出

用户定义的输出变量只能是以下 GLSL 类型：浮点数、整数、相同类型的向量。也可以是这些类型的数组。

### 输出缓冲区

用户定义的输出表示一系列"颜色"，根据 `glDrawBuffers` 状态定向到特定缓冲区。

有三种方式将输出变量与颜色编号关联（按优先级排序）：

#### 着色器内指定

```glsl
layout(location = 3) out vec4 diffuseColor;
```

#### 链接前指定

```cpp
void glBindFragDataLocation(GLuint program, GLuint colorNumber, const char *name);
```

#### 自动分配

如果以上两种方法都未使用，OpenGL 会在程序链接时自动分配颜色编号。

::: warning
自动分配不太合理，因为颜色编号引用的是 `glDrawBuffers` 定义的绘制缓冲区。通常会为多个不同程序使用相同的帧缓冲区，每次更改 `glDrawBuffers` 状态并重新验证 FBO 不是好主意。
:::

片段颜色的数量限制由 `GL_MAX_DRAW_BUFFERS` 定义（使用双源混合时为 `GL_MAX_DUAL_SOURCE_DRAW_BUFFERS`）。

### 示例

```cpp
const GLenum buffers[] = {GL_COLOR_ATTACHMENT4, GL_COLOR_ATTACHMENT2, GL_NONE, GL_COLOR_ATTACHMENT0};
glDrawBuffers(4, buffers);
```

```glsl
layout(location = 1) out int materialID;
layout(location = 4) out vec3 normal;
layout(location = 0) out vec4 diffuseColor;
layout(location = 3) out vec3 position;
layout(location = 2) out vec4 specularColor;
```

| 输出名称 | 颜色附件 |
|---------|---------|
| materialID | GL_COLOR_ATTACHMENT2 |
| normal | GL_NONE |
| diffuseColor | GL_COLOR_ATTACHMENT4 |
| position | GL_COLOR_ATTACHMENT0 |
| specularColor | GL_NONE |

### 双源混合 (Dual-Source Blending)

双源混合是一种技术，允许两个（或更多）输出值通过混合用于同一缓冲区。

这通过为片段输出变量分配另一个参数：索引来实现：

```glsl
layout(location = 0, index = 1) out vec4 diffuseColor1;
layout(location = 0) out vec4 diffuseColor0;
```

`diffuseColor0` 分配到片段颜色 0、索引 0；`diffuseColor1` 分配到片段颜色 0、索引 1。

::: warning
使用双源输出时，可写入的最大片段颜色输出为 `GL_MAX_DUAL_SOURCE_DRAW_BUFFERS`（通常为 1）。如果需要双源混合，只能从片段着色器写入**一个缓冲区**。
:::

也可以在链接前指定：

```cpp
void glBindFragDataLocationIndexed(GLuint program, GLuint colorNumber, 
                                   GLuint index, const char *name);
```

### 其他输出

片段着色器有以下内置输出变量：

```glsl
out float gl_FragDepth;
```

#### gl_FragDepth

片段的深度值。如果着色器没有静态写入此值，则取 `gl_FragCoord.z` 的值。

::: warning
如果片段着色器静态写入 `gl_FragDepth`，则着色器有责任在**所有情况下**确保写入该值。如果在某个地方有条件写入，应确保在此之前有一个无条件写入。
:::

#### 保守深度 (Conservative Depth)

GLSL 4.20 或 `ARB_conservative_depth` 允许指定对 `gl_FragDepth` 的修改方式：

```glsl
layout (depth_<condition>) out float gl_FragDepth;
```

`condition` 可以是：
- `any` - 默认，可自由更改深度，但性能损失最大
- `greater` - 只会使深度变**大**
- `less` - 只会使深度变**小**
- `unchanged` - 写入的值与 `gl_FragCoord.z` 相同

违反条件会导致未定义行为。

#### gl_SampleMask

GLSL 4.00 或 `ARB_sample_shading`：

```glsl
out int gl_SampleMask[];
```

定义多重采样渲染时片段的采样掩码。如果着色器没有静态写入，则由 `gl_SampleMaskIn` 填充。输出的采样掩码将与光栅化器计算的采样掩码进行逻辑与运算。

::: warning
如果片段着色器写入 `gl_SampleMask`，必须确保所有执行路径都写入该值，并且写入数组中的每个元素。数组大小与 `gl_SampleMaskIn` 相同。
:::
