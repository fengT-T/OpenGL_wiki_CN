# 深度测试 (Depth Test)

深度测试（Depth Test）是逐样本处理操作，在片段着色器执行后（有时可在之前）进行。片段的深度值与深度缓冲区中对应样本的深度值进行比较，若测试失败则丢弃该片段。

## 深度缓冲区 (Depth Buffer)

使用深度测试需要当前帧缓冲区（Framebuffer）具有深度缓冲区。深度缓冲区是使用深度格式的图像：

- 默认帧缓冲区可能包含深度缓冲区
- 用户定义的帧缓冲区可将深度格式图像附加到 `GL_DEPTH_ATTACHMENT`

::: tip 注意
如果当前帧缓冲区没有深度缓冲区，深度测试行为如同始终禁用。
:::

## 片段深度值 (Fragment Depth Value)

每个片段都有一个深度值，来源有两种：

1. 片段着色器写入 `gl_FragDepth`
2. 顶点后处理阶段计算的窗口空间 Z 坐标

## 深度测试

启用深度测试：

```cpp
glEnable(GL_DEPTH_TEST);
```

禁用深度测试时，深度缓冲区写入也被禁用。

深度测试将片段深度值 **N** 与缓冲区深度值 **P** 比较，条件为 `(N FUNC P)`，其中 `FUNC` 通过以下函数设置：

```cpp
void glDepthFunc(GLenum func);
```

可用的比较函数：

| 枚举值 | 比较 | 枚举值 | 比较 |
|--------|------|--------|------|
| `GL_NEVER` | 总是失败 | `GL_ALWAYS` | 总是通过 |
| `GL_LESS` | < | `GL_LEQUAL` | ≤ |
| `GL_GREATER` | > | `GL_GEQUAL` | ≥ |
| `GL_EQUAL` | = | `GL_NOTEQUAL` | ≠ |

## 早期深度测试 (Early Depth Test)

深度测试可在片段着色器执行前进行，这是一种优化。条件是片段着色器不丢弃片段且不修改 `gl_FragDepth`。

::: info 强制早期测试
OpenGL 4.2 或 `ARB_shader_image_load_store` 扩展支持强制早期测试。强制时，片段着色器对 `gl_FragDepth` 的修改将被忽略，且即使着色器丢弃片段，深度仍会被写入。
:::

## 相关内容

- [模板测试 (Stencil Test)](/concepts/stencil-test)
- [片段着色器 (Fragment Shader)](/concepts/fragment-shader)