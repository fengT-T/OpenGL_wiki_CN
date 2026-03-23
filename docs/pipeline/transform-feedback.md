# 变换反馈 (Transform Feedback)

变换反馈（Transform Feedback）是捕获顶点处理阶段生成的图元，并将数据记录到缓冲对象的过程。这允许保留对象的后变换渲染状态，并多次重用这些数据。

::: info 版本信息
- 核心版本：4.6
- 引入版本：3.0
- ARB 扩展：`ARB_transform_feedback2`、`ARB_transform_feedback3`、`ARB_transform_feedback_instanced`
- EXT 扩展：`EXT_transform_feedback`
:::

::: info 多流输出
输出到多个流需要 OpenGL 4.0 或 `ARB_transform_feedback3` 和 `ARB_gpu_shader5`。
:::

---

## 着色器设置

捕获图元的程序必须在链接前设置相关参数。

### 捕获设置

```cpp
void glTransformFeedbackVaryings(GLuint program, GLsizei count, 
                                  const char **varyings, GLenum bufferMode);
```

参数说明：
- `bufferMode`：捕获模式，`GL_INTERLEAVED_ATTRIBS`（交错）或 `GL_SEPARATE_ATTRIBS`（分离）
- `count`：`varyings` 数组中的字符串数量
- `varyings`：要捕获的输出变量名称数组

::: warning 注意
此函数设置程序的所有反馈输出，再次调用会覆盖之前的设置。
:::

### 捕获数据格式

变换反馈显式捕获图元。即使渲染 6 个顶点的 `GL_TRIANGLE_STRIP`（产生 4 个三角形），TF 会捕获 12 个顶点（4 × 3），而非 6 个。

每个图元按处理顺序写入，顶点数据按图元组装后的顺序排列。

### 高级交错

使用特殊"varying"名称实现更灵活的布局：

| 名称 | 效果 |
|------|------|
| `gl_NextBuffer` | 后续输出路由到下一个缓冲区索引 |
| `gl_SkipComponents#` | 跳过 # 个分量（1-4），不修改内存 |

### 双精度对齐

双精度值需要 8 字节对齐。必须确保：
1. 每个双精度分量从 8 字节边界开始
2. 包含双精度的顶点数据总大小对齐到 8 字节

示例：

```cpp
const char *varyings[] = {
  "DataBlock.var1",
  "gl_SkipComponents1",       // 填充到 8 字节对齐
  "DataBlock.someDoubles",
  "DataBlock.var3",
  "gl_SkipComponents1",       // 填充顶点结构到 8 字节对齐
};
```

### 着色器内指定

使用布局限定符在着色器中定义捕获设置（需要 OpenGL 4.4 或 `ARB_enhanced_layouts`）：

```glsl
layout(xfb_buffer = 1, xfb_stride = 32) out;  // 设置缓冲区 1 的步长

layout(xfb_buffer = 0) out Data {
  layout(xfb_offset = 0) float val1;
  layout(xfb_offset = 8) vec4 val2;
};
```

---

## 缓冲绑定

开始变换反馈操作前，必须将缓冲绑定到索引 `GL_TRANSFORM_FEEDBACK_BUFFER` 绑定点：

```cpp
glBindBufferRange(GL_TRANSFORM_FEEDBACK_BUFFER, index, buffer, offset, size);
```

偏移量必须 4 字节对齐，如果捕获双精度数据则需 8 字节对齐。

---

## 反馈过程

### 开始反馈

```cpp
void glBeginTransformFeedback(GLenum primitiveMode);
```

`primitiveMode` 必须是 `GL_POINTS`、`GL_LINES` 或 `GL_TRIANGLES`，定义捕获的图元类型。

激活变换反馈模式后，执行绘制命令会将输出记录到绑定的缓冲区。

### 结束反馈

```cpp
void glEndTransformFeedback();
```

### 示例

```cpp
glUseProgram(g_program);
glBindBufferRange(GL_TRANSFORM_FEEDBACK_BUFFER, 0, feedback_buffer, 
                   buffer_offset, number_of_bytes);
glBeginTransformFeedback(GL_LINES);
glBindVertexArray(vao);
glDrawElements(GL_POINTS, count, GL_UNSIGNED_SHORT, BUFFER_OFFSET(0));
glEndTransformFeedback();
glUseProgram(0);
```

### 激活时的限制

变换反馈激活（且未暂停）时，不能：
- 更改 `GL_TRANSFORM_FEEDBACK_BUFFER` 绑定
- 读写这些缓冲区（反馈写入除外）
- 重新分配这些缓冲区的存储
- 更改当前程序

---

## 反馈对象

::: info 版本信息
- 引入版本：4.0
- ARB 扩展：`ARB_transform_feedback2`
:::

变换反馈对象封装了执行反馈操作所需的状态：

```cpp
void glGenTransformFeedbacks(GLsizei n, GLuint *ids);
void glDeleteTransformFeedbacks(GLsizei n, const GLuint *ids);
void glBindTransformFeedback(GLenum target, GLuint id);
```

封装的状态包括：
- `GL_TRANSFORM_FEEDBACK_BUFFER` 的通用和索引绑定
- 反馈是否激活/暂停
- 当前记录的图元计数

::: tip 提示
反馈对象 0 是默认对象，无法删除。
:::

### 暂停和恢复

```cpp
void glPauseTransformFeedback();
void glResumeTransformFeedback();
```

暂停后可以：
- 解绑反馈对象
- 更改程序
- 读取缓冲区（需先解绑反馈对象）

恢复时必须绑定相同的程序或管线对象。

### 反馈渲染

使用反馈对象记录的顶点计数直接渲染：

```cpp
void glDrawTransformFeedback(GLenum mode, GLuint id);
void glDrawTransformFeedbackInstanced(GLenum mode, GLuint id, GLsizei instancecount);
```

这些函数类似 `glDrawArrays`，但不执行顶点规范设置工作，仅从反馈操作获取顶点计数。

---

## 限制

| 限制 | 枚举值 | 最小值 |
|------|--------|--------|
| 分离捕获的最大变量数 | `GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS` | 4 |
| 分离捕获每变量最大分量数 | `GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS` | 4 |
| 交错捕获的最大分量数 | `GL_MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | 64 |
| 最大缓冲区数 | `GL_MAX_TRANSFORM_FEEDBACK_BUFFERS` | 4 |

双精度分量计为 2 个分量。

---

## 另见

- [顶点渲染](../rendering/vertex-rendering)
- [缓冲对象](../concepts/buffer-object)
- [图元](./primitive)