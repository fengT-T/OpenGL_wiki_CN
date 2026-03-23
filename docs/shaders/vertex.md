# Vertex Shader 顶点着色器

**Vertex Shader（顶点着色器）** 是渲染管线中处理单个顶点的可编程着色器阶段。它从顶点流接收顶点属性数据，处理每个输入顶点并生成一个输出顶点，必须保持 1:1 的映射关系。

顶点着色器通常执行到裁剪空间的变换，供后续的 Vertex Post-Processing 阶段使用，也可用于逐顶点光照计算或为后续着色器阶段做准备工作。

## Invocation Frequency 调用频率

顶点着色器大约为顶点流中的每个顶点执行一次。

::: tip 不变性与缓存优化
顶点着色器通常对其输入具有 **invariance（不变性）**：在同一个绘制命令中，接收相同输入属性的两个调用将返回二进制相同的结果。

OpenGL 实现利用 **Post Transform Cache（后变换缓存）** 优化：当使用索引绘制时，如果同一索引再次出现，实现可以复用之前的计算结果，跳过顶点着色器执行。
:::

::: warning 细分的影响
如果启用了 Tessellation（细分），特别是 Tessellation Control Shader 激活时，顶点着色器的调用频率可能改变。用于节省顶点着色器调用的技巧在细分时可能无效。
:::

## Inputs 输入

用户定义的顶点着色器输入称为 **vertex attributes（顶点属性）**，通过绑定 Vertex Array Object (VAO) 并执行绘制命令来提供。

顶点着色器输入变量使用 `in` 类型限定符定义，不能聚合到 Interface Block 中。

### 属性索引分配

每个输入变量被分配一个或多个顶点属性索引，按优先级从高到低：

**1. 着色器内指定**

```glsl
layout(location = 2) in vec4 a_vec;
```

**2. 链接前指定**

```cpp
void glBindAttribLocation(GLuint program, GLuint index, const GLchar *name);
```

**3. 自动分配**

如果以上方法都未指定，链接时 OpenGL 自动分配索引。

::: warning 自动分配的不确定性
自动分配的索引完全任意，即使使用相同的顶点着色器代码，不同程序的分配也可能不同。建议显式指定属性位置。
:::

### Multiple Attributes 多属性

矩阵、数组和双精度类型可能占用多个属性索引：

- **矩阵**：每列占用一个索引
- **数组**：每个元素占用一个索引
- **双精度 (`double`, `dvec`)**：始终占用一个索引

```glsl
layout(location = 3) in mat4 a_matrix;  // 占用索引 3, 4, 5, 6
```

::: danger 索引冲突
以下代码将因索引范围重叠而链接失败：

```glsl
layout(location = 0) in mat4 a_matrix;  // 占用 [0, 3]
layout(location = 3) in vec4 a_vec;     // 冲突！
```
:::

### Attribute Limits 属性限制

属性索引不能超过 `GL_MAX_VERTEX_ATTRIBS`。

::: warning 双精度属性
`dvec3` 和 `dvec4` 虽然只占用一个属性索引，但实现可能将其计为两个资源。应假设它们消耗两个输入资源。
:::

### Built-in Inputs 内置输入

```glsl
in int gl_VertexID;
in int gl_InstanceID;
in int gl_DrawID;      // 需要 GLSL 4.60 或 ARB_shader_draw_parameters
in int gl_BaseVertex;  // 需要 GLSL 4.60 或 ARB_shader_draw_parameters
in int gl_BaseInstance;// 需要 GLSL 4.60 或 ARB_shader_draw_parameters
```

| 变量 | 说明 |
|------|------|
| `gl_VertexID` | 当前处理的顶点索引。非索引绘制时为有效索引；索引绘制时为用于获取顶点的索引值 |
| `gl_InstanceID` | 实例化渲染时的当前实例索引，始终从 0 开始 |
| `gl_DrawID` | 多重绘制命令中的绘制命令索引 |
| `gl_BaseVertex` | 绘制命令的 baseVertex 参数值 |
| `gl_BaseInstance` | 实例化绘制命令的 baseInstance 参数值 |

::: warning gl_InstanceID
`gl_InstanceID` **不包含** `baseInstance` 参数值，始终在范围 `[0, instancecount)` 内。如需完整实例索引，使用 `gl_InstanceID + gl_BaseInstance`。
:::

## Outputs 输出

顶点着色器输出传递给下一阶段（Tessellation → Geometry → Vertex Post-Processing）。

用户定义的输出变量可以有 **interpolation qualifiers（插值限定符）**，也可以聚合到 Interface Block 中。

### Built-in Outputs 内置输出

```glsl
out gl_PerVertex {
    vec4 gl_Position;
    float gl_PointSize;
    float gl_ClipDistance[];
};
```

| 变量 | 说明 |
|------|------|
| `gl_Position` | 当前顶点的裁剪空间输出位置 |
| `gl_PointSize` | 点图元的光栅化像素宽/高，仅渲染点图元时有效，会被限制在 `GL_POINT_SIZE_RANGE` 范围内 |
| `gl_ClipDistance[]` | 顶点到用户定义裁剪半空间的距离。非负值表示在裁剪平面内侧，负值表示在外侧 |

::: tip gl_ClipDistance 使用
使用 `gl_ClipDistance` 需要手动重新声明并指定大小。GLSL 4.10+ 或 ARB_separate_shader_objects 需要重新声明整个 `gl_PerVertex` 块。
:::