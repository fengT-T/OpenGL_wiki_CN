# 接口块 (Interface Blocks)

接口块（Interface Block）是一组 GLSL 输入、输出、uniform 或存储缓冲区变量。这些块具有特殊的语法和语义。

## 语法

接口块的语法定义如下：

```glsl
storage_qualifier block_name
{
  <成员定义>
} instance_name;
```

这看起来像结构体定义，但它**不是**结构体。

### 存储限定符

`storage_qualifier` 可以是以下存储限定符之一：

| 限定符 | 说明 |
|--------|------|
| `uniform` | Uniform 块 |
| `in` / `out` | 输入/输出块（需要 OpenGL 3.2） |
| `buffer` | 着色器存储块（需要 OpenGL 4.3 或 ARB_shader_storage_buffer_object） |

### 块名称和实例名称

**`block_name`** 是接口块的真实名称。在 OpenGL 代码中引用或在大多数上下文中讨论时，使用此名称。着色器不能有多个具有相同块名称和相同存储限定符的块。

**`instance_name`** 是块的 GLSL 实例名称，是可选的。如果存在，则在 GLSL 代码中引用时必须用实例名称限定：

```glsl
uniform MatrixBlock
{
  mat4 projection;
  mat4 modelview;
} matrices;

// 访问：matrices.projection
```

如果没有实例名称：

```glsl
uniform MatrixBlock
{
  mat4 projection;
  mat4 modelview;
};

// 访问：projection
```

::: info
在 GLSL 中**永远**不能使用 `MatrixBlock.projection`（尽管这是 OpenGL 代码内省时显示的名称）。
:::

实例名称可用于定义块数组：

```glsl
uniform MatrixBlock
{
  mat4 projection;
  mat4 modelview;
} matrices[3]; // 3 个独立的接口块
```

::: info
实例名称仅由 GLSL 使用。OpenGL 始终使用实际的块名称。因此，上述块的名称是 "MatrixBlock[1]"，其成员名称是 "MatrixBlock.projection" 等。
:::

### 有效类型

接口块不能包含不透明类型。它们也不能包含嵌套结构体定义，但块成员可以包含结构体成员。

### 限定符

接口块成员可以有关联的类型限定符，包括布局限定符：

```glsl
in BlockName
{
  flat ivec3 someInts; // flat 插值
  vec4 value;          // 默认 smooth 插值
};
```

### 接口匹配

两个块要匹配，必须满足：

- 相同的块名称（不是实例名称）
- 相同的块限定符（包括布局限定符）
- 定义完全相同的变量（类型/数组计数和名称）
- 相同的顺序
- 相同的变量限定符
- 都有或都没有实例名称
- 相同的块数组计数

匹配的块在不同着色器阶段链接到同一程序时，将作为单个接口块呈现。

## 输入和输出

输入和输出块旨在互补使用。它们主要用于几何或细分着色器，因为这些着色器通常处理输入/输出值的聚合。

::: warning
顶点着色器不能声明输入接口块，片元着色器不能声明输出接口块。
:::

示例——顶点着色器到几何着色器：

```glsl
// 顶点着色器
out VertexData
{
  vec3 color;
  vec2 texCoord;
} outData;

// 几何着色器
in VertexData
{
  vec3 color;
  vec2 texCoord;
} inData[];
```

注意几何着色器中的块定义为数组，且使用了不同的实例名称。

::: info
输入/输出接口块不使用 `location` 名称进行接口匹配。在可分离程序中，接口必须通过名称直接匹配。
:::

## 缓冲区支持

Uniform 块和着色器存储块的工作方式非常相似，统称为"缓冲区支持的块"（buffer-backed blocks），因为它们的存储内容来自缓冲区对象。

### 矩阵存储顺序

由于这些块的存储来自缓冲区对象，矩阵顺序变得重要。矩阵可以按列主序或行主序存储。

::: info
这**不会**改变 GLSL 如何使用它们。GLSL 矩阵**始终**是列主序的。此规范仅改变 GLSL 如何从缓冲区获取数据。
:::

可以设置默认值：

```glsl
layout(row_major) uniform; // 从此点起，uniform 块中的所有矩阵都是行主序
```

特定块可以设置默认值：

```glsl
layout(row_major) uniform MatrixBlock
{
  mat4 projection;
  mat4 modelview;
} matrices[3];
```

单个变量也可以调整：

```glsl
layout(row_major) uniform MatrixBlock
{
  mat4 projection;
  layout(column_major) mat4 modelview; // 覆盖为列主序
} matrices[3];
```

### 内存布局

有四种内存布局限定符：`shared`、`packed`、`std140` 和 `std430`。默认为 `shared`。

#### packed

实现决定块中字段如何布局。必须使用 OpenGL API 查询特定块成员的布局。块的成员可能被优化掉（如果实现发现它们不影响着色器结果）。

#### shared

类似于 `packed`，但有两个例外：

1. 保证块中定义的所有变量都被视为活动的，没有任何优化
2. 保证成员与另一个程序中的块定义具有相同的布局（只要定义完全相同的成员、顺序、限定符）

这允许用户在多个程序之间**共享**缓冲区。

#### std140

此布局明确规定了任何接口块的布局规则，无需查询偏移量。缺点是数组/结构体的打包规则可能引入大量不必要的填充。

::: warning
`std140` 中数组元素的步长（数组元素之间的字节数）始终向上舍入到 `vec4` 的大小（16 字节）。
:::

::: warning
实现对 `vec3` 组件的 `std140` 布局有时会出错。建议手动填充结构体/数组，避免使用 `vec3`。
:::

#### std430

类似于 `std140`，但优化了标量和向量元素（`vec3` 除外）的对齐和步长，不再向上舍入到 16 字节的倍数。

::: warning
此布局只能用于着色器存储块，不能用于 uniform 块。
:::

### 布局查询

对于 `packed` 和 `shared` 布局，必须使用程序内省（Program Introspection）确定布局的具体信息：

| 属性 | 说明 |
|------|------|
| `GL_OFFSET` | 变量相对于块开头的字节偏移 |
| `GL_ARRAY_SIZE` | 数组中的元素数量 |
| `GL_ARRAY_STRIDE` | 数组步长（从一个元素开始到下一个元素开始的字节数） |
| `GL_MATRIX_STRIDE` | 矩阵列/行向量之间的字节数 |
| `GL_IS_ROW_MAJOR` | 是否为行主序 |

### 显式变量布局

OpenGL 4.4 或 ARB_enhanced_layouts 起，可以显式指定块成员的布局：

```glsl
layout(std140) uniform MyBlock
{
  layout(offset = 32) vec4 first;   // 显式偏移
  layout(align = 16) vec4 second;   // 显式对齐
};
```

::: warning
- 对齐必须是 2 的幂且大于 0
- 这些限定符只能用于块的直接成员，不能用于结构体成员
- 不能违反默认布局要求
- 不能使成员相互重叠
:::

### 块缓冲区绑定

缓冲区支持的接口块从缓冲区对象获取数据。关联方式如下：

对于每种缓冲区支持的接口块类型，OpenGL 上下文有一个索引的缓冲区对象绑定目标：

| 块类型 | 目标 |
|--------|------|
| Uniform 块 | `GL_UNIFORM_BUFFER` |
| 着色器存储块 | `GL_SHADER_STORAGE_BUFFER` |

#### 从 OpenGL 设置绑定索引

1. 使用程序内省获取接口块的**块索引**：

```glsl
GLuint glGetProgramResourceIndex(GLuint program, GL_SHADER_STORAGE_BLOCK, const char *name);
GLuint glGetUniformBlockIndex(GLuint program, const char *name);
```

2. 设置块的绑定索引：

```glsl
void glUniformBlockBinding(GLuint program, GLuint uniformBlockIndex, GLuint uniformBlockBinding);
void glShaderStorageBlockBinding(GLuint program, GLuint storageBlockIndex, GLuint storageBlockBinding);
```

#### 从着色器设置绑定索引

```glsl
layout(binding = 3) uniform MatrixBlock
{
  mat4 projection;
  mat4 modelview;
};
```

对于块数组，绑定语法按顺序分配索引：

```glsl
layout(binding = 2) uniform MatrixBlock
{
  mat4 projection;
  mat4 modelview;
} matrices[4]; // 使用绑定索引 2, 3, 4, 5
```

## Uniform 块

Uniform 块不能使用 `std430` 布局。

OpenGL 4.3 起，如果 uniform 块使用实例名称，则链接程序中对该 uniform 块名称的所有引用也必须使用实例名称（不必是相同的实例名称）。

## 着色器存储块

如果着色器存储块的最后一个成员变量声明为不确定数组长度（使用 `[]`），则此数组的大小在着色器执行时确定：

```glsl
layout(std430, binding = 2) buffer MyBuffer
{
  mat4 matrix;
  float lotsOfFloats[];
};
```

`lotsOfFloats` 中的浮点变量数量取决于绑定到绑定点的缓冲区范围的大小。`matrix` 占用 64 字节，所以元素数量为 (缓冲区大小 - 64) / 4。

```glsl
glBindBufferRange(GL_SHADER_STORAGE_BUFFER, 2, buffer, 0, 128);
// lotsOfFloats.length() 返回 16
```

::: info
通常，GLSL 中的 `length` 是常量表达式。但在这种特定情况下，它是动态一致表达式。
:::
