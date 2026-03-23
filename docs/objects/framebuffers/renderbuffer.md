# 渲染缓冲区对象 (Renderbuffer Object)

渲染缓冲区对象是包含图像的 OpenGL 对象，专门用于帧缓冲区对象（FBO）。它们被优化为渲染目标，而纹理可能未针对此用途优化。

## 何时使用渲染缓冲区 vs 纹理

::: tip 选择建议
- **使用渲染缓冲区**：当不需要从生成的图像中采样时（例如在后处理着色器中）
- **使用纹理**：当需要重新采样时（例如在第二个着色器通道中读取深度）
:::

渲染缓冲区对象还原生支持多重采样（MSAA）。

## 创建

渲染缓冲区对象是标准 OpenGL 对象，使用以下函数创建和销毁：

```cpp
glGenRenderbuffers(GLsizei n, GLuint* renderbuffers);
glDeleteRenderbuffers(GLsizei n, const GLuint* renderbuffers);
```

绑定渲染缓冲区：

```cpp
glBindRenderbuffer(GLenum target, GLuint renderbuffer);
```

`target` 参数唯一可行的值是 `GL_RENDERBUFFER`。

### 分配存储

与纹理对象类似，渲染缓冲区在初始化时为空。在将其绑定到帧缓冲区对象之前，必须为渲染缓冲区分配存储：

```cpp
void glRenderbufferStorage(
    GLenum target,
    GLenum internalformat,
    GLsizei width,
    GLsizei height
);
```

参数说明：
- `target`：必须是 `GL_RENDERBUFFER`
- `internalformat`：图像的内部格式（详见[图像格式](../textures/formats)）
- `width`、`height`：渲染缓冲区的宽度和高度

### 多重采样渲染缓冲区

创建多重采样渲染缓冲区：

```cpp
void glRenderbufferStorageMultisample(
    GLenum target,
    GLsizei samples,
    GLenum internalformat,
    GLsizei width,
    GLsizei height
);
```

参数说明：
- `samples`：缓冲区中的样本数，必须小于 `GL_MAX_SAMPLES`
- 如果 `samples` 为 0，行为与 `glRenderbufferStorage` 相同

::: warning 重新分配存储
强烈建议不要对已有存储的渲染缓冲区重新调用存储分配函数。如果需要新的渲染缓冲区，请删除旧对象并创建新对象。使用相同对象名重新创建渲染缓冲区可能导致完整性问题，特别是当它附加到另一个对象时。
:::

## 使用方式

渲染缓冲区没有参数来初始化数据，也没有函数像 `glTexImage2D` 那样上传数据。渲染缓冲区的内容是未定义的。

使用渲染缓冲区对象的唯一方法是将其附加到帧缓冲区对象（FBO）：

1. 将 FBO 绑定到上下文
2. 设置适当的绘制或读取缓冲区
3. 使用像素传输操作读取和写入
4. 正常渲染到它

标准的 `glClear` 和 `glClearBuffer` 等函数也可以清除适当的缓冲区。

## 另见

- [帧缓冲区对象](./index.md)
- [默认帧缓冲区](./default-framebuffer.md)