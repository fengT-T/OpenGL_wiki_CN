# Framebuffer Object（帧缓冲区对象）

::: info 版本信息
核心版本：4.6+，核心引入：3.0  
核心 ARB 扩展：GL_ARB_framebuffer_object  
EXT 扩展：GL_EXT_framebuffer_object、GL_EXT_framebuffer_blit、GL_EXT_framebuffer_multisample、GL_EXT_packed_depth_stencil
:::

Framebuffer Objects（帧缓冲区对象，简称 FBO）是 OpenGL 中用于创建用户自定义帧缓冲区的对象。通过 FBO，可以将渲染输出重定向到非默认帧缓冲区（Default Framebuffer）的位置，从而在不干扰主屏幕的情况下进行离屏渲染。

## 术语定义

在深入讨论 FBO 之前，先明确以下术语：

| 术语 | 说明 |
|------|------|
| **Image（图像）** | 单个 2D 像素数组，具有特定的 [Image Format（图像格式）](../concepts/image-format.md) |
| **Layered Image（层叠图像）** | 一组具有相同大小和格式的图像序列，来源于特定纹理类型的单个 mipmap 级别 |
| **Texture（纹理）** | 包含多个图像的对象，所有图像共享相同格式（但大小可能不同，如不同 mipmap 级别） |
| **Renderbuffer（渲染缓冲区）** | 仅包含单个图像的对象，无法被 Shader 访问，只能用于 FBO 附件 |
| **Attach（附加）** | 将一个对象连接到另一个对象。与绑定（bind）不同，对象绑定到上下文，而附加是对象之间的连接 |
| **Attachment Point（附加点）** | FBO 中用于附加图像的命名位置，限制可附加的图像格式类型 |

## FBO 结构

作为标准的 OpenGL 对象，FBO 遵循常规的对象管理规则。

### 创建与删除

```c
void glGenFramebuffers(GLsizei n, GLuint *framebuffers);
void glDeleteFramebuffers(GLsizei n, const GLuint *framebuffers);
```

### 绑定

```c
void glBindFramebuffer(GLenum target, GLuint framebuffer);
```

`target` 参数可取以下值：

| 目标 | 说明 |
|------|------|
| `GL_FRAMEBUFFER` | 同时绑定到读取和绘制目标 |
| `GL_READ_FRAMEBUFFER` | 仅绑定到读取目标（用于 `glReadPixels` 等） |
| `GL_DRAW_FRAMEBUFFER` | 仅绑定到绘制目标（用于所有渲染命令） |

::: tip 分离读写目标
使用 `GL_READ_FRAMEBUFFER` 和 `GL_DRAW_FRAMEBUFFER` 可以将读取操作和渲染操作定向到不同的帧缓冲区。
:::

### 附加点

FBO 不使用默认帧缓冲区的缓冲区名称（如 `GL_FRONT`、`GL_BACK`），而是使用以下附加点：

| 附加点 | 说明 |
|--------|------|
| `GL_COLOR_ATTACHMENTi` | 颜色附件，数量可通过 `GL_MAX_COLOR_ATTACHMENTS` 查询（至少 8 个） |
| `GL_DEPTH_ATTACHMENT` | 深度附件，附加后成为 FBO 的深度缓冲区 |
| `GL_STENCIL_ATTACHMENT` | 模板附件，附加后成为 FBO 的模板缓冲区 |
| `GL_DEPTH_STENCIL_ATTACHMENT` | 深度-模板附件，同时作为深度和模板缓冲区 |

::: warning 格式匹配
- 颜色附件只能附加可颜色渲染格式的图像，压缩格式不可用
- 深度附件只能附加深度格式的图像
- 模板附件只能附加模板格式的图像
- 使用 `GL_DEPTH_STENCIL_ATTACHMENT` 时，应使用打包的深度-模板内部格式
:::

## 附加图像

附加图像前，需要先将 FBO 绑定到上下文。

### 纹理图像附加

不同纹理类型映射到帧缓冲区图像的方式：

| 纹理类型 | 图像标识方式 |
|----------|--------------|
| 1D 纹理 | `level`（高度视为 1） |
| 2D 纹理 | `level` |
| 3D 纹理 | `level` + `layer`（Z 坐标） |
| Rectangle 纹理 | `level` = 0 |
| Cubemap 纹理 | `level` + `target`（面）或 `layer` |
| 1D/2D Array 纹理 | `level` + `layer`（数组索引） |
| Cubemap Array 纹理 | `level` + `layer`（层-面索引） |

::: warning 限制
Buffer Texture（缓冲区纹理）无法附加到帧缓冲区。
:::

#### 附加函数

```c
void glFramebufferTexture1D(GLenum target, GLenum attachment, GLenum textarget, GLuint texture, GLint level);
void glFramebufferTexture2D(GLenum target, GLenum attachment, GLenum textarget, GLuint texture, GLint level);
void glFramebufferTextureLayer(GLenum target, GLenum attachment, GLuint texture, GLint level, GLint layer);
```

参数说明：
- `target`：绑定目标（`GL_FRAMEBUFFER` 等同于 `GL_DRAW_FRAMEBUFFER`）
- `attachment`：附加点（如 `GL_COLOR_ATTACHMENT0`）
- `textarget`：纹理类型（如 `GL_TEXTURE_2D`），Cubemap 需指定具体面
- `texture`：纹理对象名称，传 0 则清除该附加点
- `level`：mipmap 级别
- `layer`：层索引（用于 3D、Array 纹理）

::: tip DSA 支持
如果支持 OpenGL 4.5 或 ARB_direct_state_access，`glFramebufferTextureLayer` 可接受非数组 Cubemap 纹理（视为单层数组），此时无需使用 Texture1D/Texture2D 函数。
:::

### 渲染缓冲区附加

Renderbuffer（渲染缓冲区）只能通过附加到 FBO 来使用：

```c
void glFramebufferRenderbuffer(GLenum target, GLenum attachment, GLenum renderbuffertarget, GLuint renderbuffer);
```

参数说明：
- `renderbuffertarget`：必须为 `GL_RENDERBUFFER`
- `renderbuffer`：渲染缓冲区对象名称

## 层叠图像附加

层叠图像用于 [Layered Rendering（分层渲染）](../rendering/layered-rendering.md)，可以将不同图元发送到帧缓冲区的不同层。

### 支持的纹理类型

| 纹理类型 | 层数 |
|----------|------|
| 1D/2D Array 纹理 | 数组大小 |
| 3D 纹理 | 该 mipmap 级别的深度 |
| Cubemap 纹理 | 固定 6 层（每个面一层） |
| Cubemap Array 纹理 | 层数 × 6（层-面索引） |

### Cubemap 面顺序

| 层号 | Cubemap 面 |
|------|------------|
| 0 | `GL_TEXTURE_CUBE_MAP_POSITIVE_X` |
| 1 | `GL_TEXTURE_CUBE_MAP_NEGATIVE_X` |
| 2 | `GL_TEXTURE_CUBE_MAP_POSITIVE_Y` |
| 3 | `GL_TEXTURE_CUBE_MAP_NEGATIVE_Y` |
| 4 | `GL_TEXTURE_CUBE_MAP_POSITIVE_Z` |
| 5 | `GL_TEXTURE_CUBE_MAP_NEGATIVE_Z` |

### 附加函数

```c
void glFramebufferTexture(GLenum target, GLenum attachment, GLuint texture, GLint level);
```

此函数可将纹理的整个 mipmap 级别作为层叠图像附加。

## 空帧缓冲区

::: info 版本信息
核心版本：4.3+，扩展：ARB_framebuffer_no_attachments
:::

FBO 可以在没有任何附件的情况下进行渲染。这在仅使用 Shader 的 Image Load Store 功能时很有用。

### 设置虚拟参数

```c
void glFramebufferParameteri(GLenum target, GLenum pname, GLint param);
```

| 参数名 | 说明 |
|--------|------|
| `GL_FRAMEBUFFER_DEFAULT_WIDTH` | 默认宽度 |
| `GL_FRAMEBUFFER_DEFAULT_HEIGHT` | 默认高度 |
| `GL_FRAMEBUFFER_DEFAULT_LAYERS` | 默认层数（非 0 模拟分层帧缓冲区） |
| `GL_FRAMEBUFFER_DEFAULT_SAMPLES` | 多重采样数 |
| `GL_FRAMEBUFFER_DEFAULT_FIXED_SAMPLE_LOCATIONS` | 固定采样位置 |

::: warning 仅在无附件时生效
如果附加了任何图像，这些参数将被忽略。
:::

## 帧缓冲区完整性

使用 FBO 前必须确保其"完整"（framebuffer complete）。

### 检查完整性

```c
GLenum glCheckFramebufferStatus(GLenum target);
```

返回 `GL_FRAMEBUFFER_COMPLETE` 表示可用，其他值表示存在问题。

### 附件完整性规则

每个附加点必须满足以下条件：

- 源对象存在且类型匹配
- 图像尺寸非零（1D 纹理高度视为 1），且小于 `GL_MAX_FRAMEBUFFER_WIDTH`/`GL_MAX_FRAMEBUFFER_HEIGHT`
- 层索引有效，小于纹理深度和 `GL_MAX_FRAMEBUFFER_LAYERS`
- 采样数小于 `GL_MAX_FRAMEBUFFER_SAMPLES`
- 图像格式符合附加点要求

### 完整性规则

按顺序检查，任一失败则返回相应错误：

1. **默认帧缓冲区**：若绑定 FBO 0 且不存在，返回 `GL_FRAMEBUFFER_UNDEFINED`
2. **所有附件完整**：否则返回 `GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT`
3. **至少一个图像附加**：否则返回 `GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT`（4.3+ 可用默认参数替代）
4. **绘制缓冲区有效**：每个 Draw Buffer 必须指向已附加的颜色附件或为 `GL_NONE`，否则返回 `GL_FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER`
5. **读取缓冲区有效**：Read Buffer 必须指向已附加的附件，否则返回 `GL_FRAMEBUFFER_INCOMPLETE_READ_BUFFER`
6. **多重采样一致**：所有图像采样数和固定采样位置设置相同，否则返回 `GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE`
7. **层叠一致性**：若任一附件为层叠图像，则所有附件必须都是层叠的，否则返回 `GL_FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS`

### 格式兼容性

实现可能不支持某些格式组合，返回 `GL_FRAMEBUFFER_UNSUPPORTED`。但以下组合必须支持：

- 任意 [必需颜色格式](../concepts/required-image-format.md) 的组合
- 可与必需深度格式组合
- 可与必需模板格式组合

::: warning 深度+模板
若同时需要深度和模板，必须使用深度-模板格式，并将同一图像附加到两个附加点。
:::

## 反馈循环

当同一纹理既绑定到 FBO 作为渲染目标，又被 Shader 采样时，会产生反馈循环。

::: danger 未定义行为
从正在写入的图像进行采样会产生未定义行为——可能读取旧数据、新数据、混合数据或垃圾数据。

这里的"图像"指 mipmap 级别，同一 mipmap 级别内的不同层数组元素也被视为同一图像。
:::

### 解决方案

- 使用 View Texture（纹理视图）将数组层分离为独立图像
- OpenGL 4.5+ 或 ARB_texture_barrier 支持 [Texture Barrier（纹理屏障）](../sync/texture-barrier.md)，允许有限制的同像素读写

## 伪代码实现

以下伪代码帮助理解 FBO 的内部结构：

```cpp
struct Framebuffer {
  map<GLenum, Attachment> attachments;
  GLenum draw_buffers[] = { GL_COLOR_ATTACHMENT0, GL_NONE, GL_NONE, ... };
  GLenum read_buffer = GL_COLOR_ATTACHMENT0;
};

struct TextureAttachment : public Attachment {
  GLuint texture_id;
  GLenum texture_target;
  GLuint mip_level;
  GLuint layer;
};

struct RenderbufferAttachment : public Attachment {
  GLuint renderbuffer_id;
  GLenum renderbuffer_target;
};
```

绑定操作：

```cpp
glBindFramebuffer(target, framebuffer_id) {
  switch (target) {
    case GL_READ_FRAMEBUFFER:
      currentContext.read_framebuffer_binding = framebuffer_id;
      break;
    case GL_DRAW_FRAMEBUFFER:
      currentContext.draw_framebuffer_binding = framebuffer_id;
      break;
    case GL_FRAMEBUFFER:
      currentContext.read_framebuffer_binding = framebuffer_id;
      currentContext.draw_framebuffer_binding = framebuffer_id;
      break;
  }
}
```

附加操作：

```cpp
glFramebufferTexture2D(target, attachmentPoint, textarget, texture, mip_level) {
  Framebuffer fb = getFramebufferByTarget(target);
  fb.attachments.set(attachmentPoint, 
    new TextureAttachment(textarget, texture, mip_level, 0));
}

glFramebufferTextureLayer(target, attachment, texture, mip_level, layer) {
  Framebuffer fb = getFramebufferByTarget(target);
  fb.attachments.set(attachment, 
    new TextureAttachment(getTextureTarget(texture), texture, mip_level, layer));
}

glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
  Framebuffer fb = getFramebufferByTarget(target);
  fb.attachments.set(attachment, 
    new RenderbufferAttachment(renderbuffertarget, renderbuffer));
}
```

Draw Buffer 设置：

```cpp
glDrawBuffers(GLsizei n, const GLenum *bufs) {
  Framebuffer fb = getFramebufferByTarget(GL_DRAW_FRAMEBUFFER);
  for (GLsizei i = 0; i < n; ++i) {
    fb.draw_buffers[i] = bufs[i];
  }
  for (GLsizei i = n; i < max_draw_buffers; ++i) {
    fb.draw_buffers[i] = GL_NONE;
  }
}

glReadBuffer(GLenum mode) {
  Framebuffer fb = getFramebufferByTarget(GL_READ_FRAMEBUFFER);
  fb.read_buffer = mode;
}
```

## 旧版 EXT 扩展

::: warning 已废弃
EXT_framebuffer_object 扩展已在 OpenGL 3.1 核心配置中移除，不建议在新代码中使用。
:::

原始 EXT 扩展功能有限，有更多硬编码限制（如所有图像必须相同尺寸）。部分硬件可能仅支持 EXT 而非 ARB 版本。

## 参考

- [Core API Framebuffer Objects](https://www.khronos.org/opengl/wiki/Category:Core_API_Ref_Framebuffer_Objects)：帧缓冲区对象 API 参考文档
