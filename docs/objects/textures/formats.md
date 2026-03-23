# 图像格式 (Image Format)

图像格式描述纹理和渲染缓冲中图像存储数据的方式，定义图像数据的含义。

图像格式分为三种基本类型：**颜色格式**、**深度格式**和**深度/模板格式**。

## 颜色格式

OpenGL 中的颜色以 RGBA 格式存储，每个颜色包含红 (R)、绿 (G)、蓝 (B) 和 Alpha (A) 四个分量。Alpha 值没有固有含义，通常用作透明度，但实际取决于着色器的使用方式。

颜色格式有三种存储方式：

1. **归一化整数 (Normalized Integer)** - 映射到浮点范围
2. **浮点 (Floating-point)** - 直接存储浮点值
3. **整数 (Integral)** - 存储整数值

### 格式命名语法

```
GL_[components][size][type]
```

- **components**：`R`、`RG`、`RGB` 或 `RGBA`
- **size**：每分量位数
- **type**：类型后缀

| 类型后缀 | 含义 |
|---------|------|
| (无) | 无符号归一化整数 [0, 1] |
| `_SNORM` | 有符号归一化整数 [-1, 1] |
| `F` | 浮点 |
| `I` | 有符号整数 |
| `UI` | 无符号整数 |

示例：
- `GL_RGBA8`：4 分量无符号归一化，每分量 8 位
- `GL_RGBA32F`：4 分量浮点，每分量 32 位
- `GL_RGB8UI`：3 分量无符号整数，每分量 8 位
- `GL_R16F`：1 分量浮点，每分量 16 位

### 各类型支持的位深

| 格式类型 | 每分量位深 |
|---------|-----------|
| 无符号归一化 | 2, 4, 5, 8, 10, 12, 16 |
| 有符号归一化 | 8, 16 |
| 无符号整数 | 8, 16, 32 |
| 有符号整数 | 8, 16, 32 |
| 浮点 | 16, 32 |

### 特殊颜色格式

- `GL_R3_G3_B2`：R 和 G 各 3 位，B 仅 2 位
- `GL_RGB5_A1`：RGB 各 5 位，Alpha 1 位
- `GL_RGB10_A2`：RGB 各 10 位，Alpha 2 位（帧缓冲常用）
- `GL_RGB10_A2UI`：无符号整数版本
- `GL_R11F_G11F_B10F`：特殊 11/10 位浮点（节省空间，无符号）
- `GL_RGB9_E5`：RGB 各 9 位精度，共享 5 位指数
- `GL_RGB565`：R 和 B 各 5 位，G 为 6 位

### sRGB 色彩空间

OpenGL 支持两种 sRGB 格式：

- `GL_SRGB8`：sRGB 图像，无 Alpha
- `GL_SRGB8_ALPHA8`：sRGB 图像，**线性 Alpha**

着色器采样 sRGB 纹理时，值会自动转换为线性色彩空间。当用作渲染目标时，若启用 `GL_FRAMEBUFFER_SRGB`，输出颜色会自动转换为 sRGB。

::: info
大多数现代硬件（GL 3.0+）会在过滤前进行色彩空间转换。
:::

## 压缩格式

纹理压缩是节省内存的重要工具。压缩格式分为两类：**通用压缩格式**和**特定压缩格式**。

### 通用压缩格式

```
GL_COMPRESSED_[components]
```

如 `GL_COMPRESSED_RGB`、`GL_COMPRESSED_RGBA`、`GL_COMPRESSED_SRGB`。驱动程序自行决定压缩方式，不保证具体实现。

### RGTC 压缩格式

- `GL_COMPRESSED_RED_RGTC1`：单分量无符号归一化
- `GL_COMPRESSED_SIGNED_RED_RGTC1`：单分量有符号归一化
- `GL_COMPRESSED_RG_RGTC2`：双分量无符号归一化
- `GL_COMPRESSED_SIGNED_RG_RGTC2`：双分量有符号归一化

### BPTC 压缩格式 (OpenGL 4.2)

- `GL_COMPRESSED_RGBA_BPTC_UNORM`：4 分量无符号归一化
- `GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM`：sRGB 色彩空间
- `GL_COMPRESSED_RGB_BPTC_SIGNED_FLOAT`：3 分量有符号浮点
- `GL_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT`：3 分量无符号浮点

### S3TC/DXT 压缩格式

通过扩展 `EXT_texture_compression_s3tc` 支持，几乎所有实现都支持：

- `GL_COMPRESSED_RGB_S3TC_DXT1_EXT`
- `GL_COMPRESSED_RGBA_S3TC_DXT1_EXT`
- `GL_COMPRESSED_RGBA_S3TC_DXT3_EXT`
- `GL_COMPRESSED_RGBA_S3TC_DXT5_EXT`

sRGB 版本通过 `EXT_texture_sRGB` 扩展提供。

::: warning
压缩图像**不可用作渲染目标**。附加压缩图像到帧缓冲对象会导致 FBO 不完整。
:::

## 深度格式

深度格式存储深度信息：

- `GL_DEPTH_COMPONENT16`：16 位深度
- `GL_DEPTH_COMPONENT24`：24 位深度
- `GL_DEPTH_COMPONENT32`：32 位深度（归一化整数）
- `GL_DEPTH_COMPONENT32F`：32 位浮点深度

32 位浮点深度纹理可用于阴影纹理查找函数。

## 深度/模板格式

组合深度和模板缓冲：

- `GL_DEPTH24_STENCIL8`：24 位深度 + 8 位模板
- `GL_DEPTH32F_STENCIL8`：32 位浮点深度 + 8 位模板

## 纯模板格式

格式为 `GL_STENCIL_INDEX#`，其中 # 为位数（1、4、8、16）。

::: warning
强烈建议仅使用 8 位模板格式。
:::

## 必需格式

OpenGL 规范要求实现必须精确支持以下格式（或更高精度）：

### 纹理和渲染缓冲通用

| 基础格式 | 数据类型 | 每分量位深 |
|---------|---------|-----------|
| RGBA, RG, R | 无符号归一化 | 8, 16 |
| RGBA, RG, R | 浮点 | 16, 32 |
| RGBA, RG, R | 有符号整数 | 8, 16, 32 |
| RGBA, RG, R | 无符号整数 | 8, 16, 32 |

其他必需格式：
- `GL_RGBA4`、`GL_RGB5_A1`、`GL_RGB565`
- `GL_RGB10_A2`、`GL_RGB10_A2UI`
- `GL_R11F_G11F_B10F`、`GL_SRGB8_ALPHA8`
- `GL_DEPTH_COMPONENT16`、`GL_DEPTH_COMPONENT24`、`GL_DEPTH_COMPONENT32F`
- `GL_DEPTH24_STENCIL8`、`GL_DEPTH32F_STENCIL8`
- `GL_STENCIL_INDEX8`

### 仅纹理

| 基础格式 | 数据类型 | 每分量位深 |
|---------|---------|-----------|
| RGB | 无符号归一化 | 8, 16 |
| RGBA, RGB, RG, R | 有符号归一化 | 8, 16 |
| RGB | 浮点 | 16, 32 |
| RGB | 有/无符号整数 | 8, 16, 32 |

其他：`GL_SRGB8`、`GL_RGB9_E5`

## 图像格式查询

**核心版本**：4.3  
**扩展**：`ARB_internalformat_query`, `ARB_internalformat_query2`

```c
void glGetInternalformativ(GLenum target, GLenum internalformat, GLenum pname, GLsizei bufSize, GLint *params);
void glGetInternalformati64v(GLenum target, GLenum internalformat, GLenum pname, GLsizei bufSize, GLint64 *params);
```

常用查询参数：

| 参数名 | 说明 |
|-------|------|
| `GL_NUM_SAMPLE_COUNTS` | 有效采样数数量 |
| `GL_SAMPLES` | 有效采样数数组 |
| `GL_INTERNALFORMAT_PREFERRED` | 实现首选的内部格式 |
| `GL_READ_PIXELS_FORMAT` | `glReadPixels` 最优格式 |
| `GL_READ_PIXELS_TYPE` | `glReadPixels` 最优类型 |
| `GL_TEXTURE_COMPRESSED_BLOCK_SIZE` | 压缩块大小（字节） |

## 遗留格式

::: warning
以下格式已在核心 OpenGL 3.1 中移除，不建议使用。
:::

**亮度/强度格式**：
- `GL_INTENSITY` → vec4(I, I, I, I)
- `GL_LUMINANCE` → vec4(L, L, L, 1)
- `GL_LUMINANCE_ALPHA` → vec4(L, L, L, A)

建议使用纹理通道重映射 (Swizzle Mask) 替代。
