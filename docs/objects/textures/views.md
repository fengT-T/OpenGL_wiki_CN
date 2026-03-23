# 纹理视图 (Texture Views)

**纹理视图** 允许多个纹理对象共享同一块不可变存储。这是不可变存储相比可变存储的独特优势。

**核心版本**：4.3  
**扩展**：`ARB_texture_view`

## 基本概念

不可变存储一旦创建，其结构（尺寸、Mipmap 数量、图像格式）不可更改，但可以在多个纹理对象之间共享。可以将其类比于引用计数的智能指针：每个对象都有自己的指针，只有当所有引用共享内存的对象都被销毁时，内存才会释放。

`glTexStorage*` 系列函数创建新的不可变存储，而 `glTextureView` 则用于共享已有存储。

## 创建纹理视图

```c
void glTextureView(GLuint texture, GLenum target, GLuint origtexture, 
                   GLenum internalformat, GLuint minlevel, GLuint numlevels, 
                   GLuint minlayer, GLuint numlayers);
```

**参数说明**：
- `texture`：新创建的纹理对象名称
- `target`：新纹理的目标类型
- `origtexture`：拥有不可变存储的源纹理
- `internalformat`：视图的图像格式
- `minlevel`：起始 Mipmap 级别
- `numlevels`：Mipmap 级别数量
- `minlayer`：起始数组层
- `numlayers`：数组层数量

::: warning 重要限制
`texture` 参数必须是通过 `glGenTextures` 返回的、**尚未绑定到任何目标**的纹理名称。此函数需要一个未初始化的纹理，使用已绑定的名称会导致失败。
:::

## 视图范围选择

纹理视图不必查看原始纹理的全部存储，可以只引用部分 Mipmap 级别和数组层。

### Mipmap 级别选择

`minlevel` 指定源纹理中作为视图基础级别的 Mipmap 级别，`numlevels` 指定视图包含的级别数。

对于不支持 Mipmap 的纹理类型（多重采样或矩形纹理），`minlevel` 必须为 0，`numlevels` 必须为 1。

### 数组层选择

对于有数组层的纹理类型（`GL_TEXTURE_1D_ARRAY`、`GL_TEXTURE_2D_ARRAY`、`GL_TEXTURE_CUBE_MAP`、`GL_TEXTURE_CUBE_MAP_ARRAY`），可以使用 `minlayer` 和 `numlayers` 选择层范围。

立方体贴图被视为具有 6 层的数组纹理；立方体数组纹理的层是 layer-face（层面）。

## 视图类型别名

纹理视图的一个重要特性是：视图的目标类型可以与源纹理不同。例如，可以从 1D 数组纹理创建 2D 纹理视图，表示原始纹理的特定数组层。

### 兼容的目标类型转换

| 原始目标 | 兼容的新目标 |
|---------|-------------|
| `GL_TEXTURE_1D` | `GL_TEXTURE_1D`, `GL_TEXTURE_1D_ARRAY` |
| `GL_TEXTURE_2D` | `GL_TEXTURE_2D`, `GL_TEXTURE_2D_ARRAY` |
| `GL_TEXTURE_3D` | `GL_TEXTURE_3D` |
| `GL_TEXTURE_CUBE_MAP` | `GL_TEXTURE_CUBE_MAP`, `GL_TEXTURE_2D`, `GL_TEXTURE_2D_ARRAY`, `GL_TEXTURE_CUBE_MAP_ARRAY` |
| `GL_TEXTURE_RECTANGLE` | `GL_TEXTURE_RECTANGLE` |
| `GL_TEXTURE_BUFFER` | *不兼容* |
| `GL_TEXTURE_1D_ARRAY` | `GL_TEXTURE_1D`, `GL_TEXTURE_1D_ARRAY` |
| `GL_TEXTURE_2D_ARRAY` | `GL_TEXTURE_2D`, `GL_TEXTURE_CUBE_MAP`, `GL_TEXTURE_2D_ARRAY`, `GL_TEXTURE_CUBE_MAP_ARRAY` |
| `GL_TEXTURE_CUBE_MAP_ARRAY` | `GL_TEXTURE_CUBE_MAP`, `GL_TEXTURE_2D`, `GL_TEXTURE_2D_ARRAY`, `GL_TEXTURE_CUBE_MAP_ARRAY` |
| `GL_TEXTURE_2D_MULTISAMPLE` | `GL_TEXTURE_2D_MULTISAMPLE`, `GL_TEXTURE_2D_MULTISAMPLE_ARRAY` |
| `GL_TEXTURE_2D_MULTISAMPLE_ARRAY` | `GL_TEXTURE_2D_MULTISAMPLE`, `GL_TEXTURE_2D_MULTISAMPLE_ARRAY` |

### 转换约束

选择的 Mipmap 级别数和数组层数不能违反目标类型的约束：
- 从 2D 非数组纹理创建 2D 数组视图时，新纹理只有 1 个数组层
- 从 2D 数组纹理创建立方体数组视图时，层数必须是 6 的倍数

## 视图格式别名

纹理视图的 `internalformat` 不必与源纹理相同，只需**兼容**。同一"类别"的格式相互兼容。

### 格式兼容类别

| 类别 | 兼容格式 |
|------|---------|
| 128-bit | `GL_RGBA32F`, `GL_RGBA32UI`, `GL_RGBA32I` |
| 96-bit | `GL_RGB32F`, `GL_RGB32UI`, `GL_RGB32I` |
| 64-bit | `GL_RGBA16F`, `GL_RG32F`, `GL_RGBA16UI`, `GL_RG32UI`, `GL_RGBA16I`, `GL_RG32I`, `GL_RGBA16`, `GL_RGBA16_SNORM` |
| 48-bit | `GL_RGB16`, `GL_RGB16_SNORM`, `GL_RGB16F`, `GL_RGB16UI`, `GL_RGB16I` |
| 32-bit | `GL_RG16F`, `GL_R11F_G11F_B10F`, `GL_R32F`, `GL_RGB10_A2UI`, `GL_RGBA8UI`, `GL_RG16UI`, `GL_R32UI`, `GL_RGBA8I`, `GL_RG16I`, `GL_R32I`, `GL_RGB10_A2`, `GL_RGBA8`, `GL_RG16`, `GL_RGBA8_SNORM`, `GL_RG16_SNORM`, `GL_SRGB8_ALPHA8`, `GL_RGB9_E5` |
| 24-bit | `GL_RGB8`, `GL_RGB8_SNORM`, `GL_SRGB8`, `GL_RGB8UI`, `GL_RGB8I` |
| 16-bit | `GL_R16F`, `GL_RG8UI`, `GL_R16UI`, `GL_RG8I`, `GL_R16I`, `GL_RG8`, `GL_R16`, `GL_RG8_SNORM`, `GL_R16_SNORM` |
| 8-bit | `GL_R8UI`, `GL_R8I`, `GL_R8`, `GL_R8_SNORM` |

### 压缩格式兼容类别

| 类别 | 兼容格式 |
|------|---------|
| `GL_VIEW_CLASS_RGTC1_RED` | `GL_COMPRESSED_RED_RGTC1`, `GL_COMPRESSED_SIGNED_RED_RGTC1` |
| `GL_VIEW_CLASS_RGTC2_RG` | `GL_COMPRESSED_RG_RGTC2`, `GL_COMPRESSED_SIGNED_RG_RGTC2` |
| `GL_VIEW_CLASS_BPTC_UNORM` | `GL_COMPRESSED_RGBA_BPTC_UNORM`, `GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM` |
| `GL_VIEW_CLASS_BPTC_FLOAT` | `GL_COMPRESSED_RGB_BPTC_SIGNED_FLOAT`, `GL_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT` |

### S3TC 压缩格式兼容

| 类别 | 兼容格式 |
|------|---------|
| `GL_S3TC_DXT1_RGB` | `GL_COMPRESSED_RGB_S3TC_DXT1_EXT`, `GL_COMPRESSED_SRGB_S3TC_DXT1_EXT` |
| `GL_S3TC_DXT1_RGBA` | `GL_COMPRESSED_RGBA_S3TC_DXT1_EXT`, `GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT` |
| `GL_S3TC_DXT3_RGBA` | `GL_COMPRESSED_RGBA_S3TC_DXT3_EXT`, `GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT` |
| `GL_S3TC_DXT5_RGBA` | `GL_COMPRESSED_RGBA_S3TC_DXT5_EXT`, `GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT` |

未列在上表中的格式只能与自身兼容。

## 视图的视图

由于纹理视图引用的是不可变存储，视图本身也可以作为 `glTextureView` 的源纹理。这意味着可以创建视图的视图。

### 示例

```c
// 创建源纹理
glBindTexture(GL_TEXTURE_2D_ARRAY, tex);
glTexStorage3D(GL_TEXTURE_2D_ARRAY, 10, GL_RGBA8, 1024, 1024, 6);

// 创建第一个视图：选择级别 2-6，层 1-3
glTextureView(texView1, GL_TEXTURE_2D_ARRAY, tex, GL_RGBA8, 2, 5, 1, 3);
// texView1 的基础级别尺寸为 256x256（来自 tex 的第 3 个级别）
// 有 5 个 Mipmap 级别，3 个数组层

// 从视图创建视图
glTextureView(texView2, GL_TEXTURE_2D, texView1, GL_RGBA8, 2, 1, 1, 1);
// texView2 是 2D 纹理
// 实际引用 tex 的第 5 个级别和第 3 个数组层
// 尺寸为 64x64
```

::: warning 访问限制
视图只能访问源纹理声明的范围或其子集，即使原始存储有更多级别或层。如果删除了用 `glTexStorage*` 创建的原始纹理，可能会完全失去对某些级别/层的访问权限。
:::

## 与纹理复制的兼容性

`glCopyImageSubData` 可以在格式兼容的图像之间复制数据。这种兼容性与纹理视图的格式兼容性相同。

此外，还可以在某些压缩格式和非压缩格式之间复制，只要压缩格式的块大小等于非压缩格式的像素大小。这不会执行压缩或解压，只是直接复制数据。

```c
// 示例：将压缩块数据复制到压缩纹理
// 先在 GL_RGBA16UI 纹理中生成压缩块数据（通过计算着色器）
// 然后复制到 GL_COMPRESSED_RED_RGTC1 纹理
glCopyImageSubData(...);
```
