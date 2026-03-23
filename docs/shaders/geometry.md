# 几何着色器 (Geometry Shader)

几何着色器（Geometry Shader，简称 GS）是使用 GLSL 编写的着色器程序，负责处理图元（Primitives）。它位于顶点着色器（Vertex Shader）（或可选的曲面细分阶段）和固定功能的顶点后处理阶段之间。

::: info 版本信息
- 核心版本：4.6
- 引入版本：3.2
- ARB 扩展：`ARB_geometry_shader4`
:::

几何着色器是可选的，不必强制使用。

每次几何着色器调用接收单个图元作为输入，可以输出零个或多个图元。实现定义了单次 GS 调用可以生成的图元数量上限。几何着色器需要指定接受的输入图元类型和输出的图元类型。

::: warning 不推荐用法
虽然几何着色器可以用于放大几何体，实现粗略的曲面细分效果，但这通常不是几何着色器的理想用途。
:::

## 几何着色器的主要用途

- **分层渲染（Layered Rendering）**：将一个图元渲染到多个图像层，无需切换绑定的渲染目标
- **变换反馈（Transform Feedback）**：常用于在 GPU 上执行计算任务（在计算着色器出现之前）

OpenGL 4.0 为几何着色器引入了两个新特性：

- **多输出流**：用于变换反馈，不同的反馈缓冲区集可以接收不同的变换反馈数据
- **几何着色器实例化**：允许多次调用处理同一输入图元，简化分层渲染的实现

## 图元输入/输出规范

每个几何着色器都设计为接受特定的图元类型作为输入，并输出特定的图元类型。

### 输入图元类型

```glsl
layout(input_primitive) in;
```

`input_primitive` 类型必须与提供给 GS 的顶点流的图元类型匹配。

| GS 输入类型 | OpenGL 图元 | TES 参数 | 顶点数 |
|------------|-------------|----------|--------|
| `points` | `GL_POINTS` | `point_mode` | 1 |
| `lines` | `GL_LINES`, `GL_LINE_STRIP`, `GL_LINE_LOOP` | `isolines` | 2 |
| `lines_adjacency` | `GL_LINES_ADJACENCY`, `GL_LINE_STRIP_ADJACENCY` | N/A | 4 |
| `triangles` | `GL_TRIANGLES`, `GL_TRIANGLE_STRIP`, `GL_TRIANGLE_FAN` | `triangles`, `quads` | 3 |
| `triangles_adjacency` | `GL_TRIANGLES_ADJACENCY`, `GL_TRIANGLE_STRIP_ADJACENCY` | N/A | 6 |

### 输出图元类型

```glsl
layout(output_primitive, max_vertices = vert_count) out;
```

`output_primitive` 必须是以下之一：

- `points`
- `line_strip`
- `triangle_strip`

要输出独立的三角形或线条，只需在每组 3 或 2 个顶点后调用 `EndPrimitive()`。

::: tip 重要
必须声明 `max_vertices`，该数值是编译时常量，定义了单次 GS 调用可以写入的最大顶点数。该值不能超过 `GL_MAX_GEOMETRY_OUTPUT_VERTICES`（最小值为 256）。
:::

### 实例化（Instancing）

::: info 版本信息
- 核心版本：4.6
- 引入版本：4.0
- ARB 扩展：`ARB_gpu_shader5`
:::

几何着色器可以实例化，使同一输入图元被多次执行。每次调用获得不同的 `gl_InvocationID` 值。

```glsl
layout(invocations = num_instances) in;
```

`num_instances` 不能超过 `GL_MAX_GEOMETRY_SHADER_INVOCATIONS`（至少为 32）。

输出图元按 `gl_InvocationID` 排序。例如，渲染两个图元且 `num_instances` 为 3 时，执行顺序为：(prim0, inst0), (prim0, inst1), (prim0, inst2), (prim1, inst0), ...

## 输入

几何着色器接收图元作为输入，每个图元由若干顶点组成。前一阶段的输出以数组形式传递给 GS。

```glsl
in gl_PerVertex
{
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
} gl_in[];
```

基于图元（而非顶点）的输入值：

```glsl
in int gl_PrimitiveIDIn;
in int gl_InvocationID; // 需要 GLSL 4.0 或 ARB_gpu_shader5
```

- `gl_PrimitiveIDIn`：当前输入图元的 ID，基于当前绘图命令开始以来 GS 处理的图元数量
- `gl_InvocationID`：当前实例的索引

## 输出

几何着色器使用基于函数的接口输出顶点。写入所有输出值后，调用 `EmitVertex()` 将顶点写入输出流。调用后，所有输出变量包含未定义的值。

::: warning 注意
必须在每次 `EmitVertex()` 调用前写入每个输出变量。
:::

`EndPrimitive()` 用于结束当前图元并开始新的图元。

```glsl
out gl_PerVertex
{
  vec4 gl_Position;
  float gl_PointSize;
  float gl_ClipDistance[];
};
```

- `gl_Position`：当前顶点的裁剪空间位置。如果向流 0 发射顶点且光栅化未关闭，必须写入此值
- `gl_PointSize`：光栅化点的像素宽度/高度。仅在输出点图元时需要
- `gl_ClipDistance`：顶点到每个用户定义裁剪平面的距离

```glsl
out int gl_PrimitiveID;
```

图元 ID 将传递给片段着色器，从该图元的引发顶点（Provoking Vertex）获取。

### 分层渲染

分层渲染允许 GS 将特定图元发送到分层帧缓冲区的不同层。

```glsl
out int gl_Layer;
out int gl_ViewportIndex; // 需要 GL 4.1 或 ARB_viewport_array
```

- `gl_Layer`：定义图元发送到哪一层
- `gl_ViewportIndex`：指定使用的视口索引

::: warning 警告
`gl_Layer` 和 `gl_ViewportIndex` 是 GS 输出变量。每次调用 `EmitVertex` 后，它们的值会变为未定义，必须在每次循环输出时重新设置。
:::

#### 引发顶点规则

可以使用 `glGetIntegerv` 查询 `GL_LAYER_PROVOKING_VERTEX` 和 `GL_VIEWPORT_INDEX_PROVOKING_VERTEX`：

- `GL_PROVOKING_VERTEX`：使用当前的引发顶点约定
- `GL_LAST_VERTEX_CONVENTION`：使用最后一个顶点
- `GL_FIRST_VERTEX_CONVENTION`：使用第一个顶点
- `GL_UNDEFINED_VERTEX`：实现未指定

### 输出流

::: info 版本信息
- 核心版本：4.6
- 引入版本：4.0
- ARB 扩展：`ARB_transform_feedback3`
:::

使用变换反馈时，可以将不同的顶点集发送到不同的缓冲区。

多输出流要求输出图元类型为 `points`。

```glsl
layout(stream = stream_index) out vec4 some_output;
```

默认流索引设置：

```glsl
layout(stream = 2) out;
```

使用 `EmitStreamVertex()` 写入特定流的顶点，使用 `EndStreamPrimitive()` 结束特定流的图元。

::: tip 提示
只有发送到流 0 的图元会传递给顶点后处理阶段进行渲染；其他流仅在变换反馈时有效。
:::

## 输出限制

几何着色器有两个输出限制：

1. **最大顶点数**：`GL_MAX_GEOMETRY_OUTPUT_VERTICES`（最小值 256）
2. **总输出分量数**：`GL_MAX_GEOMETRY_TOTAL_OUTPUT_COMPONENTS`

总输出分量数 = 每顶点分量数 × 顶点数。例如，总输出分量数为 1024，每顶点写入 12 个分量，则最大顶点数为 `floor(1024/12) = 85`。

内置输出如 `gl_Layer` 也计入总分量数。

## 另见

- [片段着色器](./fragment)
- 类型限定符 (Type Qualifier)
- 几何着色器示例
