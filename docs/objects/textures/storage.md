# 纹理存储 (Texture Storage)

纹理存储是纹理对象中存储实际像素数据的部分。本文介绍纹理存储的结构，以及管理纹理存储分配和像素内容的多种方式。

## 存储结构

纹理的图像存储包含一个或多个特定维度的图像。每种纹理类型都有特定的图像排列方式。纹理可以有 Mipmap，即同一图像的缩小版本，用于辅助纹理采样和过滤。每个 Mipmap 级别都有一组独立的图像。

纹理中的每个图像可以通过以下参数唯一标识：

- 对于可以有 Mipmap 的纹理：Mipmap **级别 (level)**
- 对于数组纹理：数组**层 (layer)**
- 对于立方体贴图纹理：该数组层和 Mipmap 级别内的**面 (face)**

| 纹理类型 | Mipmap | 数组层 | 立方体面 | 图像维度 |
|---------|--------|--------|----------|---------|
| `GL_TEXTURE_1D` | ✓ | | | 1D |
| `GL_TEXTURE_2D` | ✓ | | | 2D |
| `GL_TEXTURE_3D` | ✓ | | | 3D |
| `GL_TEXTURE_1D_ARRAY` | ✓ | ✓ | | 1D |
| `GL_TEXTURE_2D_ARRAY` | ✓ | ✓ | | 2D |
| `GL_TEXTURE_CUBE_MAP` | ✓ | | ✓ | 2D |
| `GL_TEXTURE_CUBE_MAP_ARRAY` | ✓ | ✓ | ✓ | 2D |
| `GL_TEXTURE_RECTANGLE` | | | | 2D |
| `GL_TEXTURE_BUFFER` | | | | 1D |
| `GL_TEXTURE_2D_MULTISAMPLE` | | | | 2D |
| `GL_TEXTURE_2D_MULTISAMPLE_ARRAY` | | ✓ | | 2D |

### 图像尺寸

同一 Mipmap 级别中的所有图像具有相同尺寸。尺寸取决于基础 Mipmap 级别（级别 0）的大小。

对于级别 0 之后的每个 Mipmap 级别，尺寸减半（向下取整）。例如，基础级别为 67x67 的二维纹理，级别 1 为 33x33，级别 2 为 16x16，依此类推。

Mipmap 链在所有维度都变为 1 时停止。

数组层数和立方体面数**不随** Mipmap 级别变化。

::: warning
立方体贴图和立方体数组纹理必须使用**正方形尺寸**，宽度和高度必须相同。
:::

### 存储类型

纹理有三种存储类型：

1. **可变存储 (Mutable Storage)** - 可重新分配
2. **不可变存储 (Immutable Storage)** - 一旦分配不可更改
3. **缓冲存储 (Buffer Storage)** - 仅用于缓冲纹理

## 不可变存储

**核心版本**：4.2/4.3  
**扩展**：`ARB_texture_storage`, `ARB_texture_storage_multisample`

不可变存储一次性分配纹理的所有图像。分配后，存储结构（尺寸、Mipmap 数量、图像格式）不能更改，但像素内容可以更新。

### 分配函数

```c
void glTexStorage1D(GLenum target, GLint levels, GLint internalformat, GLsizei width);
// 有效 target: GL_TEXTURE_1D

void glTexStorage2D(GLenum target, GLint levels, GLint internalformat, GLsizei width, GLsizei height);
// 有效 target: GL_TEXTURE_2D, GL_TEXTURE_RECTANGLE, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_1D_ARRAY

void glTexStorage3D(GLenum target, GLint levels, GLint internalformat, GLsizei width, GLsizei height, GLsizei depth);
// 有效 target: GL_TEXTURE_3D, GL_TEXTURE_2D_ARRAY, GL_TEXTURE_CUBE_MAP_ARRAY

void glTexStorage2DMultisample(GLenum target, GLsizei samples, GLint internalformat, GLsizei width, GLsizei height, GLboolean fixedsamplelocations);
// 有效 target: GL_TEXTURE_2D_MULTISAMPLE

void glTexStorage3DMultisample(GLenum target, GLsizei samples, GLint internalformat, GLsizei width, GLsizei height, GLsizei depth, GLboolean fixedsamplelocations);
// 有效 target: GL_TEXTURE_2D_MULTISAMPLE_ARRAY
```

`internalformat` 参数定义图像格式，必须使用有尺寸的格式（如 `GL_RGBA8`，而非 `GL_RGBA`）。

::: tip 推荐
如果实现支持不可变存储，应尽可能使用它。这能避免许多错误和问题。
:::

### 纹理视图 (Texture Views)

**核心版本**：4.3  
**扩展**：`ARB_texture_view`

不可变存储可以在多个纹理对象之间共享：

```c
void glTextureView(GLuint texture, GLenum target, GLuint origtexture, GLenum internalformat, GLuint minlevel, GLuint numlevels, GLuint minlayer, GLuint numlayers);
```

::: warning
`texture` 参数必须是通过 `glGenTextures` 返回的、**尚未绑定到任何目标**的纹理名称。
:::

纹理视图可以：
1. 引用原始纹理的部分 Mipmap 级别和数组层
2. 将纹理类型转换为兼容的类型
3. 将图像格式转换为兼容的格式

**兼容的目标类型转换**：

| 原始目标 | 兼容的新目标 |
|---------|-------------|
| `GL_TEXTURE_1D` | `GL_TEXTURE_1D`, `GL_TEXTURE_1D_ARRAY` |
| `GL_TEXTURE_2D` | `GL_TEXTURE_2D`, `GL_TEXTURE_2D_ARRAY` |
| `GL_TEXTURE_CUBE_MAP` | `GL_TEXTURE_CUBE_MAP`, `GL_TEXTURE_2D`, `GL_TEXTURE_2D_ARRAY`, `GL_TEXTURE_CUBE_MAP_ARRAY` |
| `GL_TEXTURE_2D_ARRAY` | `GL_TEXTURE_2D`, `GL_TEXTURE_CUBE_MAP`, `GL_TEXTURE_2D_ARRAY`, `GL_TEXTURE_CUBE_MAP_ARRAY` |

## 可变存储

可变存储使用 `glTexImage*` 系列函数创建，可以逐个 Mipmap 级别分配，也可以重新分配整个纹理存储。

### 纹理完整性

可变存储需要用户确保纹理对象**完整 (complete)**，即所有 Mipmap 级别使用相同的内部格式。

### 直接创建

```c
void glTexImage1D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLint border, GLenum format, GLenum type, void *data);
void glTexImage2D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, void *data);
void glTexImage3D(GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height, GLsizei depth, GLint border, GLenum format, GLenum type, void *data);
void glTexImage2DMultisample(GLenum target, GLsizei samples, GLint internalformat, GLsizei width, GLsizei height, GLboolean fixedsamplelocations);
void glTexImage3DMultisample(GLenum target, GLsizei samples, GLint internalformat, GLsizei width, GLsizei height, GLsizei depth, GLboolean fixedsamplelocations);
```

::: warning
不要忘记确保同一纹理中的所有 Mipmap 和图像使用相同的 `internalformat`。
:::

`border` 参数已废弃，始终设为 0。如果 `data` 为 NULL，则不执行像素传输，纹理数据未定义。

### 压缩格式创建

对于预压缩数据，使用专用函数：

```c
void glCompressedTexImage1D(GLenum target, GLint level, GLenum internalformat, GLsizei width, GLint border, GLsizei imageSize, void *data);
void glCompressedTexImage2D(GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLint border, GLsizei imageSize, void *data);
void glCompressedTexImage3D(GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLsizei depth, GLint border, GLsizei imageSize, void *data);
```

### 帧缓冲复制创建

从当前绑定的 `GL_READ_FRAMEBUFFER` 复制像素数据：

```c
void glCopyTexImage1D(GLenum target, GLint level, GLenum internalformat, GLint x, GLint y, GLsizei width, GLint border);
void glCopyTexImage2D(GLenum target, GLint level, GLenum internalformat, GLint x, GLint y, GLsizei width, GLsizei height, GLint border);
```

## 存储内容操作

### 自动生成 Mipmap

```c
void glGenerateMipmap(GLenum target);
```

从基础级别自动生成所有后续 Mipmap 级别。

### 像素上传

更新部分或全部 Mipmap 级别：

```c
void glTexSubImage1D(GLenum target, GLint level, GLint xoffset, GLsizei width, GLenum format, GLenum type, const GLvoid *data);
void glTexSubImage2D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width, GLsizei height, GLenum format, GLenum type, const GLvoid *data);
void glTexSubImage3D(GLenum target, GLint level, GLint xoffset, GLint yoffset, GLint zoffset, GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type, const GLvoid *data);
```

### 纹理清除

**核心版本**：4.4  
**扩展**：`ARB_clear_texture`

```c
void glClearTexImage(GLuint texture, GLint level, GLenum format, GLenum type, const void *data);
void glClearTexSubImage(GLuint texture, GLint level, GLint xoffset, GLint yoffset, GLint zoffset, GLsizei width, GLsizei height, GLsizei depth, GLenum format, GLenum type, const void *data);
```

### 纹理间复制

**核心版本**：4.3  
**扩展**：`ARB_copy_image`

```c
void glCopyImageSubData(GLuint srcName, GLenum srcTarget, GLint srcLevel, GLint srcX, GLint srcY, GLint srcZ, GLuint dstName, GLenum dstTarget, GLint dstLevel, GLint dstX, GLint dstY, GLint dstZ, GLsizei srcWidth, GLsizei srcHeight, GLsizei srcDepth);
```

### 存储失效

**核心版本**：4.3  
**扩展**：`ARB_invalidate_subdata`

```c
void glInvalidateTexImage(GLuint texture, GLint level);
void glInvalidateTexSubImage(GLuint texture, GLint level, GLint xoffset, GLint yoffset, GLint zoffset, GLsizei width, GLsizei height, GLsizei depth);
```

失效操作可以使内容变为未定义，但对于同步和性能优化非常有用。

### 像素下载

```c
void glGetTexImage(GLenum target, GLint level, GLenum format, GLenum type, GLvoid *img);
void glGetCompressedTexImage(GLenum target, GLint lod, GLvoid *img);
```

## 缓冲存储

缓冲纹理的存储来自缓冲对象，使用 `glTexBuffer` 或 `glTexBufferRange` 绑定。
