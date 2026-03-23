# 查询对象 (Query Object)

查询对象是用于异步查询特定类型信息的 OpenGL 对象。

## 对象管理

查询对象遵循标准 OpenGL 对象范式，使用以下函数创建和销毁：

```cpp
glGenQueries(GLsizei n, GLuint* ids);
glDeleteQueries(GLsizei n, const GLuint* ids);
```

与其他大多数 OpenGL 对象不同，查询对象没有通用的 `glBindQuery` 函数。查询对象不是容器对象，但它们不能在 OpenGL 上下文之间共享。

### 查询类型

查询对象通过 `target` 参数区分不同类型，每种类型代表一个由某个 OpenGL 过程生成的整数值：

| 查询类型 | 说明 | 最低版本 |
|---------|------|---------|
| `GL_SAMPLES_PASSED` | 通过深度测试的样本数量 | 1.5 |
| `GL_ANY_SAMPLES_PASSED` | 是否有样本通过深度测试（布尔值） | 3.3 / ARB_occlusion_query2 |
| `GL_ANY_SAMPLES_PASSED_CONSERVATIVE` | 同上，但可能使用更快但不精确的算法 | 4.3 / ARB_ES3_compatibility |
| `GL_PRIMITIVES_GENERATED` | 发送到几何着色器输出流的图元数量 | 3.0 |
| `GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN` | 写入变换反馈对象的图元数量 | 3.0 |
| `GL_TIME_ELAPSED` | GPU 执行作用域内命令的时间（纳秒） | 3.3 / ARB_timer_query |
| `GL_TIMESTAMP` | GPU 当前时间戳（纳秒） | 3.3 / ARB_timer_query |

### 查询作用域

查询对象的结果通常基于多个绘制命令创建的数据。查询作用域由 begin/end 函数对界定：

```cpp
glBeginQuery(GLenum target, GLuint id);
glEndQuery(GLenum target);
```

::: tip 注意
`GL_TIMESTAMP` 是唯一不被 `glBeginQuery`/`glEndQuery` 接受的查询类型。
:::

某些目标是索引化的，意味着该目标有多个查询操作槽位。这些目标可以使用：

```cpp
glBeginQueryIndexed(GLenum target, GLuint index, GLuint id);
glEndQueryIndexed(GLenum target, GLuint index);
```

支持索引的目标：
- `GL_PRIMITIVES_GENERATED`：索引表示几何着色器的顶点流输出
- `GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN`：同上

最大索引值为 `GL_MAX_VERTEX_STREAMS`。

### 查询结果获取

查询对象结束后，可以检索存储的数据：

```cpp
glGetQueryObjectiv(GLuint id, GLenum pname, GLint* params);
glGetQueryObjectui64v(GLuint id, GLenum pname, GLuint64* params);
```

可查询的信息类型：

**`GL_QUERY_RESULT_AVAILABLE`**

返回查询结果是否可用。如果查询操作尚未完成，返回 `GL_FALSE`，否则返回 `GL_TRUE`。

**`GL_QUERY_RESULT`**

返回查询的实际结果。

::: warning 同步阻塞
如果在 `GL_QUERY_RESULT_AVAILABLE` 返回 `GL_TRUE` 之前查询结果，将把异步查询变成同步查询，函数会阻塞 CPU 直到结果可用。
:::

**`GL_QUERY_RESULT_NO_WAIT`**（需要 OpenGL 4.4 或 `ARB_query_buffer_object`）

如果结果可用，返回查询结果；如果不可用，则不写入任何内容，`params` 中的值保持不变。

### 查询缓冲区对象

查询结果可以直接写入缓冲区对象，这对于将查询结果反馈到 OpenGL 内部操作非常有用：

```cpp
glBindBuffer(GL_QUERY_BUFFER, buffer);
glGetQueryObjectui64v(id, GL_QUERY_RESULT, (GLuint64*)offset);
```

当非零缓冲区绑定到 `GL_QUERY_BUFFER` 时，`params` 参数被解释为缓冲区中的字节偏移量，而不是内存指针。

### 查询精度

每种查询类型都有不同的精度。可以通过以下方式查询：

```cpp
glGetQueryiv(target, GL_QUERY_COUNTER_BITS, &bits);
```

| 查询类型 | 最小精度 |
|---------|---------|
| `GL_SAMPLES_PASSED` | 32* |
| `GL_ANY_SAMPLES_PASSED` | 1 |
| `GL_ANY_SAMPLES_PASSED_CONSERVATIVE` | 1 |
| `GL_PRIMITIVES_GENERATED` | 32 |
| `GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN` | 32 |
| `GL_TIME_ELAPSED` | 30 |
| `GL_TIMESTAMP` | 30 |

*在 OpenGL 3.3 中，`GL_SAMPLES_PASSED` 的最小精度是最大视口宽度和高度的两倍。

## 遮挡查询 (Occlusion Queries)

遮挡查询包括 `GL_SAMPLES_PASSED`、`GL_ANY_SAMPLES_PASSED` 和 `GL_ANY_SAMPLES_PASSED_CONSERVATIVE`，用于检测对象是否可见。

这些查询检测是否有片元在逐样本处理的深度测试阶段之后继续被处理。如果片元通过深度测试，它必须也通过之前的所有操作（模板测试、裁剪测试等）。

::: tip 使用场景
遮挡查询的典型用法是：
1. 渲染一个简单的包围体（使用简单着色器）
2. 使用写入掩码阻止实际绘制
3. 如果有样本可见，再渲染实际的复杂对象
:::

遮挡查询的结果可用作条件渲染的条件。

## 计时器查询 (Timer Queries)

计时器查询包括 `GL_TIMESTAMP` 和 `GL_TIME_ELAPSED`，用于测量 GPU 操作时间。所有返回的时间都以**纳秒**为单位。

`GL_TIME_ELAPSED` 用于测量作用域内命令在 GPU 上执行的时间：

```cpp
glBeginQuery(GL_TIME_ELAPSED, query);
// 绘制命令
glEndQuery(GL_TIME_ELAPSED);
```

`GL_TIMESTAMP` 不使用作用域，用于记录特定时间点：

```cpp
glQueryCounter(GLuint id, GL_TIMESTAMP);
```

这将在 GPU 完成所有先前发出的命令时将时间戳存入查询对象。

也可以直接获取时间戳（同步方式）：

```cpp
GLint64 timestamp;
glGetInteger64v(GL_TIMESTAMP, &timestamp);
```

::: warning 同步阻塞
直接获取时间戳会阻塞 CPU 直到时间戳返回。
:::

## 图元查询 (Primitive Queries)

图元查询包括 `GL_PRIMITIVES_GENERATED` 和 `GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN`，用于检测渲染操作中生成了多少图元。

这主要用于变换反馈，特别是在几何着色器和/或曲面细分生成的图元数量取决于提供的数据时。

**`GL_PRIMITIVES_GENERATED`**

提供最终顶点处理步骤输出的图元数量。如果没有激活几何着色器或曲面细分，则是绘制命令的图元数量。

**`GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN`**

写入变换反馈缓冲区的图元数量。此计数仅在 `glBeginTransformFeedback`/`glEndTransformFeedback` 作用域内的绘制命令时递增。

::: tip 注意
图元计数是基本图元的数量。例如，一个 5 顶点的三角形带是 3 个图元，而不是 1 个图元。
:::

### 多输出流

变换反馈操作可以有多个输出流。图元查询可以索引化，每个索引代表一个潜在的变换反馈输出流。

发送到没有变换反馈缓冲区写入的流的图元：
- `GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN` 查询不会递增
- `GL_PRIMITIVES_GENERATED` 查询会递增