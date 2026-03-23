# Buffer Object（缓冲区对象）

Buffer Objects（缓冲区对象）是 OpenGL 中用于存储非格式化内存数组的对象，这些内存由 OpenGL 上下文（即 GPU）分配。它们可用于存储顶点数据、从图像或帧缓冲区获取的像素数据，以及多种其他用途。

## 创建

Buffer Objects 作为标准的 OpenGL 对象，遵循所有常规 OpenGL 对象的规则。

### 生成与删除

创建缓冲区对象：

```c
void glGenBuffers(GLsizei n, GLuint *buffers);
```

使用 DSA（Direct State Access，直接状态访问）创建：

```c
void glCreateBuffers(GLsizei n, GLuint *buffers);
```

删除缓冲区对象：

```c
void glDeleteBuffers(GLsizei n, const GLuint *buffers);
```

### 绑定对象

`glGenBuffers` 仅创建对象名称（引用），实际状态在首次绑定到上下文时才会初始化：

```c
void glBindBuffer(GLenum target, GLuint buffer);
```

`target` 参数定义了缓冲区对象的绑定目标。当仅用于创建或填充数据时，使用的目标在技术上并不重要。

::: tip DSA 的区别
使用 DSA API 时，`glCreateBuffers` 同时生成名称并立即初始化内部状态，无需绑定即可使用。但在混合使用 DSA 与非 DSA API 时需注意，DSA 函数要求对象已完全初始化。
:::

## 存储分配

缓冲区对象需要先分配存储空间才能使用。分配方式有两种：不可变存储和可变存储。

### 不可变存储（Immutable Storage）

::: info 版本信息
核心版本：4.4+，扩展：ARB_buffer_storage
:::

不可变存储一旦分配，无法重新分配大小。但仍可通过显式失效命令或映射来使内容失效。

```c
void glBufferStorage(GLenum target, GLsizeiptr size, const void *data, GLbitfield flags);
void glNamedBufferStorage(GLuint buffer, GLsizeiptr size, const void *data, GLbitfield flags);
```

参数说明：
- `target`：绑定目标（非 DSA 版本）
- `buffer`：缓冲区对象名称（DSA 版本）
- `size`：要分配的字节数
- `data`：初始数据指针，可为 NULL（此时缓冲区内容未定义）
- `flags`：访问标志位，定义如何访问缓冲区

#### 访问标志

以下操作无论 `flags` 设置如何，始终有效：
- 渲染管线写入（Transform Feedback、Image Load Store、Atomic Counter、SSBO 等）
- 清空缓冲区
- 复制缓冲区
- 失效缓冲区
- 异步像素传输
- 使用 `glGetBufferSubData` 读取数据

客户端访问标志：

| 标志 | 说明 |
|------|------|
| `GL_MAP_READ_BIT` | 允许映射读取 |
| `GL_MAP_WRITE_BIT` | 允许映射写入 |
| `GL_DYNAMIC_STORAGE_BIT` | 允许使用 `glBufferSubData` 修改内容 |
| `GL_MAP_PERSISTENT_BIT` | 允许持久映射，映射期间可使用缓冲区 |
| `GL_MAP_COHERENT_BIT` | 允许一致性访问，无需显式屏障 |
| `GL_CLIENT_STORAGE_BIT` | 提示存储应来自客户端内存 |

#### 常见使用场景

**纯 OpenGL 缓冲区**：完全由 OpenGL 进程读写（如 Compute Shader 写入、Transform Feedback 等），设置 `flags = 0`。

**静态数据缓冲区**：数据上传后不再改变，设置 `flags = 0` 并提供初始数据。

**图像读取缓冲区**：用于异步像素传输读取，设置 `flags = GL_MAP_READ_BIT`。

**可修改缓冲区**：需要频繁更新，设置 `flags = GL_MAP_WRITE_BIT`。

### 可变存储（Mutable Storage）

```c
void glBufferData(GLenum target, GLsizeiptr size, const void *data, GLenum usage);
void glNamedBufferData(GLuint buffer, GLsizeiptr size, const void *data, GLenum usage);
```

参数说明：
- `target`/`buffer`：目标或对象名称
- `size`：字节数
- `data`：初始数据指针，可为 NULL
- `usage`：使用提示

#### Usage 提示

`usage` 参数由两部分组成：访问模式和更新频率。

访问模式：
- **DRAW**：用户写入数据，GL 读取（如顶点数据）
- **READ**：GL 写入数据，用户读取（如像素传输目标、Transform Feedback）
- **COPY**：GL 写入并读取（如 Transform Feedback 后用作顶点数据）

更新频率：
- **STATIC**：数据设置一次
- **DYNAMIC**：数据偶尔更新
- **STREAM**：数据几乎每次使用后都更新

常用组合：`GL_STATIC_DRAW`、`GL_DYNAMIC_DRAW`、`GL_STREAM_DRAW` 等。

::: warning 提示仅作参考
这些只是性能提示，不会限制实际行为。最佳选择需要针对特定硬件和驱动进行性能测试。
:::

## 数据操作

### 更新数据

更新已分配缓冲区的部分或全部内容：

```c
void glBufferSubData(GLenum target, GLintptr offset, GLsizeiptr size, const void *data);
void glNamedBufferSubData(GLuint buffer, GLintptr offset, GLsizeiptr size, const void *data);
```

### 清空缓冲区

::: info 版本信息
核心版本：4.3+，扩展：ARB_clear_buffer_object
:::

将缓冲区内容清空为指定值：

```c
void glClearBufferData(GLenum target, GLenum internalformat, GLenum format, GLenum type, const void *data);
void glClearBufferSubData(GLenum target, GLenum internalformat, GLintptr offset, GLsizeiptr size, GLenum format, GLenum type, const void *data);
void glClearNamedBufferData(GLuint buffer, GLenum internalformat, GLenum format, GLenum type, const void *data);
void glClearNamedBufferSubData(GLuint buffer, GLenum internalformat, GLintptr offset, GLsizeiptr size, GLenum format, GLenum type, const void *data);
```

`internalformat` 必须是可用于缓冲区纹理的尺寸化图像格式。`data` 指向单个像素的数据，该值将被重复填充到指定范围。

### 复制缓冲区

在缓冲区间或同一缓冲区的不同区域复制数据：

```c
void glCopyBufferSubData(GLenum readtarget, GLenum writetarget, GLintptr readoffset, GLintptr writeoffset, GLsizeiptr size);
void glCopyNamedBufferSubData(GLuint readbuffer, GLuint writebuffer, GLintptr readoffset, GLintptr writeoffset, GLsizeiptr size);
```

::: tip 推荐目标
使用 `GL_COPY_READ_BUFFER` 和 `GL_COPY_WRITE_BUFFER` 作为绑定目标，它们没有特殊语义，不会干扰其他绑定。
:::

### 映射缓冲区

映射缓冲区可直接获取指向缓冲区内存的指针，避免中间拷贝：

```c
void *glMapBuffer(GLenum target, GLbitfield access);
void *glMapNamedBuffer(GLuint buffer, GLbitfield access);
void *glMapBufferRange(GLenum target, GLintptr offset, GLsizeiptr length, GLbitfield access);
void *glMapNamedBufferRange(GLuint buffer, GLintptr offset, GLsizeiptr length, GLbitfield access);
```

解除映射：

```c
GLboolean glUnmapBuffer(GLenum target);
GLboolean glUnmapNamedBuffer(GLuint buffer);
```

`access` 必须包含 `GL_MAP_READ_BIT` 或 `GL_MAP_WRITE_BIT`（或两者）。

::: warning 映射期间限制
除非使用持久映射，否则映射期间不能调用任何会导致 OpenGL 读写该缓冲区的函数。
:::

#### 对齐

::: info 版本信息
核心版本：4.2+，扩展：ARB_map_buffer_alignment
:::

映射返回的指针保证至少按 `GL_MIN_MAP_BUFFER_ALIGNMENT`（最小值为 64）对齐，满足 SSE（16 字节）和 AVX（32 字节）等 SIMD 指令的要求。

#### 缓冲区损坏

映射期间，系统可能发生内存损坏。如果 `glUnmapBuffer` 返回 `GL_FALSE`，则缓冲区内容已失效。

#### 持久映射

::: info 版本信息
核心版本：4.4+，扩展：ARB_buffer_storage
:::

使用 `GL_MAP_PERSISTENT_BIT` 创建并映射的缓冲区可无限期保持映射状态，同时允许 OpenGL 使用该缓冲区。

**写入同步**：使用 `GL_MAP_FLUSH_EXPLICIT_BIT` 映射后，需显式刷新写入范围：

```c
void glFlushMappedBufferRange(GLenum target, GLintptr offset, GLsizeiptr length);
void glFlushMappedNamedBufferRange(GLuint buffer, GLintptr offset, GLsizeiptr length);
```

**读取同步**：读取 OpenGL 写入的数据需要：
1. 发出内存屏障：`glMemoryBarrier(GL_CLIENT_MAPPED_BUFFER_BARRIER_BIT)`
2. 使用 Fence Sync 确保命令完成

**简化同步**：使用 `GL_MAP_COHERENT_BIT` 可自动获得一致性访问，但仍需 Fence Sync 确保数据已写入。

::: tip 性能考量
一致性访问可能有性能开销，建议针对目标硬件进行性能测试。
:::

#### 性能建议

- 映射写入时应顺序写入，利用写合并（write-combine）优化
- 避免随机访问或跳跃式写入
- 对于流式数据，映射写入通常比 `glBufferSubData` 更快

### 失效

::: info 版本信息
核心版本：4.3+，扩展：ARB_invalidate_subdata
:::

失效操作使缓冲区内容变为未定义，实现可分配新内存，避免同步等待：

```c
void glInvalidateBufferData(GLuint buffer);
void glInvalidateBufferSubData(GLuint buffer, GLintptr offset, GLsizeiptr length);
```

其他失效方式：
- 可变存储：调用 `glBufferData(..., NULL)` 使用相同大小和 usage
- 映射时：使用 `GL_MAP_INVALIDATE_BUFFER_BIT` 或 `GL_MAP_INVALIDATE_RANGE_BIT`

### 流式传输

流式传输是指频繁上传数据并使用缓冲区的过程。关键在于避免同步：如果 OpenGL 正在使用缓冲区时尝试更新数据，线程将被阻塞。

详细信息请参阅 Buffer Object Streaming 相关文档。

## 通用用途

缓冲区对象通过绑定到特定目标来使用，不同目标有不同的语义：

| 目标 | 用途 |
|------|------|
| `GL_ARRAY_BUFFER` | 顶点属性数据源 |
| `GL_ELEMENT_ARRAY_BUFFER` | 索引数据（属于 VAO 状态） |
| `GL_COPY_READ_BUFFER` / `GL_COPY_WRITE_BUFFER` | 缓冲区复制（无特殊语义） |
| `GL_PIXEL_UNPACK_BUFFER` | 像素上传源 |
| `GL_PIXEL_PACK_BUFFER` | 像素读取目标 |
| `GL_QUERY_BUFFER` | 查询结果写入目标 |
| `GL_TEXTURE_BUFFER` | 纹理缓冲区 |
| `GL_TRANSFORM_FEEDBACK_BUFFER` | Transform Feedback（索引绑定） |
| `GL_UNIFORM_BUFFER` | Uniform Block（索引绑定） |
| `GL_DRAW_INDIRECT_BUFFER` | 间接绘制参数 |
| `GL_ATOMIC_COUNTER_BUFFER` | 原子计数器（索引绑定） |
| `GL_DISPATCH_INDIRECT_BUFFER` | 间接计算分发 |
| `GL_SHADER_STORAGE_BUFFER` | SSBO（索引绑定） |
| `GL_PARAMETER_BUFFER` | 间接计数多绘制参数 |

### 索引绑定

某些目标是索引绑定的，允许同时绑定多个缓冲区：

```c
void glBindBufferBase(GLenum target, GLuint index, GLuint buffer);
void glBindBufferRange(GLenum target, GLuint index, GLuint buffer, GLintptr offset, GLsizeiptr size);
```

有效索引目标：`GL_ATOMIC_COUNTER_BUFFER`、`GL_SHADER_STORAGE_BUFFER`、`GL_TRANSFORM_FEEDBACK_BUFFER`、`GL_UNIFORM_BUFFER`。

::: warning 对齐要求
`offset` 必须满足对齐要求：
- `GL_ATOMIC_COUNTER_BUFFER`：4 字节
- `GL_TRANSFORM_FEEDBACK_BUFFER`：4 字节
- `GL_SHADER_STORAGE_BUFFER`：`GL_SHADER_STORAGE_BUFFER_OFFSET_ALIGNMENT`
- `GL_UNIFORM_BUFFER`：`GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT`

后两者的对齐要求在某些实现上可能很大，需特别注意！
:::

`glBindBufferBase` 绑定整个缓冲区，`glBindBufferRange` 绑定指定范围。

### 多重绑定

::: info 版本信息
核心版本：4.4+，扩展：ARB_multi_bind
:::

一次绑定多个缓冲区到连续的索引位置：

```c
void glBindBuffersRange(GLenum target, GLuint first, GLsizei count, const GLuint *buffers, const GLintptr *offsets, const GLsizeiptr *sizes);
void glBindBuffersBase(GLenum target, GLuint first, GLsizei count, const GLuint *buffers);
```

## 参考

- [Core API Buffer Objects](https://www.khronos.org/opengl/wiki/Category:Core_API_Ref_Buffer_Objects)：缓冲区对象管理的 API 参考文档。
