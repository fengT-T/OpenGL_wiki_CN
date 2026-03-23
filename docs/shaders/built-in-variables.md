# 内置变量 (Built-in Variables)

OpenGL Shading Language（GLSL）为各个着色器阶段定义了一系列特殊变量。这些**内置变量**（built-in variables）具有特殊属性，通常用于与固定功能管线进行通信。按照约定，所有预定义变量都以 `gl_` 开头，用户定义的变量不得以此开头。

::: info
本文仅描述核心 OpenGL 着色语言预定义变量，不包含兼容性配置文件中的变量。
:::

## 顶点着色器输入

顶点着色器（Vertex Shader）具有以下内置输入变量：

```glsl
in int gl_VertexID;
in int gl_InstanceID;
in int gl_DrawID;      // 需要 GLSL 4.60 或 ARB_shader_draw_parameters
in int gl_BaseVertex;  // 需要 GLSL 4.60 或 ARB_shader_draw_parameters
in int gl_BaseInstance; // 需要 GLSL 4.60 或 ARB_shader_draw_parameters
```

### 变量说明

**`gl_VertexID`**
当前正在处理的顶点索引。使用非索引渲染时，它是当前顶点的有效索引（已处理顶点数 + `first` 值）；使用索引渲染时，它是从缓冲区获取此顶点所使用的索引。

::: info
如果渲染命令中包含 `baseVertex` 参数，`gl_VertexID` 会加上该参数值。
:::

**`gl_InstanceID`**
执行实例渲染（instanced rendering）时当前实例的索引。实例计数始终从 0 开始，即使使用了 base instance 调用。不使用实例渲染时，此值为 0。

::: warning
此值**不会**跟随某些实例渲染函数提供的 `baseInstance` 参数。`gl_InstanceID` 始终落在半开区间 [0, instancecount) 内。如果使用 GLSL 4.60，可以使用 `gl_BaseInstance` 来计算正确的实例索引。
:::

**`gl_DrawID`**
多绘制渲染命令（包括间接多绘制命令）中绘制命令的索引。第一个绘制命令的 ID 为 0，随渲染器处理绘制命令而递增。此值始终是动态一致表达式（Dynamically Uniform Expression）。

**`gl_BaseVertex`**
渲染命令的 `baseVertex` 参数值。如果渲染命令不包含该参数，此输入值为 0。

**`gl_BaseInstance`**
实例渲染命令的 `baseInstance` 参数值。如果渲染命令不包含该参数，此输入值为 0。

## 顶点着色器输出

顶点着色器具有以下预定义输出：

```glsl
out gl_PerVertex
{
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
};
```

`gl_PerVertex` 定义了一个输出接口块（interface block）。该块定义时不带实例名，因此不需要前缀。

这些变量仅在以下情况下具有下述含义：此着色器是最后一个活动的顶点处理阶段，且光栅化仍然处于活动状态（即未启用 `GL_RASTERIZER_DISCARD`）。

### 输出变量说明

**`gl_Position`**
当前顶点的裁剪空间（clip-space）输出位置。

**`gl_PointSize`**
正在光栅化的点的像素宽度/高度。仅在渲染点图元（point primitives）时有意义。值将被限制在 `GL_POINT_SIZE_RANGE` 范围内。

**`gl_ClipDistance`**
允许着色器设置顶点到每个用户定义裁剪半空间（user-defined clipping half-space）的距离。非负距离表示顶点在裁剪平面内部/后面，负距离表示在外部/前面。数组中每个元素对应一个裁剪平面。要使用此变量，用户必须手动重新声明并指定显式大小。

## 细分控制着色器输入

细分控制着色器（Tessellation Control Shader，TCS）提供以下内置输入变量：

```glsl
in int gl_PatchVerticesIn;
in int gl_PrimitiveID;
in int gl_InvocationID;
```

**`gl_PatchVerticesIn`**
输入补丁（patch）中的顶点数量。

**`gl_PrimitiveID`**
当前补丁在此渲染命令中的索引。

**`gl_InvocationID`**
此补丁内 TCS 调用的索引。TCS 调用通过使用此索引来写入逐顶点输出变量。

TCS 还接收顶点着色器输出的内置变量：

```glsl
in gl_PerVertex
{
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
} gl_in[gl_MaxPatchVertices];
```

## 细分控制着色器输出

TCS 具有以下内置补丁输出变量：

```glsl
patch out float gl_TessLevelOuter[4];
patch out float gl_TessLevelInner[2];
```

这些定义了细分图元生成器（tessellation primitive generator）使用的外部和内部细分级别。它们定义了对补丁应用多少细分。其确切含义取决于细分评估着色器（TES）中定义的补丁类型和其他设置。

::: info
如果抽象补丁类型使用的任何外部级别为 0 或负数（或 NaN），则补丁将被生成器丢弃，不会产生此补丁的 TES 调用。
:::

## 细分评估着色器输入

细分评估着色器（Tessellation Evaluation Shader，TES）具有以下内置输入：

```glsl
in vec3 gl_TessCoord;
in int gl_PatchVerticesIn;
in int gl_PrimitiveID;
```

**`gl_TessCoord`**
此顶点在细分抽象补丁（tessellated abstract patch）中的位置。对于 `isolines` 和 `quads`，只有 XY 分量有有效值；对于 `triangles`，所有三个分量都有有效值。所有有效值都是 [0, 1] 范围内的归一化浮点数。

**`gl_PatchVerticesIn`**
正在处理的补丁的顶点数。

**`gl_PrimitiveID`**
当前补丁在此绘制调用中处理的补丁系列中的索引。

TES 还可以访问 TCS 或 OpenGL 为补丁提供的细分级别：

```glsl
patch in float gl_TessLevelOuter[4];
patch in float gl_TessLevelInner[2];
```

## 细分评估着色器输出

TES 具有以下内置输出：

```glsl
out gl_PerVertex {
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
};
```

## 几何着色器输入

几何着色器（Geometry Shader，GS）提供以下内置输入变量：

```glsl
in gl_PerVertex
{
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
} gl_in[];

in int gl_PrimitiveIDIn;
in int gl_InvocationID; // 需要 GLSL 4.0 或 ARB_gpu_shader5
```

**`gl_PrimitiveIDIn`**
当前输入图元的 ID，基于自当前绘制命令开始以来 GS 处理的图元数量。

**`gl_InvocationID`**
当前实例，用于实例化几何着色器（instancing geometry shaders）。

## 几何着色器输出

GS 具有以下内置输出：

```glsl
out gl_PerVertex
{
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
};

out int gl_PrimitiveID;
out int gl_Layer;
out int gl_ViewportIndex; // 需要 GL 4.1 或 ARB_viewport_array
```

**`gl_PrimitiveID`**
将传递给片元着色器的图元 ID。

**`gl_Layer`**
定义图元发送到分层图像（layered image）中的哪一层。

**`gl_ViewportIndex`**
指定与此图元一起使用的视口索引。

## 片元着色器输入

片元着色器（Fragment Shader）具有以下内置输入变量：

```glsl
in vec4 gl_FragCoord;
in bool gl_FrontFacing;
in vec2 gl_PointCoord;
```

**`gl_FragCoord`**
片元在窗口空间中的位置。X、Y 和 Z 分量是片元的窗口空间位置。Z 值将写入深度缓冲区（如果着色器未写入 `gl_FragDepth`）。W 分量是 1/Wclip，其中 Wclip 是从最后一个顶点处理阶段输出到 `gl_Position` 的裁剪空间顶点位置的插值 W 分量。

可以通过使用特殊的输入布局限定符重新声明 `gl_FragCoord` 来修改其空间：

```glsl
layout(origin_upper_left) in vec4 gl_FragCoord;  // 原点在左上角
layout(pixel_center_integer) in vec4 gl_FragCoord; // 整数值表示像素中心
```

**`gl_FrontFacing`**
如果片元是由图元的背面生成的，则为 false；在所有其他情况下（包括没有背面的图元）为 true。

**`gl_PointCoord`**
点图元内的位置，定义片元相对于点边缘的位置。值的范围是 [0, 1]。OpenGL 默认使用左上角原点作为点坐标。

### OpenGL 4.0+ 额外输入

```glsl
in int gl_SampleID;
in vec2 gl_SamplePosition;
in int gl_SampleMaskIn[];
```

**`gl_SampleID`**
此片元正在光栅化的当前样本的整数标识符。

::: warning
使用此变量将强制着色器按样本评估。由于多重采样（multisampling）的主要目的之一就是避免这种情况，应仅在必要时使用。
:::

**`gl_SamplePosition`**
当前样本在像素区域内的位置，值在 [0, 1] 范围内。

**`gl_SampleMaskIn`**
使用多重采样时，包含正在生成的片元的样本掩码位域。

## 片元着色器输出

```glsl
out float gl_FragDepth;
out int gl_SampleMask[]; // 需要 GLSL 4.00 或 ARB_sample_shading
```

**`gl_FragDepth`**
片元的深度。如果着色器没有静态写入此值，则它将采用 `gl_FragCoord.z` 的值。

::: warning
如果片元着色器静态写入 `gl_FragDepth`，则着色器有责任在所有情况下静态写入该值。无论执行哪些分支，着色器都必须确保写入该值。
:::

GLSL 4.20 或 ARB_conservative_depth 允许通过重新声明指定深度修改的行为：

```glsl
layout (depth_any) out float gl_FragDepth;       // 默认，可自由更改
layout (depth_greater) out float gl_FragDepth;   // 只会增大深度
layout (depth_less) out float gl_FragDepth;      // 只会减小深度
layout (depth_unchanged) out float gl_FragDepth; // 写入 gl_FragCoord.z
```

**`gl_SampleMask`**
定义执行多重采样渲染时片元的样本掩码。

## 计算着色器输入

计算着色器（Compute Shader）具有以下内置输入变量：

```glsl
in uvec3 gl_NumWorkGroups;
in uvec3 gl_WorkGroupID;
in uvec3 gl_LocalInvocationID;
in uvec3 gl_GlobalInvocationID;
in uint  gl_LocalInvocationIndex;
```

**`gl_NumWorkGroups`**
传递给调度函数的工作组数量。

**`gl_WorkGroupID`**
此着色器调用的当前工作组。每个 XYZ 分量在半开区间 [0, gl_NumWorkGroups.XYZ) 内。

**`gl_LocalInvocationID`**
工作组内着色器的当前调用。每个 XYZ 分量在半开区间 [0, gl_WorkGroupSize.XYZ) 内。

**`gl_GlobalInvocationID`**
在此计算调度调用的所有调用中唯一标识此特定计算着色器调用。等同于：`gl_WorkGroupID * gl_WorkGroupSize + gl_LocalInvocationID`

**`gl_LocalInvocationIndex`**
`gl_LocalInvocationID` 的一维版本，标识此调用在工作组内的索引。

## 计算着色器常量

```glsl
const uvec3 gl_WorkGroupSize; // GLSL ≥ 4.30
```

`gl_WorkGroupSize` 是包含着色器局部工作组大小的常量，由布局限定符 `local_size_x/y/z` 定义，是编译时常量。

## 着色器 Uniform

```glsl
struct gl_DepthRangeParameters
{
    float near;
    float far;
    float diff;
};
uniform gl_DepthRangeParameters gl_DepthRange;

uniform int gl_NumSamples; // GLSL 4.20
```

`gl_DepthRange` 提供对 `glDepthRange` near 和 far 值的访问。`diff` 值是 `far` 减去 `near`。

`gl_NumSamples` 是当前帧缓冲区中的样本数。如果帧缓冲区不是多重采样的，此值为 1。

## 常量限制

GLSL 提供了许多常量整数变量，为着色器提供实现定义的限制值。这些变量声明为 `const`，被视为常量表达式。

| 名称 | 最小值 | 说明 |
|------|--------|------|
| `gl_MaxVertexAttribs` | 16 | 顶点属性数量 |
| `gl_MaxVertexUniformComponents` | 1024 | 顶点着色器 uniform 组件数 |
| `gl_MaxVertexOutputComponents` | 64 | 顶点着色器输出组件数 |
| `gl_MaxFragmentInputComponents` | 128 | 片元着色器输入组件数 |
| `gl_MaxTextureImageUnits` | 16 | 纹理图像单元数 |
| `gl_MaxDrawBuffers` | 8 | 绘制缓冲区数 |
| `gl_MaxClipDistances` | 8 | 裁剪距离数 |
| `gl_MaxViewports` | 16 | 视口数（GL 4.1+） |
| `gl_MaxComputeWorkGroupSize` | \{ 1024, 1024, 64 \} | 计算工作组最大尺寸（GL 4.3+） |
