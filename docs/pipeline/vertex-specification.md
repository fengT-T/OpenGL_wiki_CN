# 顶点规格 (Vertex Specification)

顶点规格是为特定着色器程序设置渲染所需对象的过程，以及使用这些对象进行渲染的过程。

## 理论基础

### 顶点流 (Vertex Stream)

要执行渲染，必须使用包含顶点着色器 (Vertex Shader) 的着色器程序或程序管线。顶点着色器的用户定义输入变量定义了该着色器期望的顶点属性 (Vertex Attributes) 列表，每个属性映射到每个用户定义输入变量。这组属性定义了顶点流必须提供的值，以便正确地使用该着色器进行渲染。

对于着色器中的每个属性，必须为该属性提供一个数据数组。所有这些数组必须具有相同数量的元素。顶点流中顶点的顺序非常重要，该顺序定义了 OpenGL 如何处理和渲染流生成的图元 (Primitives)。

有两种使用顶点数组进行渲染的方式：可以按数组顺序生成流，或使用索引列表定义顺序。索引控制接收顶点的顺序，索引可以多次指定同一数组元素。

例如，假设有以下包含 3 个顶点的 3D 位置数据数组：

```cpp
{ {1, 1, 1}, {0, 0, 0}, {0, 0, 1} }
```

如果直接使用该数组作为流，OpenGL 将按顺序（从左到右）接收和处理这三个顶点。如果使用索引列表 `{2, 1, 0, 2, 1, 2}`，OpenGL 将接收以下顶点流：

```cpp
{ {0, 0, 1}, {0, 0, 0}, {1, 1, 1}, {0, 0, 1}, {0, 0, 0}, {0, 0, 1} }
```

索引列表是一种重新排序顶点属性数组数据而无需实际更改它的方法。这主要用作数据压缩的手段——在大多数紧凑网格中，顶点会被多次使用。能够只存储一次顶点的属性数据非常经济，因为顶点的属性数据通常约为 32 字节，而索引通常只有 2-4 字节。

::: warning 注意
许多创作工具会为每个属性数组提供单独的索引数组，以使每个属性的数组更小。但 OpenGL（和 Direct3D）**不允许这样做**。只能使用一个索引数组，每个属性数组都使用相同的索引。如果网格数据有多个索引数组，必须将创作工具导出的格式转换为上述格式。
:::

### 图元 (Primitives)

顶点流本身不足以绘制任何内容，还必须告诉 OpenGL 如何解释该流，即告诉 OpenGL 将流解释为何种图元类型。

对于 12 个顶点的流，OpenGL 可以将其解释为三角形序列、点或线。例如，可以将 12 个顶点解释为 4 个独立三角形（每 3 个顶点组成一个三角形），或 10 个依赖三角形（流中每 3 个连续顶点组成一个三角形）等。

## 顶点数组对象 (Vertex Array Object)

::: info 版本信息
- 核心版本：3.0
- 核心扩展：`ARB_vertex_array_object`
:::

顶点数组对象 (VAO) 是一种 OpenGL 对象，它存储提供顶点数据所需的所有状态（除了下面提到的一个小例外）。它存储顶点数据的格式以及提供顶点数据数组的缓冲区对象 (Buffer Objects)。VAO 仅引用缓冲区，不会复制或冻结其内容；如果被引用的缓冲区稍后被修改，这些更改将在使用 VAO 时被看到。

作为 OpenGL 对象，VAO 具有常规的创建、销毁和绑定函数：

- `glGenVertexArrays`
- `glCreateVertexArrays`
- `glDeleteVertexArrays`
- `glBindVertexArray`

`glBindVertexArray` 与其他绑定函数不同，没有"target"参数；VAO 只有一个目标。

::: warning 注意
VAO 不能在 OpenGL 上下文之间共享。
:::

顶点属性的编号从 0 到 `GL_MAX_VERTEX_ATTRIBS` - 1。每个属性可以启用或禁用数组访问。当属性的数组访问被禁用时，顶点着色器读取该属性将产生常量值，而不是从数组中提取的值。

新创建的 VAO 对所有属性禁用数组访问。通过绑定 VAO 并调用以下函数来启用或禁用数组访问：

```cpp
void glEnableVertexAttribArray(GLuint index);
void glDisableVertexAttribArray(GLuint index);
```

使用直接状态访问 (DSA) 时，可以不绑定 VAO 直接启用或禁用属性数组：

```cpp
void glEnableVertexArrayAttrib(GLuint vao, GLuint index);
void glDisableVertexArrayAttrib(GLuint vao, GLuint index);
```

::: warning 兼容性说明
兼容性 OpenGL 配置文件将 VAO 对象 0 作为默认对象。核心 OpenGL 配置文件将 VAO 对象 0 视为根本不是对象。因此，如果在核心配置文件中绑定了 VAO 0，**不应调用任何修改 VAO 状态的函数**，包括使用 `glBindBuffer` 绑定 `GL_ELEMENT_ARRAY_BUFFER`。
:::

## 顶点缓冲区对象 (Vertex Buffer Object)

顶点缓冲区对象 (VBO) 是普通缓冲区对象用作顶点数组数据源时的常用术语。它与任何其他缓冲区对象没有区别，用于变换反馈 (Transform Feedback) 或异步像素传输的缓冲区对象也可以用作顶点数组的源值。

有两种方法将缓冲区对象用作顶点数据的源。本节描述组合格式方法，分离方法在后面介绍。

属性数组的格式和源缓冲区可以这样设置：首先，将属性数据来源的缓冲区绑定到 `GL_ARRAY_BUFFER`。

::: warning 注意
调用 `glBindBuffer` 设置 `GL_ARRAY_BUFFER` 绑定**不会**修改当前 VAO 的状态！
:::

绑定缓冲区后，调用以下函数之一：

```cpp
void glVertexAttribPointer(GLuint index, GLint size, GLenum type, 
                           GLboolean normalized, GLsizei stride, 
                           const void *offset);
void glVertexAttribIPointer(GLuint index, GLint size, GLenum type, 
                            GLsizei stride, const void *offset);
void glVertexAttribLPointer(GLuint index, GLint size, GLenum type, 
                            GLsizei stride, const void *offset);
```

这些函数设置属性索引 `index` 的格式和缓冲区存储信息。这些函数表明属性索引 `index` 将从当前绑定到 `GL_ARRAY_BUFFER` 的缓冲区对象获取其属性数据。**必须理解**这种关联是在调用此函数时建立的。

示例：

```cpp
glBindBuffer(GL_ARRAY_BUFFER, buf1);
glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
glBindBuffer(GL_ARRAY_BUFFER, 0);
```

第一行将 `buf1` 绑定到 `GL_ARRAY_BUFFER`。第二行表示属性索引 0 从 `buf1` 获取顶点数组数据。第三行将缓冲区对象 0 绑定到 `GL_ARRAY_BUFFER`。这对属性 0 和 `buf1` 之间的关联**没有任何影响**！只有调用 `glVertexAttribPointer` 才能改变这种关联。

::: warning 注意
如果当前绑定到 `GL_ARRAY_BUFFER` 的是 0，调用 `glVertexAttribPointer` 函数是错误的。
:::

## 顶点格式 (Vertex Format)

`glVertexAttribPointer` 函数定义属性索引从何处获取数组数据，以及 OpenGL 应如何解释该数据。

顶点着色器中的顶点属性可以声明为浮点 GLSL 类型（如 `float` 或 `vec4`）、整数类型（如 `uint` 或 `ivec3`）或双精度类型（如 `double` 或 `dvec4`）。双精度属性仅在 OpenGL 4.1 或 `ARB_vertex_attrib_64bit` 扩展中可用。

顶点着色器中使用的属性的一般类型必须与属性数组提供的一般类型匹配：
- 浮点属性：使用 `glVertexAttribPointer`
- 整数属性（有符号和无符号）：使用 `glVertexAttribIPointer`
- 双精度属性：使用 `glVertexAttribLPointer`

每个属性索引表示一个向量，长度为 1 到 4 个分量。`size` 参数定义属性数组提供的向量中的分量数量，可以是 1-4。如果顶点着色器的分量少于属性提供的，则多余的分量被忽略。如果顶点着色器的分量多于数组提供的，则缺失的 XYZW 分量被赋予向量 (0, 0, 0, 1) 的值。

### 分量类型 (Component Type)

向量分量的类型由 `type` 和 `normalized` 参数给出。

**`glVertexAttribPointer` 支持的类型：**

浮点类型（`normalized` 必须为 `GL_FALSE`）：
- `GL_HALF_FLOAT`：16 位半精度浮点值
- `GL_FLOAT`：32 位单精度浮点值
- `GL_DOUBLE`：64 位双精度浮点值（性能陷阱，不推荐使用）
- `GL_FIXED`：16.16 位定点二进制补码值

整数类型（自动转换为浮点）：
- `GL_BYTE`、`GL_UNSIGNED_BYTE`：8 位整数
- `GL_SHORT`、`GL_UNSIGNED_SHORT`：16 位整数
- `GL_INT`、`GL_UNSIGNED_INT`：32 位整数
- `GL_INT_2_10_10_10_REV`、`GL_UNSIGNED_INT_2_10_10_10_REV`：打包在 32 位无符号整数中的四个值

如果 `normalized` 为 `GL_TRUE`，整数值将通过整数归一化转换为浮点（例如无符号字节值 255 变为 1.0f）。

**`glVertexAttribIPointer` 支持的类型：**
仅用于整数属性：`GL_BYTE`、`GL_UNSIGNED_BYTE`、`GL_SHORT`、`GL_UNSIGNED_SHORT`、`GL_INT`、`GL_UNSIGNED_INT`

**`glVertexAttribLPointer` 支持的类型：**
仅用于双精度属性：`GL_DOUBLE`

### D3D 兼容性

使用 `glVertexAttribPointer` 时，`size` 字段可以是 1-4 的数字，也可以是 `GL_BGRA`。这相当于大小为 4，但反转前三个分量的顺序。此特殊模式仅用于与某些 Direct3D 顶点格式兼容，需要满足：
- `type` 必须是 `GL_UNSIGNED_BYTE`、`GL_INT_2_10_10_10_REV` 或 `GL_UNSIGNED_INT_2_10_10_10_REV`
- `normalized` 必须为 `GL_TRUE`

## 顶点缓冲区偏移和步长

OpenGL 需要两个额外信息才能找到数据：从缓冲区对象开始到数组第一个元素的字节偏移，以及从一个元素开始到下一个元素开始的字节数（步长）。

`offset` 参数定义缓冲区对象偏移，类型为 `const void *`，需要将整数偏移转换为指针：`(void*)(byteOffset)` 或 `reinterpret_cast<void*>(byteOffset)`。

如果 `stride` 设置为 0，OpenGL 将假设顶点数据紧密打包，并根据其他组件计算步长。

### 交错属性 (Interleaved Attributes)

`stride` 参数的主要目的是允许不同属性之间的交错。这对应于以下两种 C++ 定义的差异：

```cpp
struct StructOfArrays
{
  GLfloat positions[VERTEX_COUNT * 3];
  GLfloat normals[VERTEX_COUNT * 3];
  GLubyte colors[VERTEX_COUNT * 4];
};

struct Vertex
{
  GLfloat position[3];
  GLfloat normal[3];
  Glubyte color[4];
};
```

对于交错数据，使用相同的步长（结构体大小）：

```cpp
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), 
                      reinterpret_cast<void*>(baseOffset + offsetof(Vertex, position)));
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), 
                      reinterpret_cast<void*>(baseOffset + offsetof(Vertex, normal)));
glVertexAttribPointer(2, 4, GL_UNSIGNED_BYTE, GL_TRUE, sizeof(Vertex), 
                      reinterpret_cast<void*>(baseOffset + offsetof(Vertex, color)));
```

::: tip 建议
应尽可能使用交错属性。如果需要更改某些属性而不更改其他属性，则不应将常量属性与变化属性交错。
:::

## 索引缓冲区

索引渲染需要一个索引数组，所有顶点属性使用该索引数组中的相同索引。索引数组由绑定到 `GL_ELEMENT_ARRAY_BUFFER` 绑定点的缓冲区对象提供。索引可以是无符号字节、无符号短整数或无符号整数。

索引缓冲区绑定存储在 VAO 中。

## 实例化数组

::: info 版本信息
- 核心版本：3.3
- 核心扩展：`ARB_instanced_arrays`
:::

在实例渲染中，可以让属性数组按实例计数索引，而不是按索引缓冲区或直接数组访问：

```cpp
void glVertexAttribDivisor(GLuint index, GLuint divisor);
```

如果 `divisor` 为零，属性按正常方式索引。如果 `divisor` 非零，则当前实例除以该除数，结果用于访问属性数组。

## 分离属性格式

::: info 版本信息
- 核心版本：4.3
- 核心扩展：`ARB_vertex_attrib_binding`
:::

`glVertexAttribPointer` 将两个概念统一到一个函数中：属性数组的顶点格式和该数组的源数据。这些概念可以分离，允许用户分别指定顶点属性的格式和源缓冲区。

缓冲区绑定点聚合以下数据：
- 源缓冲区对象
- 缓冲区对象中所有顶点属性的基本字节偏移
- 所有顶点属性的字节步长
- 实例除数

顶点格式包括：
- 启用/禁用的属性
- 顶点属性数据的大小、类型和归一化
- 关联的缓冲区绑定点
- 从关联缓冲区绑定点的基本偏移到顶点数据开始的字节偏移

设置缓冲区绑定点数据的函数：

```cpp
void glBindVertexBuffer(GLuint bindingindex, GLuint buffer, 
                        GLintptr offset, GLintptr stride);
void glVertexBindingDivisor(GLuint bindingindex, GLuint divisor);
```

设置顶点属性格式的函数：

```cpp
void glVertexAttribFormat(GLuint attribindex, GLint size, GLenum type, 
                          GLboolean normalized, GLuint relativeoffset);
void glVertexAttribIFormat(GLuint attribindex, GLint size, GLenum type, 
                           GLuint relativeoffset);
void glVertexAttribLFormat(GLuint attribindex, GLint size, GLenum type, 
                           GLuint relativeoffset);
```

将顶点属性与缓冲区绑定关联：

```cpp
void glVertexAttribBinding(GLuint attribindex, GLuint bindingindex);
```

使用分离属性格式 API 的示例：

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

使用直接状态访问 (DSA)：

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

## 矩阵属性

GLSL 中的属性可以是矩阵类型。OpenGL 通过将矩阵 GLSL 属性转换为多个属性索引来解决此问题。

如果直接将属性索引分配给矩阵类型，它隐式占用多个属性索引。矩阵占用的属性数量取决于矩阵的列数：`mat2` 占用 2 个，`mat2x4` 占用 2 个，`mat4x2` 占用 4 个。每个属性的大小是矩阵的行数。

VAO 中每个绑定的属性填充一列，从最左边的列开始，向右进行。例如，如果将 3x3 矩阵分配给属性索引 3，它将占用属性索引 3、4 和 5，每个索引大小为 3 个元素。

## 非数组属性值

顶点着色器可以读取当前未启用的属性。它获得的值由特殊的上下文状态定义，该状态不是 VAO 的一部分。

由于属性由上下文状态定义，它在单个绘制调用期间是常量。每个属性索引都有单独的值。

::: warning 警告
每次使用启用的数组发出绘制命令时，相应的上下文属性值变为未定义。如果要使用非数组属性索引，需要重复将其重置为已知值。
:::

初始值为浮点 `(0.0, 0.0, 0.0, 1.0)`。更改值的函数形式：

```cpp
void glVertexAttrib*(GLuint index, Type values);
void glVertexAttribN*(GLuint index, Type values);
void glVertexAttribP*(GLuint index, GLenum type, GLboolean normalized, Type values);
void glVertexAttribI*(GLuint index, Type values);
void glVertexAttribL*(GLuint index, Type values);
```

::: tip 注意
不建议使用非数组属性值。其性能特征未知，不是 OpenGL 驱动程序开发人员优化的高优先级情况。
:::

## 绘制

一旦 VAO 正确设置，顶点数据数组就可以作为图元渲染。OpenGL 提供了多种渲染顶点数据的选项。

## 参见

- [图元 (Primitive)](/pipeline/primitive)
- [顶点渲染 (Vertex Rendering)](/pipeline/vertex-rendering)
- [顶点属性 (Vertex Attribute)](/pipeline/vertex-attribute)