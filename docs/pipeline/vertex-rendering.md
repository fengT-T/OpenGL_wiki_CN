# 顶点渲染

顶点渲染（Vertex Rendering）是将数组中指定的顶点数据渲染为一个或多个图元的过程。本文介绍顶点的绘制函数。如需了解如何定义顶点数据来源，请参阅顶点指定相关文档。

## 前置条件

为了成功发出绘制命令，当前绑定的顶点数组对象（Vertex Array Object，VAO）必须已正确设置了顶点属性数组。如果使用索引渲染，VAO 中的 `GL_ELEMENT_ARRAY_BUFFER` 绑定也必须绑定一个缓冲区对象。

### 渲染失败的原因

发出任何绘制命令时，可能因多种原因产生 `GL_INVALID_OPERATION` 错误，其中大多数与绘制命令本身关系不大。以下是发出绘制命令时必须确保有效的情况：

- 必须绑定非零的 VAO（虽然不需要启用任何数组，所以可以是新创建的 VAO）
- 当前帧缓冲区必须完整
- 当前程序对象或程序管线对象必须成功链接并对当前状态有效
- 使用的纹理必须完整
- 如果存在几何着色器，馈送给 GS 的图元类型必须与 GS 的图元输入兼容
- 如果变换反馈处于活动状态，变换反馈模式必须匹配适用的图元模式
- `mode` 参数为 `GL_PATCHES` 当且仅当曲面细分评估着色器处于活动状态
- 被 OpenGL 渲染调用读取或写入的缓冲区对象不能以非持久方式映射

::: warning 警告
在没有程序或程序管线的情况下渲染不会产生 `GL_INVALID_OPERATION` 错误，而是导致未定义行为。
:::

## 基本概念

渲染可以分为非索引渲染和索引渲染。索引渲染使用元素缓冲区决定从顶点数组中拉取哪些索引的值。

- 所有非索引绘制命令形式为 `gl*Draw*Arrays*`
- 所有索引绘制命令形式为 `gl*Draw*Elements*`

### 图元重启（Primitive Restart）

图元重启功能允许告诉 OpenGL：特定索引值不表示在该索引处获取顶点，而是从下一个顶点开始同一类型的新图元。这本质上是 `glMultiDrawElements` 的替代方案。

使用方法：

```cpp
void glPrimitiveRestartIndex(GLuint index);
glEnable(GL_PRIMITIVE_RESTART);
```

当在索引数组中找到此索引时，系统不会获取顶点，而是重新开始图元处理。

**示例**：索引数组 `{ 0 1 2 3 65535 2 3 4 5 }`

- 正常渲染为三角形条带：7 个三角形
- 使用 `glPrimitiveRestartIndex(65535)` 并启用图元重启：4 个三角形 `{0 1 2}, {1 2 3}, {2 3 4}, {3 4 5}`

::: tip 注意
与 BaseVertex 绘制函数一起使用时，此测试在基础索引添加到重启索引**之前**进行。图元重启适用于任何索引渲染函数，包括间接渲染。
:::

#### 固定索引重启

OpenGL 4.3 引入 `GL_PRIMITIVE_RESTART_FIXED_INDEX` 以兼容 OpenGL ES 3.0。如果两者都启用，固定索引重启优先。

固定索引使用特定索引值：索引绘制命令 `type` 参数的最大可能值。例如 `GL_UNSIGNED_SHORT` 类型的重启索引为 65535（0xFFFF）。

## 直接渲染

直接渲染命令将各种渲染参数直接作为函数参数传递。

### 基本绘制

```cpp
void glDrawArrays(GLenum mode, GLint first, GLsizei count);
void glDrawElements(GLenum mode, GLsizei count, GLenum type, void *indices);
```

**glDrawArrays 参数**：
- `mode`：图元类型
- `first` 和 `count`：定义从缓冲区拉取的元素范围

**glDrawElements 参数**：
- `count`：使用的索引数量
- `indices`：索引缓冲区对象（绑定到 `GL_ELEMENT_ARRAY_BUFFER`）中开始读取数据的偏移量
- `type`：索引类型
  - `GL_UNSIGNED_BYTE`：索引范围 [0, 255]
  - `GL_UNSIGNED_SHORT`：索引范围 [0, 65535]
  - `GL_UNSIGNED_INT`：索引范围 [0, 2^32 - 1]

::: warning 重要
`indices` 参数实际上不是指针，而是字节偏移量，被伪装成 `void*` 类型。需要将字节偏移量转换为 `void*`。
:::

### 多重绘制

绑定或修改 VAO 状态通常是昂贵的操作。多重绘制允许一次调用渲染多个图元：

```cpp
void glMultiDrawArrays(GLenum mode, GLint *first, GLsizei *count, GLsizei primcount);
void glMultiDrawElements(GLenum mode, GLsizei *count, GLenum type, void **indices, GLsizei primcount);
```

`glMultiDrawArrays` 概念上等价于：

```cpp
for (int i = 0; i < primcount; i++) {
    if (count[i] > 0)
        glDrawArrays(mode, first[i], count[i]);
}
```

多重绘制适用于知道要绘制大量使用相同着色器的相同类型独立图元的情况。

### 基础索引

当有多个共享相同顶点格式的网格时，可以将它们放在同一缓冲区对象中。对于索引渲染，`glDrawElementsBaseVertex` 允许为每个网格添加基础索引：

```cpp
void glDrawElementsBaseVertex(GLenum mode, GLsizei count,
    GLenum type, void *indices, GLint basevertex);
```

`basevertex` 在从顶点数据拉取之前添加到每个索引。

### 实例化

实例化允许渲染同一网格的多个副本：

```cpp
void glDrawArraysInstanced(GLenum mode, GLint first,
    GLsizei count, GLsizei instancecount);
void glDrawElementsInstanced(GLenum mode, GLsizei count, 
    GLenum type, const void *indices, GLsizei instancecount);
```

顶点着色器接收特殊输入值 `gl_InstanceID`，范围 [0, instancecount)。

OpenGL 4.2 或 ARB_base_instance 可用时可指定起始实例：

```cpp
void glDrawArraysInstancedBaseInstance(GLenum mode, GLint first,
    GLsizei count, GLsizei instancecount, GLuint baseinstance);
void glDrawElementsInstancedBaseInstance(GLenum mode, GLsizei count, 
    GLenum type, const void *indices, GLsizei instancecount, GLuint baseinstance);
```

::: warning 重要警告
`gl_InstanceID` **不**遵循 `baseinstance`，始终在范围 [0, instancecount) 内。基础实例仅在使用实例化数组时有用。在 OpenGL 4.6 或 ARB_shader_draw_parameters 中，可访问 `gl_BaseInstance`。
:::

### 范围绘制

范围绘制允许指定索引渲染调用不会使用超出给定范围的索引值：

```cpp
void glDrawRangeElements(GLenum mode, GLuint start, 
    GLuint end, GLsizei count, GLenum type, void *indices);
```

`start` 和 `end` 指定此绘制调用将使用的最小和最大索引值。实现可能有特定的"最佳点"索引范围：

- `end - start` 应小于等于 `GL_MAX_ELEMENTS_VERTICES`
- `count` 应小于等于 `GL_MAX_ELEMENTS_INDICES`

### 组合功能

基础索引可与多重绘制、范围或实例化组合：

```cpp
void glMultiDrawElementsBaseVertex(GLenum mode, 
    GLsizei *count, GLenum type, void **indices, 
    GLsizei primcount, GLint *basevertex);

void glDrawRangeElementsBaseVertex(GLenum mode, 
    GLuint start, GLuint end, GLsizei count, GLenum type, 
    void *indices, GLint basevertex);

void glDrawElementsInstancedBaseVertex(GLenum mode, 
    GLsizei count, GLenum type, const void *indices, 
    GLsizei instancecount, GLint basevertex);
```

基础索引和实例化还可与基础实例组合：

```cpp
void glDrawElementsInstancedBaseVertexBaseInstance(GLenum mode, 
    GLsizei count, GLenum type, const void *indices, 
    GLsizei instancecount, GLint basevertex, GLuint baseinstance);
```

## 变换反馈渲染

使用变换反馈生成渲染顶点时，通常使用异步查询对象获取图元数量。但这需要 GPU→CPU→GPU 的信息传输。

变换反馈渲染功能允许绕过此问题，直接绘制变换反馈操作期间渲染的所有内容：

```cpp
void glDrawTransformFeedback(GLenum mode, GLuint id);
void glDrawTransformFeedbackStream(GLenum mode, GLuint id, GLuint stream);
```

::: warning 注意
这些函数**只**发出渲染调用，**不会绑定变换反馈缓冲区**，也不会修改任何 VAO 状态。唯一从变换反馈对象拉取的是渲染到该流的图元数量。调用前需自行设置顶点数组。
:::

实例化版本（GL 4.2 或 ARB_transform_feedback_instanced）：

```cpp
void glDrawTransformFeedbackInstanced(GLenum mode, GLuint id, GLsizei instancecount);
void glDrawTransformFeedbackStreamInstanced(GLenum mode, GLuint id, GLuint stream, GLsizei instancecount);
```

## 间接渲染

间接渲染允许绘制命令的大部分参数来自缓冲区对象存储的 GPU 数据。这避免了 GPU→CPU→GPU 往返，GPU 决定渲染哪些顶点范围。

间接渲染函数从绑定到 `GL_DRAW_INDIRECT_BUFFER` 的缓冲区获取数据。

### 非索引间接渲染

```cpp
void glDrawArraysIndirect(GLenum mode, const void *indirect);
```

数据结构：

```c
typedef struct {
   GLuint  count;
   GLuint  instanceCount;
   GLuint  first;
   GLuint  baseInstance;
} DrawArraysIndirectCommand;
```

等价于：

```c
glDrawArraysInstancedBaseInstance(mode, cmd->first, cmd->count, cmd->instanceCount, cmd->baseInstance);
```

::: info 版本要求
如果 OpenGL 4.2 或 ARB_base_instance 不可用，`baseInstance` 字段必须为 0。
:::

多重绘制（GL 4.3 或 ARB_multi_draw_indirect）：

```cpp
void glMultiDrawArraysIndirect(GLenum mode, const void *indirect, GLsizei drawcount, GLsizei stride);
```

### 索引间接渲染

```cpp
void glDrawElementsIndirect(GLenum mode, GLenum type, const void *indirect);
```

数据结构：

```cpp
typedef struct {
    GLuint  count;
    GLuint  instanceCount;
    GLuint  firstIndex;
    GLuint  baseVertex;
    GLuint  baseInstance;
} DrawElementsIndirectCommand;
```

等价于：

```c
glDrawElementsInstancedBaseVertexBaseInstance(mode, cmd->count, type,
  cmd->firstIndex * size-of-type, cmd->instanceCount, cmd->baseVertex, cmd->baseInstance);
```

多重绘制：

```cpp
void glMultiDrawElementsIndirect(GLenum mode, GLenum type, const void *indirect,
    GLsizei drawcount, GLsizei stride);
```

### 间接计数

OpenGL 4.6 引入了从 `GL_PARAMETER_BUFFER` 绑定的缓冲区对象提供 `drawcount` 的扩展：

```cpp
void glMultiDrawArraysIndirectCount(GLenum mode, const void *indirect,
    GLintptr drawcount, GLsizei maxdrawcount, GLsizei stride);

void glMultiDrawElementsIndirectCount(GLenum mode, GLenum type,
    const void *indirect, GLintptr drawcount, GLsizei maxdrawcount, GLsizei stride);
```

- `drawcount`：`GL_PARAMETER_BUFFER` 中的字节偏移量（必须是 4 的倍数）
- `maxdrawcount`：`GL_DRAW_INDIRECT_BUFFER` 中绘制命令的预期上限

## 条件渲染

条件渲染机制使一个或多个渲染命令的执行取决于遮挡查询操作的结果。

```cpp
glBeginConditionalRender(GLuint id, GLenum mode);
glEndConditionalRender();
```

在这两个函数边界内发出的所有渲染命令仅当 `id` 指定的遮挡条件测试为真时才执行。对于 `GL_SAMPLES_PASSED` 查询，如果样本数不为零则视为真。

`mode` 参数确定如何执行丢弃：

| 模式 | 说明 |
|-----|------|
| `GL_QUERY_WAIT` | OpenGL 等待查询结果返回，然后决定是否执行渲染命令 |
| `GL_QUERY_NO_WAIT` | OpenGL 可能仍然执行渲染命令，不等待查询测试是否为真 |
| `GL_QUERY_BY_REGION_WAIT` | 等待查询结果，但渲染结果裁剪到遮挡查询中实际光栅化的样本 |
| `GL_QUERY_BY_REGION_NO_WAIT` | 不等待，但仍保持区域裁剪 |

::: tip 性能提示
"等待"并不意味着 `glEndConditionalRender` 会在 CPU 上停滞。这意味着条件渲染范围内的第一个命令在查询返回之前不会由 GPU 执行。CPU 会继续处理，但 GPU 本身可能有管线停顿。
:::

## 参见

- [顶点指定](./vertex-specification.md)
- [图元](./primitive.md)
