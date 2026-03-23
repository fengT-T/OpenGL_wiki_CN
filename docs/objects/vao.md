# 顶点数组对象（Vertex Array Object，VAO）

顶点数组对象（VAO）是 OpenGL 中用于存储顶点数据状态的核心对象。本文将详细介绍 VAO 的工作原理、相关概念及其使用方法。

## 基本概念

### 顶点流（Vertex Stream）

要使用 OpenGL 进行渲染，必须使用包含顶点着色器（Vertex Shader）的着色器程序（Shader Program）或程序管线（Program Pipeline）。顶点着色器的用户定义输入变量定义了该着色器所需的顶点属性（Vertex Attributes）列表。每个属性映射到一个用户定义的输入变量。这组属性定义了顶点流必须提供的值，以便正确地使用该着色器进行渲染。

对于着色器中的每个属性，必须提供包含该属性数据的数组。所有这些数组必须具有相同数量的元素。

顶点流中顶点的顺序非常重要，这个顺序定义了 OpenGL 如何处理和渲染该流生成的图元（Primitives）。

::: tip 索引数组
索引数组是一种重新排列顶点属性数组数据的方式，无需实际修改数据。这在数据压缩方面非常有用——在大多数紧凑网格中，顶点会被多次使用。能够仅存储一次顶点的属性数据非常经济，因为顶点的属性数据通常约为 32 字节，而索引通常只有 2-4 字节。
:::

OpenGL（以及 Direct3D）只允许使用一个索引数组，每个属性数组都使用相同的索引进行访问。如果网格数据有多个索引数组，必须将其转换为 OpenGL 支持的格式。

## 顶点数组对象（VAO）

::: info 版本信息
- 核心版本：自 OpenGL 3.0 起
- ARB 扩展：`ARB_vertex_array_object`
:::

**顶点数组对象（VAO）** 是一种 OpenGL 对象，用于存储提供顶点数据所需的所有状态。它存储顶点数据的格式以及提供顶点数据数组的缓冲区对象（Buffer Objects）。

::: warning 注意
VAO 仅仅是引用缓冲区，它不会复制或冻结缓冲区的内容。如果被引用的缓冲区稍后被修改，这些更改将在使用 VAO 时被看到。
:::

### 创建和管理 VAO

作为 OpenGL 对象，VAO 具有标准的创建、销毁和绑定函数：

```cpp
void glGenVertexArrays(GLsizei n, GLuint *arrays);
void glCreateVertexArrays(GLsizei n, GLuint *arrays);
void glDeleteVertexArrays(GLsizei n, const GLuint *arrays);
void glBindVertexArray(GLuint array);
```

`glBindVertexArray` 与其他绑定函数不同，它没有"目标"参数——VAO 只有一个目标。

::: warning 注意
VAO 不能在 OpenGL 上下文之间共享。
:::

### 启用和禁用属性数组

顶点属性的编号从 0 到 `GL_MAX_VERTEX_ATTRIBS - 1`。每个属性可以启用或禁用数组访问。当属性的数组访问被禁用时，顶点着色器对该属性的任何读取都会产生一个常量值，而不是从数组中提取的值。

新创建的 VAO 对所有属性都禁用了数组访问。可以通过以下函数启用或禁用：

```cpp
void glEnableVertexAttribArray(GLuint index);
void glDisableVertexAttribArray(GLuint index);
```

使用直接状态访问（DSA）时，可以在不绑定 VAO 的情况下启用或禁用属性数组：

```cpp
void glEnableVertexArrayAttrib(GLuint vao, GLuint index);
void glDisableVertexArrayAttrib(GLuint vao, GLuint index);
```

::: warning 兼容性说明
兼容性配置文件（Compatibility Profile）将 VAO 对象 0 作为默认对象。核心配置文件（Core Profile）将 VAO 对象 0 视为不存在。因此，如果在核心配置文件中绑定了 VAO 0，则不应调用任何修改 VAO 状态的函数，包括使用 `glBindBuffer` 绑定 `GL_ELEMENT_ARRAY_BUFFER`。
:::

## 顶点缓冲区对象（VBO）

**顶点缓冲区对象（VBO）** 是指当缓冲区对象（Buffer Object）用作顶点数组数据源时的通用术语。它与任何其他缓冲区对象没有区别——用于变换反馈（Transform Feedback）或异步像素传输的缓冲区对象也可以用作顶点数组的源值。

### 使用 glVertexAttribPointer

可以使用以下函数设置属性数组的格式和源缓冲区：

```cpp
void glVertexAttribPointer(
    GLuint index,
    GLint size,
    GLenum type,
    GLboolean normalized,
    GLsizei stride,
    const void *offset
);

void glVertexIPointer(
    GLuint index,
    GLint size,
    GLenum type,
    GLsizei stride,
    const void *offset
);

void glVertexAttribLPointer(
    GLuint index,
    GLint size,
    GLenum type,
    GLsizei stride,
    const void *offset
);
```

::: tip 重要理解
这些函数指定属性索引从当前绑定到 `GL_ARRAY_BUFFER` 的缓冲区对象获取其属性数据。这种关联是在调用此函数时建立的。

调用 `glBindBuffer` 设置 `GL_ARRAY_BUFFER` 绑定不会修改当前 VAO 的状态！只有调用 `glVertexAttribPointer` 才会建立属性索引与缓冲区的关联。
:::

示例代码：

```cpp
glBindBuffer(GL_ARRAY_BUFFER, buf1);
glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
glBindBuffer(GL_ARRAY_BUFFER, 0);
```

上述代码中，第三行将缓冲区对象 0 绑定到 `GL_ARRAY_BUFFER`，但这不会影响属性 0 与 `buf1` 的关联。

::: warning 错误情况
如果当前绑定到 `GL_ARRAY_BUFFER` 的是 0，调用 `glVertexAttribPointer` 函数将导致错误。
:::

## 顶点格式（Vertex Format）

### 组件类型

顶点着色器中的顶点属性可以声明为浮点 GLSL 类型（如 `float` 或 `vec4`）、整型类型（如 `uint` 或 `ivec3`）或双精度类型（如 `double` 或 `dvec4`）。属性的一般类型必须与属性数组提供的类型匹配。

| 函数 | 用途 | 支持的类型 |
|------|------|------------|
| `glVertexAttribPointer` | 浮点属性 | `GL_FLOAT`、`GL_HALF_FLOAT`、`GL_DOUBLE`（不推荐）、`GL_FIXED`、各种整型（可归一化） |
| `glVertexAttribIPointer` | 整型属性 | `GL_BYTE`、`GL_UNSIGNED_BYTE`、`GL_SHORT`、`GL_UNSIGNED_SHORT`、`GL_INT`、`GL_UNSIGNED_INT` |
| `glVertexAttribLPointer` | 双精度属性 | `GL_DOUBLE` |

::: tip 组件填充规则
如果顶点着色器的组件数少于属性提供的数量，多余的组件将被忽略。如果顶点着色器的组件数多于数组提供的数量，缺失的 XYZW 组件将被赋予向量 (0, 0, 0, 1) 中的值。

对于双精度输入，如果着色器属性的组件数多于提供的值，多余组件将具有未定义的值。
:::

### 打包类型的位布局

`GL_INT_2_10_10_10_REV` 和 `GL_UNSIGNED_INT_2_10_10_10_REV` 类型的位布局：

```
31 30 29 28 27 26 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
|  W |              Z              |              Y              |               X            |
```

`GL_UNSIGNED_INT_10F_11F_11F_REV` 类型的位布局：

```
31 30 29 28 27 26 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1  0
|             Z              |              Y                 |               X               |
```

### D3D 兼容性

::: info 版本信息
- 核心版本：自 OpenGL 3.2 起
- ARB 扩展：`ARB_vertex_array_bgra`
:::

使用 `glVertexAttribPointer` 时，`size` 参数可以是 `GL_BGRA`。这会交换前三个组件的顺序，专门用于与某些 Direct3D 顶点格式兼容。

使用 `GL_BGRA` 时必须满足：
- `type` 必须是 `GL_UNSIGNED_BYTE`、`GL_INT_2_10_10_10_REV` 或 `GL_UNSIGNED_INT_2_10_10_10_REV`
- `normalized` 必须是 `GL_TRUE`

::: warning 使用建议
仅当数据以 D3D 格式存在且需要在 GL 应用程序中使用时，才应使用此特殊模式。否则不要使用，不会获得任何性能提升。
:::

## 缓冲区偏移和步长

OpenGL 需要两个额外的信息才能找到数据：

1. **偏移量（Offset）**：从缓冲区对象开始到数组第一个元素的字节偏移
2. **步长（Stride）**：从一个元素开始到下一个元素开始的字节数

如果 `stride` 设置为 0，OpenGL 将假设顶点数据是紧密排列的，并根据给定的其他组件自动计算步长。

### 交错属性（Interleaved Attributes）

步长参数的主要目的是允许不同属性之间的交错。这是以下两种数据布局的概念区别：

```cpp
// 结构体数组（分离的属性数组）
struct StructOfArrays {
    GLfloat positions[VERTEX_COUNT * 3];
    GLfloat normals[VERTEX_COUNT * 3];
    GLubyte colors[VERTEX_COUNT * 4];
};

// 交错顶点数据
struct Vertex {
    GLfloat position[3];
    GLfloat normal[3];
    GLubyte color[4];
};

Vertex vertices[VERTEX_COUNT];
```

使用交错属性的示例：

```cpp
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, position)));
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, normal)));
glVertexAttribPointer(2, 4, GL_UNSIGNED_BYTE, GL_TRUE, sizeof(Vertex),
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, color)));
```

::: tip 最佳实践
应尽可能使用交错属性。如果某些属性需要更改而其他属性不需要，则应将常量属性互相交错，将同时更改的属性互相交错。
:::

## 索引缓冲区（Index Buffer）

索引渲染需要索引数组，所有顶点属性都将使用此索引数组中的相同索引。索引数组由绑定到 `GL_ELEMENT_ARRAY_BUFFER` 绑定点的缓冲区对象提供。

当缓冲区绑定到 `GL_ELEMENT_ARRAY_BUFFER` 时，所有 `gl*Draw*Elements*` 形式的绘制命令将使用该缓冲区中的索引。索引可以是无符号字节、无符号短整型或无符号整型。

::: warning 重要
索引缓冲区绑定存储在 VAO 中。如果没有绑定 VAO，则无法将缓冲区对象绑定到 `GL_ELEMENT_ARRAY_BUFFER`。
:::

## 实例化数组（Instanced Arrays）

::: info 版本信息
- 核心版本：自 OpenGL 3.3 起
- ARB 扩展：`ARB_instanced_arrays`
:::

进行实例化渲染（Instanced Rendering）时，可以使用实例计数而不是索引缓冲区来索引属性数组：

```cpp
void glVertexAttribDivisor(GLuint index, GLuint divisor);
```

- 如果 `divisor` 为零，属性行为正常，由数组或索引缓冲区索引
- 如果 `divisor` 非零，则将当前实例数除以此除数，结果用于访问属性数组

::: tip 性能考虑
这通常被认为是将逐实例数据传递给顶点着色器最有效的方式。但是，OpenGL 实现通常提供的顶点属性数量相当有限（约 16 个），这限制了可用于逐实例数据的属性数量。
:::

## 分离属性格式（Separate Attribute Format）

::: info 版本信息
- 核心版本：自 OpenGL 4.3 起
- ARB 扩展：`ARB_vertex_attrib_binding`
:::

`glVertexAttribPointer` 将两个概念统一到一个函数中：属性数组的顶点格式和该数组的源数据。这些概念可以分离，允许用户分别指定顶点属性的格式和源缓冲区。

### 缓冲区绑定点

缓冲区绑定点聚合以下数据：
- 源缓冲区对象
- 所有从此绑定点拉取数据的顶点属性的基准字节偏移
- 所有从此绑定点拉取数据的顶点属性的字节步长
- 实例除数

设置缓冲区绑定点的函数：

```cpp
void glBindVertexBuffer(
    GLuint bindingindex,
    GLuint buffer,
    GLintptr offset,
    GLintptr stride
);

void glVertexBindingDivisor(GLuint bindingindex, GLuint divisor);
```

::: warning 步长限制
在 OpenGL 4.4 中，`stride` 不能超过 `GL_MAX_VERTEX_ATTRIB_STRIDE`（至少为 2048）。即使使用 OpenGL 4.3，也建议遵守此限制。
:::

### 顶点格式

设置顶点属性格式的函数：

```cpp
void glVertexAttribFormat(
    GLuint attribindex,
    GLint size,
    GLenum type,
    GLboolean normalized,
    GLuint relativeoffset
);

void glVertexAttribIFormat(
    GLuint attribindex,
    GLint size,
    GLenum type,
    GLuint relativeoffset
);

void glVertexAttribLFormat(
    GLuint attribindex,
    GLint size,
    GLenum type,
    GLuint relativeoffset
);
```

`relativeoffset` 是相对于缓冲区绑定的基准偏移的偏移量，其限制为 `GL_MAX_VERTEX_ATTRIB_RELATIVE_OFFSET`（至少为 2047 字节）。

### 关联属性与绑定点

```cpp
void glVertexAttribBinding(GLuint attribindex, GLuint bindingindex);
```

### 完整示例对比

使用传统 `glVertexAttribPointer` 方法：

```cpp
glBindVertexArray(vao);
glBindBuffer(GL_ARRAY_BUFFER, buff);
glEnableVertexAttribArray(0);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, position)));
glEnableVertexAttribArray(1);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, normal)));
glEnableVertexAttribArray(2);
glVertexAttribPointer(2, 4, GL_UNSIGNED_BYTE, GL_TRUE, sizeof(Vertex),
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, color)));
```

使用分离属性格式 API：

```cpp
glBindVertexArray(vao);
glBindVertexBuffer(0, buff, baseOffset, sizeof(Vertex));

glEnableVertexAttribArray(0);
glVertexAttribFormat(0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, position));
glVertexAttribBinding(0, 0);
glEnableVertexAttribArray(1);
glVertexAttribFormat(1, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, normal));
glVertexAttribBinding(1, 0);
glEnableVertexAttribArray(2);
glVertexAttribFormat(2, 4, GL_UNSIGNED_BYTE, GL_TRUE, offsetof(Vertex, color));
glVertexAttribBinding(2, 0);
```

使用 DSA（直接状态访问）：

```cpp
glVertexArrayVertexBuffer(vao, 0, buff, baseOffset, sizeof(Vertex));

glEnableVertexArrayAttrib(vao, 0);
glVertexArrayAttribFormat(vao, 0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, position));
glVertexArrayAttribBinding(vao, 0, 0);
glEnableVertexArrayAttrib(vao, 1);
glVertexArrayAttribFormat(vao, 1, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, normal));
glVertexArrayAttribBinding(vao, 1, 0);
glEnableVertexArrayAttrib(vao, 2);
glVertexArrayAttribFormat(vao, 2, 4, GL_UNSIGNED_BYTE, GL_TRUE, offsetof(Vertex, color));
glVertexArrayAttribBinding(vao, 2, 0);
```

### 多重用(重用, 重用, 重用, 重用, 重用(重用, color)));
glVertexArrayAttribBinding(vao, 2, 0);
```

### 多重绑定（Multibind）

::: info 版本信息
- 核心版本：自 OpenGL 4.4 起
- ARB 扩展：`ARB_multi_bind`
:::

```cpp
void glBindVertexBuffers(
    GLuint first,
    GLsizei count,
    const GLuint *buffers,
    const GLuintptr *offsets,
    const GLsizei *strides
);
```

此函数相当于对多个绑定索引调用 `glBindVertexBuffer`，可以快速切换多个缓冲区。

## 矩阵属性（Matrix Attributes）

GLSL 中的属性可以是矩阵类型。OpenGL 通过将矩阵 GLSL 属性转换为多个属性索引来解决这个问题。

矩阵占用的属性索引数取决于矩阵的列数：
- `mat2` 占用 2 个属性索引
- `mat2x4` 占用 2 个属性索引
- `mat4x2` 占用 4 个属性索引

每个绑定的属性填充一列，从最左边的列开始向右进行。例如，如果将 3x3 矩阵分配给属性索引 3，它将占用属性索引 3、4 和 5。

::: tip 双精度矩阵
双精度矩阵（如 `dmat3x3`）占用两倍的空间，即 6 个属性索引，每列占用两个。
:::

## 非数组属性值

顶点着色器可以读取当前未启用的属性。它获取的值由特殊的上下文状态定义，该状态不是 VAO 的一部分。

```cpp
void glVertexAttrib*(GLuint index, Type values);
void glVertexAttribN*(GLuint index, Type values);
void glVertexAttribP*(GLuint index, GLenum type, GLboolean normalized, Type values);
void glVertexAttribI*(GLuint index, Type values);
void glVertexAttribL*(GLuint index, Type values);
```

这些函数的初始值为浮点数 `(0.0, 0.0, 0.0, 1.0)`。

::: warning 重要
每次使用启用的数组发出绘制命令时，相应的上下文属性值会变为未定义。如果要在之前使用数组后使用非数组属性索引，需要重复将其重置为已知值。
:::

::: warning 性能建议
不建议使用非数组属性值。使用固定属性数据的性能特征未知，这不是 OpenGL 驱动程序开发人员优先优化的情况。
:::

## 绘制（Drawing）

一旦 VAO 正确设置，顶点数据数组就可以作为图元（Primitive）进行渲染。OpenGL 提供了多种渲染顶点数据的选项，详见 [顶点渲染](../pipeline/vertex-rendering)。

## 参考链接

- [Primitive（图元）](../pipeline/primitive)
- [Vertex Rendering（顶点渲染）](../pipeline/vertex-rendering)
