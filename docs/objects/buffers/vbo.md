# 顶点缓冲对象（Vertex Buffer Object, VBO）

顶点缓冲对象（VBO）是用于存储顶点数组数据的缓冲对象（Buffer Object）。它与任何其他缓冲对象没有本质区别——用于变换反馈（Transform Feedback）或异步像素传输的缓冲对象同样可以作为顶点数组的数据源。

## 基本概念

### 顶点流（Vertex Stream）

为了进行渲染，必须使用包含顶点着色器（Vertex Shader）的着色器程序。顶点着色器的用户定义输入变量定义了该着色器所需的顶点属性（Vertex Attributes）列表。对于着色器中的每个属性，都必须提供相应的数据数组。

顶点在流中的顺序非常重要，这个顺序定义了 OpenGL 如何处理和渲染生成的图元（Primitive）。有两种渲染方式：

1. **直接渲染**：按照数组顺序生成顶点流
2. **索引渲染**：使用索引列表定义顶点顺序

索引渲染允许重复使用同一顶点数据，这在紧密网格中特别有用，因为顶点通常会被多次使用。顶点属性数据通常约 32 字节，而索引通常只有 2-4 字节，因此这种数据压缩方式非常经济。

::: tip 索引渲染的限制
OpenGL（以及 Direct3D）只允许使用一个索引数组，所有属性数组都使用相同的索引。如果建模工具导出的数据有多个索引数组，必须将其转换为统一索引格式。
:::

## 顶点数组对象（Vertex Array Object, VAO）

VAO 是一种 OpenGL 对象，用于存储提供顶点数据所需的所有状态。它存储顶点数据的格式以及提供顶点数据数组的缓冲对象。

VAO 仅引用缓冲区，不会复制或冻结其内容——如果被引用的缓冲区后来被修改，这些更改在使用 VAO 时将会被看到。

### 创建和绑定

```cpp
GLuint vao;
glGenVertexArrays(1, &vao);
glBindVertexArray(vao);
```

或者使用 DSA（Direct State Access）：

```cpp
GLuint vao;
glCreateVertexArrays(1, &vao);
```

::: warning VAO 对象 0
兼容性配置文件使 VAO 对象 0 成为默认对象。核心配置文件使 VAO 对象 0 根本不是对象。因此在核心配置文件中绑定 VAO 0 后，不应调用任何修改 VAO 状态的函数。
:::

### 启用属性数组

顶点属性编号从 0 到 `GL_MAX_VERTEX_ATTRIBS` - 1。新创建的 VAO 所有属性的数组访问都被禁用。

```cpp
void glEnableVertexAttribArray(GLuint index);
void glDisableVertexAttribArray(GLuint index);
```

使用 DSA：

```cpp
void glEnableVertexArrayAttrib(GLuint vao, GLuint index);
void glDisableVertexArrayAttrib(GLuint vao, GLuint index);
```

## 设置顶点属性

有两种方式将缓冲对象用作顶点数据源。本节介绍传统的组合格式方法。

### 使用 glVertexAttribPointer

```cpp
void glVertexAttribPointer(GLuint index, GLint size, GLenum type, 
                           GLboolean normalized, GLsizei stride, 
                           const void *offset);

void glVertexAttribIPointer(GLuint index, GLint size, GLenum type, 
                            GLsizei stride, const void *offset);

void glVertexAttribLPointer(GLuint index, GLint size, GLenum type, 
                            GLsizei stride, const void *offset);
```

参数说明：
- `index`：属性索引
- `size`：分量数量（1-4）
- `type`：数据类型
- `normalized`：是否归一化（仅用于 `glVertexAttribPointer`）
- `stride`：步长（字节）
- `offset`：偏移量

::: tip 重要：GL_ARRAY_BUFFER 与 VAO 的关系
`glBindBuffer(GL_ARRAY_BUFFER, ...)` 调用本身**不修改**当前 VAO 的状态。属性与缓冲区的关联是在调用 `glVertexAttribPointer` 时建立的。调用之后更改 `GL_ARRAY_BUFFER` 绑定不会影响已设置的属性。
:::

示例：

```cpp
glBindBuffer(GL_ARRAY_BUFFER, buf1);
glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
glBindBuffer(GL_ARRAY_BUFFER, 0);  // 这不会影响属性 0 与 buf1 的关联
```

## 顶点格式

### 数据类型

**glVertexAttribPointer 支持的类型：**

浮点类型（`normalized` 必须为 `GL_FALSE`）：
- `GL_HALF_FLOAT`：16 位半精度浮点
- `GL_FLOAT`：32 位单精度浮点
- `GL_DOUBLE`：64 位双精度浮点（不推荐使用，通常是性能陷阱）
- `GL_FIXED`：16.16 位定点数

整数类型（可自动转换为浮点）：
- `GL_BYTE`、`GL_UNSIGNED_BYTE`
- `GL_SHORT`、`GL_UNSIGNED_SHORT`
- `GL_INT`、`GL_UNSIGNED_INT`
- `GL_INT_2_10_10_10_REV`：打包的 4 值格式
- `GL_UNSIGNED_INT_2_10_10_10_REV`：打包的 4 值格式
- `GL_UNSIGNED_INT_10F_11F_11F_REV`：打包的 3 浮点格式（需要 OpenGL 4.4）

**glVertexAttribIPointer 支持的类型：**
- `GL_BYTE`、`GL_UNSIGNED_BYTE`
- `GL_SHORT`、`GL_UNSIGNED_SHORT`
- `GL_INT`、`GL_UNSIGNED_INT`

**glVertexAttribLPointer 支持的类型：**
- `GL_DOUBLE`

### 分量大小

`size` 参数定义属性向量中的分量数量（1-4）。如果着色器中的分量数少于属性提供的，额外的分量将被忽略；如果着色器中的分量数多于属性提供的，缺少的分量将填充 (0, 0, 0, 1)。

::: warning 双精度属性
对于双精度输入，如果着色器属性的分量数多于提供的值，额外分量的值将是未定义的。
:::

## 偏移量和步长

`offset` 定义缓冲对象中第一个元素的字节偏移。由于历史原因，它是 `const void*` 类型，需要进行类型转换：

```cpp
// C 风格
(void*)(byteOffset)

// C++ 风格
reinterpret_cast<void*>(byteOffset)
```

`stride` 定义从一个顶点开始到下一个顶点开始的字节数。如果设为 0，OpenGL 会根据 `size` 和 `type` 自动计算紧密打包的步长。

### 交错属性（Interleaved Attributes）

交错属性是将不同属性存储在同一个结构体中的方式：

```cpp
struct Vertex
{
    GLfloat position[3];
    GLfloat normal[3];
    GLubyte color[4];
};

Vertex vertices[VERTEX_COUNT];
```

设置交错属性：

```cpp
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), 
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, position)));
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), 
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, normal)));
glVertexAttribPointer(2, 4, GL_UNSIGNED_BYTE, GL_TRUE, sizeof(Vertex), 
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, color)));
```

::: tip 最佳实践
尽可能使用交错属性。如果某些属性需要改变而其他不需要，则将常量属性和变化属性分开交错。
:::

## 索引缓冲区

索引渲染需要一个索引数组，所有顶点属性都使用相同的索引。索引数组由绑定到 `GL_ELEMENT_ARRAY_BUFFER` 绑定点的缓冲对象提供。

```cpp
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elementBuffer);
```

::: info
索引缓冲区绑定存储在 VAO 内部。如果没有绑定 VAO，则无法将缓冲对象绑定到 `GL_ELEMENT_ARRAY_BUFFER`。
:::

索引可以是 `GL_UNSIGNED_BYTE`、`GL_UNSIGNED_SHORT` 或 `GL_UNSIGNED_INT` 类型。

## 实例化数组

在实例化渲染（Instanced Rendering）中，可以让属性数组按实例计数索引，而不是按顶点索引：

```cpp
void glVertexAttribDivisor(GLuint index, GLuint divisor);
```

如果 `divisor` 为 0，属性行为正常。如果 `divisor` 非 0，当前实例数除以该值的结果用于访问属性数组。

::: tip 效率
这通常被认为是将逐实例数据传递给顶点着色器最有效的方式，但受到顶点属性数量限制。
:::

## 分离属性格式（OpenGL 4.3+）

分离属性格式 API 将顶点格式和缓冲区绑定分开，使代码更清晰、更灵活。

### 缓冲区绑定

```cpp
void glBindVertexBuffer(GLuint bindingindex, GLuint buffer, 
                        GLintptr offset, GLintptr stride);

void glVertexBindingDivisor(GLuint bindingindex, GLuint divisor);
```

### 属性格式

```cpp
void glVertexAttribFormat(GLuint attribindex, GLint size, GLenum type, 
                          GLboolean normalized, GLuint relativeoffset);

void glVertexAttribIFormat(GLuint attribindex, GLint size, GLenum type, 
                           GLuint relativeoffset);

void glVertexAttribLFormat(GLuint attribindex, GLint size, GLenum type, 
                           GLuint relativeoffset);

void glVertexAttribBinding(GLuint attribindex, GLuint bindingindex);
```

### 示例对比

传统方式：

```cpp
glBindVertexArray(vao);
glBindBuffer(GL_ARRAY_BUFFER, buff);
glEnableVertexAttribArray(0);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), 
    reinterpret_cast<void*>(baseOffset + offsetof(Vertex, position)));
// ... 更多属性
```

分离格式方式：

```cpp
glBindVertexArray(vao);
glBindVertexBuffer(0, buff, baseOffset, sizeof(Vertex));

glEnableVertexAttribArray(0);
glVertexAttribFormat(0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, position));
glVertexAttribBinding(0, 0);
// ... 更多属性
```

使用 DSA：

```cpp
glVertexArrayVertexBuffer(vao, 0, buff, baseOffset, sizeof(Vertex));

glEnableVertexArrayAttrib(vao, 0);
glVertexArrayAttribFormat(vao, 0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, position));
glVertexArrayAttribBinding(vao, 0, 0);
// ... 更多属性
```

::: warning 步长限制
`relativeoffset` 的限制通过 `GL_MAX_VERTEX_ATTRIB_RELATIVE_OFFSET` 查询，保证至少为 2047 字节。`stride` 在 OpenGL 4.4 中不能超过 `GL_MAX_VERTEX_ATTRIB_STRIDE`（至少 2048）。
:::

## 矩阵属性

GLSL 中的矩阵属性会占用多个属性索引。矩阵占用的属性数量等于其列数：

- `mat2` 占用 2 个属性索引
- `mat3` 占用 3 个属性索引
- `mat4` 占用 4 个属性索引
- `mat2x4` 占用 2 个属性索引
- `mat4x2` 占用 4 个属性索引

每个绑定的属性填充一列，从最左边开始。例如，3x3 矩阵绑定到属性索引 3，它将使用索引 3、4、5。

双精度矩阵占用两倍空间：`dmat3x3` 将占用 6 个属性索引。

## 非数组属性值

如果属性未启用，顶点着色器读取的值由上下文状态定义（不是 VAO 的一部分）。初始值为 `(0.0, 0.0, 0.0, 1.0)`。

```cpp
void glVertexAttrib*(GLuint index, Type values);
void glVertexAttribN*(GLuint index, Type values);
void glVertexAttribI*(GLuint index, Type values);
void glVertexAttribL*(GLuint index, Type values);
```

::: warning 使用注意
每次使用数组启用进行绘制命令后，相应的上下文属性值变为未定义。这些非数组属性值不属于 VAO 状态。不建议使用此功能，其性能特征未知。
:::
