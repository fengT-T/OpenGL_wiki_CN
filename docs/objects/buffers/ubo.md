# 统一缓冲对象（Uniform Buffer Object, UBO）

统一缓冲对象（UBO）是用于存储着色器程序统一变量（Uniform）数据的缓冲对象。它可以在不同程序之间共享统一变量，也可以快速切换同一程序对象的不同统一变量集。

::: info 术语区分
"Uniform Buffer Object" 指 OpenGL 缓冲对象本身；"Uniform Block"（统一块）指 GLSL 中存储来自缓冲对象的统一变量分组。
:::

## 用途

统一缓冲对象有以下几个主要用途：

1. **快速切换**：切换统一缓冲绑定通常比切换程序中数十个统一变量更快，可以快速切换共享同一程序的不同对象的统一数据集

2. **更大容量**：统一缓冲对象通常可以存储比非缓冲统一变量更多的数据

3. **跨程序共享**：修改单个缓冲区可以有效更新多个程序中的统一变量

## 着色器规范

统一块（Uniform Block）是缓冲支持接口块（Buffer-backed Interface Block）的一种特殊形式。在 GLSL 中声明统一块：

```glsl
layout(std140) uniform MyBlock {
    vec4 data;
    mat4 transform;
    float values[16];
};
```

## OpenGL 使用

### 获取统一块索引

```cpp
GLuint glGetUniformBlockIndex(GLuint program, const char *uniformBlockName);
```

如果块名未找到，返回 `GL_INVALID_INDEX`。

### 绑定统一块到绑定点

```cpp
void glUniformBlockBinding(GLuint program, GLuint uniformBlockIndex, 
                           GLuint uniformBlockBinding);
```

这会将程序中的 `uniformBlockIndex` 绑定到统一缓冲绑定位置 `uniformBlockBinding`。

### 绑定缓冲对象

使用 `glBindBufferRange` 或 `glBindBufferBase` 将统一缓冲对象绑定到相应绑定点：

```cpp
// 绑定整个缓冲区
glBindBufferBase(GL_UNIFORM_BUFFER, bindingIndex, buffer);

// 绑定缓冲区的一部分
glBindBufferRange(GL_UNIFORM_BUFFER, bindingIndex, buffer, offset, size);
```

### 完整示例

```cpp
// 着色器中：
// layout(std140, binding = 0) uniform Matrices {
//     mat4 projection;
//     mat4 view;
// };

// C++ 代码
GLuint ubo;
glGenBuffers(1, &ubo);
glBindBuffer(GL_UNIFORM_BUFFER, ubo);
glBufferData(GL_UNIFORM_BUFFER, sizeof(matrices), matrices, GL_STATIC_DRAW);
glBindBufferBase(GL_UNIFORM_BUFFER, 0, ubo);
```

## 布局查询

如果未使用 `std140` 布局，需要查询块中每个统一变量的字节偏移。OpenGL 规范解释了基本类型的存储方式，但类型之间的对齐需要查询。

可以通过传统的统一变量内省 API 或较新的程序接口查询 API 获取：

```cpp
// 获取统一变量偏移
GLint offset;
glGetActiveUniformsiv(program, 1, &uniformIndex, GL_UNIFORM_OFFSET, &offset);

// 获取数组步长
GLint stride;
glGetActiveUniformsiv(program, 1, &uniformIndex, GL_UNIFORM_ARRAY_STRIDE, &stride);
```

## 限制

### 绑定点数量限制

每个着色器阶段对统一缓冲绑定位置数量有限制：

```cpp
GLint maxVertexBlocks, maxGeometryBlocks, maxFragmentBlocks;
glGetIntegerv(GL_MAX_VERTEX_UNIFORM_BLOCKS, &maxVertexBlocks);
glGetIntegerv(GL_MAX_GEOMETRY_UNIFORM_BLOCKS, &maxGeometryBlocks);
glGetIntegerv(GL_MAX_FRAGMENT_UNIFORM_BLOCKS, &maxFragmentBlocks);
```

总绑定位置数量通过 `GL_MAX_UNIFORM_BUFFER_BINDINGS` 查询。

### 大小限制

每个统一缓冲的最大存储空间通过 `GL_MAX_UNIFORM_BLOCK_SIZE` 查询（以字节为单位）。

### 对齐要求

使用 `glBindBufferRange` 时，`offset` 参数必须是 `GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT` 的倍数：

```cpp
GLint alignment;
glGetIntegerv(GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT, &alignment);
// offset 必须是 alignment 的倍数
```

::: tip 多块存储
如果要在单个缓冲对象中存储多个统一块的数据，必须确保每个块的数据对齐到上述要求。
:::

## std140 布局规则

使用 `std140` 布局可以避免运行时查询偏移量，规则如下：

| 类型 | 偏移规则 |
|------|----------|
| 标量（int, float, bool） | 4 字节对齐 |
| 二元向量（vec2, ivec2） | 8 字节对齐 |
| 三元向量（vec3, ivec3） | 16 字节对齐 |
| 四元向量（vec4, ivec4） | 16 字节对齐 |
| 矩阵（mat3, mat4） | 列向量对齐规则，每列 16 字节对齐 |
| 数组 | 每个元素按 vec4 对齐（16 字节） |
| 结构体 | 成员按各自规则对齐，整体按最大成员对齐 |

```glsl
layout(std140) uniform Example {
    float scalar;      // offset: 0, size: 4
    vec2 vec2_val;     // offset: 8, size: 8  (填充 4 字节)
    vec3 vec3_val;     // offset: 16, size: 12
    float arr[2];      // offset: 32, size: 32 (每元素 16 字节)
    mat4 matrix;       // offset: 64, size: 64
};
```

## 参考

- 核心版本：OpenGL 3.1
- 核心扩展：`ARB_uniform_buffer_object`
